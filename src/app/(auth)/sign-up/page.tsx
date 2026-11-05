import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { features } from "@/server/env";

export const metadata: Metadata = { title: "Create your account", robots: { index: false } };
export default function Page() {
  return <Suspense><AuthForm mode="sign-up" googleEnabled={features().google} /></Suspense>;
}
