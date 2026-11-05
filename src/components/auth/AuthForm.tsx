"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { signIn, signUp } from "@/lib/auth-client";

const signInSchema = z.object({ email: z.string().email("Enter a valid email"), password: z.string().min(1, "Enter your password") });
const signUpSchema = z.object({ name: z.string().trim().min(1, "Enter your name").max(80), email: z.string().email("Enter a valid email"), password: z.string().min(10, "At least 10 characters").max(128) });

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

export function AuthForm({ mode, googleEnabled }: { mode: "sign-in" | "sign-up"; googleEnabled: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get("next") ?? "/dashboard";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const isUp = mode === "sign-up";
  const form = useForm<z.infer<typeof signUpSchema>>({ resolver: zodResolver((isUp ? signUpSchema : signInSchema) as typeof signUpSchema), defaultValues: { name: "", email: "", password: "" } });
  const { register, handleSubmit, formState } = form;

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    const res = isUp ? await signUp.email({ name: v.name, email: v.email, password: v.password }) : await signIn.email({ email: v.email, password: v.password });
    if (res.error) {
      setError(res.error.message ?? "Something went wrong. Please try again.");
      return;
    }
    router.push(next);
    router.refresh();
  });

  return (
    <div>
      <p className="eyebrow">{isUp ? "Begin your journey" : "Welcome back"}</p>
      <h1 className="mt-3 text-5xl text-moon">{isUp ? "Create your account" : "Sign in"}</h1>
      <p className="mt-3 text-slate">{isUp ? "Save your Kundli, talk with AURA and keep your readings in one private place." : "Return to your universe."}</p>

      {googleEnabled && (
        <>
          <button type="button" onClick={() => signIn.social({ provider: "google", callbackURL: next })} className="btn-ghost mt-8 w-full">
            <GoogleIcon /> Continue with Google
          </button>
          <div className="my-6 flex items-center gap-4 text-xs tracking-widest text-slate/70"><span className="h-px flex-1 bg-moon/10" />OR<span className="h-px flex-1 bg-moon/10" /></div>
        </>
      )}

      <form onSubmit={onSubmit} noValidate className={googleEnabled ? "space-y-4" : "mt-8 space-y-4"}>
        {isUp && (
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm text-slate">Name</label>
            <input id="name" autoComplete="name" className="field" {...register("name")} aria-invalid={!!formState.errors.name} />
            {formState.errors.name && <p className="mt-1 text-xs text-[#F0A08A]">{formState.errors.name.message}</p>}
          </div>
        )}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm text-slate">Email</label>
          <input id="email" type="email" autoComplete="email" className="field" {...register("email")} aria-invalid={!!formState.errors.email} />
          {formState.errors.email && <p className="mt-1 text-xs text-[#F0A08A]">{formState.errors.email.message}</p>}
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm text-slate">Password</label>
            {!isUp && <Link href="/forgot-password" className="text-xs text-amethyst hover:underline">Forgot password?</Link>}
          </div>
          <input id="password" type="password" autoComplete={isUp ? "new-password" : "current-password"} className="field" {...register("password")} aria-invalid={!!formState.errors.password} />
          {formState.errors.password && <p className="mt-1 text-xs text-[#F0A08A]">{formState.errors.password.message}</p>}
        </div>
        {error && <p role="alert" className="rounded-xl border border-[#E07A5F]/40 bg-[#E07A5F]/10 px-4 py-3 text-sm text-[#F0A08A]">{error}</p>}
        <button type="submit" disabled={formState.isSubmitting} className="btn-primary w-full">
          {formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} {isUp ? "Create account" : "Sign in"}
        </button>
        {isUp && <p className="text-xs leading-relaxed text-slate/80">By creating an account you agree to our <Link className="underline" href="/legal/terms">Terms</Link> and acknowledge our <Link className="underline" href="/legal/privacy">Privacy Notice</Link>.</p>}
      </form>
      <p className="mt-8 text-sm text-slate">
        {isUp ? "Already have an account? " : "New to VYOMIRA? "}
        <Link href={`${isUp ? "/sign-in" : "/sign-up"}${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-gold hover:underline">{isUp ? "Sign in" : "Create an account"}</Link>
      </p>
    </div>
  );
}
