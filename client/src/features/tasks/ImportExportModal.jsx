// client/src/features/tasks/ImportExportModal.jsx
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  FileCode,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { importTasks } from './tasksSlice';
import { addToast } from '../ui/uiSlice';
import { api } from '../../lib/api';

const SAMPLE_CSV = `Title,Description,Column,Priority,Labels
Setup Redis Caching,Configure cluster mode and pubsub,To Do,high,backend;infra
Design Mobile Wireframes,Figma prototypes for responsive view,In Progress,medium,design;mobile
Automate CI/CD Pipelines,GitHub actions matrix for Node & Vite,Done,urgent,devops`;

export default function ImportExportModal({ project, isOpen, onClose }) {
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState('export');
  const [exportFormat, setExportFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);

  // Import states
  const [importText, setImportText] = useState('');
  const [targetColumnId, setTargetColumnId] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen || !project) return null;

  const handleDownloadExport = async () => {
    setIsExporting(true);
    try {
      if (exportFormat === 'csv') {
        const res = await api.get(`/projects/${project._id}/export?format=csv`, {
          responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${project.key}-export.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      } else {
        const res = await api.get(`/projects/${project._id}/export?format=json`);
        const blob = new Blob([JSON.stringify(res.data.data, null, 2)], {
          type: 'application/json',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${project.key}-export.json`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      }
      dispatch(addToast({ message: `Exported ${exportFormat.toUpperCase()} successfully`, type: 'success' }));
    } catch (err) {
      dispatch(
        addToast({
          message: err.response?.data?.message || 'Failed to export data',
          type: 'error',
        })
      );
    } finally {
      setIsExporting(false);
    }
  };

  const parseInputToTasks = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return [];

    // Try parsing as JSON first
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // Fallback to CSV
      }
    }

    // Parse as CSV
    const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const tasks = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      const item = {};
      headers.forEach((h, idx) => {
        item[h] = parts[idx] || '';
      });

      if (item.title) {
        tasks.push({
          title: item.title,
          description: item.description || '',
          column: item.column || undefined,
          priority: item.priority || 'medium',
          labels: item.labels ? item.labels.split(';').map((l) => l.trim()) : [],
        });
      }
    }

    return tasks;
  };

  const handleImport = async (e) => {
    e.preventDefault();
    const tasksToImport = parseInputToTasks(importText);

    if (tasksToImport.length === 0) {
      dispatch(addToast({ message: 'No valid task records found in input', type: 'error' }));
      return;
    }

    // Apply selected target column if designated
    if (targetColumnId) {
      tasksToImport.forEach((t) => {
        if (!t.column) t.columnId = targetColumnId;
      });
    }

    setIsImporting(true);
    const res = await dispatch(
      importTasks({
        projectId: project._id,
        tasksData: tasksToImport,
      })
    );
    setIsImporting(false);

    if (res.meta.requestStatus === 'fulfilled') {
      dispatch(
        addToast({
          message: `Successfully imported ${tasksToImport.length} task(s)!`,
          type: 'success',
        })
      );
      onClose();
    } else {
      dispatch(addToast({ message: res.payload?.message || 'Import failed', type: 'error' }));
    }
  };

  const parsedPreview = parseInputToTasks(importText);
  const columns = project.columns || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Import & Export Data</h3>
              <p className="text-xs text-slate-400">
                Backup board tasks or bulk import from CSV/JSON spreadsheets
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
            onClick={() => setActiveTab('export')}
            className={`py-3 flex items-center gap-2 transition-all ${
              activeTab === 'export'
                ? 'text-blue-400 border-b-2 border-blue-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Export Data
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`py-3 flex items-center gap-2 transition-all ${
              activeTab === 'import'
                ? 'text-blue-400 border-b-2 border-blue-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Bulk Import Tasks
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-5">
              <p className="text-xs text-slate-300 leading-relaxed">
                Export all active Kanban tasks for <strong>{project.name}</strong> ({project.key}) including key, title, description, workflow column, priority, assignees, labels, and due date.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setExportFormat('csv')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    exportFormat === 'csv'
                      ? 'bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/30'
                      : 'bg-slate-850/60 border-slate-750 hover:bg-slate-800'
                  }`}
                >
                  <FileSpreadsheet className="w-6 h-6 text-emerald-400 mb-2" />
                  <h4 className="text-xs font-bold text-white">CSV Spreadsheet</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Standard RFC 4180 format for Excel, Google Sheets & Jira
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat('json')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    exportFormat === 'json'
                      ? 'bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/30'
                      : 'bg-slate-850/60 border-slate-750 hover:bg-slate-800'
                  }`}
                >
                  <FileCode className="w-6 h-6 text-blue-400 mb-2" />
                  <h4 className="text-xs font-bold text-white">JSON Document</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Structured programmatic array format for API backups
                  </p>
                </button>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  onClick={handleDownloadExport}
                  disabled={isExporting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 flex items-center gap-2 disabled:opacity-50"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Download {exportFormat.toUpperCase()}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT */}
          {activeTab === 'import' && (
            <form onSubmit={handleImport} className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Paste CSV or JSON Data
                </label>
                <button
                  type="button"
                  onClick={() => setImportText(SAMPLE_CSV)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Load Sample CSV
                </button>
              </div>

              <textarea
                rows={6}
                required
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Title,Description,Column,Priority,Labels&#10;Fix authentication bug,Details here,To Do,high,bug;auth"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-750 text-white font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Default Destination Column (if not specified in row)
                  </label>
                  <select
                    value={targetColumnId}
                    onChange={(e) => setTargetColumnId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-850 border border-slate-750 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {columns.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  {parsedPreview.length > 0 && (
                    <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span>{parsedPreview.length} task(s) ready to import</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isImporting || parsedPreview.length === 0}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 flex items-center gap-2 disabled:opacity-50"
                >
                  {isImporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>Import {parsedPreview.length > 0 ? `(${parsedPreview.length})` : ''}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
