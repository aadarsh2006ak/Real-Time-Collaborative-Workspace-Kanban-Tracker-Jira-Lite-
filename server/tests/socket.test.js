// server/tests/socket.test.js
const http = require('http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const ioClient = require('socket.io-client');
const request = require('supertest');
const app = require('../src/app');
const { initSocket } = require('../src/sockets');
const User = require('../src/modules/users/user.model');
const Project = require('../src/modules/projects/project.model');
const Task = require('../src/modules/tasks/task.model');
const { signAccess } = require('../src/modules/auth/auth.service');

jest.setTimeout(30000);

let mongod, server, io, port;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  server = http.createServer(app);
  io = initSocket(server);
  app.set('io', io);

  await new Promise((resolve) => {
    server.listen(0, () => {
      port = server.address().port;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise((resolve) => {
    io.close(() => {
      server.close(resolve);
    });
  });
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

function createClientSocket(token) {
  return ioClient(`http://localhost:${port}`, {
    auth: { token },
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
  });
}

describe('Socket.io Real-Time & Live Presence Engine', () => {
  let ownerUser, memberUser, outsiderUser;
  let ownerToken, memberToken, outsiderToken;
  let project, todoCol;

  beforeEach(async () => {
    ownerUser = await User.create({
      name: 'Owner',
      email: 'owner@test.com',
      passwordHash: 'hash1',
    });
    memberUser = await User.create({
      name: 'Member',
      email: 'member@test.com',
      passwordHash: 'hash2',
    });
    outsiderUser = await User.create({
      name: 'Outsider',
      email: 'outsider@test.com',
      passwordHash: 'hash3',
    });

    ownerToken = signAccess(ownerUser);
    memberToken = signAccess(memberUser);
    outsiderToken = signAccess(outsiderUser);

    project = await Project.create({
      name: 'Socket Project',
      key: 'SOCK',
      owner: ownerUser._id,
      members: [{ user: memberUser._id, role: 'member' }],
      columns: [
        { name: 'To Do', order: 0, wipLimit: 0 },
        { name: 'Done', order: 1, wipLimit: 0 },
      ],
    });
    todoCol = project.columns[0];
  });

  describe('1. Handshake Authentication Guard', () => {
    it('rejects connection if no JWT token provided', (done) => {
      const socket = createClientSocket(null);
      socket.on('connect_error', (err) => {
        expect(err.message).toBe('UNAUTHORIZED');
        socket.disconnect();
        done();
      });
    });

    it('rejects connection if invalid JWT token provided', (done) => {
      const socket = createClientSocket('invalid.jwt.token');
      socket.on('connect_error', (err) => {
        expect(err.message).toBe('UNAUTHORIZED');
        socket.disconnect();
        done();
      });
    });

    it('successfully connects when valid JWT token is provided', (done) => {
      const socket = createClientSocket(ownerToken);
      socket.on('connect', () => {
        expect(socket.connected).toBe(true);
        socket.disconnect();
        done();
      });
    });
  });

  describe('2. Project Room RBAC Authorization', () => {
    it('allows project owner and member to join room', (done) => {
      const socket = createClientSocket(ownerToken);
      socket.on('connect', () => {
        socket.emit('project:join', { projectId: project._id.toString() }, (res) => {
          expect(res.ok).toBe(true);
          expect(Array.isArray(res.online)).toBe(true);
          expect(res.online).toContain(ownerUser._id.toString());
          socket.disconnect();
          done();
        });
      });
    });

    it('denies outsider with FORBIDDEN error when attempting to join room', (done) => {
      const socket = createClientSocket(outsiderToken);
      socket.on('connect', () => {
        socket.emit('project:join', { projectId: project._id.toString() }, (res) => {
          expect(res.ok).toBe(false);
          expect(res.error).toBe('FORBIDDEN');
          socket.disconnect();
          done();
        });
      });
    });
  });

  describe('3. Real-Time Broadcasts & Sender Skip (x-socket-id)', () => {
    it('broadcasts task:created to other room members and skips sender', async () => {
      const socketA = createClientSocket(ownerToken);
      const socketB = createClientSocket(memberToken);

      await Promise.all([
        new Promise((resolve) => socketA.on('connect', resolve)),
        new Promise((resolve) => socketB.on('connect', resolve)),
      ]);

      await Promise.all([
        new Promise((resolve) =>
          socketA.emit('project:join', { projectId: project._id.toString() }, resolve)
        ),
        new Promise((resolve) =>
          socketB.emit('project:join', { projectId: project._id.toString() }, resolve)
        ),
      ]);

      const receivedByA = jest.fn();
      const receivedByB = jest.fn();

      socketA.on('task:created', receivedByA);
      socketB.on('task:created', receivedByB);

      // User A creates a task via REST API with x-socket-id header set to socketA.id
      const res = await request(app)
        .post(`/api/v1/projects/${project._id}/tasks`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-socket-id', socketA.id)
        .send({
          title: 'Broadcasted Task',
          columnId: todoCol._id.toString(),
          priority: 'high',
        });

      expect(res.status).toBe(201);

      // Wait 100ms for event propagation
      await new Promise((r) => setTimeout(r, 100));

      expect(receivedByB).toHaveBeenCalledTimes(1);
      expect(receivedByB.mock.calls[0][0].task.title).toBe('Broadcasted Task');
      // Socket A skipped because of x-socket-id
      expect(receivedByA).not.toHaveBeenCalled();

      socketA.disconnect();
      socketB.disconnect();
    });
  });

  describe('4. Typing Indicator Event Propagation', () => {
    it('relays typing status across active room members', async () => {
      const socketA = createClientSocket(ownerToken);
      const socketB = createClientSocket(memberToken);

      await Promise.all([
        new Promise((resolve) => socketA.on('connect', resolve)),
        new Promise((resolve) => socketB.on('connect', resolve)),
      ]);

      await Promise.all([
        new Promise((resolve) =>
          socketA.emit('project:join', { projectId: project._id.toString() }, resolve)
        ),
        new Promise((resolve) =>
          socketB.emit('project:join', { projectId: project._id.toString() }, resolve)
        ),
      ]);

      const typingReceived = new Promise((resolve) => {
        socketB.on('typing', (data) => {
          resolve(data);
        });
      });

      socketA.emit('typing', {
        projectId: project._id.toString(),
        taskId: 'some-task-id',
        isTyping: true,
      });

      const data = await typingReceived;
      expect(data).toEqual({
        taskId: 'some-task-id',
        userId: ownerUser._id.toString(),
        isTyping: true,
      });

      socketA.disconnect();
      socketB.disconnect();
    });
  });

  describe('5. Presence Updates & Disconnect Lifecycle', () => {
    it('broadcasts presence:left when a member disconnects', async () => {
      const socketA = createClientSocket(ownerToken);
      const socketB = createClientSocket(memberToken);

      await Promise.all([
        new Promise((resolve) => socketA.on('connect', resolve)),
        new Promise((resolve) => socketB.on('connect', resolve)),
      ]);

      await Promise.all([
        new Promise((resolve) =>
          socketA.emit('project:join', { projectId: project._id.toString() }, resolve)
        ),
        new Promise((resolve) =>
          socketB.emit('project:join', { projectId: project._id.toString() }, resolve)
        ),
      ]);

      const leftPromise = new Promise((resolve) => {
        socketB.on('presence:left', (data) => {
          resolve(data);
        });
      });

      socketA.disconnect();

      const leftData = await leftPromise;
      expect(leftData.userId).toBe(ownerUser._id.toString());

      socketB.disconnect();
    });
  });
});
