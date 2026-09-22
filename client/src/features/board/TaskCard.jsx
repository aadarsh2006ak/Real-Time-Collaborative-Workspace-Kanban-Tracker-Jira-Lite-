// client/src/features/board/TaskCard.jsx
import React from 'react';
import { Calendar, Tag } from 'lucide-react';

const priorityConfig = {
  urgent: {
    bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    label: 'Urgent',
  },
  high: {
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    label: 'High',
  },
  medium: {
    bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    label: 'Medium',
  },
  low: {
    bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    label: 'Low',
  },
};

const TaskCard = React.memo(function TaskCard({ task, onClick }) {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;

  return (
    <div
      onClick={() => onClick && onClick(task)}
      className="p-3.5 rounded-xl bg-slate-850/90 border border-slate-750/70 hover:border-blue-500/50 hover:bg-slate-800/90 transition-all shadow-md group cursor-pointer"
    >
      {/* Header: Key & Priority */}
      <div className="flex items-center justify-between gap-2 mb-2 text-[11px]">
        <span className="font-mono font-bold text-blue-400">{task.key}</span>
        <span
          className={`px-1.5 py-0.5 rounded border text-[10px] uppercase font-semibold ${priority.bg}`}
        >
          {priority.label}
        </span>
      </div>

      {/* Title */}
      <p className="text-xs font-semibold text-slate-100 leading-snug line-clamp-2">
        {task.title}
      </p>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {task.labels.map((label, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-slate-300 text-[10px]"
            >
              <Tag className="w-2.5 h-2.5 text-slate-400" />
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Footer: Due date & Assignees */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div>
          {task.dueDate && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Calendar className="w-3 h-3 text-slate-500" />
              {new Date(task.dueDate).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>

        {/* Assignees Avatars */}
        <div className="flex items-center -space-x-1.5">
          {task.assignees && task.assignees.length > 0 ? (
            task.assignees.map((assignee, idx) => {
              const name = typeof assignee === 'string' ? assignee : assignee.name;
              return (
                <div
                  key={idx}
                  title={name}
                  className="w-5 h-5 rounded-full bg-indigo-600 border border-slate-900 text-white flex items-center justify-center text-[9px] font-bold"
                >
                  {name ? name[0].toUpperCase() : 'U'}
                </div>
              );
            })
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] text-slate-500">
              ?
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default TaskCard;
