// client/src/components/Navbar.jsx
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Kanban, LogOut, Layers, Sparkles } from 'lucide-react';
import { loggedOut } from '../features/auth/authSlice';
import { api } from '../lib/api';

export default function Navbar({ currentProject = null }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      dispatch(loggedOut());
      navigate('/login');
    }
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/75 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Breadcrumbs */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/projects" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Kanban className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white group-hover:text-blue-400 transition-colors">
                Jira-Lite
              </span>
            </div>
          </Link>

          {currentProject && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="text-slate-600">/</span>
              <Link
                to="/projects"
                className="hover:text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Projects</span>
              </Link>
              <span className="text-slate-600">/</span>
              <span className="font-semibold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-xs">
                {currentProject.key}
              </span>
              <span className="text-slate-200 font-medium hidden sm:inline">
                {currentProject.name}
              </span>
            </div>
          )}
        </div>

        {/* Right: User Profile & Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
            <Sparkles className="w-3 h-3" />
            <span>v0.5 RTK Ready</span>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 pl-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-600 border border-indigo-400/40 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-200 leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight truncate max-w-[120px]">
                    {user.email}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 border border-slate-700/60 hover:border-rose-500/30 transition-all text-xs flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
