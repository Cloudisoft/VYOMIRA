import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/server/session";
import { Logo } from "@/components/brand/Logo";
import { SaveClient } from "./SaveClient";

export const metadata = { title: "Save your chart", robots: { index: false } };

export default async function SavePage() {
  const s = await getSession();
  if (!s) redirect(`/sign-in?next=${encodeURIComponent("/onboarding/save")}`);
  return (
    <main id="main" className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center px-6 py-6"><Link href="/" aria-label="VYOMIRA home"><Logo /></Link></header>
      <div className="px-6 py-10"><SaveClient /></div>
    </main>
  );
}
