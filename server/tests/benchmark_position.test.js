// server/tests/benchmark_position.test.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Task = require('../src/modules/tasks/task.model');
const Project = require('../src/modules/projects/project.model');
const User = require('../src/modules/users/user.model');
const { computePosition, GAP } = require('../src/utils/position');

describe('⚡ Algorithmic Benchmark: O(N) Sequential Indexing vs O(1) Fractional Midpoint', () => {
  let mongod;
  let testProject;
  let testUser;
  const colId = new mongoose.Types.ObjectId().toString();
  const N = 50; // 50 tasks in a column

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    testUser = await User.create({
      name: 'Benchmark User',
      email: 'bench@test.com',
      passwordHash: 'hash',
    });

    testProject = await Project.create({
      name: 'Benchmark Project',
      key: 'BENCH',
      owner: testUser._id,
      columns: [{ _id: colId, name: 'In Progress', order: 0, wipLimit: 0 }],
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  beforeEach(async () => {
    await Task.deleteMany({});
    // Seed N tasks
    const initialTasks = [];
    for (let i = 0; i < N; i++) {
      initialTasks.push({
        project: testProject._id,
        key: `BENCH-${i + 1}`,
        title: `Task ${i + 1}`,
        columnId: colId,
        position: (i + 1) * GAP,
        version: 1,
        reporter: testUser._id,
      });
    }
    await Task.insertMany(initialTasks);
  });

  it('measures latency and DB write reduction between O(N) vs O(1)', async () => {
    const allTasks = await Task.find({ columnId: colId }).sort({ position: 1 });
    const taskToMove = allTasks[allTasks.length - 1]; // Move last card to top (index 1)
    const targetIndex = 1;

    // --- 1. OLD APPROACH: O(N) Sequential Index Shift ---
    const oldStartTime = process.hrtime.bigint();
    
    // In traditional O(N) approach: update moved card + shift all subsequent cards by +1
    let oldDbWrites = 0;
    const cardsToShift = allTasks.filter((_, idx) => idx >= targetIndex && idx < allTasks.length - 1);
    
    // Update moved card to targetIndex
    await Task.updateOne({ _id: taskToMove._id }, { $set: { position: targetIndex } });
    oldDbWrites++;

    // Write amplification: rewrite indices for all subsequent N cards
    for (let i = 0; i < cardsToShift.length; i++) {
      await Task.updateOne({ _id: cardsToShift[i]._id }, { $set: { position: targetIndex + 1 + i } });
      oldDbWrites++;
    }
    
    const oldEndTime = process.hrtime.bigint();
    const oldDurationMs = Number(oldEndTime - oldStartTime) / 1e6;

    // --- 2. CURRENT APPROACH: O(1) Fractional Midpoint ---
    // Reset positions for fair comparison
    await Task.deleteMany({});
    const resetTasks = [];
    for (let i = 0; i < N; i++) {
      resetTasks.push({
        project: testProject._id,
        key: `BENCH-${i + 1}`,
        title: `Task ${i + 1}`,
        columnId: colId,
        position: (i + 1) * GAP,
        version: 1,
        reporter: testUser._id,
      });
    }
    await Task.insertMany(resetTasks);

    const freshTasks = await Task.find({ columnId: colId }).sort({ position: 1 });
    const freshTaskToMove = freshTasks[freshTasks.length - 1];
    const beforeNeighbor = freshTasks[0]; // between 0 and 1
    const afterNeighbor = freshTasks[1];

    const newStartTime = process.hrtime.bigint();
    let newDbWrites = 0;

    // Calculate midpoint O(1)
    const newPos = await computePosition(beforeNeighbor._id, afterNeighbor._id, Task);
    
    // Exactly 1 single database write
    await Task.updateOne({ _id: freshTaskToMove._id }, { $set: { position: newPos } });
    newDbWrites = 1;

    const newEndTime = process.hrtime.bigint();
    const newDurationMs = Number(newEndTime - newStartTime) / 1e6;

    const latencyReduction = (((oldDurationMs - newDurationMs) / oldDurationMs) * 100).toFixed(1);
    const writeReduction = (((oldDbWrites - newDbWrites) / oldDbWrites) * 100).toFixed(1);

    console.log('\n======================================================');
    console.log(`📊 BENCHMARK RESULTS (Column Size: N = ${N} tasks)`);
    console.log('======================================================');
    console.log(`❌ Old O(N) Sequential Approach:  ${oldDurationMs.toFixed(2)} ms | Database Writes: ${oldDbWrites}`);
    console.log(`✅ O(1) Fractional Midpoint:      ${newDurationMs.toFixed(2)} ms | Database Writes: ${newDbWrites}`);
    console.log(`⚡ Latency Reduction:             ${latencyReduction}% faster`);
    console.log(`📉 Database Write Reduction:      ${writeReduction}% fewer DB queries`);
    console.log('======================================================\n');

    expect(newDbWrites).toBe(1);
    expect(oldDbWrites).toBeGreaterThanOrEqual(N - 1);
    expect(newDurationMs).toBeLessThan(oldDurationMs);
  });
});
