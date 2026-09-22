// client/src/features/board/BoardPage.jsx
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { DragDropContext } from '@hello-pangea/dnd';
import {
  Search,
  Plus,
  Loader2,
  X,
  Settings,
  BarChart2,
  FilterX,
  Clock,
  Download,
  CheckSquare,
  Trash2,
} from 'lucide-react';
import { fetchProjectById, selectProjectById } from '../projects/projectsSlice';
import {
  fetchTasks,
  createTask,
  moveTask,
  bulkMoveTasks,
  bulkDeleteTasks,
  bulkUpdateTasks,
} from '../tasks/tasksSlice';
import { selectTasksByColumn, selectAllTasks } from '../tasks/tasksSelectors';
import { setFilter, resetFilters, addToast } from '../ui/uiSlice';
import { useProjectSocket } from '../../hooks/useProjectSocket';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { calcPosition } from '../../lib/position';
import Navbar from '../../components/Navbar';
import Column from './Column';
import TaskModal from '../tasks/TaskModal';
import ProjectSettingsModal from '../projects/ProjectSettingsModal';
import AnalyticsModal from '../analytics/AnalyticsModal';
import ImportExportModal from '../tasks/ImportExportModal';

export default function BoardPage() {
  const { projectId } = useParams();
  const dispatch = useDispatch();

  // Connect project socket for real-time collaboration & presence
  useProjectSocket(projectId);

  const project = useSelector((state) => selectProjectById(state, projectId));
  const projectStatus = useSelector((state) => state.projects.status);
  const tasksStatus = useSelector((state) => state.tasks.status);
  const byColumn = useSelector(selectTasksByColumn);
  const allTasks = useSelector(selectAllTasks);
  const filters = useSelector((state) => state.ui.filters);
  const onlineUsers = useSelector((state) => state.presence?.online || []);

  // Modal states
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  // Multi-select & Bulk Action states
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [isBulkOperating, setIsBulkOperating] = useState(false);

  // Quick task creation form states
  const [targetColumnId, setTargetColumnId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDescription, setTaskDescription] = useState('');

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectById(projectId));
      dispatch(fetchTasks(projectId));
    }
  }, [projectId, dispatch]);

  const handleToggleSelectTask = useCallback((taskId) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  }, []);

  const handleSelectAll = () => {
    setSelectedTaskIds(allTasks.map((t) => t._id));
  };

  const handleDeselectAll = () => {
    setSelectedTaskIds([]);
  };

  const handleBulkMove = async (toColumnId) => {
    if (!toColumnId || selectedTaskIds.length === 0) return;
    setIsBulkOperating(true);
    const res = await dispatch(
      bulkMoveTasks({
        projectId,
        taskIds: selectedTaskIds,
        toColumnId,
      })
    );
    setIsBulkOperating(false);
    if (res.meta.requestStatus === 'fulfilled') {
      dispatch(
        addToast({
          message: `Moved ${selectedTaskIds.length} tasks successfully`,
          type: 'success',
        })
      );
      setSelectedTaskIds([]);
    }
  };

  const handleBulkPriority = async (priority) => {
    if (!priority || selectedTaskIds.length === 0) return;
    setIsBulkOperating(true);
    const res = await dispatch(
      bulkUpdateTasks({
        projectId,
        taskIds: selectedTaskIds,
        updates: { priority },
      })
    );
    setIsBulkOperating(false);
    if (res.meta.requestStatus === 'fulfilled') {
      dispatch(
        addToast({
          message: `Updated priority for ${selectedTaskIds.length} tasks`,
          type: 'success',
        })
      );
      setSelectedTaskIds([]);
    }
  };

  const handleBulkDelete = async () => {
    if (
      selectedTaskIds.length === 0 ||
      !window.confirm(`Are you sure you want to delete ${selectedTaskIds.length} task(s)?`)
    ) {
      return;
    }
    setIsBulkOperating(true);
    const res = await dispatch(
      bulkDeleteTasks({
        projectId,
        taskIds: selectedTaskIds,
      })
    );
    setIsBulkOperating(false);
    if (res.meta.requestStatus === 'fulfilled') {
      dispatch(
        addToast({
          message: `Deleted ${selectedTaskIds.length} tasks`,
          type: 'success',
        })
      );
      setSelectedTaskIds([]);
    }
  };

  const handleOpenAddTask = useCallback((colId) => {
    const columnsList = project?.columns || [];
    const defaultCol = colId || (columnsList[0] ? columnsList[0]._id : '');
    setTargetColumnId(defaultCol);
    setIsCreateModalOpen(true);
  }, [project]);

  const handleTaskClick = useCallback((task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !targetColumnId) return;

    const res = await dispatch(
      createTask({
        projectId,
        taskData: {
          title: taskTitle.trim(),
          description: taskDescription.trim(),
          columnId: targetColumnId,
          priority: taskPriority,
        },
      })
    );

    if (res.meta.requestStatus === 'fulfilled') {
      dispatch(addToast({ message: `Task ${res.payload.key} created!`, type: 'success' }));
      setTaskTitle('');
      setTaskDescription('');
      setIsCreateModalOpen(false);
    }
  };

  // Drag & Drop Handler with 0ms Optimistic UI & Automatic Rollback
  const onDragEnd = ({ source, destination, draggableId }) => {
    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Filter out the dragged card from destination list to calculate neighbors correctly
    const destList = (byColumn[destination.droppableId] || []).filter(
      (t) => t._id !== draggableId
    );

    const before = destList[destination.index - 1];
    const after = destList[destination.index];
    const newPosition = calcPosition(before?.position, after?.position);

    dispatch(
      moveTask({
        taskId: draggableId,
        toColumnId: destination.droppableId,
        beforeId: before?._id || null,
        afterId: after?._id || null,
        position: newPosition,
      })
    ).then((actionResult) => {
      if (actionResult.meta.requestStatus === 'rejected') {
        dispatch(
          addToast({
            message: 'Failed to save card position. Rollback applied.',
            type: 'error',
          })
        );
      }
    });
  };

  const columns = project?.columns || [];

  // Register Global Keyboard Shortcuts
  useKeyboardShortcuts({
    onNewTask: () => {
      if (columns.length > 0) handleOpenAddTask(columns[0]._id);
    },
    onToggleSelectMode: () => {
      setIsSelectMode((prev) => !prev);
      setSelectedTaskIds([]);
    },
    onEscape: () => {
      setIsSelectMode(false);
      setSelectedTaskIds([]);
      setIsCreateModalOpen(false);
      setIsTaskModalOpen(false);
      setIsSettingsOpen(false);
      setIsAnalyticsOpen(false);
      setIsImportExportOpen(false);
    },
    onBulkDelete: handleBulkDelete,
    hasSelection: isSelectMode && selectedTaskIds.length > 0,
  });

  const hasActiveFilters = Boolean(
    filters.q || filters.priority || filters.assignee || filters.isOverdue
  );

  if (projectStatus === 'loading' && !project) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs font-mono">Loading board data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050811] text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white h-screen overflow-hidden relative transition-colors duration-200">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 bg-grid-cyber bg-radial-vignette opacity-40 dark:opacity-50 pointer-events-none" />

      <Navbar currentProject={project} />

      {/* Board Header & Engineered Command Ribbon */}
      <div className="relative z-20 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/75 backdrop-blur-xl px-4 sm:px-6 py-2.5 flex flex-col gap-2.5 shadow-sm transition-colors duration-200">
        {/* Tier 1: Project Identity, Active Presence & Core Action Utilities */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Left: Project Key, Project Name, Task Count & Online Avatars */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 dark:border-blue-500/30 px-2.5 py-0.5 rounded-lg shadow-sm">
                {project?.key || 'PROJ'}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {project?.name || 'Kanban Board'}
              </h2>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 px-2 py-0.5 rounded-full">
                {allTasks.length} {allTasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>

            {/* Online Members Presence */}
            <div className="hidden sm:flex items-center -space-x-1.5 pl-3 border-l border-slate-200 dark:border-slate-800">
              {project?.members?.map((m, i) => {
                const memberId = m.user?._id || m.user;
                const isOnline = onlineUsers.includes(memberId);
                return (
                  <div key={i} className="relative group">
                    <div
                      title={`${m.user?.name || 'Member'} (${m.role})${isOnline ? ' • Active Now' : ''}`}
                      className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-900 text-slate-700 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center cursor-default transition-transform hover:scale-110 shadow-sm"
                    >
                      {m.user?.name ? m.user.name[0].toUpperCase() : 'M'}
                    </div>
                    {isOnline && (
                      <span
                        title="Online"
                        className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-pulse"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Board Tools & Primary CTA */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Multi-Select Toggle */}
            <button
              onClick={() => {
                setIsSelectMode(!isSelectMode);
                if (isSelectMode) setSelectedTaskIds([]);
              }}
              title="Toggle multi-select mode (M)"
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                isSelectMode
                  ? 'bg-blue-600/15 border-blue-500/50 text-blue-600 dark:text-blue-300 shadow-sm'
                  : 'bg-slate-100/80 dark:bg-slate-950/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Select</span>
            </button>

            {/* Import / Export */}
            <button
              onClick={() => setIsImportExportOpen(true)}
              title="Import/Export CSV & JSON"
              className="px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-950/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">Import/Export</span>
            </button>

            {/* Analytics */}
            <button
              onClick={() => setIsAnalyticsOpen(true)}
              title="Board Metrics & Health"
              className="px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-950/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <BarChart2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Analytics</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Project Settings & Columns"
              className="px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-950/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            {/* Primary CTA: Create Task */}
            {columns.length > 0 && (
              <button
                onClick={() => handleOpenAddTask(columns[0]._id)}
                className="relative group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
              >
                <div className="absolute inset-0 shimmer-badge pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-200" />
                <span>Create Task</span>
              </button>
            )}
          </div>
        </div>

        {/* Tier 2: Search, Filters & Quick Toggles */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex-wrap">
          {/* Left: Search Bar & Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input with Hotkey '/' */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                id="board-search-input"
                type="text"
                value={filters.q || ''}
                onChange={(e) => dispatch(setFilter({ key: 'q', value: e.target.value }))}
                placeholder="Search cards (/) ..."
                className="pl-8 pr-7 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-750 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 w-40 sm:w-48 transition-all"
              />
              {filters.q && (
                <button
                  onClick={() => dispatch(setFilter({ key: 'q', value: '' }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Priority Filter */}
            <select
              value={filters.priority || ''}
              onChange={(e) =>
                dispatch(setFilter({ key: 'priority', value: e.target.value || null }))
              }
              className="px-2.5 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-750 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer transition-all"
            >
              <option value="">Priorities (All)</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Assignee Filter */}
            <select
              value={filters.assignee || ''}
              onChange={(e) =>
                dispatch(setFilter({ key: 'assignee', value: e.target.value || null }))
              }
              className="px-2.5 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-750 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 max-w-[140px] cursor-pointer transition-all"
            >
              <option value="">Assignees (All)</option>
              {project?.members?.map((m) => (
                <option key={m.user?._id || m.user} value={m.user?._id || m.user}>
                  {m.user?.name || 'Member'}
                </option>
              ))}
            </select>

            {/* Overdue Quick Toggle */}
            <button
              onClick={() =>
                dispatch(
                  setFilter({
                    key: 'isOverdue',
                    value: filters.isOverdue ? null : true,
                  })
                )
              }
              title="Toggle overdue tasks filter"
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                filters.isOverdue
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300 shadow-sm'
                  : 'bg-slate-100/90 dark:bg-slate-950/80 border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Overdue</span>
            </button>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={() => dispatch(resetFilters())}
                title="Reset all filters"
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <FilterX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right: Engineered Status & Shortcut Tip */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span>Drag cards to reorder</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span>Hotkeys: <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">?</kbd></span>
          </div>
        </div>
      </div>

      {/* Main Drag & Drop Board Container */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="relative z-10 flex-1 overflow-x-auto overflow-y-hidden p-6">
          {tasksStatus === 'loading' && Object.keys(byColumn).length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-xs font-mono">Loading workflow columns...</p>
            </div>
          ) : (
            <div className="flex gap-5 h-full items-start">
              {columns.map((col) => (
                <Column
                  key={col._id}
                  column={col}
                  tasks={byColumn[col._id] || []}
                  onAddTask={handleOpenAddTask}
                  onTaskClick={handleTaskClick}
                  isSelectMode={isSelectMode}
                  selectedTaskIds={selectedTaskIds}
                  onToggleSelectTask={handleToggleSelectTask}
                />
              ))}
            </div>
          )}
        </div>
      </DragDropContext>

      {/* Floating Bulk Action Toolbar (appears when items are selected) */}
      {isSelectMode && selectedTaskIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/95 dark:bg-slate-900/95 border border-blue-500/40 backdrop-blur-md rounded-2xl shadow-2xl p-3 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 pl-2 pr-3 border-r border-slate-200 dark:border-slate-800">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {selectedTaskIds.length} Selected
            </span>
          </div>

          {/* Quick Select All / None */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleSelectAll}
              className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              All
            </button>
            <button
              onClick={handleDeselectAll}
              className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Bulk Move To Column */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">Move:</span>
            <select
              disabled={isBulkOperating}
              onChange={(e) => {
                if (e.target.value) handleBulkMove(e.target.value);
                e.target.value = '';
              }}
              defaultValue=""
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="" disabled>
                Destination Column
              </option>
              {columns.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bulk Set Priority */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">Priority:</span>
            <select
              disabled={isBulkOperating}
              onChange={(e) => {
                if (e.target.value) handleBulkPriority(e.target.value);
                e.target.value = '';
              }}
              defaultValue=""
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="" disabled>
                Set Priority
              </option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Bulk Delete */}
          <button
            disabled={isBulkOperating}
            onClick={handleBulkDelete}
            title="Delete selected tasks"
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      )}

      {/* Quick Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Task</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Implement search indexing"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Workflow Column
                  </label>
                  <select
                    value={targetColumnId}
                    onChange={(e) => setTargetColumnId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    {columns.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Task details and acceptance criteria..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details & Edit Modal */}
      <TaskModal
        task={selectedTask}
        project={project}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
      />

      {/* Project Settings Modal */}
      <ProjectSettingsModal
        project={project}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Board Analytics Modal */}
      <AnalyticsModal
        projectId={projectId}
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />

      {/* Import / Export Modal */}
      <ImportExportModal
        project={project}
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
      />
    </div>
  );
}
