const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/modules/users/user.model');
const Project = require('../src/modules/projects/project.model');
const Task = require('../src/modules/tasks/task.model');
const Activity = require('../src/modules/activity/activity.model');
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

describe('Tasks API & Fractional Reordering Module', () => {
  let ownerUser, memberUser, viewerUser, outsiderUser;
  let ownerToken, memberToken, viewerToken, outsiderToken;
  let project, todoColId, inProgColId, doneColId;

  beforeEach(async () => {
    ownerUser = await User.create({ name: 'Owner', email: 'owner@test.com', passwordHash: 'hash1' });
    memberUser = await User.create({ name: 'Member', email: 'member@test.com', passwordHash: 'hash2' });
    viewerUser = await User.create({ name: 'Viewer', email: 'viewer@test.com', passwordHash: 'hash3' });
    outsiderUser = await User.create({ name: 'Outsider', email: 'outsider@test.com', passwordHash: 'hash4' });

    ownerToken = signAccess(ownerUser);
    memberToken = signAccess(memberUser);
    viewerToken = signAccess(viewerUser);
    outsiderToken = signAccess(outsiderUser);

    project = await Project.create({
      name: 'Alpha Project',
      key: 'ALPHA',
      owner: ownerUser._id,
      members: [
        { user: memberUser._id, role: 'member' },
        { user: viewerUser._id, role: 'viewer' },
      ],
      columns: [
        { name: 'To Do', order: 0, wipLimit: 0 },
        { name: 'In Progress', order: 1, wipLimit: 0 },
        { name: 'Done', order: 2, wipLimit: 0 },
      ],
    });

    todoColId = project.columns[0]._id.toString();
    inProgColId = project.columns[1]._id.toString();
    doneColId = project.columns[2]._id.toString();
  });

  describe('POST /api/v1/projects/:projectId/tasks', () => {
    it('should create tasks with atomic keys (ALPHA-1, ALPHA-2) and incremental positions', async () => {
      const res1 = await request(app)
        .post(`/api/v1/projects/${project._id}/tasks`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Implement Authentication',
          description: 'JWT + refresh token rotation',
          columnId: todoColId,
          priority: 'urgent',
          labels: ['backend', 'security'],
        });

      expect(res1.status).toBe(201);
      expect(res1.body.data.task.key).toBe('ALPHA-1');
      expect(res1.body.data.task.position).toBe(1024);
      expect(res1.body.data.task.version).toBe(0);

      const res2 = await request(app)
        .post(`/api/v1/projects/${project._id}/tasks`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Build Kanban Drag & Drop UI',
          columnId: todoColId,
          priority: 'high',
          labels: ['frontend'],
        });

      expect(res2.status).toBe(201);
      expect(res2.body.data.task.key).toBe('ALPHA-2');
      expect(res2.body.data.task.position).toBe(2048);

      // Verify activity log creation
      const activities = await Activity.find({ project: project._id });
      expect(activities.length).toBe(2);
      expect(activities[0].type).toBe('TASK_CREATED');
    });

    it('should deny viewer from creating tasks (403)', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${project._id}/tasks`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          title: 'Unauthorized Task',
          columnId: todoColId,
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should fail with 400 for invalid columnId', async () => {
      const fakeColId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post(`/api/v1/projects/${project._id}/tasks`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Invalid Col Task',
          columnId: fakeColId,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_COLUMN');
    });
  });

  describe('GET /api/v1/projects/:projectId/tasks (Filters & Search)', () => {
    beforeEach(async () => {
      await Task.create([
        {
          project: project._id,
          key: 'ALPHA-1',
          title: 'Setup Redis adapter',
          description: 'Horizontal WebSocket scaling',
          columnId: todoColId,
          position: 1024,
          priority: 'urgent',
          labels: ['backend', 'realtime'],
          reporter: ownerUser._id,
          assignees: [memberUser._id],
        },
        {
          project: project._id,
          key: 'ALPHA-2',
          title: 'Design Task Modal',
          description: 'Comments & tabs',
          columnId: inProgColId,
          position: 1024,
          priority: 'low',
          labels: ['ui', 'frontend'],
          reporter: memberUser._id,
          assignees: [ownerUser._id],
        },
      ]);
    });

    it('should list all tasks for board viewers', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${project._id}/tasks`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBe(2);
    });

    it('should filter tasks by priority', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${project._id}/tasks?priority=urgent`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.tasks[0].key).toBe('ALPHA-1');
    });

    it('should filter tasks by label', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${project._id}/tasks?label=frontend`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.tasks[0].key).toBe('ALPHA-2');
    });

    it('should search tasks by keyword q', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${project._id}/tasks?q=WebSocket`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.tasks[0].key).toBe('ALPHA-1');
    });
  });

  describe('PATCH /api/v1/tasks/:taskId (Optimistic Concurrency Control)', () => {
    it('should successfully update task with matching version and increment version', async () => {
      const task = await Task.create({
        project: project._id,
        key: 'ALPHA-1',
        title: 'Original Title',
        columnId: todoColId,
        position: 1024,
        reporter: ownerUser._id,
        version: 0,
      });

      const res = await request(app)
        .patch(`/api/v1/tasks/${task._id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Updated Title',
          version: 0,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.task.title).toBe('Updated Title');
      expect(res.body.data.task.version).toBe(1);
    });

    it('should return 409 VERSION_CONFLICT on stale version', async () => {
      const task = await Task.create({
        project: project._id,
        key: 'ALPHA-1',
        title: 'Original Title',
        columnId: todoColId,
        position: 1024,
        reporter: ownerUser._id,
        version: 1, // Current DB version is 1
      });

      // User sends stale version 0
      const res = await request(app)
        .patch(`/api/v1/tasks/${task._id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Conflicting Title Update',
          version: 0,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('VERSION_CONFLICT');
    });
  });

  describe('PATCH /api/v1/tasks/:taskId/move (Fractional Indexing)', () => {
    it('should reorder a task between two neighbouring tasks accurately', async () => {
      const taskA = await Task.create({
        project: project._id,
        key: 'ALPHA-1',
        title: 'Task A',
        columnId: todoColId,
        position: 1024,
        reporter: ownerUser._id,
      });

      const taskB = await Task.create({
        project: project._id,
        key: 'ALPHA-2',
        title: 'Task B',
        columnId: todoColId,
        position: 2048,
        reporter: ownerUser._id,
      });

      const taskC = await Task.create({
        project: project._id,
        key: 'ALPHA-3',
        title: 'Task C',
        columnId: doneColId,
        position: 1024,
        reporter: ownerUser._id,
      });

      // Move Task C into todoColId between Task A (1024) and Task B (2048)
      const res = await request(app)
        .patch(`/api/v1/tasks/${taskC._id}/move`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          toColumnId: todoColId,
          beforeId: taskA._id.toString(),
          afterId: taskB._id.toString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.data.task.columnId).toBe(todoColId);
      expect(res.body.data.task.position).toBe(1536); // (1024 + 2048) / 2
    });

    it('should place task at top of column when no beforeId is provided', async () => {
      const taskA = await Task.create({
        project: project._id,
        key: 'ALPHA-1',
        title: 'Task A',
        columnId: todoColId,
        position: 1024,
        reporter: ownerUser._id,
      });

      const taskC = await Task.create({
        project: project._id,
        key: 'ALPHA-3',
        title: 'Task C',
        columnId: doneColId,
        position: 1024,
        reporter: ownerUser._id,
      });

      // Move Task C to top of todo column before Task A
      const res = await request(app)
        .patch(`/api/v1/tasks/${taskC._id}/move`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          toColumnId: todoColId,
          beforeId: null,
          afterId: taskA._id.toString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.data.task.position).toBe(512); // 1024 / 2
    });
  });

  describe('DELETE /api/v1/tasks/:taskId (Soft Delete)', () => {
    it('should soft delete task and exclude from default task queries', async () => {
      const task = await Task.create({
        project: project._id,
        key: 'ALPHA-1',
        title: 'To Be Deleted',
        columnId: todoColId,
        position: 1024,
        reporter: ownerUser._id,
      });

      const res = await request(app)
        .delete(`/api/v1/tasks/${task._id}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Task deleted successfully');

      // Verify soft delete in DB
      const dbTask = await Task.findById(task._id);
      expect(dbTask.deletedAt).not.toBeNull();

      // List query should not return this task
      const listRes = await request(app)
        .get(`/api/v1/projects/${project._id}/tasks`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(listRes.body.data.tasks.length).toBe(0);
    });
  });
});
