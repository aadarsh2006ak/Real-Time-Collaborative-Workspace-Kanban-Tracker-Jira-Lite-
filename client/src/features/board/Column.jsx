// client/src/features/board/Column.jsx
import { Droppable } from '@hello-pangea/dnd';
import { Plus, AlertTriangle, Circle } from 'lucide-react';
import TaskCard from './TaskCard';

// Color map for common kanban column states
const getColumnColor = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('progress') || n.includes('doing') || n.includes('active')) {
    return {
      dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]',
      border: 'hover:border-amber-500/40',
      badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    };
  }
  if (n.includes('review') || n.includes('qa') || n.includes('testing')) {
    return {
      dot: 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.5)]',
      border: 'hover:border-purple-500/40',
      badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
    };
  }
  if (n.includes('done') || n.includes('completed') || n.includes('shipped')) {
    return {
      dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]',
      border: 'hover:border-emerald-500/40',
      badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    };
  }
  // Default: To Do / Backlog
  return {
    dot: 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]',
    border: 'hover:border-blue-500/40',
    badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  };
};

export default function Column({
  column,
  tasks = [],
  onAddTask,
  onTaskClick,
  isSelectMode = false,
  selectedTaskIds = [],
  onToggleSelectTask,
}) {
  const isOverWip = column.wipLimit > 0 && tasks.length > column.wipLimit;
  const colColor = getColumnColor(column.name);

  return (
    <div className="w-80 flex-shrink-0 flex flex-col bg-slate-100/90 dark:bg-slate-900/75 backdrop-blur-xl rounded-2xl border border-slate-200/90 dark:border-slate-800/90 max-h-full overflow-hidden shadow-xl dark:shadow-2xl dark:shadow-black/40 transition-all duration-200">
      {/* Column Header */}
      <div className="p-3.5 px-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-white/60 dark:bg-slate-900/50">
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full ${colColor.dot}`} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            {column.name}
          </h3>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold border transition-colors ${
              isOverWip
                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse'
                : colColor.badge
            }`}
          >
            {tasks.length}
            {column.wipLimit > 0 && ` / ${column.wipLimit}`}
          </span>
        </div>

        {isOverWip && (
          <div
            title="WIP limit exceeded!"
            className="flex items-center gap-1 text-[10px] text-rose-500 dark:text-rose-400 font-semibold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 animate-bounce"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>WIP Alert</span>
          </div>
        )}
      </div>

      {/* Droppable Cards Container */}
      <Droppable droppableId={column._id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[160px] transition-all rounded-xl m-1 ${
              snapshot.isDraggingOver
                ? 'bg-blue-50/80 dark:bg-slate-800/50 ring-2 ring-blue-500/40 shadow-inner'
                : 'hover:bg-slate-200/30 dark:hover:bg-slate-900/30'
            }`}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver ? (
              <div className="h-32 border-2 border-dashed border-slate-300 dark:border-slate-800/70 rounded-xl flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-xs font-medium gap-1.5 p-4 text-center">
                <Circle className="w-4 h-4 opacity-40 text-slate-400" />
                <span>No tasks in this stage</span>
              </div>
            ) : (
              tasks.map((task, index) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  index={index}
                  onClick={onTaskClick}
                  isSelectMode={isSelectMode}
                  isSelected={selectedTaskIds.includes(task._id)}
                  onToggleSelect={onToggleSelectTask}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Column Footer: Quick Add Button */}
      <div className="p-2.5 border-t border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40">
        <button
          onClick={() => onAddTask && onAddTask(column._id)}
          className="group w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-850/80 dark:hover:bg-slate-800 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-750/70 hover:border-blue-500/30 text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform" />
          <span>Add Task</span>
        </button>
      </div>
    </div>
  );
}
