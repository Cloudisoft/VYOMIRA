"use client";
import { useEffect } from "react";

/** Stores the browser's IANA timezone so daily insights are computed for the user's local day. */
export function TzCookie() {
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && !document.cookie.includes(`vy_tz=${encodeURIComponent(tz)}`)) document.cookie = `vy_tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;
    } catch {}
  }, []);
  return null;
}
