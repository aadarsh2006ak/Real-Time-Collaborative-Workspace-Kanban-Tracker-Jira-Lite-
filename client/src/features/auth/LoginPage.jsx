// client/src/features/auth/LoginPage.jsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { login, clearAuthError } from './authSlice';
import AuthLayout from './AuthLayout';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [isDemoFilled, setIsDemoFilled] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const onSubmit = async (data) => {
    const res = await dispatch(login(data));
    if (res.meta.requestStatus === 'fulfilled') {
      navigate('/projects');
    }
  };

  const fillDemo = () => {
    setValue('email', 'siddharth@example.com', { shouldValidate: true });
    setValue('password', 'Password123!', { shouldValidate: true });
    setIsDemoFilled(true);
    setTimeout(() => setIsDemoFilled(false), 2000);
  };

  return (
    <AuthLayout
      title="Welcome to Jira-Lite"
      subtitle="Real-Time Collaborative Kanban for Engineering Teams"
    >
      {error && (
        <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/30 flex items-center gap-2.5 text-rose-300 text-xs shadow-lg shadow-rose-950/30 animate-shake">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error.message || 'Authentication failed'}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            <span>Work Email</span>
          </label>
          <div className="relative">
            <input
              type="email"
              {...register('email')}
              placeholder="developer@company.com"
              className="w-full pl-3.5 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-750 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-[11px] text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            <span>Password</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              placeholder="••••••••"
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-750 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-[11px] text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="relative group w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-blue-500/50 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-2 overflow-hidden"
        >
          <div className="absolute inset-0 shimmer-badge pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          {status === 'loading' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>

      {/* Quick Demo Pre-fill Feature */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          Quick Preview?
        </span>
        <button
          type="button"
          onClick={fillDemo}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
            isDemoFilled
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 hover:text-blue-300'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>{isDemoFilled ? 'Demo Credentials Loaded!' : 'Fill Demo Credentials'}</span>
        </button>
      </div>

      <div className="mt-5 pt-3 text-center border-t border-slate-800/60 text-xs text-slate-400">
        New to Jira-Lite?{' '}
        <Link
          to="/register"
          className="font-semibold text-blue-400 hover:text-blue-300 hover:underline transition-colors"
        >
          Create an account
        </Link>
      </div>
    </AuthLayout>
  );
}
