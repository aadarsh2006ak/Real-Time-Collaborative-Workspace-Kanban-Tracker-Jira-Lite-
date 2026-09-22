// client/src/components/ToastContainer.jsx
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { removeToast } from '../features/ui/uiSlice';

export default function ToastContainer() {
  const dispatch = useDispatch();
  const toasts = useSelector((state) => state.ui.toasts);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => dispatch(removeToast(toast.id))}
        />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/30 bg-emerald-950/70 text-emerald-200',
    error: 'border-rose-500/30 bg-rose-950/70 text-rose-200',
    info: 'border-blue-500/30 bg-slate-900/90 text-slate-200',
  };

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border backdrop-blur-xl shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-2 ${
        borders[toast.type] || borders.info
      }`}
    >
      <div className="flex items-center gap-2.5 text-xs font-medium">
        {icons[toast.type] || icons.info}
        <span>{toast.message}</span>
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-white transition-colors p-1"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
