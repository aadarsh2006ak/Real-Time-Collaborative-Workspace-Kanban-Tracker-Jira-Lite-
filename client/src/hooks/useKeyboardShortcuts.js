// client/src/hooks/useKeyboardShortcuts.js
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { toggleTheme, setShortcutsModalOpen } from '../features/ui/uiSlice';

export function useKeyboardShortcuts({
  onNewTask,
  onToggleSelectMode,
  onEscape,
  onBulkDelete,
  hasSelection = false,
} = {}) {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInputFocused =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeTag === 'select' ||
        document.activeElement?.isContentEditable;

      // Handle Escape in all contexts
      if (e.key === 'Escape') {
        if (isInputFocused) {
          document.activeElement?.blur();
        }
        if (onEscape) {
          onEscape();
        }
        return;
      }

      // If user is typing in a form or input, don't intercept standard alphanumeric keys
      if (isInputFocused) return;

      // Focus Search input: '/'
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('board-search-input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // Show Shortcuts Cheat Sheet: '?' or 'Shift + /'
      if (e.key === '?') {
        e.preventDefault();
        dispatch(setShortcutsModalOpen(true));
        return;
      }

      // Toggle Theme: 't' or 'T'
      if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        dispatch(toggleTheme());
        return;
      }

      // New Task Modal: 'c' or 'n'
      if ((e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'n') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (onNewTask) onNewTask();
        return;
      }

      // Multi-Select Toggle: 'm'
      if (e.key.toLowerCase() === 'm' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (onToggleSelectMode) onToggleSelectMode();
        return;
      }

      // Bulk Delete: 'Delete' or 'Backspace' when tasks are selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && hasSelection) {
        e.preventDefault();
        if (onBulkDelete) onBulkDelete();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, onNewTask, onToggleSelectMode, onEscape, onBulkDelete, hasSelection]);
}
