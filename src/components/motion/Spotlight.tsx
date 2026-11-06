"use client";
import { useEffect } from "react";

/** Moves a soft light under the cursor on every `.glass` card (CSS vars --mx/--my). One listener, rAF-throttled. */
export function Spotlight() {
  useEffect(() => {
    if (window.matchMedia("(hover: none), (prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last: HTMLElement | null = null;
    let ev: PointerEvent | null = null;
    const apply = () => {
      raf = 0;
      if (!ev) return;
      const el = (ev.target as Element | null)?.closest?.(".glass") as HTMLElement | null;
      if (last && last !== el) { last.style.removeProperty("--mx"); last.style.removeProperty("--my"); }
      if (el) {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${ev.clientX - r.left}px`);
        el.style.setProperty("--my", `${ev.clientY - r.top}px`);
      }
      last = el;
    };
    const onMove = (e: PointerEvent) => { ev = e; if (!raf) raf = requestAnimationFrame(apply); };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, []);
  return null;
}
