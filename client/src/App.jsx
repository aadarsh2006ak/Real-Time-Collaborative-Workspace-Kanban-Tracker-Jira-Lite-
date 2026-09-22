import { useState, useEffect } from 'react';
import {
  Kanban,
  CheckCircle2,
  Layers,
  Zap,
  ShieldCheck,
  FolderGit2,
  Sparkles,
  Database,
} from 'lucide-react';

export default function App() {
  const [health, setHealth] = useState({ status: 'checking', uptime: 0 });
  const [activeTab, setActiveTab] = useState('kanban');

  useEffect(() => {
    // Check local backend health
    fetch('http://localhost:5000/healthz')
      .then((res) => res.json())
      .then((data) => setHealth({ status: 'connected', uptime: data.uptime }))
      .catch(() => setHealth({ status: 'offline', uptime: 0 }));
  }, []);

  const sampleTasks = {
    todo: [
      { id: 'JL-101', title: 'Complete Monorepo & Husky Setup', priority: 'high', label: 'DevOps', assignee: 'Alex M.' },
      { id: 'JL-102', title: 'Implement Zod Validation Layer', priority: 'medium', label: 'Backend', assignee: 'Riya K.' },
    ],
    inProgress: [
      { id: 'JL-103', title: 'Fractional Indexing Algorithm', priority: 'urgent', label: 'Core DB', assignee: 'Siddharth' },
      { id: 'JL-104', title: 'Socket Handshake & Auth Guards', priority: 'high', label: 'Realtime', assignee: 'Alex M.' },
    ],
    review: [
      { id: 'JL-105', title: 'Redux Entity Adapter Normalization', priority: 'medium', label: 'Frontend', assignee: 'Neha S.' },
    ],
    done: [
      { id: 'JL-100', title: '12-Week Jira-Lite Architecture Spec', priority: 'low', label: 'Design', assignee: 'Team' },
    ],
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Kanban className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight text-white">Jira-Lite</h1>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Week 1 Milestone
                </span>
              </div>
              <p className="text-xs text-slate-400">Real-Time Collaborative Kanban Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
              <span
                className={`w-2 h-2 rounded-full ${
                  health.status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span>API: {health.status === 'connected' ? `Live (${Math.round(health.uptime)}s)` : 'Waiting for dev server'}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-xs font-semibold text-indigo-300">
                JL
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* Hero Header Section */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 p-8 border border-slate-800/80 shadow-2xl">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Phase 0 & 1 Architecture Initialized
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Enterprise Real-Time Kanban <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400">
                Engineered for High-Scale Teams
              </span>
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
              MERN Stack + Socket.io + Redux Toolkit with O(1) Fractional Indexing, Dual-Token Rotating Auth, RBAC Matrix, and Graceful Optimistic State Rollback.
            </p>

            {/* Quick Status Tags */}
            <div className="mt-6 flex flex-wrap gap-3 text-xs">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200">
                <Database className="w-3.5 h-3.5 text-blue-400" /> MongoDB 7 Replica Set
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Socket.io Multi-Room Sync
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> RBAC & Zod Guards
              </span>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`pb-3 flex items-center gap-2 transition-all ${
              activeTab === 'kanban'
                ? 'text-blue-400 border-b-2 border-blue-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Kanban className="w-4 h-4" /> Board Architecture Preview
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`pb-3 flex items-center gap-2 transition-all ${
              activeTab === 'checklist'
                ? 'text-blue-400 border-b-2 border-blue-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" /> Week 1 Deliverables
          </button>
        </div>

        {/* Tab 1: Board Preview */}
        {activeTab === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Column 1: To Do */}
            <div className="flex flex-col gap-3.5 bg-slate-900/50 rounded-xl p-4 border border-slate-800/80">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-semibold text-xs tracking-wider uppercase text-slate-400">To Do</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                  {sampleTasks.todo.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {sampleTasks.todo.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-lg bg-slate-850 border border-slate-750/70 hover:border-blue-500/40 transition-all shadow-md group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                      <span className="font-mono font-bold text-blue-400">{task.id}</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] uppercase font-semibold">
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-200 leading-snug">{task.title}</p>
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {task.label}
                      </span>
                      <div className="flex items-center gap-1 text-slate-300">
                        <div className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[9px] font-bold">
                          {task.assignee[0]}
                        </div>
                        <span className="text-[10px]">{task.assignee}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: In Progress */}
            <div className="flex flex-col gap-3.5 bg-slate-900/50 rounded-xl p-4 border border-slate-800/80">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-semibold text-xs tracking-wider uppercase text-blue-400">In Progress</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">
                  {sampleTasks.inProgress.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {sampleTasks.inProgress.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-lg bg-slate-850 border border-slate-750/70 hover:border-blue-500/40 transition-all shadow-md group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                      <span className="font-mono font-bold text-blue-400">{task.id}</span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] uppercase font-semibold">
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-200 leading-snug">{task.title}</p>
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {task.label}
                      </span>
                      <div className="flex items-center gap-1 text-slate-300">
                        <div className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[9px] font-bold">
                          {task.assignee[0]}
                        </div>
                        <span className="text-[10px]">{task.assignee}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Review */}
            <div className="flex flex-col gap-3.5 bg-slate-900/50 rounded-xl p-4 border border-slate-800/80">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-semibold text-xs tracking-wider uppercase text-purple-400">In Review</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-medium">
                  {sampleTasks.review.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {sampleTasks.review.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-lg bg-slate-850 border border-slate-750/70 hover:border-blue-500/40 transition-all shadow-md group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                      <span className="font-mono font-bold text-blue-400">{task.id}</span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] uppercase font-semibold">
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-200 leading-snug">{task.title}</p>
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {task.label}
                      </span>
                      <div className="flex items-center gap-1 text-slate-300">
                        <div className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[9px] font-bold">
                          {task.assignee[0]}
                        </div>
                        <span className="text-[10px]">{task.assignee}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 4: Done */}
            <div className="flex flex-col gap-3.5 bg-slate-900/50 rounded-xl p-4 border border-slate-800/80">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-semibold text-xs tracking-wider uppercase text-emerald-400">Done</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                  {sampleTasks.done.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {sampleTasks.done.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-lg bg-slate-850/80 border border-emerald-500/20 hover:border-emerald-500/40 transition-all shadow-md group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                      <span className="font-mono font-bold text-emerald-400">{task.id}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase font-semibold">
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-300 line-through leading-snug">{task.title}</p>
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {task.label}
                      </span>
                      <div className="flex items-center gap-1 text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px]">Completed</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Week 1 Checklist */}
        {activeTab === 'checklist' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col gap-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-blue-400" />
                Phase 0: Environment & Quality Gates
              </h3>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Monorepo setup with server, client, and docs folders
                </li>
                <li className="flex items-center gap-2 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Docker Compose with MongoDB 7 Replica Set + Redis 7
                </li>
                <li className="flex items-center gap-2 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  GitHub Actions matrix CI (.github/workflows/ci.yml)
                </li>
                <li className="flex items-center gap-2 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Zod fail-fast environment validation
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col gap-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Phase 1: Requirements & Data Architecture
              </h3>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Full User Stories (US-01 to US-12) & RBAC Matrix
                </li>
                <li className="flex items-center gap-2 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Mermaid ER Diagram & Compound Indexing Strategy
                </li>
                <li className="flex items-center gap-2 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  REST Envelope & Socket.io Event Contracts (docs/api.md)
                </li>
                <li className="flex items-center gap-2 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  5 Architecture Decision Records (ADR 0001 - 0005)
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 bg-slate-950/80 text-center text-xs text-slate-400">
        <p>Jira-Lite Real-Time Collaborative Kanban • Week 1 Milestone Ready</p>
      </footer>
    </div>
  );
}
