// client/src/features/tasks/tasksSelectors.js
import { createSelector } from '@reduxjs/toolkit';
import { tasksAdapter } from './tasksSlice';

export const {
  selectAll: selectAllTasks,
  selectById: selectTaskById,
  selectIds: selectTaskIds,
} = tasksAdapter.getSelectors((state) => state.tasks);

const selectFilters = (state) => state.ui.filters;

/**
 * Memoized derived selector grouping tasks by columnId with active filters and fractional sorting
 */
export const selectTasksByColumn = createSelector(
  [selectAllTasks, selectFilters],
  (tasks, { q, assignee, label, priority }) => {
    const out = {};
    const query = (q || '').trim().toLowerCase();

    for (const t of tasks) {
      if (t.deletedAt) continue;

      if (
        query &&
        !t.title.toLowerCase().includes(query) &&
        !t.key.toLowerCase().includes(query) &&
        !(t.description || '').toLowerCase().includes(query)
      ) {
        continue;
      }

      if (
        assignee &&
        !t.assignees.some((a) => (typeof a === 'string' ? a === assignee : a._id === assignee))
      ) {
        continue;
      }

      if (label && !t.labels.includes(label)) continue;
      if (priority && t.priority !== priority) continue;

      (out[t.columnId] ||= []).push(t);
    }

    // Sort every column's card list in ascending fractional position order
    for (const colId in out) {
      out[colId].sort((a, b) => a.position - b.position);
    }

    return out;
  }
);
