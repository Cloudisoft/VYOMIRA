"use client";
import { usePathname } from "next/navigation";
import { WhatsAppButton } from "./WhatsAppButton";

/** WhatsApp help in the dashboard, except on the AURA chat screen where it would cover the composer. */
export function DashboardWhatsApp() {
  return usePathname()?.startsWith("/dashboard/aura") ? null : <WhatsAppButton />;
}
