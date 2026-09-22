// client/src/features/board/TaskCard.jsx
import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Calendar, Tag, Clock } from 'lucide-react';

const priorityConfig = {
  urgent: {
    bg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    dot: 'bg-rose-500 dark:bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.6)]',
    label: 'Urgent',
  },
  high: {
    bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    dot: 'bg-amber-500 dark:bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]',
    label: 'High',
  },
  medium: {
    bg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    dot: 'bg-blue-500 dark:bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]',
    label: 'Medium',
  },
  low: {
    bg: 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30',
    dot: 'bg-slate-500 dark:bg-slate-400',
    label: 'Low',
  },
};

const TaskCard = React.memo(function TaskCard({
  task,
  index,
  onClick,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
}) {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={(e) => {
            if (isSelectMode) {
              e.stopPropagation();
              onToggleSelect && onToggleSelect(task._id);
            } else {
              onClick && onClick(task);
            }
          }}
          className={`p-3.5 rounded-xl border transition-all duration-150 shadow-sm group cursor-grab active:cursor-grabbing select-none relative ${
            isSelected
              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/40 shadow-blue-500/20'
              : snapshot.isDragging
              ? 'bg-white dark:bg-slate-800/95 border-blue-500 shadow-2xl shadow-blue-500/30 ring-2 ring-blue-500/50 scale-[1.02] rotate-1 z-50'
              : 'bg-white dark:bg-slate-850/95 border-slate-200 dark:border-slate-750/70 hover:border-blue-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/95 hover:shadow-md dark:hover:shadow-black/50 hover:-translate-y-0.5'
          }`}
        >
          {/* Header: Key & Priority Badge */}
          <div className="flex items-center justify-between gap-2 mb-2 text-[11px]">
            <div className="flex items-center gap-2">
              {isSelectMode && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleSelect && onToggleSelect(task._id);
                  }}
                  className="w-3.5 h-3.5 rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                />
              )}
              <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-500/20">
                {task.key}
              </span>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] uppercase font-mono font-semibold ${priority.bg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
              {priority.label}
            </span>
          </div>

          {/* Title */}
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-white transition-colors">
            {task.title}
          </p>

          {/* Labels / Tags */}
          {task.labels && task.labels.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {task.labels.map((label, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-750/70 text-slate-600 dark:text-slate-400 text-[10px] font-mono"
                >
                  <Tag className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500" />
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Footer: Due Date & Assignees */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
            <div>
              {task.dueDate && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    isOverdue
                      ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {isOverdue ? (
                    <Clock className="w-3 h-3 text-rose-500 dark:text-rose-400 animate-pulse" />
                  ) : (
                    <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  )}
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
                      className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border border-white dark:border-slate-900 text-white flex items-center justify-center text-[9px] font-bold shadow-sm"
                    >
                      {name ? name[0].toUpperCase() : 'U'}
                    </div>
                  );
                })
              ) : (
                <div
                  title="Unassigned"
                  className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 flex items-center justify-center text-[9px] text-slate-400 dark:text-slate-500"
                >
                  ?
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
});

export default TaskCard;
