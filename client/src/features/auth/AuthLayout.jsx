// client/src/features/auth/AuthLayout.jsx
import { Kanban, Sparkles, CheckCircle2, ShieldCheck, Zap, Users, ArrowUpRight, Heart, Cpu, Activity } from 'lucide-react';
import EngineeringBackground from './EngineeringBackground';

export default function AuthLayout({ children, title, subtitle }) {
  const socialLinks = [
    {
      name: 'GitHub',
      handle: '@aadarsh2006ak',
      url: 'https://github.com/aadarsh2006ak',
      hoverColor: 'hover:border-slate-400 hover:text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:bg-slate-800/90',
      icon: (
        <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      handle: 'aadarshkumar2006',
      url: 'https://www.linkedin.com/in/aadarshkumar2006/',
      hoverColor: 'hover:border-blue-500 hover:text-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:bg-blue-950/40',
      icon: (
        <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.25a1.62 1.62 0 0 0-1.63 1.63c0 .9.73 1.63 1.63 1.63.9 0 1.63-.73 1.63-1.63 0-.9-.73-1.63-1.63-1.63Z" />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      handle: '@aadarsh_tiwari_ak',
      url: 'https://www.instagram.com/aadarsh_tiwari_ak?stkn=MWE1NmthcDB5OHRjMA==',
      hoverColor: 'hover:border-pink-500 hover:text-pink-400 hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:bg-pink-950/30',
      icon: (
        <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#050811] text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-blue-600 selection:text-white font-sans antialiased">
      {/* 1. Engineered Architecture Background Engine (Nodes, Traces, Packets, Scanlines) */}
      <EngineeringBackground />

      {/* 2. Ambient Deep Spotlights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* 3. Floating Engineering Telemetry Badges (Visible on 2XL+ screens) */}
      {/* Top-Left CAD Widget */}
      <div className="hidden 2xl:flex absolute top-24 left-14 animate-float-1 pointer-events-none select-none z-10">
        <div className="w-64 p-3.5 rounded-2xl bg-slate-900/85 backdrop-blur-xl border border-slate-800/90 shadow-2xl shadow-blue-950/40">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Zap className="w-3 h-3 text-amber-400" /> ENGINE // RUNNING
            </span>
            <span className="text-[10px] text-slate-500 font-mono">SYS-01</span>
          </div>
          <p className="text-xs font-mono font-medium text-slate-200 line-clamp-1">
            Redis Pub/Sub Sync Mesh
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-400">LATENCY: &lt;12ms</span>
            </div>
            <span className="text-slate-400">P1 CRITICAL</span>
          </div>
        </div>
      </div>

      {/* Top-Right CAD Widget */}
      <div className="hidden 2xl:flex absolute top-28 right-14 animate-float-2 pointer-events-none select-none z-10">
        <div className="w-60 p-3.5 rounded-2xl bg-slate-900/85 backdrop-blur-xl border border-slate-800/90 shadow-2xl shadow-indigo-950/40">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> DND_PIPELINE
            </span>
            <span className="text-[10px] text-slate-500 font-mono">OPT-60FPS</span>
          </div>
          <p className="text-xs font-mono font-medium text-slate-200 line-clamp-1">
            Optimistic State Reorder
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="text-indigo-400">REDUX_TOOLKIT</span>
            <span className="text-slate-500">SYNCED</span>
          </div>
        </div>
      </div>

      {/* Main Content Area - Center Aligned */}
      <main className="relative z-20 flex-1 flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 w-full">
        <div className="w-full max-w-md mx-auto text-center flex flex-col items-center">
          {/* Logo with Engineered Glow Aura */}
          <div className="relative inline-flex mb-3.5 group">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 opacity-70 blur-md group-hover:opacity-100 transition-opacity duration-500 animate-pulse-glow" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 p-[1px] shadow-2xl flex items-center justify-center">
              <div className="w-full h-full rounded-2xl bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-3">
                <Kanban className="w-full h-full text-cyan-400" />
              </div>
            </div>
          </div>

          {/* Engineered Architecture Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono font-medium mb-2.5 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>MERN • SOCKET.IO • REDIS PUB/SUB</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 tracking-tight">
            {title}
          </h1>
          <p className="mt-1.5 text-xs text-slate-400 max-w-sm">
            {subtitle}
          </p>

          {/* Central Card Container */}
          <div className="mt-6 w-full">
            <div className="relative group w-full text-left">
              {/* Outer subtle gradient glow border */}
              <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-b from-cyan-500/30 via-blue-500/20 to-transparent blur-[1px]" />
              
              {/* Inner Glass Card */}
              <div className="relative rounded-3xl bg-slate-900/90 backdrop-blur-2xl border border-slate-800/90 py-7 px-6 sm:px-9 shadow-2xl shadow-black/90 overflow-hidden">
                {/* Top ambient highlight line */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
                
                {children}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 4. Creator Identity & Social Footer - Clean Aligned */}
      <footer className="relative z-20 w-full border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-lg py-4 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Creator Brand Info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1.5px] flex-shrink-0 shadow-md shadow-cyan-500/20">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">
                AK
              </div>
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <span>Engineered with</span>
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline animate-pulse" />
                <span>by</span>
                <span className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors">
                  Aadarsh Kumar
                </span>
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                Distributed Real-Time Kanban Architecture
              </p>
            </div>
          </div>

          {/* Social Profiles with Centered & Responsive Alignment */}
          <div className="flex items-center gap-2.5 flex-wrap justify-center">
            {socialLinks.map((item) => (
              <a
                key={item.name}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800/90 text-slate-300 text-xs font-medium transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 ${item.hoverColor}`}
                title={`Connect with Aadarsh on ${item.name}`}
              >
                {item.icon}
                <span>{item.name}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-current transition-colors opacity-70 group-hover:opacity-100" />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
