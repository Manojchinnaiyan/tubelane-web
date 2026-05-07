// ── Particle network ────────────────────────────────────────────────────────
// Canvas-rendered network of small dots connected by short lines when
// they're close together. Mouse acts as a soft repeller. Pure vanilla,
// ~2KB minified, GPU-accelerated via 2d canvas. Disabled on touch /
// reduced-motion to save battery.
//
// Mounts on <canvas data-particles> elements. Reads colour palette from
// CSS variables (--accent) so it stays in theme automatically — pure
// monochrome (white) to match the desktop app's strict-mono palette.

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

const canvases = document.querySelectorAll<HTMLCanvasElement>("[data-particles]");
const reduced = globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCoarse = globalThis.matchMedia("(pointer: coarse)").matches;

if (canvases.length > 0 && !reduced && !isCoarse) {
  for (const canvas of canvases) {
    initCanvas(canvas);
  }
}

function initCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Pull colour from theme. We resolve --accent at runtime (it aliases
  // var(--brand-500) which is white in dark mode), then fall back to a
  // safe near-white if the cascade hasn't applied yet.
  const root = getComputedStyle(document.documentElement);
  const accent =
    root.getPropertyValue("--accent").trim() ||
    root.getPropertyValue("--brand-500").trim() ||
    "#ffffff";

  // Density tuned to feel "alive" but not crowded. Roughly 1 particle per
  // 11000 pixels of canvas area, which gives ~80 on a 1200×800 hero.
  const DENSITY = 0.00009;
  const LINK_DIST = 130;
  const MOUSE_REPEL = 110;

  let particles: Particle[] = [];
  let mx = -9999;
  let my = -9999;
  let dpr = Math.min(2, globalThis.devicePixelRatio || 1);

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Recompute particle pool on resize.
    const target = Math.floor(rect.width * rect.height * DENSITY);
    const pool: Particle[] = [];
    for (let i = 0; i < target; i++) {
      pool.push({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: 0.8 + Math.random() * 1.2,
      });
    }
    particles = pool;
  };
  resize();
  globalThis.addEventListener("resize", resize);

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
  });
  canvas.addEventListener("mouseleave", () => {
    mx = -9999;
    my = -9999;
  });

  const tick = () => {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Move + render dots.
    for (const p of particles) {
      // Mouse repulsion — soft falloff inside MOUSE_REPEL radius.
      const dx = p.x - mx;
      const dy = p.y - my;
      const dist = Math.hypot(dx, dy);
      if (dist < MOUSE_REPEL) {
        const force = (MOUSE_REPEL - dist) / MOUSE_REPEL;
        p.vx += (dx / dist) * force * 0.4;
        p.vy += (dy / dist) * force * 0.4;
      }

      // Gentle damping so the field doesn't spiral out of control.
      p.vx *= 0.96;
      p.vy *= 0.96;

      // A whisper of constant motion so static frames still drift.
      p.vx += (Math.random() - 0.5) * 0.02;
      p.vy += (Math.random() - 0.5) * 0.02;

      p.x += p.vx;
      p.y += p.vy;

      // Wrap edges to keep the field continuous.
      if (p.x < -10) p.x = rect.width + 10;
      if (p.x > rect.width + 10) p.x = -10;
      if (p.y < -10) p.y = rect.height + 10;
      if (p.y > rect.height + 10) p.y = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.55;
      ctx.fill();
    }

    // Draw connecting lines for nearby pairs. O(n²) but fine for ~80
    // particles — runs at 60fps comfortably.
    ctx.lineWidth = 0.6;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < LINK_DIST) {
          const opacity = (1 - d / LINK_DIST) * 0.45;
          ctx.globalAlpha = opacity;
          ctx.strokeStyle = accent;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
