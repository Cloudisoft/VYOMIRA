"use client";
import { useEffect } from "react";

/** Moves a soft light under the cursor on every `.glass` card (CSS vars --mx/--my) and tilts cards marked `data-tilt`. One listener, rAF-throttled. */
export function Spotlight() {
  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;
    let raf = 0;
    let last: HTMLElement | null = null;
    let ev: PointerEvent | null = null;
    const apply = () => {
      raf = 0;
      if (!ev) return;
      const el = (ev.target as Element | null)?.closest?.(".glass") as HTMLElement | null;
      if (last && last !== el) for (const k of ["--mx", "--my", "--rx", "--ry"]) last.style.removeProperty(k);
      if (el) {
        const r = el.getBoundingClientRect();
        const px = ev.clientX - r.left, py = ev.clientY - r.top;
        el.style.setProperty("--mx", `${px}px`);
        el.style.setProperty("--my", `${py}px`);
        if (el.hasAttribute("data-tilt")) {
          const k = Math.min(1, 420 / r.width); // wide cards tilt less
          el.style.setProperty("--rx", `${((0.5 - py / r.height) * 3 * k).toFixed(2)}deg`);
          el.style.setProperty("--ry", `${((px / r.width - 0.5) * 4.5 * k).toFixed(2)}deg`);
        }
      }
      last = el;
    };
    const onMove = (e: PointerEvent) => { ev = e; if (!raf) raf = requestAnimationFrame(apply); };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, []);
  return null;
}
