// server/tests/analytics_and_filters.test.js
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

describe('Phase 9: Advanced Filters & Board Analytics Module', () => {
  let ownerUser, memberUser1, memberUser2;
  let ownerToken, memberToken1;
  let project, todoCol, inProgCol, doneCol;

  beforeEach(async () => {
    ownerUser = await User.create({
      name: 'Owner Alice',
      email: 'alice@test.com',
      passwordHash: 'hash1',
    });
    memberUser1 = await User.create({
      name: 'Bob Developer',
      email: 'bob@test.com',
      passwordHash: 'hash2',
    });
    memberUser2 = await User.create({
      name: 'Charlie QA',
      email: 'charlie@test.com',
      passwordHash: 'hash3',
    });

    ownerToken = signAccess(ownerUser);
    memberToken1 = signAccess(memberUser1);

    project = await Project.create({
      name: 'Analytics Project',
      key: 'ANL',
      owner: ownerUser._id,
      members: [
        { user: memberUser1._id, role: 'member' },
        { user: memberUser2._id, role: 'member' },
      ],
      columns: [
        { name: 'To Do', order: 0, wipLimit: 2 },
        { name: 'In Progress', order: 1, wipLimit: 1 },
        { name: 'Done', order: 2, wipLimit: 0 },
      ],
    });

    todoCol = project.columns[0];
    inProgCol = project.columns[1];
    doneCol = project.columns[2];

    // Seed tasks
    await Task.create([
      {
        project: project._id,
        key: 'ANL-1',
        title: 'Overdue Bug Fix',
        description: 'Urgent security fix',
        columnId: todoCol._id,
        position: 1024,
        priority: 'urgent',
        labels: ['bug', 'security'],
        assignees: [memberUser1._id],
        reporter: ownerUser._id,
        dueDate: new Date(Date.now() - 86400000), // Yesterday (overdue)
      },
      {
        project: project._id,
        key: 'ANL-2',
        title: 'Backend API Refactor',
        description: 'Refactor controllers',
        columnId: inProgCol._id,
        position: 2048,
        priority: 'high',
        labels: ['backend', 'api'],
        assignees: [memberUser1._id],
        reporter: ownerUser._id,
        dueDate: new Date(Date.now() + 86400000), // Tomorrow
      },
      {
        project: project._id,
        key: 'ANL-3',
        title: 'Another In Progress Task (Breaches WIP)',
        description: 'Causes WIP exceed',
        columnId: inProgCol._id,
        position: 3072,
        priority: 'medium',
        labels: ['backend'],
        assignees: [memberUser2._id],
        reporter: ownerUser._id,
      },
      {
        project: project._id,
        key: 'ANL-4',
        title: 'Finished feature',
        description: 'Successfully deployed',
        columnId: doneCol._id,
        position: 4096,
        priority: 'low',
        labels: ['frontend'],
        assignees: [memberUser2._id],
        reporter: ownerUser._id,
      },
    ]);
  });

  describe('1. Advanced Multi-Criteria Task Filtering', () => {
    it('filters tasks by multiple comma-separated labels', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${project._id}/tasks?labels=bug,api`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tasks).toHaveLength(2);
      const keys = res.body.data.tasks.map((t) => t.key);
      expect(keys).toContain('ANL-1');
      expect(keys).toContain('ANL-2');
    });

    it('filters tasks by overdue status', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${project._id}/tasks?isOverdue=true`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tasks).toHaveLength(1);
      expect(res.body.data.tasks[0].key).toBe('ANL-1');
    });

    it('filters tasks by multiple assignees', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${project._id}/tasks?assignees=${memberUser1._id},${memberUser2._id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tasks).toHaveLength(4);
    });
  });

  describe('2. Board Metrics & Analytics Endpoint', () => {
    it('computes accurate executive metrics, WIP adherence, and workload distribution', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${project._id}/analytics`)
        .set('Authorization', `Bearer ${memberToken1}`);

      expect(res.status).toBe(200);
      const analytics = res.body.data.analytics;

      expect(analytics.totalTasks).toBe(4);
      expect(analytics.completedTasks).toBe(1);
      expect(analytics.activeTasks).toBe(3);
      expect(analytics.completionRate).toBe(25);
      expect(analytics.overdueTasks).toBe(1);

      // Priority Breakdown
      expect(analytics.priorityBreakdown).toEqual({
        urgent: 1,
        high: 1,
        medium: 1,
        low: 1,
      });

      // WIP Limit Health
      // In Progress has wipLimit=1 and 2 tasks -> isExceeded should be true
      const inProgHealth = analytics.columnHealth.find((c) => c.name === 'In Progress');
      expect(inProgHealth).toBeDefined();
      expect(inProgHealth.taskCount).toBe(2);
      expect(inProgHealth.isExceeded).toBe(true);
      expect(inProgHealth.utilization).toBe(200);

      // To Do has wipLimit=2 and 1 task -> isExceeded should be false
      const todoHealth = analytics.columnHealth.find((c) => c.name === 'To Do');
      expect(todoHealth.isExceeded).toBe(false);
      expect(todoHealth.utilization).toBe(50);

      // Assignee Workload
      const bobWorkload = analytics.assigneeWorkload.find((w) => w.name === 'Bob Developer');
      expect(bobWorkload.taskCount).toBe(2);

      const charlieWorkload = analytics.assigneeWorkload.find((w) => w.name === 'Charlie QA');
      expect(charlieWorkload.taskCount).toBe(2);
    });
  });
});
