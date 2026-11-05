"use client";
import dynamic from "next/dynamic";
import { useClientValue } from "@/lib/use-session-json";
import { PlanetFallback } from "./PlanetFallback";

const HeroPlanet3D = dynamic(() => import("./HeroPlanet3D"), { ssr: false, loading: () => <PlanetFallback className="mx-auto w-[62%]" /> });

/** Chooses WebGL only for capable desktop browsers; everything else gets the CSS planet. */
export function HeroVisual() {
  const webgl = useClientValue(detectWebgl, false);
  return <div className="relative h-full w-full">{webgl ? <HeroPlanet3D /> : <div className="flex h-full items-center justify-center"><PlanetFallback className="w-[62%]" /></div>}</div>;
}

let cached: boolean | null = null;
function detectWebgl(): boolean {
  if (cached !== null) return cached;
  {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = window.matchMedia("(min-width: 900px)").matches;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    let gl = false;
    try {
      const c = document.createElement("canvas");
      gl = Boolean(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      gl = false;
    }
    const lowMem = ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) < 4;
    cached = !reduce && desktop && gl && !conn?.saveData && !lowMem;
  }
  return cached;
}
