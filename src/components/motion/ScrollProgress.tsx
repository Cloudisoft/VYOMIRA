"use client";
import { motion, useScroll, useSpring } from "motion/react";

/** Hairline of gold across the top that fills as the page scrolls. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });
  return <motion.div aria-hidden style={{ scaleX }} className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-amethyst via-gold to-[#fff3d6]" />;
}
