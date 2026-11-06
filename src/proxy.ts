import { NextResponse, type NextRequest } from "next/server";

/**
 * SEO: one canonical host. Requests that reach the app on a platform host (e.g. *.up.railway.app)
 * are permanently redirected to NEXT_PUBLIC_APP_URL. API routes are excluded so health checks,
 * payment webhooks and the internal cron keep working on any host.
 */
const canonical = (() => { try { return new URL(process.env.NEXT_PUBLIC_APP_URL ?? ""); } catch { return null; } })();

export function proxy(req: NextRequest) {
  if (!canonical || canonical.hostname === "localhost") return NextResponse.next();
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (host.endsWith(".up.railway.app") && host !== canonical.hostname) {
    const to = new URL(req.nextUrl.pathname + req.nextUrl.search, canonical.origin);
    return NextResponse.redirect(to, 301);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api/|_next/|favicon|.*\\.(?:png|jpg|jpeg|webp|svg|ico|mp4|woff2?)$).*)"] };
