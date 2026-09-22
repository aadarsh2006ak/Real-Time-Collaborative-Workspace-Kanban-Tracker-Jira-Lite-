// client/src/features/ui/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  taskModalId: null,
  filters: {
    q: '',
    assignee: null,
    label: null,
    priority: null,
    isOverdue: null,
  },
  toasts: [],
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      const { key, value } = action.payload;
      state.filters[key] = value;
    },
    clearFilters: (state) => {
      state.filters = { q: '', assignee: null, label: null, priority: null, isOverdue: null };
    },
    resetFilters: (state) => {
      state.filters = { q: '', assignee: null, label: null, priority: null, isOverdue: null };
    },
    openTaskModal: (state, action) => {
      state.taskModalId = action.payload;
    },
    closeTaskModal: (state) => {
      state.taskModalId = null;
    },
    addToast: (state, action) => {
      const { message, type = 'info', id = Date.now() } = action.payload;
      state.toasts.push({ id, message, type });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const {
  setFilter,
  clearFilters,
  resetFilters,
  openTaskModal,
  closeTaskModal,
  addToast,
  removeToast,
} = uiSlice.actions;

export default uiSlice.reducer;
