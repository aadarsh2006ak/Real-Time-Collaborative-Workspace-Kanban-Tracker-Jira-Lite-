// client/src/features/tasks/TaskModal.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  Send,
  Edit2,
  Check,
  Tag,
  Users,
  Plus,
} from 'lucide-react';
import { updateTask, deleteTask } from './tasksSlice';
import {
  fetchComments,
  createComment,
  updateComment,
  deleteComment,
  clearComments,
} from '../comments/commentsSlice';
import { fetchTaskActivity, clearActivity } from '../activity/activitySlice';
import { addToast } from '../ui/uiSlice';

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

const PRESET_LABELS = ['bug', 'feature', 'frontend', 'backend', 'api', 'security', 'design', 'p1'];

export default function TaskModal({ task, project, isOpen, onClose }) {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const comments = useSelector((state) => state.comments.items);
  const commentsStatus = useSelector((state) => state.comments.status);
  const activities = useSelector((state) => state.activity.items);
  const activityStatus = useSelector((state) => state.activity.status);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [columnId, setColumnId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [labels, setLabels] = useState([]);
  const [newLabelInput, setNewLabelInput] = useState('');
  const [assigneeIds, setAssigneeIds] = useState([]);
  const [activeTab, setActiveTab] = useState('details');
  const [isSaving, setIsSaving] = useState(false);
  const [conflictError, setConflictError] = useState(null);

  // Comment input states
  const [newCommentBody, setNewCommentBody] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentBody, setEditCommentBody] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setColumnId(task.columnId || '');
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setLabels(task.labels || []);
      setAssigneeIds(
        (task.assignees || []).map((a) => (typeof a === 'object' ? a._id : a))
      );
      setConflictError(null);
    }
  }, [task]);

  useEffect(() => {
    if (task?._id && isOpen) {
      if (activeTab === 'comments') {
        dispatch(fetchComments(task._id));
      } else if (activeTab === 'activity') {
        dispatch(fetchTaskActivity(task._id));
      }
    }
  }, [task?._id, activeTab, isOpen, dispatch]);

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
      labels,
      assignees: assigneeIds,
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

  const handleAddLabel = (labelToAdd) => {
    const trimmed = labelToAdd.trim().toLowerCase();
    if (trimmed && !labels.includes(trimmed)) {
      setLabels([...labels, trimmed]);
      setNewLabelInput('');
    }
  };

  const handleRemoveLabel = (labelToRemove) => {
    setLabels(labels.filter((l) => l !== labelToRemove));
  };

  const handleToggleAssignee = (userId) => {
    if (assigneeIds.includes(userId)) {
      setAssigneeIds(assigneeIds.filter((id) => id !== userId));
    } else {
      setAssigneeIds([...assigneeIds, userId]);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentBody.trim()) return;

    setIsSubmittingComment(true);
    const res = await dispatch(
      createComment({
        taskId: task._id,
        body: newCommentBody.trim(),
      })
    );
    setIsSubmittingComment(false);

    if (res.meta.requestStatus === 'fulfilled') {
      setNewCommentBody('');
      dispatch(addToast({ message: 'Comment posted', type: 'success' }));
    } else {
      dispatch(addToast({ message: res.payload || 'Failed to post comment', type: 'error' }));
    }
  };

  const handleSaveEditComment = async (commentId) => {
    if (!editCommentBody.trim()) return;
    const res = await dispatch(
      updateComment({
        commentId,
        body: editCommentBody.trim(),
      })
    );

    if (res.meta.requestStatus === 'fulfilled') {
      setEditingCommentId(null);
      setEditCommentBody('');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Delete this comment?')) {
      await dispatch(deleteComment(commentId));
    }
  };

  const columns = project?.columns || [];
  const projectMembers = project?.members || [];

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
              onClick={() => {
                dispatch(clearComments());
                dispatch(clearActivity());
                onClose();
              }}
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
            {comments.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
                {comments.length}
              </span>
            )}
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

          {/* TAB 1: DETAILS */}
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

              {/* Assignees Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  Assignees
                </label>
                <div className="flex flex-wrap gap-2">
                  {projectMembers.map((m) => {
                    const memberId = m.user?._id || m.user;
                    const isAssigned = assigneeIds.includes(memberId);
                    return (
                      <button
                        type="button"
                        key={memberId}
                        onClick={() => handleToggleAssignee(memberId)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all ${
                          isAssigned
                            ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500/50'
                            : 'bg-slate-850 border-slate-750 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-slate-700 text-slate-300 text-[9px] font-bold flex items-center justify-center">
                          {m.user?.name ? m.user.name[0].toUpperCase() : 'M'}
                        </div>
                        <span>{m.user?.name || 'Member'}</span>
                        {isAssigned && <Check className="w-3 h-3 text-blue-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Labels Manager */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Labels & Tags
                </label>
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {labels.map((lbl) => (
                    <span
                      key={lbl}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-medium"
                    >
                      <span>#{lbl}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLabel(lbl)}
                        className="hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add custom label (press Enter)..."
                    value={newLabelInput}
                    onChange={(e) => setNewLabelInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddLabel(newLabelInput);
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-850 border border-slate-750 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddLabel(newLabelInput)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Preset Badges */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-500">Presets:</span>
                  {PRESET_LABELS.filter((p) => !labels.includes(p)).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAddLabel(preset)}
                      className="px-2 py-0.5 rounded-md bg-slate-850 hover:bg-slate-800 border border-slate-750 text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={4}
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

          {/* TAB 2: COMMENTS */}
          {activeTab === 'comments' && (
            <div className="space-y-6">
              {/* Comment Thread List */}
              <div className="space-y-4">
                {commentsStatus === 'loading' && comments.length === 0 ? (
                  <div className="py-8 flex justify-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p>No comments yet. Start the conversation!</p>
                  </div>
                ) : (
                  comments.map((comment) => {
                    const isAuthor =
                      currentUser?._id === (comment.author?._id || comment.author);
                    const isEditing = editingCommentId === comment._id;

                    return (
                      <div
                        key={comment._id}
                        className={`p-4 rounded-xl border ${
                          comment.isDeleted
                            ? 'bg-slate-900/30 border-slate-850 italic text-slate-500'
                            : 'bg-slate-850/60 border-slate-750/80 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-[10px] flex items-center justify-center">
                              {comment.author?.name ? comment.author.name[0].toUpperCase() : 'U'}
                            </div>
                            <span className="text-xs font-semibold text-slate-300">
                              {comment.author?.name || 'User'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {formatTimeAgo(comment.createdAt)}
                            </span>
                            {comment.editedAt && (
                              <span className="text-[10px] text-slate-500 italic">
                                (edited)
                              </span>
                            )}
                          </div>

                          {isAuthor && !comment.isDeleted && !isEditing && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingCommentId(comment._id);
                                  setEditCommentBody(comment.body);
                                }}
                                title="Edit comment"
                                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-750 transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment._id)}
                                title="Delete comment"
                                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="mt-2 space-y-2">
                            <textarea
                              rows={2}
                              value={editCommentBody}
                              onChange={(e) => setEditCommentBody(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingCommentId(null)}
                                className="px-2.5 py-1 rounded text-[11px] text-slate-400 hover:text-white"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEditComment(comment._id)}
                                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" /> Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                            {comment.body}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add New Comment Box */}
              <form onSubmit={handleAddComment} className="pt-4 border-t border-slate-800">
                <div className="relative">
                  <textarea
                    rows={3}
                    required
                    value={newCommentBody}
                    onChange={(e) => setNewCommentBody(e.target.value)}
                    placeholder="Write a comment... (Type @ to mention teammates)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-750 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                  />
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    Supports Markdown and instant notifications
                  </span>
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !newCommentBody.trim()}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmittingComment ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Post Comment</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: ACTIVITY TRAIL */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              {activityStatus === 'loading' && activities.length === 0 ? (
                <div className="py-8 flex justify-center text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : activities.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  <Clock className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p>No activity records logged for this card yet.</p>
                </div>
              ) : (
                <div className="relative pl-6 border-l border-slate-800 space-y-6">
                  {activities.map((act) => {
                    return (
                      <div key={act._id} className="relative">
                        <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-blue-500" />
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-200">
                            {act.actor?.name || 'System'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {formatTimeAgo(act.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {act.type === 'TASK_CREATED' && 'created this task'}
                          {act.type === 'TASK_UPDATED' && 'updated task details'}
                          {act.type === 'TASK_MOVED' &&
                            `moved task from ${act.meta?.from || 'previous column'} to ${
                              act.meta?.to || 'new column'
                            }`}
                          {act.type === 'COMMENT_ADDED' && 'commented on this task'}
                          {act.type === 'TASK_DELETED' && 'deleted this task'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
