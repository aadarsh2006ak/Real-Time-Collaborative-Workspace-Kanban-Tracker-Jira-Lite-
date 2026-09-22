// client/src/features/board/Column.jsx
import { Droppable } from '@hello-pangea/dnd';
import { Plus, AlertTriangle } from 'lucide-react';
import TaskCard from './TaskCard';

export default function Column({ column, tasks = [], onAddTask, onTaskClick }) {
  const isOverWip = column.wipLimit > 0 && tasks.length > column.wipLimit;

  return (
    <div className="w-80 flex-shrink-0 flex flex-col bg-slate-900/60 rounded-2xl border border-slate-800/80 max-h-full overflow-hidden shadow-xl">
      {/* Column Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {column.name}
          </h3>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              isOverWip
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {tasks.length}
            {column.wipLimit > 0 && ` / ${column.wipLimit}`}
          </span>
        </div>

        {isOverWip && (
          <div
            title="WIP limit exceeded!"
            className="flex items-center gap-1 text-[10px] text-rose-400 font-semibold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20"
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
            className={`flex-1 overflow-y-auto p-3.5 space-y-3 min-h-[160px] transition-colors rounded-xl m-1 ${
              snapshot.isDraggingOver ? 'bg-slate-800/40 ring-1 ring-blue-500/30' : ''
            }`}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver ? (
              <div className="h-28 border-2 border-dashed border-slate-800/80 rounded-xl flex items-center justify-center text-slate-500 text-xs font-medium">
                Drop cards here
              </div>
            ) : (
              tasks.map((task, index) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  index={index}
                  onClick={onTaskClick}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Column Footer: Quick Add Button */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={() => onAddTask && onAddTask(column._id)}
          className="w-full py-2 px-3 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-blue-400" />
          <span>Add Task</span>
        </button>
      </div>
    </div>
  );
}
