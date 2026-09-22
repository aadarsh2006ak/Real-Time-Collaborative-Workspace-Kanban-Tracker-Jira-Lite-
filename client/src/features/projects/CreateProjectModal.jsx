// client/src/features/projects/CreateProjectModal.jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { X, Loader2, Plus, Sparkles } from 'lucide-react';
import { createProject } from './projectsSlice';
import { addToast } from '../ui/uiSlice';

const createProjectSchema = z.object({
  name: z.string().trim().min(2, 'Project name must be at least 2 characters').max(100),
  key: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, 'Key must be at least 2 characters')
    .max(10, 'Key must be at most 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Uppercase letters and numbers only'),
  description: z.string().trim().max(1000).optional(),
});

export default function CreateProjectModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      key: '',
      description: '',
    },
  });

  const projectName = watch('name');

  // Auto-generate key from name if empty
  const handleNameChange = (e) => {
    const val = e.target.value;
    setValue('name', val);
    const generatedKey = val
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 5)
      .toUpperCase();
    if (generatedKey && !watch('key')) {
      setValue('key', generatedKey);
    }
  };

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    const res = await dispatch(createProject(data));
    if (res.meta.requestStatus === 'fulfilled') {
      const created = res.payload;
      dispatch(addToast({ message: `Project ${created.name} created!`, type: 'success' }));
      reset();
      onClose();
      navigate(`/projects/${created._id}`);
    } else {
      const err = res.payload;
      setError('root', { message: err?.message || 'Failed to create project' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Create New Project</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errors.root && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs">
            {errors.root.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={handleNameChange}
              placeholder="e.g. Mobile Application V2"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-750 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="mt-1 text-[11px] text-rose-400">{errors.name.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Project Key
              </label>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-400" />
                Prefix for tasks (e.g. {watch('key') || 'MOB'}-1)
              </span>
            </div>
            <input
              type="text"
              {...register('key')}
              placeholder="MOB"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-750 text-white text-xs uppercase font-mono tracking-wider placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {errors.key && (
              <p className="mt-1 text-[11px] text-rose-400">{errors.key.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Describe the goals, scope, and team for this project..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-750 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Project</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
