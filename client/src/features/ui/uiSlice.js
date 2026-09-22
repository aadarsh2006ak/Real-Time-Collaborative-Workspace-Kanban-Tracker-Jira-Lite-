// client/src/features/ui/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialTheme =
  typeof window !== 'undefined'
    ? localStorage.getItem('jira_theme') || 'dark'
    : 'dark';

if (typeof document !== 'undefined') {
  if (initialTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

const initialState = {
  theme: initialTheme,
  taskModalId: null,
  isShortcutsModalOpen: false,
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
    toggleTheme: (state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      state.theme = nextTheme;
      if (typeof window !== 'undefined') {
        localStorage.setItem('jira_theme', nextTheme);
        if (nextTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('jira_theme', action.payload);
        if (action.payload === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    },
    setShortcutsModalOpen: (state, action) => {
      state.isShortcutsModalOpen = action.payload;
    },
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
  toggleTheme,
  setTheme,
  setShortcutsModalOpen,
  setFilter,
  clearFilters,
  resetFilters,
  openTaskModal,
  closeTaskModal,
  addToast,
  removeToast,
} = uiSlice.actions;

export default uiSlice.reducer;
