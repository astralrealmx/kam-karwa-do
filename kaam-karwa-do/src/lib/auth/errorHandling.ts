import "server-only";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

/**
 * Turns an unknown thrown error into a safe JSON response for auth
 * routes (signup, OTP verify), and — critically — actually surfaces the
 * real cause instead of swallowing it:
 *
 * - The FULL error (name, message, Prisma error code if any) is always
 *   logged server-side via console.error, prefixed so it's easy to grep
 *   server logs for. This is where the true root cause is discoverable —
 *   NEVER in the HTTP response.
 * - The client only ever receives a small, safe error `code` plus a
 *   short human-readable `message`. No stack trace, no DATABASE_URL, no
 *   password/hash, no raw Prisma error text is ever sent to the browser,
 *   in development or production.
 *
 * `context` is just a short label (e.g. "signup") so the server log line
 * says which route failed.
 */
export function handleAuthRouteError(err: unknown, context: string): NextResponse {
  // Race-condition backstop: two concurrent signups with the same phone/
  // email can both pass the initial existence check and then collide on
  // the unique constraint at insert time. Treat it the same as the
  // normal "already exists" path rather than a generic failure.
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    console.warn(`[auth:${context}] unique constraint hit (treated as ALREADY_EXISTS)`, {
      target: err.meta?.target,
    });
    return NextResponse.json({ ok: false, error: "ALREADY_EXISTS" }, { status: 409 });
  }

  // Cannot reach the database, or the DB config itself is broken (bad
  // DATABASE_URL, DB not running, etc). This is almost always an
  // environment/configuration problem, not a code bug.
  if (
    err instanceof Prisma.PrismaClientInitializationError ||
    (err instanceof Prisma.PrismaClientKnownRequestError &&
      ["P1000", "P1001", "P1002", "P1003", "P1008", "P1010", "P1017"].includes(err.code))
  ) {
    console.error(
      `[auth:${context}] DATABASE CONNECTION FAILED — check DATABASE_URL and that the ` +
        `database is running and migrated (npx prisma migrate dev). Raw error below:`,
      err
    );
    return NextResponse.json(
      { ok: false, error: "DATABASE_UNAVAILABLE" },
      { status: 503 }
    );
  }

  // Table/column doesn't exist — almost always means migrations were
  // never run against this database.
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    (err.code === "P2021" || err.code === "P2022")
  ) {
    console.error(
      `[auth:${context}] DATABASE SCHEMA MISSING — the expected table/column was not ` +
        `found. Run "npx prisma migrate dev" against this database. Raw error below:`,
      err
    );
    return NextResponse.json(
      { ok: false, error: "DATABASE_NOT_MIGRATED" },
      { status: 503 }
    );
  }

  // A raw Postgres permissions error (e.g. Row Level Security denying
  // the insert on a Supabase-hosted Postgres, or a DB role without
  // GRANT on the table) surfaces from Prisma as an "unknown" request
  // error whose underlying message mentions "permission denied" or
  // "row-level security". Prisma doesn't give this its own error code,
  // so we pattern-match the message here — logged in full server-side,
  // never sent to the client.
  const message = err instanceof Error ? err.message : String(err);
  if (/permission denied|row-level security|RLS/i.test(message)) {
    console.error(
      `[auth:${context}] DATABASE PERMISSION DENIED — if this database is hosted on ` +
        `Supabase (or similar) and Row Level Security is enabled on these tables, the ` +
        `Postgres role in DATABASE_URL must be one that bypasses RLS (Supabase's default ` +
        `"postgres" connection string does; the "anon"/"authenticated" roles do not). ` +
        `Raw error below:`,
      err
    );
    return NextResponse.json(
      { ok: false, error: "DATABASE_PERMISSION_DENIED" },
      { status: 503 }
    );
  }

  // Anything else: log everything we have, tell the client only that
  // something unexpected happened server-side.
  console.error(`[auth:${context}] UNEXPECTED ERROR:`, err);
  return NextResponse.json({ ok: false, error: "UNEXPECTED" }, { status: 500 });
}
