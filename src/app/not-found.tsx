import Link from "next/link";
import { StarField } from "@/components/cosmic/StarField";

export default function NotFound() {
  return (
    <main id="main" className="relative flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <StarField className="absolute inset-0 -z-10 h-full w-full" density={0.6} />
      <p className="eyebrow">404 · Uncharted</p>
      <h1 className="mt-4 text-6xl">This corner of the sky is empty.</h1>
      <p className="mt-4 text-slate">The page you were looking for isn't here.</p>
      <Link href="/" className="btn-primary mt-8">Return home</Link>
    </main>
  );
}
