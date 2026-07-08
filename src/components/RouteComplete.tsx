import { useEffect, useRef } from 'react';

/**
 * Animation de fin de parcours : feu d'artifice (canvas) au-dessus de la
 * silhouette des trois clochers de Cambrai (Beffroi, Cathédrale Notre-Dame de
 * Grâce, Saint-Géry). Aucune dépendance externe. Respecte prefers-reduced-motion.
 */
export function RouteComplete({
  routeTitle,
  count,
  onClose,
}: {
  routeTitle: string;
  count: number;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduced =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current;
    if (!canvas || reduced) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);
    const onResize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', onResize);

    const colors = ['#f9d976', '#ffd700', '#f39c6b', '#e0f1e8', '#ff6b6b', '#4dabf7', '#c9a26b'];
    type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number };
    let particles: Particle[] = [];

    const launch = () => {
      const cx = w * 0.15 + Math.random() * w * 0.7;
      const cy = h * 0.1 + Math.random() * h * 0.4;
      const n = 46 + Math.floor(Math.random() * 34);
      const color = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n;
        const sp = 1.4 + Math.random() * 2.8;
        particles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, color, size: 1.5 + Math.random() * 2 });
      }
    };

    let raf = 0;
    let last = performance.now();
    let timer = 0;
    const tick = (t: number) => {
      const dt = Math.min(32, t - last);
      last = t;
      timer -= dt;
      if (timer <= 0) {
        launch();
        timer = 420 + Math.random() * 520;
      }
      // Voile sombre semi-transparent → traînées lumineuses + ciel nocturne.
      ctx.fillStyle = 'rgba(18, 14, 26, 0.22)';
      ctx.fillRect(0, 0, w, h);
      const step = dt / 16;
      for (const p of particles) {
        p.vy += 0.03 * step;
        p.x += p.vx * step;
        p.y += p.vy * step;
        p.life -= 0.009 * step;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      particles = particles.filter((p) => p.life > 0);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="celebrate" role="dialog" aria-label="Parcours terminé" onClick={onClose}>
      <canvas ref={canvasRef} className="celebrate__sky" />

      <svg className="celebrate__towers" viewBox="0 0 300 170" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        {/* Beffroi (gauche) */}
        <g className="tower tower--1">
          <rect x="46" y="86" width="34" height="78" fill="#241a12" />
          <path d="M46 86 L63 60 L80 86 Z" fill="#241a12" />
          <circle cx="63" cy="55" r="6" fill="#3a2a1c" />
          <line x1="63" y1="49" x2="63" y2="40" stroke="#f9d976" strokeWidth="2" />
          <rect x="56" y="98" width="14" height="18" rx="2" fill="#f9d976" className="win" />
          <rect x="58" y="126" width="10" height="14" rx="2" fill="#f9d976" className="win" />
        </g>
        {/* Cathédrale Notre-Dame de Grâce (centre) — tour-lanterne */}
        <g className="tower tower--2">
          <rect x="126" y="66" width="40" height="98" fill="#2a1e14" />
          <path d="M126 66 Q146 44 166 66 Z" fill="#2a1e14" />
          <circle cx="146" cy="52" r="9" fill="#3a2a1c" />
          <path d="M146 33 v-10 M141 28 h10" stroke="#f9d976" strokeWidth="2" />
          <rect x="136" y="80" width="20" height="24" rx="3" fill="#f9d976" className="win" />
          <rect x="139" y="116" width="14" height="20" rx="2" fill="#f9d976" className="win" />
        </g>
        {/* Saint-Géry (droite) — le plus haut, à la flèche */}
        <g className="tower tower--3">
          <rect x="212" y="58" width="36" height="106" fill="#241a12" />
          <path d="M212 58 L230 20 L248 58 Z" fill="#241a12" />
          <path d="M230 20 v-10 M225 15 h10" stroke="#f9d976" strokeWidth="2" />
          <rect x="221" y="74" width="16" height="22" rx="3" fill="#f9d976" className="win" />
          <rect x="223" y="112" width="12" height="18" rx="2" fill="#f9d976" className="win" />
        </g>
        {/* sol */}
        <rect x="20" y="162" width="260" height="6" rx="3" fill="#1a130d" />
      </svg>

      <p className="celebrate__caption">Les trois clochers de Cambrai</p>

      <div className="celebrate__card" onClick={(e) => e.stopPropagation()}>
        <div className="celebrate__emoji">🎉</div>
        <h2>Bravo !</h2>
        <p>Tu as terminé le parcours</p>
        <p className="celebrate__route">{routeTitle}</p>
        <p className="muted">{count} lieux visités</p>
        <button className="btn" onClick={onClose}>
          Continuer
        </button>
      </div>
    </div>
  );
}
