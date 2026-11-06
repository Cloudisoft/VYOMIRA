import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TzCookie } from "@/components/dashboard/TzCookie";
import { Spotlight } from "@/components/motion/Spotlight";

export const metadata: Metadata = { title: "My Universe", robots: { index: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_1fr]">
      <TzCookie />
      <Spotlight />
      <Sidebar name={user.name} email={user.email} isAdmin={user.role === "ADMIN"} />
      <main id="main" className="relative min-w-0 px-5 pt-20 pb-24 sm:px-8 lg:px-12 lg:pt-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(ellipse_60%_100%_at_70%_0%,rgba(114,86,216,.14),transparent)]" />
        <div className="page-enter mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
