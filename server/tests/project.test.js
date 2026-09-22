const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/modules/users/user.model');
const Project = require('../src/modules/projects/project.model');
const Task = require('../src/modules/tasks/task.model');
const { signAccess } = require('../src/modules/auth/auth.service');

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

describe('Projects & RBAC Management Module', () => {
  let ownerUser, adminUser, memberUser, viewerUser, outsiderUser;
  let ownerToken, adminToken, memberToken, viewerToken, outsiderToken;
  let project;

  beforeEach(async () => {
    ownerUser = await User.create({ name: 'Owner User', email: 'owner@test.com', passwordHash: 'hash1' });
    adminUser = await User.create({ name: 'Admin User', email: 'admin@test.com', passwordHash: 'hash2' });
    memberUser = await User.create({ name: 'Member User', email: 'member@test.com', passwordHash: 'hash3' });
    viewerUser = await User.create({ name: 'Viewer User', email: 'viewer@test.com', passwordHash: 'hash4' });
    outsiderUser = await User.create({ name: 'Outsider User', email: 'outsider@test.com', passwordHash: 'hash5' });

    ownerToken = signAccess(ownerUser);
    adminToken = signAccess(adminUser);
    memberToken = signAccess(memberUser);
    viewerToken = signAccess(viewerUser);
    outsiderToken = signAccess(outsiderUser);

    project = await Project.create({
      name: 'Kanban Core',
      key: 'CORE',
      owner: ownerUser._id,
      members: [
        { user: adminUser._id, role: 'admin' },
        { user: memberUser._id, role: 'member' },
        { user: viewerUser._id, role: 'viewer' },
      ],
      columns: [
        { name: 'To Do', order: 0, wipLimit: 0 },
        { name: 'In Progress', order: 1, wipLimit: 5 },
        { name: 'Done', order: 2, wipLimit: 0 },
      ],
    });
  });

  describe('POST /api/v1/projects', () => {
    it('should create a project with default workflow columns and uppercase key', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Mobile App',
          key: 'MOB',
          description: 'React Native mobile application',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.project.name).toBe('Mobile App');
      expect(res.body.data.project.key).toBe('MOB');
      expect(res.body.data.project.columns.length).toBe(4);
      expect(res.body.data.project.columns[0].name).toBe('To Do');
    });

    it('should fail with 409 when project key is already in use', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Another Project',
          key: 'CORE',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('KEY_TAKEN');
    });

    it('should fail with 400 for invalid key characters', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Invalid Project',
          key: 'invalid key!',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/projects', () => {
    it('should return only projects the user is affiliated with', async () => {
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.projects.length).toBe(1);
      expect(res.body.data.projects[0].key).toBe('CORE');

      const outsiderRes = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(outsiderRes.status).toBe(200);
      expect(outsiderRes.body.data.projects.length).toBe(0);
    });
  });

  describe('GET /api/v1/projects/:projectId', () => {
    it('should allow viewer to retrieve project data', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${project._id}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.project.name).toBe('Kanban Core');
      expect(res.body.data.currentUserRole).toBe('viewer');
    });

    it('should return 403 FORBIDDEN for an outsider user', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${project._id}`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Member Management (Invites, Roles, Removal)', () => {
    it('should allow admin to add a new member by email', async () => {
      const newUser = await User.create({ name: 'New Dev', email: 'newdev@test.com', passwordHash: 'hash' });

      const res = await request(app)
        .post(`/api/v1/projects/${project._id}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newdev@test.com',
          role: 'member',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.members.some((m) => m.user.email === 'newdev@test.com')).toBe(true);
    });

    it('should reject non-admin users (member/viewer) from adding members (403)', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${project._id}/members`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          email: 'outsider@test.com',
          role: 'member',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow admin to change member role to admin', async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${project._id}/members/${viewerUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(200);
      const updatedViewer = res.body.data.members.find((m) => String(m.user._id) === String(viewerUser._id));
      expect(updatedViewer.role).toBe('admin');
    });

    it('should prevent modifying the project owner role (400)', async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${project._id}/members/${ownerUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'viewer' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_MODIFY_OWNER');
    });

    it('should allow admin to remove a member', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${project._id}/members/${viewerUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.members.some((m) => String(m.user._id) === String(viewerUser._id))).toBe(false);
    });
  });

  describe('Workflow Columns Management', () => {
    it('should allow admin to add a custom column with WIP limit', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${project._id}/columns`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'QA Testing',
          wipLimit: 3,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.column.name).toBe('QA Testing');
      expect(res.body.data.column.wipLimit).toBe(3);
    });

    it('should update column name and WIP limit', async () => {
      const colId = project.columns[1]._id; // 'In Progress'

      const res = await request(app)
        .patch(`/api/v1/projects/${project._id}/columns/${colId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'In Development',
          wipLimit: 8,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.column.name).toBe('In Development');
      expect(res.body.data.column.wipLimit).toBe(8);
    });

    it('should delete empty column successfully', async () => {
      const colId = project.columns[2]._id; // 'Done'

      const res = await request(app)
        .delete(`/api/v1/projects/${project._id}/columns/${colId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Column deleted successfully');
    });

    it('should prevent deleting a column if active tasks exist (400)', async () => {
      const colId = project.columns[0]._id;

      // Seed a task inside this column
      await Task.create({
        project: project._id,
        key: 'CORE-1',
        title: 'Active Task',
        columnId: colId,
        position: 1024,
        reporter: ownerUser._id,
      });

      const res = await request(app)
        .delete(`/api/v1/projects/${project._id}/columns/${colId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('COLUMN_NOT_EMPTY');
    });
  });

  describe('Project Deletion & Ownership Rules', () => {
    it('should allow project owner to delete project', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${project._id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Project deleted successfully');

      const checkInDb = await Project.findById(project._id);
      expect(checkInDb).toBeNull();
    });

    it('should deny non-owner admin from deleting project (403)', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${project._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});
