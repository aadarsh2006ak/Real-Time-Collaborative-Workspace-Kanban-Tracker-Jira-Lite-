// client/src/features/activity/activitySlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export const fetchTaskActivity = createAsyncThunk(
  'activity/fetchTaskActivity',
  async (taskId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/tasks/${taskId}/activity`);
      return res.data.data.activities;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load task activity');
    }
  }
);

export const fetchProjectActivity = createAsyncThunk(
  'activity/fetchProjectActivity',
  async (projectId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/projects/${projectId}/activity`);
      return res.data.data.activities;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load project activity');
    }
  }
);

const activitySlice = createSlice({
  name: 'activity',
  initialState: {
    items: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    activityReceived: (state, action) => {
      state.items.unshift(action.payload);
    },
    clearActivity: (state) => {
      state.items = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTaskActivity.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTaskActivity.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchTaskActivity.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchProjectActivity.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProjectActivity.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      });
  },
});

export const { activityReceived, clearActivity } = activitySlice.actions;

export default activitySlice.reducer;
