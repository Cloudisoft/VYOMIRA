"use client";
import { useMemo, useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener("vy-session", cb);
  return () => { window.removeEventListener("storage", cb); window.removeEventListener("vy-session", cb); };
};

/** Reads a JSON value from sessionStorage without hydration mismatches. undefined = not yet known (SSR). */
export function useSessionJSON<T>(key: string): T | null | undefined {
  const raw = useSyncExternalStore(
    subscribe,
    () => { try { return sessionStorage.getItem(key); } catch { return null; } },
    () => undefined,
  );
  return useMemo(() => {
    if (raw === undefined) return undefined;
    if (raw === null) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  }, [raw]);
}

export function useClientValue<T>(get: () => T, server: T): T {
  return useSyncExternalStore(() => () => {}, get, () => server);
}
