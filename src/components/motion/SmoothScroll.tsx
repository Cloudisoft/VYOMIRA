"use client";
import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Inertial smooth scrolling for mouse/trackpad users on marketing pages. Touch devices keep native
 * momentum scrolling; with reduced motion requested the glide is shorter. In-page anchor links glide to
 * their target, offset for the fixed navbar. Scrollable panels can opt out with `data-lenis-prevent`.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = new Lenis({
      autoRaf: true,
      duration: calm ? 0.7 : 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      wheelMultiplier: 0.95,
      anchors: { offset: -88 },
    });
    return () => lenis.destroy();
  }, []);
  return null;
}
