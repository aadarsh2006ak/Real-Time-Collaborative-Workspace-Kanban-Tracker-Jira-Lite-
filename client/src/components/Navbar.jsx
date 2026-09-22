// client/src/components/Navbar.jsx
import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  Kanban,
  LogOut,
  Layers,
  Sparkles,
  Bell,
  CheckCheck,
  MessageSquare,
  UserCheck,
  Clock,
} from 'lucide-react';
import { loggedOut } from '../features/auth/authSlice';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../features/notifications/notificationsSlice';
import { api } from '../lib/api';

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

export default function Navbar({ currentProject = null }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { items: notifications, unreadCount } = useSelector(
    (state) => state.notifications
  );

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications());
    }
  }, [user, dispatch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    dispatch(markAllNotificationsRead());
  };

  const handleNotificationClick = (notif) => {
    if (!notif.readAt) {
      dispatch(markNotificationRead(notif._id));
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
            <span>v0.8 Collab Engine</span>
          </div>

          {user && (
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Notification Bell Dropdown */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setIsNotifOpen((prev) => !prev)}
                  title="Notifications"
                  className={`p-2 rounded-xl border transition-all relative ${
                    isNotifOpen
                      ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                      : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-900 animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Popup */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white">Notifications</h4>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-[10px] font-semibold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 text-xs">
                          <Bell className="w-6 h-6 mx-auto mb-2 text-slate-700" />
                          <p>You&apos;re all caught up!</p>
                        </div>
                      ) : (
                        notifications.slice(0, 20).map((notif) => (
                          <div
                            key={notif._id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-3 text-xs transition-colors cursor-pointer flex gap-3 items-start ${
                              notif.readAt
                                ? 'bg-transparent text-slate-400 hover:bg-slate-850/40'
                                : 'bg-blue-600/5 text-slate-200 hover:bg-blue-600/10'
                            }`}
                          >
                            <div className="mt-0.5 p-1.5 rounded-lg bg-slate-800 border border-slate-750 text-blue-400 flex-shrink-0">
                              {notif.type === 'COMMENT' && (
                                <MessageSquare className="w-3.5 h-3.5" />
                              )}
                              {notif.type === 'MENTION' && (
                                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                              )}
                              {notif.type === 'ASSIGNMENT' && (
                                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                              {notif.type !== 'COMMENT' &&
                                notif.type !== 'MENTION' &&
                                notif.type !== 'ASSIGNMENT' && (
                                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="font-semibold text-slate-200 truncate">
                                  {notif.title}
                                </p>
                                <span className="text-[10px] text-slate-500 flex-shrink-0">
                                  {formatTimeAgo(notif.createdAt)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                                {notif.message}
                              </p>
                            </div>

                            {!notif.readAt && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <div className="flex items-center gap-2.5 pl-1">
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
