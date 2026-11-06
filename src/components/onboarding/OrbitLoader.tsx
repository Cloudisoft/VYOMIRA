"use client";
import { motion } from "motion/react";
import { SvgSpin } from "@/components/motion/SvgSpin";

export function OrbitLoader({ done = false }: { done?: boolean }) {
  const rings = [{ r: 34, d: 3.2, c: "#E9E3F5" }, { r: 52, d: 5.6, c: "#A58BFF" }, { r: 70, d: 8.4, c: "#D8B477" }];
  return (
    <svg viewBox="-90 -90 180 180" className="h-44 w-44" role="img" aria-label={done ? "Calculation complete" : "Calculating"}>
      <defs><radialGradient id="ol-sun"><stop offset="0" stopColor="#FFF3D6" /><stop offset="1" stopColor="#D8B477" /></radialGradient></defs>
      <motion.circle r="12" fill="url(#ol-sun)" animate={done ? { scale: [1, 1.25, 1] } : {}} transition={{ duration: 0.8 }} />
      {rings.map((o, i) => (
        <g key={o.r}>
          <circle r={o.r} fill="none" stroke="rgba(165,139,255,.2)" />
          <SvgSpin key={done ? "slow" : "fast"} duration={done ? o.d * 3 : o.d}>
            <circle cx={o.r} cy="0" r={4 - i * 0.6} fill={o.c} />
          </SvgSpin>
        </g>
      ))}
    </svg>
  );
}
