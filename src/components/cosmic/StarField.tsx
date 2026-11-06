"use client";
import { useEffect, useRef } from "react";

/**
 * Lightweight 2D canvas star field: twinkling stars in three parallax layers, constellation
 * lines that draw in after load, cursor parallax. Pauses when hidden; static under
 * prefers-reduced-motion; density scales down on small screens.
 */
const CONSTELLATIONS: [number, number][][] = [
  // original abstract figures (normalized 0..1 coordinates)
  [[0.08, 0.22], [0.13, 0.16], [0.19, 0.2], [0.24, 0.13], [0.29, 0.18]],
  [[0.72, 0.12], [0.77, 0.18], [0.83, 0.15], [0.88, 0.22], [0.84, 0.28]],
  [[0.62, 0.72], [0.67, 0.66], [0.73, 0.7], [0.7, 0.78]],
];

export function StarField({ className, density = 1 }: { className?: string; density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = 1, raf = 0;
    const start = performance.now();
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    type Star = { x: number; y: number; r: number; layer: number; phase: number; speed: number; hue: number };
    let stars: Star[] = [];
    type Meteor = { x: number; y: number; vx: number; vy: number; life: number; max: number };
    const meteors: Meteor[] = [];
    let nextMeteor = 2.5;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(((w * h) / (w < 768 ? 5200 : 3200)) * density);
      // deterministic pseudo-random so layout is stable across resizes
      let seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      stars = Array.from({ length: count }, () => {
        const layer = rnd() < 0.7 ? 0 : rnd() < 0.8 ? 1 : 2;
        return { x: rnd() * w, y: rnd() * h, r: [0.5, 0.9, 1.4][layer] * (0.6 + rnd() * 0.6), layer, phase: rnd() * Math.PI * 2, speed: 0.4 + rnd() * 1.4, hue: rnd() };
      });
    };

    const draw = (t: number) => {
      const el = (t - start) / 1000;
      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const par = [4, 10, 22][s.layer];
        const x = s.x + pointer.x * par;
        const y = s.y + pointer.y * par;
        const tw = reduce ? 0.8 : 0.55 + 0.45 * Math.sin(el * s.speed + s.phase);
        ctx.globalAlpha = tw * (0.45 + s.layer * 0.25);
        ctx.fillStyle = s.hue > 0.92 ? "#F1DCAE" : s.hue > 0.8 ? "#C9B8FF" : "#F4F1FB";
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.layer === 2 && tw > 0.85) {
          ctx.globalAlpha = (tw - 0.85) * 2;
          ctx.fillRect(x - s.r * 3, y - 0.25, s.r * 6, 0.5);
          ctx.fillRect(x - 0.25, y - s.r * 3, 0.5, s.r * 6);
        }
      }
      // shooting stars: one every ~4–9 s, a short gold-white streak with a fading tail
      if (!reduce) {
        if (el > nextMeteor) {
          const ang = (Math.PI / 180) * (18 + Math.random() * 22);
          const sp = (w < 768 ? 520 : 820) * (0.8 + Math.random() * 0.5);
          meteors.push({ x: w * (0.15 + Math.random() * 0.7), y: h * Math.random() * 0.45, vx: -Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0, max: 0.9 + Math.random() * 0.5 });
          nextMeteor = el + 4 + Math.random() * 5;
        }
        const dt = 1 / 60;
        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i];
          m.life += dt; m.x += m.vx * dt; m.y += m.vy * dt;
          const k = m.life / m.max;
          if (k >= 1) { meteors.splice(i, 1); continue; }
          const alpha = Math.sin(Math.PI * k);
          const tail = 0.12;
          const g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * tail, m.y - m.vy * tail);
          g.addColorStop(0, `rgba(255,246,226,${0.95 * alpha})`);
          g.addColorStop(0.3, `rgba(216,180,119,${0.5 * alpha})`);
          g.addColorStop(1, "rgba(165,139,255,0)");
          ctx.globalAlpha = 1;
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(m.x - m.vx * tail, m.y - m.vy * tail);
          ctx.stroke();
          ctx.fillStyle = `rgba(255,250,240,${alpha})`;
          ctx.beginPath(); ctx.arc(m.x, m.y, 1.4, 0, Math.PI * 2); ctx.fill();
        }
      }
      // constellations draw in over ~3s
      const p = reduce ? 1 : Math.min(1, Math.max(0, (el - 0.6) / 2.6));
      const ease = 1 - Math.pow(1 - p, 3);
      ctx.lineWidth = 0.7;
      for (const c of CONSTELLATIONS) {
        const pts = c.map(([cx, cy]) => [cx * w + pointer.x * 14, cy * h + pointer.y * 14]);
        const segs = pts.length - 1;
        const drawn = ease * segs;
        ctx.strokeStyle = "rgba(216,180,119,0.35)";
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 0; i < segs; i++) {
          const f = Math.min(1, Math.max(0, drawn - i));
          if (f <= 0) break;
          ctx.lineTo(pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f);
        }
        ctx.stroke();
        for (let i = 0; i < pts.length; i++) {
          if (i > drawn + 0.01) break;
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = "#F1DCAE";
          ctx.beginPath();
          ctx.arc(pts[i][0], pts[i][1], 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth - 0.5) * -1;
      pointer.ty = (e.clientY / window.innerHeight - 0.5) * -1;
    };
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduce) raf = requestAnimationFrame(draw);
    };
    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    if (!reduce) window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [density]);
  return <canvas ref={ref} aria-hidden className={className} />;
}
