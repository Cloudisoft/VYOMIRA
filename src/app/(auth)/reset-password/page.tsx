import { Suspense } from "react";
import { ResetForm } from "@/components/auth/PasswordForms";
export const metadata = { title: "Choose a new password", robots: { index: false } };
export default function Page() {
  return (<div><p className="eyebrow">Account recovery</p><h1 className="mt-3 text-5xl">New password</h1><Suspense><ResetForm /></Suspense></div>);
}
