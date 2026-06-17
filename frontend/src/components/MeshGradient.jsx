import { useEffect, useRef } from 'react';

// A slow animated multi-stop mesh-gradient field rendered on a canvas.
// Several radial blobs (jade, amber, coral) drift over a deep forest-ink base.
// It is devicePixelRatio-aware and pauses when the tab is hidden.
const BLOBS = [
  { color: [52, 211, 153], r: 0.55, ax: 0.22, ay: 0.18, sx: 0.00007, sy: 0.00005, px: 0.2, py: 1.1 },
  { color: [251, 191, 36], r: 0.45, ax: 0.18, ay: 0.2, sx: 0.00009, sy: 0.00006, px: 2.1, py: 0.4 },
  { color: [251, 113, 133], r: 0.42, ax: 0.2, ay: 0.16, sx: 0.00006, sy: 0.00008, px: 4.0, py: 3.2 },
  { color: [52, 211, 153], r: 0.38, ax: 0.16, ay: 0.22, sx: 0.00008, sy: 0.00007, px: 5.3, py: 1.9 },
];

export default function MeshGradient() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let running = true;
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (t) => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#08110E';
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'lighter';
      for (const b of BLOBS) {
        const cx = width * (0.5 + b.ax * Math.cos(t * b.sx + b.px));
        const cy = height * (0.5 + b.ay * Math.sin(t * b.sy + b.py));
        const radius = Math.max(width, height) * b.r;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        const [r, g, bl] = b.color;
        grad.addColorStop(0, `rgba(${r}, ${g}, ${bl}, 0.30)`);
        grad.addColorStop(0.5, `rgba(${r}, ${g}, ${bl}, 0.08)`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${bl}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      // Subtle dark vignette for depth.
      const vig = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.3,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8
      );
      vig.addColorStop(0, 'rgba(8, 17, 14, 0)');
      vig.addColorStop(1, 'rgba(5, 11, 9, 0.7)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);

      raf = requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(draw);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    raf = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
