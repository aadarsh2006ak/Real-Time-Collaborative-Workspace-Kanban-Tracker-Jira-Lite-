// client/src/features/tasks/TaskModal.jsx
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  X,
  Trash2,
  AlertTriangle,
  Loader2,
  Calendar,
  Layers,
  Save,
  Clock,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { updateTask, deleteTask } from './tasksSlice';
import { addToast } from '../ui/uiSlice';

export default function TaskModal({ task, project, isOpen, onClose }) {
  const dispatch = useDispatch();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [columnId, setColumnId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [isSaving, setIsSaving] = useState(false);
  const [conflictError, setConflictError] = useState(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setColumnId(task.columnId || '');
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setConflictError(null);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setConflictError(null);

    const updatePayload = {
      title: title.trim(),
      description: description.trim(),
      priority,
      columnId,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      version: task.version, // OCC Concurrency Control
    };

    const res = await dispatch(
      updateTask({
        taskId: task._id,
        updateData: updatePayload,
      })
    );

    setIsSaving(false);

    if (res.meta.requestStatus === 'fulfilled') {
      dispatch(addToast({ message: 'Task updated successfully', type: 'success' }));
      onClose();
    } else {
      const err = res.payload;
      if (err?.code === 'VERSION_CONFLICT') {
        setConflictError(
          'Conflict detected: Another user edited this task concurrently. Please close and reopen to load the latest changes.'
        );
      } else {
        dispatch(addToast({ message: err?.message || 'Failed to update task', type: 'error' }));
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete task ${task.key}?`)) {
      const res = await dispatch(deleteTask(task._id));
      if (res.meta.requestStatus === 'fulfilled') {
        dispatch(addToast({ message: `Task ${task.key} deleted`, type: 'info' }));
        onClose();
      }
    }
  };

  const columns = project?.columns || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {task.key}
            </span>
            <span className="text-xs text-slate-400">
              Created by {task.reporter?.name || 'Team Member'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              title="Delete Task"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex px-5 border-b border-slate-800 text-xs font-medium gap-6 bg-slate-900/40">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 flex items-center gap-2 transition-all ${
              activeTab === 'details'
                ? 'text-blue-400 border-b-2 border-blue-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Details
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`py-3 flex items-center gap-2 transition-all ${
              activeTab === 'comments'
                ? 'text-blue-400 border-b-2 border-blue-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Comments
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-3 flex items-center gap-2 transition-all ${
              activeTab === 'activity'
                ? 'text-blue-400 border-b-2 border-blue-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Activity
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {conflictError && (
            <div className="mb-4 p-4 rounded-xl bg-rose-950/70 border border-rose-500/40 flex items-start gap-3 text-rose-200 text-xs">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-300">Version Conflict (409)</p>
                <p className="mt-1">{conflictError}</p>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-750 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    Workflow Column
                  </label>
                  <select
                    value={columnId}
                    onChange={(e) => setColumnId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-850 border border-slate-750 text-xs text-white focus:outline-none focus:border-blue-500"
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
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-850 border border-slate-750 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-850 border border-slate-750 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add detailed task description, acceptance criteria, or notes..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-750 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  OCC Version: {task.version}
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'comments' && (
            <div className="py-8 text-center text-slate-400 text-xs">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p>Threaded comments module will be enabled in Week 8.</p>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="py-8 text-center text-slate-400 text-xs">
              <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p>Task audit trail & activity log will be enabled in Week 8.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
