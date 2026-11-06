"use client";
import { usePathname } from "next/navigation";
import { BackHome } from "./BackHome";

/** Shows the back button on every marketing page except the homepage itself. */
export function MarketingBackHome() {
  const path = usePathname();
  if (path === "/") return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-24 z-20">
      <div className="mx-auto max-w-7xl px-6"><BackHome className="pointer-events-auto" /></div>
    </div>
  );
}
