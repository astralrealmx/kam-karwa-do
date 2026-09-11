import "server-only";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";
import { SESSION_COOKIE } from "./constants";

export { SESSION_COOKIE };
const SESSION_TTL_DAYS = 30;

export interface SessionUser {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  role: Role;
  language: "EN" | "HINGLISH";
  avatarUrl: string | null;
  phoneVerifiedAt: Date | null;
}

/**
 * Creates a brand-new session for a user: a random opaque token stored in
 * the database (Session table) and mirrored into an httpOnly cookie.
 * The cookie itself carries no trustable claims — every read re-validates
 * against the database record.
 */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { token, userId, expiresAt },
  });

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function destroySession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  cookies().delete(SESSION_COOKIE);
}

/**
 * Reads the current session cookie, validates it against the database
 * (checks it exists AND hasn't expired), and returns the associated user.
 * Returns null if there is no valid session — callers decide what to do
 * (redirect, 401, etc.). This is the single source of truth for "who is
 * logged in" — nothing here trusts client-supplied role/user data.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      // Expired — clean it up.
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    }
    return null;
  }

  const { user } = session;
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    language: user.language,
    avatarUrl: user.avatarUrl,
    phoneVerifiedAt: user.phoneVerifiedAt,
  };
}

/**
 * Server Component guard: requires a logged-in user with the CUSTOMER
 * role. Redirects to /login (no session) or / (wrong role) otherwise.
 *
 * IMPORTANT: this uses next/navigation's redirect(), which is only
 * appropriate for Server Components/Server Actions/pages. Route Handlers
 * (API routes returning JSON) must use `requireCustomerApi()` below
 * instead — a redirect response from an API route gets silently
 * followed by `fetch`, which would return an HTML page where JSON was
 * expected instead of a clean 401/403.
 *
 * This is the enforcement point — role checks happen here against the
 * database-backed session, not against anything the client sent.
 */
export async function requireCustomer(): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "CUSTOMER") {
    redirect("/");
  }

  return user;
}

/**
 * Route Handler (API) guard: requires a logged-in CUSTOMER, same DB-backed
 * check as `requireCustomer()`, but returns a plain result instead of
 * throwing/redirecting — so API routes can return a clean JSON 401/403
 * instead of an HTTP redirect that a JSON-consuming client can't handle.
 *
 * Usage:
 *   const auth = await requireCustomerApi();
 *   if ("response" in auth) return auth.response;
 *   const user = auth.user;
 */
export async function requireCustomerApi(): Promise<
  { user: SessionUser } | { response: NextResponse }
> {
  const user = await getSessionUser();

  if (!user) {
    return {
      response: NextResponse.json(
        { ok: false, error: "UNAUTHENTICATED" },
        { status: 401 }
      ),
    };
  }

  if (user.role !== "CUSTOMER") {
    return {
      response: NextResponse.json(
        { ok: false, error: "FORBIDDEN" },
        { status: 403 }
      ),
    };
  }

  return { user };
}

/**
 * Server Component guard: requires a logged-in user with the WORKER
 * role. Mirrors `requireCustomer()` exactly, for the worker side of the
 * app. Does NOT check onboarding-completion — that's a separate,
 * page-level concern handled in src/app/worker/(app)/layout.tsx so that
 * /worker/onboarding itself (which a worker with an incomplete profile
 * must be able to reach) isn't caught by it.
 */
export async function requireWorker(): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "WORKER") {
    redirect("/");
  }

  return user;
}

/**
 * Route Handler (API) guard for the worker role — same shape and same
 * reasoning as `requireCustomerApi()`.
 */
export async function requireWorkerApi(): Promise<
  { user: SessionUser } | { response: NextResponse }
> {
  const user = await getSessionUser();

  if (!user) {
    return {
      response: NextResponse.json(
        { ok: false, error: "UNAUTHENTICATED" },
        { status: 401 }
      ),
    };
  }

  if (user.role !== "WORKER") {
    return {
      response: NextResponse.json(
        { ok: false, error: "FORBIDDEN" },
        { status: 403 }
      ),
    };
  }

  return { user };
}
