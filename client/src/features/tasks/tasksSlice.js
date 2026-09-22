// client/src/features/tasks/tasksSlice.js
import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export const tasksAdapter = createEntityAdapter({
  selectId: (task) => task._id,
});

export const fetchTasks = createAsyncThunk('tasks/fetch', async (projectId, { rejectWithValue }) => {
  try {
    const res = await api.get(`/projects/${projectId}/tasks`);
    return res.data.data.tasks;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || { message: 'Failed to load tasks' });
  }
});

export const createTask = createAsyncThunk(
  'tasks/create',
  async ({ projectId, taskData }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/projects/${projectId}/tasks`, taskData);
      return res.data.data.task;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to create task' });
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/update',
  async ({ taskId, updateData }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/tasks/${taskId}`, updateData);
      return res.data.data.task;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to update task' });
    }
  }
);

export const moveTask = createAsyncThunk(
  'tasks/move',
  async ({ taskId, toColumnId, beforeId, afterId }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/tasks/${taskId}/move`, { toColumnId, beforeId, afterId });
      return res.data.data.task;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to move task' });
    }
  }
);

export const deleteTask = createAsyncThunk('tasks/delete', async (taskId, { rejectWithValue }) => {
  try {
    await api.delete(`/tasks/${taskId}`);
    return taskId;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || { message: 'Failed to delete task' });
  }
});

export const importTasks = createAsyncThunk(
  'tasks/import',
  async ({ projectId, tasksData }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/projects/${projectId}/import`, tasksData);
      return res.data.data.tasks;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to import tasks' });
    }
  }
);

export const bulkMoveTasks = createAsyncThunk(
  'tasks/bulkMove',
  async ({ projectId, taskIds, toColumnId }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/projects/${projectId}/tasks/bulk-move`, {
        taskIds,
        toColumnId,
      });
      return res.data.data.tasks;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to move tasks in bulk' });
    }
  }
);

export const bulkDeleteTasks = createAsyncThunk(
  'tasks/bulkDelete',
  async ({ projectId, taskIds }, { rejectWithValue }) => {
    try {
      await api.post(`/projects/${projectId}/tasks/bulk-delete`, { taskIds });
      return taskIds;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to delete tasks in bulk' });
    }
  }
);

export const bulkUpdateTasks = createAsyncThunk(
  'tasks/bulkUpdate',
  async ({ projectId, taskIds, updates }, { dispatch, rejectWithValue }) => {
    try {
      await api.post(`/projects/${projectId}/tasks/bulk-update`, { taskIds, updates });
      dispatch(fetchTasks(projectId));
      return { taskIds, updates };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to update tasks in bulk' });
    }
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: tasksAdapter.getInitialState({
    status: 'idle', // 'idle' | 'loading' | 'ready' | 'failed'
    pendingMoves: {},
    error: null,
  }),
  reducers: {
    // Socket broadcast events
    taskReceived(state, { payload }) {
      const current = state.entities[payload._id];
      if (!current || payload.version >= current.version) {
        tasksAdapter.upsertOne(state, payload);
      }
    },
    taskRemoved: tasksAdapter.removeOne,
    clearTasksState(state) {
      tasksAdapter.removeAll(state);
      state.status = 'idle';
      state.pendingMoves = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tasks
      .addCase(fetchTasks.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTasks.fulfilled, (state, { payload }) => {
        tasksAdapter.setAll(state, payload);
        state.status = 'ready';
      })
      .addCase(fetchTasks.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload;
      })
      // Create Task
      .addCase(createTask.fulfilled, (state, { payload }) => {
        tasksAdapter.upsertOne(state, payload);
      })
      // Update Task
      .addCase(updateTask.fulfilled, (state, { payload }) => {
        tasksAdapter.upsertOne(state, payload);
      })
      // Optimistic Move & Rollback
      .addCase(moveTask.pending, (state, { meta }) => {
        const { taskId, toColumnId, position } = meta.arg;
        const task = state.entities[taskId];
        if (task) {
          state.pendingMoves[meta.requestId] = {
            taskId,
            prev: { columnId: task.columnId, position: task.position },
          };
          task.columnId = toColumnId;
          if (position !== undefined) {
            task.position = position;
          }
        }
      })
      .addCase(moveTask.fulfilled, (state, { payload, meta }) => {
        delete state.pendingMoves[meta.requestId];
        tasksAdapter.upsertOne(state, payload);
      })
      .addCase(moveTask.rejected, (state, { meta }) => {
        const rollback = state.pendingMoves[meta.requestId];
        if (rollback && state.entities[rollback.taskId]) {
          Object.assign(state.entities[rollback.taskId], rollback.prev);
        }
        delete state.pendingMoves[meta.requestId];
      })
      // Delete Task
      .addCase(deleteTask.fulfilled, (state, { payload }) => {
        tasksAdapter.removeOne(state, payload);
      })
      // Import Tasks
      .addCase(importTasks.fulfilled, (state, { payload }) => {
        if (Array.isArray(payload)) {
          tasksAdapter.upsertMany(state, payload);
        }
      })
      // Bulk Move Tasks
      .addCase(bulkMoveTasks.fulfilled, (state, { payload }) => {
        if (Array.isArray(payload)) {
          tasksAdapter.upsertMany(state, payload);
        }
      })
      // Bulk Delete Tasks
      .addCase(bulkDeleteTasks.fulfilled, (state, { payload }) => {
        if (Array.isArray(payload)) {
          tasksAdapter.removeMany(state, payload);
        }
      });
  },
});

export const { taskReceived, taskRemoved, clearTasksState } = tasksSlice.actions;

export default tasksSlice.reducer;
