// client/src/features/presence/presenceSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  online: [], // Array of online user IDs in current project
  typing: {}, // Map of taskId -> array of typing user IDs
};

export const presenceSlice = createSlice({
  name: 'presence',
  initialState,
  reducers: {
    presenceSet: (state, action) => {
      state.online = action.payload || [];
    },
    userJoined: (state, action) => {
      const userId = action.payload;
      if (userId && !state.online.includes(userId)) {
        state.online.push(userId);
      }
    },
    userLeft: (state, action) => {
      const userId = action.payload;
      state.online = state.online.filter((id) => id !== userId);
    },
    typingSet: (state, action) => {
      const { taskId, userId, isTyping } = action.payload;
      if (!taskId || !userId) return;

      const current = state.typing[taskId] || [];
      if (isTyping) {
        if (!current.includes(userId)) {
          state.typing[taskId] = [...current, userId];
        }
      } else {
        state.typing[taskId] = current.filter((id) => id !== userId);
      }
    },
    clearPresence: (state) => {
      state.online = [];
      state.typing = {};
    },
  },
});

export const {
  presenceSet,
  userJoined,
  userLeft,
  typingSet,
  clearPresence,
} = presenceSlice.actions;

export default presenceSlice.reducer;
