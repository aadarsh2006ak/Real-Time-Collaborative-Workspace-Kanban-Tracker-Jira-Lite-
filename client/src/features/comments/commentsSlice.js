// client/src/features/comments/commentsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export const fetchComments = createAsyncThunk(
  'comments/fetchComments',
  async (taskId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/tasks/${taskId}/comments`);
      return res.data.data.comments;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load comments');
    }
  }
);

export const createComment = createAsyncThunk(
  'comments/createComment',
  async ({ taskId, body, parentId = null, mentions = [] }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/tasks/${taskId}/comments`, {
        body,
        parentId,
        mentions,
      });
      return res.data.data.comment;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to post comment');
    }
  }
);

export const updateComment = createAsyncThunk(
  'comments/updateComment',
  async ({ commentId, body }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/comments/${commentId}`, { body });
      return res.data.data.comment;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update comment');
    }
  }
);

export const deleteComment = createAsyncThunk(
  'comments/deleteComment',
  async (commentId, { rejectWithValue }) => {
    try {
      await api.delete(`/comments/${commentId}`);
      return commentId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete comment');
    }
  }
);

const commentsSlice = createSlice({
  name: 'comments',
  initialState: {
    items: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    commentReceived: (state, action) => {
      const exists = state.items.some((c) => c._id === action.payload._id);
      if (!exists) {
        state.items.push(action.payload);
      }
    },
    commentUpdated: (state, action) => {
      const index = state.items.findIndex((c) => c._id === action.payload._id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    commentRemoved: (state, action) => {
      const comment = state.items.find((c) => c._id === action.payload);
      if (comment) {
        comment.isDeleted = true;
        comment.body = 'This comment was deleted.';
      }
    },
    clearComments: (state) => {
      state.items = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchComments.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Create
      .addCase(createComment.fulfilled, (state, action) => {
        const exists = state.items.some((c) => c._id === action.payload._id);
        if (!exists) {
          state.items.push(action.payload);
        }
      })
      // Update
      .addCase(updateComment.fulfilled, (state, action) => {
        const index = state.items.findIndex((c) => c._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      // Delete
      .addCase(deleteComment.fulfilled, (state, action) => {
        const comment = state.items.find((c) => c._id === action.payload);
        if (comment) {
          comment.isDeleted = true;
          comment.body = 'This comment was deleted.';
        }
      });
  },
});

export const { commentReceived, commentUpdated, commentRemoved, clearComments } =
  commentsSlice.actions;

export default commentsSlice.reducer;
