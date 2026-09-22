// client/src/features/auth/RegisterPage.jsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { tokenRefreshed, clearAuthError } from './authSlice';
import { api } from '../../lib/api';
import AuthLayout from './AuthLayout';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const watchedPassword = watch('password', '');

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const onSubmit = async (data) => {
    try {
      const res = await api.post('/auth/register', data);
      const { user, accessToken } = res.data.data;
      dispatch(tokenRefreshed(accessToken));
      dispatch({ type: 'auth/login/fulfilled', payload: { user, accessToken } });
      navigate('/projects');
    } catch (err) {
      const errData = err.response?.data?.error;
      setError('root', {
        message: errData?.message || 'Registration failed. Please try again.',
      });
    }
  };

  const hasLength = watchedPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(watchedPassword);
  const hasNum = /[0-9]/.test(watchedPassword);

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start collaborating in real-time with your engineering team"
    >
      {(errors.root || error) && (
        <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/30 flex items-center gap-2.5 text-rose-300 text-xs shadow-lg shadow-rose-950/30 animate-shake">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errors.root?.message || error?.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span>Full Name</span>
          </label>
          <div className="relative">
            <input
              type="text"
              {...register('name')}
              placeholder="Aadarsh Kumar"
              className="w-full pl-3.5 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-750 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
            />
          </div>
          {errors.name && (
            <p className="mt-1.5 text-[11px] text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            <span>Work Email</span>
          </label>
          <div className="relative">
            <input
              type="email"
              {...register('email')}
              placeholder="aadarsh@example.com"
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
              placeholder="Min 8 chars (e.g. Secret123)"
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
          
          {/* Password strength dynamic hints */}
          {watchedPassword && (
            <div className="mt-2 p-2 rounded-lg bg-slate-950/50 border border-slate-800 text-[10px] space-y-1">
              <div className={`flex items-center gap-1.5 ${hasLength ? 'text-emerald-400' : 'text-slate-400'}`}>
                <Check className={`w-3 h-3 ${hasLength ? 'opacity-100' : 'opacity-30'}`} />
                <span>At least 8 characters</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-400' : 'text-slate-400'}`}>
                <Check className={`w-3 h-3 ${hasUpper ? 'opacity-100' : 'opacity-30'}`} />
                <span>At least one uppercase letter (A-Z)</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasNum ? 'text-emerald-400' : 'text-slate-400'}`}>
                <Check className={`w-3 h-3 ${hasNum ? 'opacity-100' : 'opacity-30'}`} />
                <span>At least one number (0-9)</span>
              </div>
            </div>
          )}

          {errors.password && (
            <p className="mt-1.5 text-[11px] text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="relative group w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-blue-500/50 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-2 overflow-hidden"
        >
          <div className="absolute inset-0 shimmer-badge pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="mt-5 pt-4 text-center border-t border-slate-800/60 text-xs text-slate-400">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-blue-400 hover:text-blue-300 hover:underline transition-colors"
        >
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
