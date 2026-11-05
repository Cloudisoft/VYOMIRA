import { ForgotForm } from "@/components/auth/PasswordForms";
export const metadata = { title: "Reset password", robots: { index: false } };
export default function Page() {
  return (<div><p className="eyebrow">Account recovery</p><h1 className="mt-3 text-5xl">Forgot password</h1><ForgotForm /></div>);
}
