// client/src/features/ui/uiSlice.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import reducer, {
  toggleTheme,
  setTheme,
  setShortcutsModalOpen,
  setFilter,
  clearFilters,
  resetFilters,
  addToast,
  removeToast,
} from './uiSlice';

// Mock localStorage for Node test environment
const mockStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    clear: () => {
      store = {};
    },
    removeItem: (key) => {
      delete store[key];
    },
  };
})();

globalThis.localStorage = mockStorage;

describe('UI Slice (Phase 11 Theme Engine & Modal System)', () => {
  const initialState = {
    theme: 'dark',
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

  beforeEach(() => {
    localStorage.clear();
  });

  it('should toggle theme between dark and light modes', () => {
    const state1 = reducer(initialState, toggleTheme());
    expect(state1.theme).toBe('light');

    const state2 = reducer(state1, toggleTheme());
    expect(state2.theme).toBe('dark');
  });

  it('should explicitly set theme', () => {
    const state = reducer(initialState, setTheme('light'));
    expect(state.theme).toBe('light');
  });

  it('should open and close keyboard shortcuts modal', () => {
    const openState = reducer(initialState, setShortcutsModalOpen(true));
    expect(openState.isShortcutsModalOpen).toBe(true);

    const closedState = reducer(openState, setShortcutsModalOpen(false));
    expect(closedState.isShortcutsModalOpen).toBe(false);
  });

  it('should update multi-criteria filters and reset accurately', () => {
    let state = reducer(initialState, setFilter({ key: 'q', value: 'bug' }));
    state = reducer(state, setFilter({ key: 'priority', value: 'high' }));
    state = reducer(state, setFilter({ key: 'isOverdue', value: true }));

    expect(state.filters.q).toBe('bug');
    expect(state.filters.priority).toBe('high');
    expect(state.filters.isOverdue).toBe(true);

    const resetState = reducer(state, resetFilters());
    expect(resetState.filters.q).toBe('');
    expect(resetState.filters.priority).toBe(null);
    expect(resetState.filters.isOverdue).toBe(null);
  });

  it('should push and pop toast notifications', () => {
    const state1 = reducer(
      initialState,
      addToast({ id: 't1', message: 'Test Notification', type: 'success' })
    );
    expect(state1.toasts).toHaveLength(1);
    expect(state1.toasts[0].message).toBe('Test Notification');

    const state2 = reducer(state1, removeToast('t1'));
    expect(state2.toasts).toHaveLength(0);
  });
});
