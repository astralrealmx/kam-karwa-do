import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireWorkerApi } from "@/lib/auth/session";
import { isVerificationProviderConfigured } from "@/lib/worker/verificationProvider";

// Deliberately GET-only. There is no PATCH/POST handler in this file —
// a worker's verification status can never be changed by the worker
// themselves through this or any other route. It can only move forward
// via a real KYC provider integration or admin tooling, neither of
// which exists yet.
export async function GET() {
  const auth = await requireWorkerApi();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: user.id },
    include: { verification: true },
  });

  if (!profile) {
    return NextResponse.json({ ok: false, error: "NOT_ONBOARDED" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    verification: {
      status: profile.verification?.status ?? "PENDING",
      submittedAt: profile.verification?.submittedAt ?? null,
      reviewedAt: profile.verification?.reviewedAt ?? null,
      rejectionReason: profile.verification?.rejectionReason ?? null,
    },
    providerConfigured: isVerificationProviderConfigured(),
  });
}
