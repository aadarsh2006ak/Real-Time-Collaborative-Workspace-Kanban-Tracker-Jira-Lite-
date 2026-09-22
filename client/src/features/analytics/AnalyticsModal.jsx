// client/src/features/analytics/AnalyticsModal.jsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  X,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Users,
  ShieldCheck,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { fetchProjectAnalytics, clearAnalytics } from './analyticsSlice';

export default function AnalyticsModal({ projectId, isOpen, onClose }) {
  const dispatch = useDispatch();
  const { data: analytics, status } = useSelector((state) => state.analytics);

  useEffect(() => {
    if (projectId && isOpen) {
      dispatch(fetchProjectAnalytics(projectId));
    }
    return () => {
      if (!isOpen) dispatch(clearAnalytics());
    };
  }, [projectId, isOpen, dispatch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Board Health & Analytics</h3>
              <p className="text-xs text-slate-400">
                Live metrics, WIP compliance, and workload distribution
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

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {status === 'loading' && !analytics ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-xs">Computing board analytics...</p>
            </div>
          ) : !analytics ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <p>No analytics data available.</p>
            </div>
          ) : (
            <>
              {/* 1. Executive Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-xl bg-slate-850/70 border border-slate-750">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Total Cards</span>
                    <Layers className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-white">
                    {analytics.totalTasks}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Across all columns</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-850/70 border border-slate-750">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Completion Rate</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-emerald-400">
                    {analytics.completionRate}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {analytics.completedTasks} completed
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-850/70 border border-slate-750">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>In-Flight Active</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-amber-400">
                    {analytics.activeTasks}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Work in progress</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-850/70 border border-slate-750">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Overdue</span>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-rose-400">
                    {analytics.overdueTasks}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Missed target dates</div>
                </div>
              </div>

              {/* 2. WIP Limit Health & Column Adherence */}
              <div className="p-4.5 rounded-2xl bg-slate-850/50 border border-slate-750/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <span>Workflow Stages & WIP Limit Health</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Kanban Bottleneck Monitoring
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analytics.columnHealth.map((col) => {
                    return (
                      <div
                        key={col.columnId}
                        className={`p-3.5 rounded-xl border transition-all ${
                          col.isExceeded
                            ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-200">
                            {col.name}
                          </span>
                          {col.isExceeded ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 text-[10px] font-bold flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" /> WIP BREACH
                            </span>
                          ) : col.wipLimit > 0 ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">
                              Limit: {col.wipLimit}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">No WIP Limit</span>
                          )}
                        </div>

                        <div className="mt-2.5 flex items-center justify-between text-xs">
                          <span className="text-slate-400 text-[11px]">
                            {col.taskCount} {col.taskCount === 1 ? 'task' : 'tasks'}
                          </span>
                          {col.utilization !== null && (
                            <span
                              className={`text-[11px] font-semibold ${
                                col.isExceeded ? 'text-rose-400' : 'text-slate-300'
                              }`}
                            >
                              {col.utilization}% load
                            </span>
                          )}
                        </div>

                        {col.wipLimit > 0 && (
                          <div className="w-full h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                col.isExceeded ? 'bg-rose-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(col.utilization || 0, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Priority Breakdown & Assignee Workload */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Priority Breakdown */}
                <div className="p-4 rounded-xl bg-slate-850/50 border border-slate-750/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-200">Priority Distribution</h4>
                  <div className="space-y-2 text-xs">
                    {Object.entries(analytics.priorityBreakdown).map(([priority, count]) => {
                      const total = analytics.totalTasks || 1;
                      const percent = Math.round((count / total) * 100);
                      const colors = {
                        urgent: 'bg-rose-500 text-rose-400',
                        high: 'bg-orange-500 text-orange-400',
                        medium: 'bg-blue-500 text-blue-400',
                        low: 'bg-emerald-500 text-emerald-400',
                      };

                      return (
                        <div key={priority}>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="capitalize text-slate-300">{priority}</span>
                            <span className="font-semibold text-slate-400">
                              {count} ({percent}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${colors[priority].split(' ')[0]}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Assignee Workload */}
                <div className="p-4 rounded-xl bg-slate-850/50 border border-slate-750/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Team Workload</span>
                    </h4>
                    {analytics.unassignedCount > 0 && (
                      <span className="text-[10px] text-slate-500">
                        {analytics.unassignedCount} unassigned
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5 max-h-48 overflow-y-auto">
                    {analytics.assigneeWorkload.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">
                        No team members assigned yet.
                      </p>
                    ) : (
                      analytics.assigneeWorkload.map((member) => (
                        <div
                          key={member.userId}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 font-bold text-[9px] flex items-center justify-center border border-indigo-500/40">
                              {member.name ? member.name[0].toUpperCase() : 'M'}
                            </div>
                            <span className="text-slate-200 font-medium">
                              {member.name}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-blue-400 font-bold text-[11px]">
                            {member.taskCount} {member.taskCount === 1 ? 'task' : 'tasks'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
