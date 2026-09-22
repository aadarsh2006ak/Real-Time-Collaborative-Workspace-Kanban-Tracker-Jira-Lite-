// client/src/components/KeyboardShortcutsModal.jsx
import { useSelector, useDispatch } from 'react-redux';
import { X, Command, Plus, Search, CheckSquare, Trash2, SunMoon, HelpCircle } from 'lucide-react';
import { setShortcutsModalOpen } from '../features/ui/uiSlice';

const SHORTCUT_GROUPS = [
  {
    category: 'Board & Navigation',
    items: [
      {
        keys: ['/'],
        description: 'Focus search bar',
        icon: Search,
      },
      {
        keys: ['Esc'],
        description: 'Close modals or clear selection',
        icon: X,
      },
      {
        keys: ['?'],
        description: 'Open this shortcuts guide',
        icon: HelpCircle,
      },
      {
        keys: ['T'],
        description: 'Toggle Dark / Light theme',
        icon: SunMoon,
      },
    ],
  },
  {
    category: 'Task Management & Actions',
    items: [
      {
        keys: ['C', 'or', 'N'],
        description: 'Create a new task card',
        icon: Plus,
      },
      {
        keys: ['M'],
        description: 'Toggle multi-select mode',
        icon: CheckSquare,
      },
      {
        keys: ['Del'],
        description: 'Delete selected tasks (in select mode)',
        icon: Trash2,
      },
    ],
  },
];

export default function KeyboardShortcutsModal() {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.ui.isShortcutsModalOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-colors">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
              <Command className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Keyboard Shortcuts</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Speed up your agile workflow with rapid hotkeys
              </p>
            </div>
          </div>

          <button
            onClick={() => dispatch(setShortcutsModalOpen(false))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {SHORTCUT_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {group.category}
              </h4>
              <div className="bg-slate-50 dark:bg-slate-850/70 border border-slate-200 dark:border-slate-750/70 rounded-xl divide-y divide-slate-200 dark:divide-slate-800/80 overflow-hidden">
                {group.items.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-slate-100/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          {item.description}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.keys.map((k, kIdx) =>
                          k === 'or' ? (
                            <span key={kIdx} className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                              or
                            </span>
                          ) : (
                            <kbd
                              key={kIdx}
                              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-blue-600 dark:text-blue-300 font-mono text-[11px] font-bold"
                            >
                              {k}
                            </kbd>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300 font-mono">Esc</kbd> anytime to dismiss
          </span>
          <button
            onClick={() => dispatch(setShortcutsModalOpen(false))}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
