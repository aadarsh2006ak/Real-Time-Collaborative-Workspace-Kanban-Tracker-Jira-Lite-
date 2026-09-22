// client/src/App.jsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import ProtectedRoute from './features/auth/ProtectedRoute';
import ToastContainer from './components/ToastContainer';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';

// Code Splitting & Performance Optimizations (Phase 11)
const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const RegisterPage = lazy(() => import('./features/auth/RegisterPage'));
const ProjectsPage = lazy(() => import('./features/projects/ProjectsPage'));
const BoardPage = lazy(() => import('./features/board/BoardPage'));

function PageFallback() {
  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-slate-400 gap-3">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <span className="text-xs font-medium tracking-wide text-slate-400">
        Loading view...
      </span>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/projects" replace />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<BoardPage />} />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
      </Suspense>

      {/* Global Real-time Toasts & Keyboard Shortcuts Guide */}
      <ToastContainer />
      <KeyboardShortcutsModal />
    </BrowserRouter>
  );
}
