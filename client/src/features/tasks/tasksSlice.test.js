// client/src/features/tasks/tasksSlice.test.js
import { describe, it, expect } from 'vitest';
import tasksReducer, {
  moveTask,
  taskReceived,
  taskRemoved,
} from './tasksSlice';

describe('Tasks Redux Slice (Optimistic Updates & Rollback)', () => {
  const seedTask = {
    _id: 'task-1',
    project: 'proj-1',
    key: 'ALPHA-1',
    title: 'Initial Task',
    columnId: 'col-todo',
    position: 1024,
    version: 0,
  };

  it('should optimistically update column and position during moveTask.pending', () => {
    let state = tasksReducer(undefined, {
      type: 'tasks/fetch/fulfilled',
      payload: [seedTask],
    });

    const moveArg = {
      taskId: 'task-1',
      toColumnId: 'col-in-prog',
      position: 1536,
    };

    state = tasksReducer(state, {
      type: moveTask.pending.type,
      meta: { requestId: 'req-1', arg: moveArg },
    });

    // Verify optimistic update
    expect(state.entities['task-1'].columnId).toBe('col-in-prog');
    expect(state.entities['task-1'].position).toBe(1536);

    // Verify pending rollback tracking
    expect(state.pendingMoves['req-1']).toEqual({
      taskId: 'task-1',
      prev: { columnId: 'col-todo', position: 1024 },
    });
  });

  it('should automatically rollback coordinates to previous state on moveTask.rejected', () => {
    let state = tasksReducer(undefined, {
      type: 'tasks/fetch/fulfilled',
      payload: [seedTask],
    });

    const moveArg = {
      taskId: 'task-1',
      toColumnId: 'col-in-prog',
      position: 1536,
    };

    // 1. Move pending (optimistic)
    state = tasksReducer(state, {
      type: moveTask.pending.type,
      meta: { requestId: 'req-1', arg: moveArg },
    });
    expect(state.entities['task-1'].columnId).toBe('col-in-prog');

    // 2. Move rejected (rollback)
    state = tasksReducer(state, {
      type: moveTask.rejected.type,
      meta: { requestId: 'req-1', arg: moveArg },
      error: new Error('Network timeout'),
    });

    // Verify rollback restored initial state
    expect(state.entities['task-1'].columnId).toBe('col-todo');
    expect(state.entities['task-1'].position).toBe(1024);
    expect(state.pendingMoves['req-1']).toBeUndefined();
  });

  it('should reconcile state with authoritative server payload on moveTask.fulfilled', () => {
    let state = tasksReducer(undefined, {
      type: 'tasks/fetch/fulfilled',
      payload: [seedTask],
    });

    const moveArg = {
      taskId: 'task-1',
      toColumnId: 'col-in-prog',
      position: 1536,
    };

    state = tasksReducer(state, {
      type: moveTask.pending.type,
      meta: { requestId: 'req-1', arg: moveArg },
    });

    const serverResponse = {
      ...seedTask,
      columnId: 'col-in-prog',
      position: 1536,
      version: 1,
    };

    state = tasksReducer(state, {
      type: moveTask.fulfilled.type,
      payload: serverResponse,
      meta: { requestId: 'req-1', arg: moveArg },
    });

    expect(state.entities['task-1'].version).toBe(1);
    expect(state.pendingMoves['req-1']).toBeUndefined();
  });

  it('should ignore stale socket broadcasts if incoming version is older', () => {
    let state = tasksReducer(undefined, {
      type: 'tasks/fetch/fulfilled',
      payload: [{ ...seedTask, version: 3, title: 'Latest Title' }],
    });

    // Stale socket event with version 2
    state = tasksReducer(
      state,
      taskReceived({ ...seedTask, version: 2, title: 'Stale Title' })
    );

    expect(state.entities['task-1'].title).toBe('Latest Title');
    expect(state.entities['task-1'].version).toBe(3);
  });

  it('should remove task from store on taskRemoved', () => {
    let state = tasksReducer(undefined, {
      type: 'tasks/fetch/fulfilled',
      payload: [seedTask],
    });

    state = tasksReducer(state, taskRemoved('task-1'));
    expect(state.entities['task-1']).toBeUndefined();
    expect(state.ids.includes('task-1')).toBe(false);
  });
});
