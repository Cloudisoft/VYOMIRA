"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return sent ? (
    <p className="mt-8 rounded-2xl border hairline bg-surface/50 p-5 text-slate">If an account exists for that email, a reset link is on its way. (In local development without Resend configured, emails are skipped — see the server log.)</p>
  ) : (
    <form className="mt-8 space-y-4" onSubmit={async (e) => { e.preventDefault(); await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" }); setSent(true); }}>
      <label htmlFor="email" className="block text-sm text-slate">Email</label>
      <input id="email" type="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button className="btn-primary w-full">Send reset link</button>
    </form>
  );
}

export function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [pw, setPw] = useState("");
  const [state, setState] = useState<"idle" | "ok" | "error">("idle");
  if (state === "ok") return <p className="mt-8 text-slate">Password updated. <Link href="/sign-in" className="text-gold">Sign in</Link></p>;
  return (
    <form className="mt-8 space-y-4" onSubmit={async (e) => { e.preventDefault(); const r = await authClient.resetPassword({ newPassword: pw, token }); setState(r.error ? "error" : "ok"); }}>
      <label htmlFor="pw" className="block text-sm text-slate">New password (min. 10 characters)</label>
      <input id="pw" type="password" minLength={10} required className="field" value={pw} onChange={(e) => setPw(e.target.value)} />
      {state === "error" && <p role="alert" className="text-sm text-[#F0A08A]">That link is invalid or has expired.</p>}
      <button className="btn-primary w-full">Update password</button>
    </form>
  );
}
