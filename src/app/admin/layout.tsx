import Link from "next/link";
import { requireAdmin } from "@/server/session";
import { Logo } from "@/components/brand/Logo";

export const metadata = { title: "Admin", robots: { index: false } };
const NAV = [["/admin", "Overview"], ["/admin/users", "Users"], ["/admin/ai", "AI usage & models"], ["/admin/payments", "Payments"], ["/admin/pricing", "Pricing & flags"], ["/admin/rules", "Rule versions"], ["/admin/feedback", "Feedback"], ["/admin/logs", "Errors & audit"]];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-dvh">
      <header className="border-b hairline bg-space/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-6 py-4">
          <Link href="/admin" className="flex items-center gap-3"><Logo /><span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] tracking-widest text-gold">ADMIN</span></Link>
          <nav aria-label="Admin" className="flex flex-wrap gap-1 text-sm">{NAV.map(([h, l]) => <Link key={h} href={h} className="rounded-full px-3 py-1.5 text-slate hover:bg-moon/5 hover:text-moon">{l}</Link>)}</nav>
          <Link href="/dashboard" className="ml-auto text-sm text-slate hover:text-moon">Back to app</Link>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}
