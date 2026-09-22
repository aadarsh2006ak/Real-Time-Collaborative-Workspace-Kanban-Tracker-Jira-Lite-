const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/modules/users/user.model');
const Project = require('../src/modules/projects/project.model');
const { requireRole } = require('../src/middlewares/rbac');
const { auth } = require('../src/middlewares/auth');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Authentication & RBAC Module', () => {
  const validUser = {
    name: 'Siddharth Kumar',
    email: 'siddharth@example.com',
    password: 'Password123!',
  };

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user, return tokens, and set httpOnly cookie', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(validUser.email.toLowerCase());
      expect(res.body.data.user.name).toBe(validUser.name);
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.accessToken).toBeDefined();

      // Check cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/rt=/);
      expect(cookies[0]).toMatch(/HttpOnly/i);
      expect(cookies[0]).toMatch(/Path=\/api\/v1\/auth/i);
    });

    it('should fail with 409 when email is already registered', async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);
      const res = await request(app).post('/api/v1/auth/register').send(validUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_TAKEN');
    });

    it('should fail with 400 on weak password (missing uppercase or number)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Weak Pass',
        email: 'weak@example.com',
        password: 'weak',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);
    });

    it('should authenticate user and return access token + cookie', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: validUser.email,
        password: validUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 BAD_CREDENTIALS for invalid password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: validUser.email,
        password: 'WrongPassword999!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BAD_CREDENTIALS');
    });

    it('should return 401 BAD_CREDENTIALS for non-existent email', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('BAD_CREDENTIALS');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return user profile when valid Bearer token is provided', async () => {
      const regRes = await request(app).post('/api/v1/auth/register').send(validUser);
      const token = regRes.body.data.accessToken;

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(validUser.email);
    });

    it('should return 401 NO_TOKEN when authorization header is missing', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('NO_TOKEN');
    });

    it('should return 401 INVALID_TOKEN for corrupted token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.string');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('POST /api/v1/auth/refresh (Rotation & Theft Detection)', () => {
    it('should successfully rotate refresh token and return new access token', async () => {
      const regRes = await request(app).post('/api/v1/auth/register').send(validUser);
      const cookies = regRes.headers['set-cookie'];

      const res = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should detect token reuse/theft when an already-used refresh token is presented again', async () => {
      const regRes = await request(app).post('/api/v1/auth/register').send(validUser);
      const initialCookie = regRes.headers['set-cookie'];

      // First refresh (consumes initialCookie and gives new cookie)
      const firstRefresh = await request(app).post('/api/v1/auth/refresh').set('Cookie', initialCookie);
      expect(firstRefresh.status).toBe(200);

      // Attempting to reuse the consumed initialCookie again -> THEFT DETECTED!
      const theftAttempt = await request(app).post('/api/v1/auth/refresh').set('Cookie', initialCookie);

      expect(theftAttempt.status).toBe(401);
      expect(theftAttempt.body.error.code).toBe('TOKEN_REUSE_DETECTED');

      // Verify all active sessions were revoked
      const userInDb = await User.findOne({ email: validUser.email });
      expect(userInDb.refreshTokens.length).toBe(0);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should invalidate the refresh token and clear cookie', async () => {
      const regRes = await request(app).post('/api/v1/auth/register').send(validUser);
      const token = regRes.body.data.accessToken;
      const cookies = regRes.headers['set-cookie'];

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const user = await User.findOne({ email: validUser.email });
      expect(user.refreshTokens.length).toBe(0);
    });
  });

  describe('RBAC Middleware verification', () => {
    it('should deny access (403 FORBIDDEN) to viewer when member role is required', async () => {
      const owner = await User.create({ name: 'Owner', email: 'owner@test.com', passwordHash: 'hash' });
      const viewer = await User.create({ name: 'Viewer', email: 'viewer@test.com', passwordHash: 'hash' });

      const project = await Project.create({
        name: 'RBAC Project',
        key: 'RBAC',
        owner: owner._id,
        members: [{ user: viewer._id, role: 'viewer' }],
      });

      const { signAccess } = require('../src/modules/auth/auth.service');
      const viewerToken = signAccess(viewer);

      const res = await request(app)
        .get(`/api/v1/test-rbac/${project._id}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should grant access to project owner', async () => {
      const owner = await User.create({ name: 'Owner2', email: 'owner2@test.com', passwordHash: 'hash' });
      const project = await Project.create({
        name: 'Owner Project',
        key: 'OWNP',
        owner: owner._id,
      });

      const { signAccess } = require('../src/modules/auth/auth.service');
      const ownerToken = signAccess(owner);

      const res = await request(app)
        .get(`/api/v1/test-rbac/${project._id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data?.role || res.body.role).toBe('owner');
    });
  });
});
