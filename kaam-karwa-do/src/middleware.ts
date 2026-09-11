import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * This middleware runs on the Edge runtime and therefore CANNOT query
 * Postgres via Prisma. It only does a cheap, coarse check: is there a
 * session cookie at all? If not, bounce to /login immediately so we don't
 * even render a protected page's shell for a clearly logged-out visitor.
 *
 * This is NOT the security boundary. The real, authoritative check —
 * validating the session against the database and checking role — happens
 * in `requireCustomer()` / `requireWorker()` (src/lib/auth/session.ts),
 * which every /customer/* and /worker/(app)/* server component and every
 * /api/customer/* and /api/worker/* route handler calls directly. A
 * stolen or forged cookie value that merely *exists* will still be
 * rejected there. Frontend/edge state is never trusted for the actual
 * authorization decision.
 *
 * /worker/onboarding is deliberately EXCLUDED from this coarse gate: an
 * anonymous visitor must be able to reach it to create a worker account
 * in the first place (step 1 of onboarding, before any session exists).
 * The page itself branches on session state server-side.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/worker/onboarding")) {
    return NextResponse.next();
  }

  const hasSession = req.cookies.has(SESSION_COOKIE);

  if (!hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/customer/:path*", "/worker/:path*"],
};
