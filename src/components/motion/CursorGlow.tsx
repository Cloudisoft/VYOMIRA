"use client";
import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

/** A soft violet light that trails the mouse across the page (mouse/trackpad only). */
export function CursorGlow() {
  const [on, setOn] = useState(false);
  const x = useMotionValue(-600);
  const y = useMotionValue(-600);
  const sx = useSpring(x, { stiffness: 90, damping: 22, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 90, damping: 22, mass: 0.6 });
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const move = (e: PointerEvent) => { x.set(e.clientX - 260); y.set(e.clientY - 260); setOn(true); };
    const leave = () => setOn(false);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => { window.removeEventListener("pointermove", move); document.documentElement.removeEventListener("pointerleave", leave); };
  }, [x, y]);
  return (
    <motion.div
      aria-hidden
      style={{ x: sx, y: sy, opacity: on ? 1 : 0 }}
      className="pointer-events-none fixed top-0 left-0 z-[1] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(165,139,255,.13)_0%,rgba(114,86,216,.06)_35%,transparent_65%)] mix-blend-screen transition-opacity duration-700"
    />
  );
}
