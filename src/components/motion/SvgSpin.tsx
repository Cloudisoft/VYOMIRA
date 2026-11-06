"use client";
import { useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Rotates SVG children continuously around an exact point in the SVG's own coordinates.
 * (CSS/motion transforms on SVG pivot around each element's bounding box, which makes clock hands
 * and orbiting bodies fly off their centre.) Static under prefers-reduced-motion.
 */
export function SvgSpin({ cx = 0, cy = 0, duration, reverse = false, children }: { cx?: number; cy?: number; duration: number; reverse?: boolean; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <g>
      {children}
      {!reduce && (
        <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`${reverse ? -360 : 360} ${cx} ${cy}`} dur={`${duration}s`} repeatCount="indefinite" />
      )}
    </g>
  );
}
