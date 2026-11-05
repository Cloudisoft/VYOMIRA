import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireUser() {
  const s = await getSession();
  if (!s) redirect("/sign-in");
  return s.user as typeof s.user & { role: string };
}

export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "ADMIN") redirect("/dashboard");
  return u;
}

/** For route handlers: returns the user or null (caller returns 401). */
export async function apiUser() {
  const s = await getSession();
  return (s?.user as (NonNullable<typeof s>["user"] & { role: string }) | undefined) ?? null;
}
