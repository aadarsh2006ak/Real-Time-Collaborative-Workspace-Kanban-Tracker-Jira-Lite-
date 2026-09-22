// server/tests/export_import_bulk.test.js
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

describe('Phase 10: Data Export/Import, CSV/JSON & Bulk Task Operations Module', () => {
  let ownerUser, memberUser;
  let ownerToken, memberToken;
  let project, todoCol, doneCol;

  beforeEach(async () => {
    ownerUser = await User.create({
      name: 'Owner Alice',
      email: 'alice@test.com',
      passwordHash: 'hash1',
    });
    memberUser = await User.create({
      name: 'Member Bob',
      email: 'bob@test.com',
      passwordHash: 'hash2',
    });

    ownerToken = signAccess(ownerUser);
    memberToken = signAccess(memberUser);

    project = await Project.create({
      name: 'Bulk Operations Project',
      key: 'BULK',
      owner: ownerUser._id,
      members: [{ user: memberUser._id, role: 'member' }],
      columns: [
        { name: 'To Do', order: 0, wipLimit: 0 },
        { name: 'Done', order: 1, wipLimit: 0 },
      ],
      taskCounter: 2,
    });

    todoCol = project.columns[0];
    doneCol = project.columns[1];

    await Task.create([
      {
        project: project._id,
        key: 'BULK-1',
        title: 'First Seed Task',
        description: 'First description',
        columnId: todoCol._id,
        position: 1024,
        priority: 'high',
        labels: ['feature'],
        assignees: [memberUser._id],
        reporter: ownerUser._id,
      },
      {
        project: project._id,
        key: 'BULK-2',
        title: 'Second Seed Task',
        description: 'Second description',
        columnId: todoCol._id,
        position: 2048,
        priority: 'medium',
        labels: ['backend'],
        assignees: [],
        reporter: ownerUser._id,
      },
    ]);
  });

  describe('1. Project Data Export (JSON & CSV)', () => {
    it('exports all active project tasks as structured JSON', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${project._id}/export?format=json`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].key).toBe('BULK-1');
      expect(res.body.data[0].column).toBe('To Do');
    });

    it('exports all active project tasks as RFC 4180 CSV', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${project._id}/export?format=csv`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Key,Title,Description,Column,Priority,Assignees,Labels,DueDate,CreatedAt');
      expect(res.text).toContain('BULK-1,First Seed Task');
      expect(res.text).toContain('BULK-2,Second Seed Task');
    });
  });

  describe('2. Bulk Task Import (Batch Ingestion)', () => {
    it('imports an array of tasks with automatic sequential keys (BULK-3, BULK-4)', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${project._id}/import`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send([
          {
            title: 'Imported Card 1',
            description: 'Imported via CSV/JSON',
            column: 'To Do',
            priority: 'urgent',
            labels: ['imported', 'fast'],
          },
          {
            title: 'Imported Card 2',
            description: 'Second imported card',
            column: 'Done',
            priority: 'low',
          },
        ]);

      expect(res.status).toBe(201);
      expect(res.body.data.importedCount).toBe(2);
      expect(res.body.data.tasks[0].key).toBe('BULK-3');
      expect(res.body.data.tasks[1].key).toBe('BULK-4');
      expect(String(res.body.data.tasks[1].columnId)).toBe(String(doneCol._id));

      // Verify taskCounter updated in DB
      const updatedProj = await Project.findById(project._id);
      expect(updatedProj.taskCounter).toBe(4);
    });
  });

  describe('3. Bulk Task Operations (Move, Delete, Update)', () => {
    let task1, task2;

    beforeEach(async () => {
      task1 = await Task.findOne({ key: 'BULK-1' });
      task2 = await Task.findOne({ key: 'BULK-2' });
    });

    it('bulk moves multiple tasks to a destination column', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${project._id}/tasks/bulk-move`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          taskIds: [task1._id.toString(), task2._id.toString()],
          toColumnId: doneCol._id.toString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.data.updatedCount).toBe(2);

      // Verify tasks in DB are now in Done column
      const movedTasks = await Task.find({ _id: { $in: [task1._id, task2._id] } });
      movedTasks.forEach((t) => {
        expect(String(t.columnId)).toBe(String(doneCol._id));
      });
    });

    it('bulk deletes multiple tasks in batch', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${project._id}/tasks/bulk-delete`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          taskIds: [task1._id.toString(), task2._id.toString()],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.deletedCount).toBe(2);

      // Querying tasks should now return 0 active tasks
      const activeTasks = await Task.find({ project: project._id, deletedAt: null });
      expect(activeTasks).toHaveLength(0);
    });
  });
});
