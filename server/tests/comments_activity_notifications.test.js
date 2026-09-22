// server/tests/comments_activity_notifications.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/modules/users/user.model');
const Project = require('../src/modules/projects/project.model');
const Task = require('../src/modules/tasks/task.model');
const Comment = require('../src/modules/comments/comment.model');
const Activity = require('../src/modules/activity/activity.model');
const Notification = require('../src/modules/notifications/notification.model');
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

describe('Phase 8: Comments, Activity Audit Trail & In-App Notifications Module', () => {
  let ownerUser, memberUser, outsiderUser;
  let ownerToken, memberToken, outsiderToken;
  let project, todoCol, task;

  beforeEach(async () => {
    ownerUser = await User.create({
      name: 'Owner User',
      email: 'owner@test.com',
      passwordHash: 'hash1',
    });
    memberUser = await User.create({
      name: 'Member User',
      email: 'member@test.com',
      passwordHash: 'hash2',
    });
    outsiderUser = await User.create({
      name: 'Outsider User',
      email: 'outsider@test.com',
      passwordHash: 'hash3',
    });

    ownerToken = signAccess(ownerUser);
    memberToken = signAccess(memberUser);
    outsiderToken = signAccess(outsiderUser);

    project = await Project.create({
      name: 'Collaboration Project',
      key: 'COL',
      owner: ownerUser._id,
      members: [{ user: memberUser._id, role: 'member' }],
      columns: [
        { name: 'To Do', order: 0, wipLimit: 0 },
        { name: 'Done', order: 1, wipLimit: 0 },
      ],
    });
    todoCol = project.columns[0];

    task = await Task.create({
      project: project._id,
      key: 'COL-1',
      title: 'Real-Time Commenting Feature',
      description: 'Implement comments and notifications',
      columnId: todoCol._id,
      position: 1024,
      priority: 'high',
      assignees: [memberUser._id],
      reporter: ownerUser._id,
      version: 0,
      deletedAt: null,
    });
  });

  describe('1. Task Comments REST APIs', () => {
    it('creates a comment and notifies assignees & mentioned users', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${task._id}/comments`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          body: 'Hello @member, please review the latest PR!',
          mentions: [memberUser._id.toString()],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comment.body).toBe('Hello @member, please review the latest PR!');
      expect(res.body.data.comment.author.name).toBe('Owner User');

      // Verify activity was logged
      const activity = await Activity.findOne({ task: task._id, type: 'COMMENT_ADDED' });
      expect(activity).not.toBeNull();
      expect(activity.actor.toString()).toBe(ownerUser._id.toString());

      // Verify notification was created for mentioned member
      const notification = await Notification.findOne({
        user: memberUser._id,
        refId: task._id,
      });
      expect(notification).not.toBeNull();
      expect(notification.type).toBe('MENTION');
      expect(notification.readAt).toBeNull();
    });

    it('fetches all comments for a task in chronological order', async () => {
      await Comment.create({
        task: task._id,
        project: project._id,
        author: ownerUser._id,
        body: 'First comment',
        createdAt: new Date(Date.now() - 10000),
      });

      await Comment.create({
        task: task._id,
        project: project._id,
        author: memberUser._id,
        body: 'Second comment',
        createdAt: new Date(),
      });

      const res = await request(app)
        .get(`/api/v1/tasks/${task._id}/comments`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.comments).toHaveLength(2);
      expect(res.body.data.comments[0].body).toBe('First comment');
      expect(res.body.data.comments[1].body).toBe('Second comment');
    });

    it('allows author to update comment content and sets editedAt', async () => {
      const comment = await Comment.create({
        task: task._id,
        project: project._id,
        author: ownerUser._id,
        body: 'Original content',
      });

      const res = await request(app)
        .patch(`/api/v1/comments/${comment._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ body: 'Updated content with edits' });

      expect(res.status).toBe(200);
      expect(res.body.data.comment.body).toBe('Updated content with edits');
      expect(res.body.data.comment.editedAt).not.toBeNull();
    });

    it('prevents non-author from updating comment (403 FORBIDDEN)', async () => {
      const comment = await Comment.create({
        task: task._id,
        project: project._id,
        author: ownerUser._id,
        body: 'Original content',
      });

      const res = await request(app)
        .patch(`/api/v1/comments/${comment._id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ body: 'Hacked content' });

      expect(res.status).toBe(403);
    });

    it('soft deletes comment and returns placeholder on retrieval', async () => {
      const comment = await Comment.create({
        task: task._id,
        project: project._id,
        author: memberUser._id,
        body: 'Sensitive remark to remove',
      });

      const delRes = await request(app)
        .delete(`/api/v1/comments/${comment._id}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(delRes.status).toBe(200);

      // Verify task comment query returns deleted placeholder
      const listRes = await request(app)
        .get(`/api/v1/tasks/${task._id}/comments`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.comments[0].isDeleted).toBe(true);
      expect(listRes.body.data.comments[0].body).toBe('This comment was deleted.');
    });
  });

  describe('2. Immutable Activity Stream APIs', () => {
    beforeEach(async () => {
      await Activity.create([
        {
          project: project._id,
          task: task._id,
          actor: ownerUser._id,
          type: 'TASK_CREATED',
          meta: { title: task.title },
          createdAt: new Date(Date.now() - 20000),
        },
        {
          project: project._id,
          task: task._id,
          actor: memberUser._id,
          type: 'TASK_MOVED',
          meta: { from: 'To Do', to: 'Done' },
          createdAt: new Date(Date.now() - 10000),
        },
      ]);
    });

    it('retrieves project-wide activity stream sorted newest first', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${project._id}/activity`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.activities).toHaveLength(2);
      expect(res.body.data.activities[0].type).toBe('TASK_MOVED');
      expect(res.body.data.activities[1].type).toBe('TASK_CREATED');
      expect(res.body.data.pagination.total).toBe(2);
    });

    it('retrieves task-specific change history stream', async () => {
      const res = await request(app)
        .get(`/api/v1/tasks/${task._id}/activity`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.activities).toHaveLength(2);
      expect(res.body.data.activities[0].actor.name).toBe('Member User');
    });
  });

  describe('3. In-App Notifications APIs', () => {
    let notif1, notif2;

    beforeEach(async () => {
      notif1 = await Notification.create({
        user: memberUser._id,
        type: 'ASSIGNMENT',
        refType: 'Task',
        refId: task._id,
        title: 'Assigned to COL-1',
        message: 'You have been assigned to task COL-1',
        readAt: null,
      });

      notif2 = await Notification.create({
        user: memberUser._id,
        type: 'COMMENT',
        refType: 'Task',
        refId: task._id,
        title: 'New comment on COL-1',
        message: 'Owner User commented on your task',
        readAt: null,
      });
    });

    it('lists unread notifications and accurate unread count', async () => {
      const res = await request(app)
        .get('/api/v1/notifications?unreadOnly=true')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(2);
      expect(res.body.data.unreadCount).toBe(2);
    });

    it('marks a single notification as read', async () => {
      const res = await request(app)
        .patch(`/api/v1/notifications/${notif1._id}/read`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notification.readAt).not.toBeNull();

      // Check unread count is now 1
      const countRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(countRes.body.data.unreadCount).toBe(1);
    });

    it('marks all notifications as read in bulk', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('All notifications marked as read');

      const countRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(countRes.body.data.unreadCount).toBe(0);
    });
  });
});
