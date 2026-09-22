// client/src/features/projects/ProjectSettingsModal.jsx
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  X,
  Settings,
  Layers,
  Users,
  Plus,
  Trash2,
  Save,
  Loader2,
  Mail,
  UserPlus,
  Info,
} from 'lucide-react';
import { fetchProjectById } from './projectsSlice';
import { addToast } from '../ui/uiSlice';
import { api } from '../../lib/api';

export default function ProjectSettingsModal({ project, isOpen, onClose }) {
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState('columns');
  const [isSaving, setIsSaving] = useState(false);

  // General tab states
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');

  // Add column form states
  const [newColName, setNewColName] = useState('');
  const [newColWip, setNewColWip] = useState(0);

  // Invite member form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  useEffect(() => {
    if (project) {
      setProjectName(project.name || '');
      setProjectDesc(project.description || '');
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleUpdateGeneral = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.patch(`/projects/${project._id}`, {
        name: projectName.trim(),
        description: projectDesc.trim(),
      });
      dispatch(fetchProjectById(project._id));
      dispatch(addToast({ message: 'Project details updated', type: 'success' }));
    } catch (err) {
      dispatch(
        addToast({
          message: err.response?.data?.message || 'Failed to update project',
          type: 'error',
        })
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    setIsSaving(true);
    try {
      await api.post(`/projects/${project._id}/columns`, {
        name: newColName.trim(),
        wipLimit: Number(newColWip) || 0,
      });
      setNewColName('');
      setNewColWip(0);
      dispatch(fetchProjectById(project._id));
      dispatch(addToast({ message: 'Column added', type: 'success' }));
    } catch (err) {
      dispatch(
        addToast({
          message: err.response?.data?.message || 'Failed to add column',
          type: 'error',
        })
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateColumnWip = async (columnId, newWip) => {
    try {
      await api.patch(`/projects/${project._id}/columns/${columnId}`, {
        wipLimit: Number(newWip) || 0,
      });
      dispatch(fetchProjectById(project._id));
      dispatch(addToast({ message: 'Column updated', type: 'success' }));
    } catch (err) {
      dispatch(
        addToast({
          message: err.response?.data?.message || 'Failed to update column',
          type: 'error',
        })
      );
    }
  };

  const handleDeleteColumn = async (columnId) => {
    if (window.confirm('Are you sure you want to delete this empty column?')) {
      try {
        await api.delete(`/projects/${project._id}/columns/${columnId}`);
        dispatch(fetchProjectById(project._id));
        dispatch(addToast({ message: 'Column deleted', type: 'info' }));
      } catch (err) {
        dispatch(
          addToast({
            message: err.response?.data?.message || 'Failed to delete column',
            type: 'error',
          })
        );
      }
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsSaving(true);
    try {
      await api.post(`/projects/${project._id}/members`, {
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });
      setInviteEmail('');
      dispatch(fetchProjectById(project._id));
      dispatch(addToast({ message: 'Team member added', type: 'success' }));
    } catch (err) {
      dispatch(
        addToast({
          message: err.response?.data?.message || 'Failed to add member',
          type: 'error',
        })
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateMemberRole = async (userId, role) => {
    try {
      await api.patch(`/projects/${project._id}/members/${userId}`, { role });
      dispatch(fetchProjectById(project._id));
      dispatch(addToast({ message: 'Member role updated', type: 'success' }));
    } catch (err) {
      dispatch(
        addToast({
          message: err.response?.data?.message || 'Failed to update role',
          type: 'error',
        })
      );
    }
  };

  const handleRemoveMember = async (userId) => {
    if (window.confirm('Remove this member from the project?')) {
      try {
        await api.delete(`/projects/${project._id}/members/${userId}`);
        dispatch(fetchProjectById(project._id));
        dispatch(addToast({ message: 'Member removed', type: 'info' }));
      } catch (err) {
        dispatch(
          addToast({
            message: err.response?.data?.message || 'Failed to remove member',
            type: 'error',
          })
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Project Settings</h3>
              <p className="text-xs text-slate-400">
                Manage workflow columns, WIP limits, and team access
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex px-5 border-b border-slate-800 text-xs font-medium gap-6 bg-slate-900/40">
          <button
            onClick={() => setActiveTab('columns')}
            className={`py-3 flex items-center gap-2 transition-all ${
              activeTab === 'columns'
                ? 'text-blue-400 border-b-2 border-blue-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Workflow Columns & WIP
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`py-3 flex items-center gap-2 transition-all ${
              activeTab === 'team'
                ? 'text-blue-400 border-b-2 border-blue-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Team & Roles
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 flex items-center gap-2 transition-all ${
              activeTab === 'general'
                ? 'text-blue-400 border-b-2 border-blue-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" /> General Info
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: COLUMNS */}
          {activeTab === 'columns' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300">Active Workflow Columns</h4>
                <div className="space-y-2">
                  {project.columns?.map((col) => (
                    <div
                      key={col._id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-850/60 border border-slate-750 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-200">{col.name}</span>
                        <span className="text-[11px] text-slate-500 ml-2">
                          (Order: {col.order})
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <span className="text-[11px]">WIP Limit:</span>
                          <input
                            type="number"
                            min="0"
                            defaultValue={col.wipLimit || 0}
                            onBlur={(e) => handleUpdateColumnWip(col._id, e.target.value)}
                            className="w-14 px-2 py-1 rounded bg-slate-900 border border-slate-750 text-center text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <button
                          onClick={() => handleDeleteColumn(col._id)}
                          title="Delete column (must be empty)"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Column Form */}
              <form onSubmit={handleAddColumn} className="p-4 rounded-xl bg-slate-850/30 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  <span>Add New Column</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="Column name (e.g. QA Testing)"
                      value={newColName}
                      onChange={(e) => setNewColName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-750 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      placeholder="WIP limit (0 = none)"
                      value={newColWip}
                      onChange={(e) => setNewColWip(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-750 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving || !newColName.trim()}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50"
                  >
                    Add Column
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: TEAM */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              {/* Member List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300">Project Members</h4>
                <div className="space-y-2">
                  {/* Owner Row */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-850/60 border border-slate-750 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-[10px] flex items-center justify-center">
                        {project.owner?.name ? project.owner.name[0].toUpperCase() : 'O'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">
                          {project.owner?.name} <span className="text-[10px] text-blue-400 font-mono">(Owner)</span>
                        </p>
                        <p className="text-[10px] text-slate-400">{project.owner?.email}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                      Owner
                    </span>
                  </div>

                  {/* Members */}
                  {project.members?.map((m) => (
                    <div
                      key={m.user?._id || m.user}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-850/60 border border-slate-750 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-bold text-[10px] flex items-center justify-center">
                          {m.user?.name ? m.user.name[0].toUpperCase() : 'M'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-200">{m.user?.name || 'Member'}</p>
                          <p className="text-[10px] text-slate-400">{m.user?.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <select
                          value={m.role}
                          onChange={(e) => handleUpdateMemberRole(m.user?._id || m.user, e.target.value)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-750 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>

                        <button
                          onClick={() => handleRemoveMember(m.user?._id || m.user)}
                          title="Remove member"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invite Form */}
              <form onSubmit={handleInviteMember} className="p-4 rounded-xl bg-slate-850/30 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-blue-400" />
                  <span>Invite New Team Member</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="teammate@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-750 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-750 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving || !inviteEmail.trim()}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50"
                  >
                    Send Invite
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: GENERAL */}
          {activeTab === 'general' && (
            <form onSubmit={handleUpdateGeneral} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-750 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Project Key
                </label>
                <input
                  type="text"
                  disabled
                  value={project.key}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-mono text-xs cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-500 mt-1">Project key is immutable.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="High-level goals and project overview..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-750 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save Settings</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
