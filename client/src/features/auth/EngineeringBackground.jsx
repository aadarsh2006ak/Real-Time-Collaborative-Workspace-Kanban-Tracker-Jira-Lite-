// client/src/features/auth/EngineeringBackground.jsx
import { useEffect, useRef } from 'react';

export default function EngineeringBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Engineering Architecture Nodes
    const nodes = [
      { id: 'CLIENT', label: 'REACT_APP', x: 0.12, y: 0.22, vx: 0.05, vy: 0.03, color: '#3b82f6', tag: 'UI_V18' },
      { id: 'REDUX', label: 'RTK_STORE', x: 0.18, y: 0.45, vx: -0.04, vy: 0.05, color: '#8b5cf6', tag: 'STATE' },
      { id: 'SOCKET', label: 'SOCKET.IO', x: 0.22, y: 0.78, vx: 0.03, vy: -0.04, color: '#10b981', tag: 'WSS://' },
      { id: 'SERVER', label: 'EXPRESS_API', x: 0.82, y: 0.25, vx: -0.05, vy: -0.03, color: '#38bdf8', tag: 'REST' },
      { id: 'REDIS', label: 'REDIS_PUBSUB', x: 0.86, y: 0.52, vx: 0.04, vy: -0.05, color: '#f43f5e', tag: 'BROKER' },
      { id: 'MONGO', label: 'MONGO_DB', x: 0.80, y: 0.80, vx: -0.03, vy: 0.04, color: '#10b981', tag: 'CLUSTER' },
      { id: 'AUTH', label: 'JWT_SECURITY', x: 0.48, y: 0.12, vx: 0.02, vy: 0.03, color: '#06b6d4', tag: 'GUARD' },
    ];

    // Data flow packets traveling along routes
    const packets = [
      { from: 0, to: 1, progress: 0.2, speed: 0.008, color: '#60a5fa' },
      { from: 0, to: 6, progress: 0.6, speed: 0.006, color: '#38bdf8' },
      { from: 1, to: 2, progress: 0.4, speed: 0.009, color: '#34d399' },
      { from: 2, to: 4, progress: 0.8, speed: 0.005, color: '#f43f5e' },
      { from: 3, to: 4, progress: 0.1, speed: 0.007, color: '#f87171' },
      { from: 3, to: 5, progress: 0.5, speed: 0.006, color: '#10b981' },
      { from: 6, to: 3, progress: 0.7, speed: 0.007, color: '#67e8f9' },
    ];

    // Engineering background grid crosshairs
    let tick = 0;

    const render = () => {
      tick += 0.015;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Technical CAD Grid Lines
      const gridSize = 60;
      ctx.lineWidth = 1;

      // Minor grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Technical crosshairs (+) at grid intersections
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1.2;
      for (let x = gridSize; x < width; x += gridSize * 2) {
        for (let y = gridSize; y < height; y += gridSize * 2) {
          const crossSize = 3;
          ctx.beginPath();
          ctx.moveTo(x - crossSize, y);
          ctx.lineTo(x + crossSize, y);
          ctx.moveTo(x, y - crossSize);
          ctx.lineTo(x, y + crossSize);
          ctx.stroke();
        }
      }

      // 2. Animate and Draw Architecture Nodes & Connection Traces
      const currentPositions = nodes.map((node, i) => {
        // Gentle oscillation
        const curX = node.x * width + Math.sin(tick * 0.8 + i) * 15;
        const curY = node.y * height + Math.cos(tick * 0.7 + i * 1.5) * 12;
        return { ...node, curX, curY };
      });

      // Draw Connection Traces
      ctx.lineWidth = 1.2;
      packets.forEach((p) => {
        const fromNode = currentPositions[p.from];
        const toNode = currentPositions[p.to];
        if (!fromNode || !toNode) return;

        // Draw circuit trace
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.45)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(fromNode.curX, fromNode.curY);
        ctx.lineTo(toNode.curX, toNode.curY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Animate Data Packets
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;

        const packetX = fromNode.curX + (toNode.curX - fromNode.curX) * p.progress;
        const packetY = fromNode.curY + (toNode.curY - fromNode.curY) * p.progress;

        // Glowing packet dot
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(packetX, packetY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Engineered Node Blocks (CAD Circuit Chips)
      currentPositions.forEach((node) => {
        // Draw chip box
        const boxW = 90;
        const boxH = 26;
        const bx = node.curX - boxW / 2;
        const by = node.curY - boxH / 2;

        // Subtle glowing background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.strokeStyle = `${node.color}55`;
        ctx.lineWidth = 1;

        // Rounded rect
        ctx.beginPath();
        ctx.roundRect(bx, by, boxW, boxH, 6);
        ctx.fill();
        ctx.stroke();

        // Technical pin / node indicator
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(bx + 10, by + boxH / 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Node Label
        ctx.font = 'bold 9px "JetBrains Mono", Menlo, Consolas, monospace';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'left';
        ctx.fillText(node.label, bx + 18, by + 12);

        // Technical Sub-tag
        ctx.font = '8px "JetBrains Mono", Menlo, Consolas, monospace';
        ctx.fillStyle = `${node.color}cc`;
        ctx.fillText(node.tag, bx + 18, by + 21);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* 1. Interactive Architectural Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-65" />

      {/* 2. Top-Down Technical Laser Scanline */}
      <div className="absolute inset-0 scanline-bar opacity-30 pointer-events-none" />

      {/* 3. CAD HUD Corner Brackets & Engineering Telemetry */}
      {/* Top Left HUD */}
      <div className="hidden lg:flex flex-col gap-0.5 absolute top-5 left-6 font-mono text-[10px] text-slate-500/80 bg-slate-950/40 p-2 rounded-lg border border-slate-800/40 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>SYSTEM_ARCH // MERN_SOCKET_ENGINE</span>
        </div>
        <div className="text-[9px] text-slate-400">
          TOPOLOGY: DISTRIBUTED_PUB_SUB • NODE_STATUS: HEALTHY
        </div>
      </div>

      {/* Top Right HUD */}
      <div className="hidden lg:flex flex-col items-end gap-0.5 absolute top-5 right-6 font-mono text-[10px] text-slate-500/80 bg-slate-950/40 p-2 rounded-lg border border-slate-800/40 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold">
          <span>REALTIME_WSS: ACTIVE</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <div className="text-[9px] text-slate-400">
          EVENT_BUS: REDIS_V7 • LATENCY: &lt; 15MS
        </div>
      </div>

      {/* Bottom Left Telemetry */}
      <div className="hidden xl:flex items-center gap-3 absolute bottom-20 left-6 font-mono text-[9px] text-slate-500/70">
        <span className="text-slate-400">[0x7F // CLUSTER_READY]</span>
        <span>•</span>
        <span>MONGO_REPLICA: CONNECTED</span>
        <span>•</span>
        <span>FRAME_RATE: 60_FPS</span>
      </div>

      {/* Bottom Right Telemetry */}
      <div className="hidden xl:flex items-center gap-3 absolute bottom-20 right-6 font-mono text-[9px] text-slate-500/70">
        <span>SECURITY: JWT_ROTATION_GUARD</span>
        <span>•</span>
        <span className="text-blue-400">TLS_1.3_ENCRYPTED</span>
      </div>

      {/* Vignette mask to keep center readable */}
      <div className="absolute inset-0 bg-radial-vignette opacity-80 pointer-events-none" />
    </div>
  );
}
