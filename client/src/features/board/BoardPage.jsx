// client/src/features/board/BoardPage.jsx
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { DragDropContext } from '@hello-pangea/dnd';
import { Search, Plus, Loader2, X } from 'lucide-react';
import { fetchProjectById, selectProjectById } from '../projects/projectsSlice';
import { fetchTasks, createTask, moveTask } from '../tasks/tasksSlice';
import { selectTasksByColumn } from '../tasks/tasksSelectors';
import { setFilter, addToast } from '../ui/uiSlice';
import { useProjectSocket } from '../../hooks/useProjectSocket';
import { calcPosition } from '../../lib/position';
import Navbar from '../../components/Navbar';
import Column from './Column';
import TaskModal from '../tasks/TaskModal';

export default function BoardPage() {
  const { projectId } = useParams();
  const dispatch = useDispatch();

  // Connect project socket for real-time collaboration & presence
  useProjectSocket(projectId);

  const project = useSelector((state) => selectProjectById(state, projectId));
  const projectStatus = useSelector((state) => state.projects.status);
  const tasksStatus = useSelector((state) => state.tasks.status);
  const byColumn = useSelector(selectTasksByColumn);
  const filters = useSelector((state) => state.ui.filters);
  const onlineUsers = useSelector((state) => state.presence?.online || []);

  // Modal states
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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

  const handleOpenAddTask = (colId) => {
    setTargetColumnId(colId);
    setIsCreateModalOpen(true);
  };

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
        position: newPosition, // Used immediately by moveTask.pending for 0ms optimistic UI
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

  if (projectStatus === 'loading' && !project) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs">Loading board data...</p>
        </div>
      </div>
    );
  }

  const columns = project?.columns || [];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white h-screen overflow-hidden">
      <Navbar currentProject={project} />

      {/* Board Header & Filter Controls */}
      <div className="border-b border-slate-800/80 bg-slate-900/40 px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Project title & Members */}
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{project?.name || 'Kanban Board'}</span>
            </h2>
          </div>

          <div className="hidden sm:flex items-center -space-x-1.5 pl-3 border-l border-slate-800">
            {project?.members?.map((m, i) => {
              const memberId = m.user?._id || m.user;
              const isOnline = onlineUsers.includes(memberId);
              return (
                <div key={i} className="relative group">
                  <div
                    title={`${m.user?.name || 'Member'} (${m.role})${isOnline ? ' • Active Now' : ''}`}
                    className="w-6 h-6 rounded-full bg-slate-800 border border-slate-900 text-slate-300 text-[10px] font-bold flex items-center justify-center cursor-default transition-transform hover:scale-110"
                  >
                    {m.user?.name ? m.user.name[0].toUpperCase() : 'M'}
                  </div>
                  {isOnline && (
                    <span
                      title="Online"
                      className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-900 animate-pulse"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Search & Filter Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={filters.q || ''}
              onChange={(e) => dispatch(setFilter({ key: 'q', value: e.target.value }))}
              placeholder="Search cards..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-850 border border-slate-750 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-44 sm:w-56"
            />
          </div>

          {/* Priority Filter */}
          <select
            value={filters.priority || ''}
            onChange={(e) =>
              dispatch(setFilter({ key: 'priority', value: e.target.value || null }))
            }
            className="px-3 py-1.5 rounded-xl bg-slate-850 border border-slate-750 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* New Task Button */}
          {columns.length > 0 && (
            <button
              onClick={() => handleOpenAddTask(columns[0]._id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Drag & Drop Board Container */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          {tasksStatus === 'loading' && Object.keys(byColumn).length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-xs">Loading workflow columns...</p>
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
                />
              ))}
            </div>
          )}
        </div>
      </DragDropContext>

      {/* Quick Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Create New Task</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Implement WebSocket reconnection strategy"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-750 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Workflow Column
                  </label>
                  <select
                    value={targetColumnId}
                    onChange={(e) => setTargetColumnId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-750 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    {columns.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-750 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Task details and acceptance criteria..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-750 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25"
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
    </div>
  );
}
