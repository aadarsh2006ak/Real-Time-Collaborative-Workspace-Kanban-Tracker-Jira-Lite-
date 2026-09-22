// client/src/features/auth/ProtectedRoute.jsx
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { restoreSession } from './authSlice';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute() {
  const dispatch = useDispatch();
  const { accessToken, status } = useSelector((state) => state.auth);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(restoreSession());
    }
  }, [status, dispatch]);

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-xs font-medium tracking-wide">Restoring collaborative session...</p>
      </div>
    );
  }

  if (status === 'unauthenticated' || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
