"use client";
import dynamic from "next/dynamic";
import { Component, useState, type ReactNode } from "react";
import { PlanetFallback } from "./PlanetFallback";
import { useClientValue } from "@/lib/use-session-json";

const HeroPlanet3D = dynamic(() => import("./HeroPlanet3D"), { ssr: false, loading: () => <Fallback /> });

const Fallback = () => <div className="flex h-full items-center justify-center"><PlanetFallback className="w-[62%]" /></div>;

/** Any WebGL/three.js error is contained here and replaced by the CSS planet — it can never take the page down. */
class WebGLBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? <Fallback /> : this.props.children; }
}

let cached: boolean | null = null;
function detectWebgl(): boolean {
  if (cached !== null) return cached;
  try {
    if (sessionStorage.getItem("vy_webgl_failed") === "1") return (cached = false);
  } catch {}
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const desktop = window.matchMedia("(min-width: 900px)").matches;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  let gl = false;
  try {
    const c = document.createElement("canvas");
    const ctx = (c.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) || c.getContext("webgl", { failIfMajorPerformanceCaveat: true })) as WebGLRenderingContext | null;
    gl = Boolean(ctx);
    ctx?.getExtension("WEBGL_lose_context")?.loseContext(); // release the probe context immediately
  } catch {
    gl = false;
  }
  const lowMem = ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) < 4;
  const fewCores = (navigator.hardwareConcurrency ?? 8) < 4;
  return (cached = !reduce && desktop && gl && !conn?.saveData && !lowMem && !fewCores);
}

/** Chooses WebGL only for capable desktop browsers; everything else gets the CSS planet. */
export function HeroVisual() {
  const capable = useClientValue(detectWebgl, false);
  const [failed, setFailed] = useState(false);
  const fail = () => {
    setFailed(true);
    cached = false;
    try { sessionStorage.setItem("vy_webgl_failed", "1"); } catch {}
  };
  return (
    <div className="relative h-full w-full">
      {capable && !failed ? (
        <WebGLBoundary onError={fail}>
          <HeroPlanet3D onFail={fail} />
        </WebGLBoundary>
      ) : (
        <Fallback />
      )}
    </div>
  );
}
