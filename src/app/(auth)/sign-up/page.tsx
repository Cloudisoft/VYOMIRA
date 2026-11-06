import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { AuthForm } from "@/components/auth/AuthForm";
import { features } from "@/server/env";

export const metadata: Metadata = { title: "Create your account", robots: { index: false } };
// Rendered per request so runtime settings (e.g. Google sign-in keys set in Railway) are honoured;
// the Docker build has no secrets, so a build-time render would always hide the Google button.
export default async function Page() {
  await connection();
  return <Suspense><AuthForm mode="sign-up" googleEnabled={features().google} /></Suspense>;
}
