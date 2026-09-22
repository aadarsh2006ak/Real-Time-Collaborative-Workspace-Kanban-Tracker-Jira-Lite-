// server/src/seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const env = require('./config/env');
const User = require('./modules/users/user.model');
const Project = require('./modules/projects/project.model');
const Task = require('./modules/tasks/task.model');
const Comment = require('./modules/comments/comment.model');
const Activity = require('./modules/activity/activity.model');

async function seedDatabase(options = { clear: true }) {
  if (options.clear) {
    console.log('Clearing existing test data...');
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Comment.deleteMany({});
    await Activity.deleteMany({});
  }

  console.log('Creating demo users...');
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const siddharth = await User.create({
    name: 'Siddharth Kumar',
    email: 'siddharth@example.com',
    passwordHash,
  });

  const alex = await User.create({
    name: 'Alex Morgan',
    email: 'alex@example.com',
    passwordHash,
  });

  const maya = await User.create({
    name: 'Maya Patel',
    email: 'maya@example.com',
    passwordHash,
  });

  console.log('Creating demo project...');
  const defaultColumns = [
    { _id: new mongoose.Types.ObjectId(), name: 'To Do', order: 0, wipLimit: 10 },
    { _id: new mongoose.Types.ObjectId(), name: 'In Progress', order: 1, wipLimit: 4 },
    { _id: new mongoose.Types.ObjectId(), name: 'Code Review', order: 2, wipLimit: 3 },
    { _id: new mongoose.Types.ObjectId(), name: 'Done', order: 3, wipLimit: 0 },
  ];

  const project = await Project.create({
    name: 'Engineering Platform',
    key: 'EP',
    description: 'Cloud Infrastructure, Microservices, and Core Platform Kanban',
    owner: siddharth._id,
    members: [
      { user: siddharth._id, role: 'admin' },
      { user: alex._id, role: 'member' },
      { user: maya._id, role: 'member' },
    ],
    columns: defaultColumns,
    taskCounter: 6,
  });

  console.log('Creating demo tasks...');
  const [todoCol, inProgCol, reviewCol, doneCol] = defaultColumns;

  const tasksData = [
    {
      project: project._id,
      key: 'EP-1',
      title: 'Configure Distributed Redis Pub/Sub Cluster',
      description: 'Set up multi-node Redis cluster for cross-server Socket.io presence events',
      columnId: inProgCol._id,
      position: 1024,
      priority: 'high',
      assignees: [siddharth._id, alex._id],
      labels: ['backend', 'infra', 'redis'],
      reporter: siddharth._id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
    {
      project: project._id,
      key: 'EP-2',
      title: 'Implement Dark & Light Theme System',
      description: 'Design sleek Tailwind dark mode and clean SaaS light mode palette with hotkey switch',
      columnId: reviewCol._id,
      position: 1024,
      priority: 'medium',
      assignees: [maya._id],
      labels: ['frontend', 'ui', 'tailwind'],
      reporter: siddharth._id,
    },
    {
      project: project._id,
      key: 'EP-3',
      title: 'RFC 4180 CSV & JSON Bulk Export Engine',
      description: 'Stream all active cards into standardized double-quoted CSV spreadsheet format',
      columnId: doneCol._id,
      position: 1024,
      priority: 'high',
      assignees: [siddharth._id],
      labels: ['export', 'csv'],
      reporter: siddharth._id,
    },
    {
      project: project._id,
      key: 'EP-4',
      title: 'Optimistic Concurrency Control (OCC) Guard',
      description: 'Prevent mid-air collision updates with 409 Conflict version checks',
      columnId: doneCol._id,
      position: 2048,
      priority: 'urgent',
      assignees: [alex._id],
      labels: ['database', 'security'],
      reporter: alex._id,
    },
    {
      project: project._id,
      key: 'EP-5',
      title: 'Multi-Select Card Floating Action Bar',
      description: 'Batch move, priority setting, and bulk deletion toolbar',
      columnId: inProgCol._id,
      position: 2048,
      priority: 'medium',
      assignees: [siddharth._id],
      labels: ['frontend', 'ux'],
      reporter: siddharth._id,
    },
    {
      project: project._id,
      key: 'EP-6',
      title: 'Automated GitHub Actions CI/CD Pipeline',
      description: 'Test matrix for Jest 78 backend tests and Vitest 10 frontend tests with Docker packaging',
      columnId: todoCol._id,
      position: 1024,
      priority: 'high',
      assignees: [alex._id, maya._id],
      labels: ['devops', 'ci-cd'],
      reporter: siddharth._id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  ];

  const createdTasks = await Task.insertMany(tasksData);

  console.log('Adding demo comments and activity trail...');
  await Comment.create({
    task: createdTasks[0]._id,
    project: project._id,
    author: alex._id,
    body: 'Redis cluster configuration files tested on staging environment! Latency under 2ms.',
  });

  await Activity.create({
    project: project._id,
    task: createdTasks[0]._id,
    actor: siddharth._id,
    type: 'TASK_MOVED',
    meta: { from: 'To Do', to: 'In Progress' },
  });

  console.log('\n===========================================');
  console.log('✅ Demo Data Seeded Successfully!');
  console.log('👤 Email:    siddharth@example.com');
  console.log('🔑 Password: Password123!');
  console.log('📁 Project:  Engineering Platform (EP)');
  console.log('===========================================\n');
}

async function autoSeedIfEmpty() {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('🌱 Empty database detected on startup. Automatically seeding initial demo data...');
    await seedDatabase({ clear: false });
  }
}

// Standalone execution
if (require.main === module) {
  (async () => {
    console.log('Connecting to MongoDB at:', env.MONGO_URI);
    await mongoose.connect(env.MONGO_URI);
    await seedDatabase({ clear: true });
    await mongoose.disconnect();
    process.exit(0);
  })().catch((err) => {
    console.error('Seed Error:', err);
    process.exit(1);
  });
}

module.exports = { seedDatabase, autoSeedIfEmpty };
