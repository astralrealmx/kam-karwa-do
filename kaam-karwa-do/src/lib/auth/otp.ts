import "server-only";
import { createHash, randomInt } from "crypto";
import { prisma } from "@/lib/db";
import { getOtpProvider } from "./otpProvider";
import type { OtpPurpose } from "@prisma/client";

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 30;

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

function generateCode(): string {
  // 6-digit numeric code, zero-padded.
  return String(randomInt(0, 1_000_000)).padStart(OTP_LENGTH, "0");
}

export interface RequestOtpResult {
  ok: boolean;
  error?: "COOLDOWN";
  /** Only ever populated when the active provider is the DEV provider —
   *  used to show the code directly in the /verify UI so the flow is
   *  testable without a real SMS gateway. Never populated for a real
   *  provider. */
  devCode?: string;
  providerIsDev: boolean;
}

export async function requestOtp(
  phone: string,
  purpose: OtpPurpose,
  userId?: string
): Promise<RequestOtpResult> {
  const provider = getOtpProvider();

  const recent = await prisma.otpCode.findFirst({
    where: { phone, purpose },
    orderBy: { createdAt: "desc" },
  });

  if (
    recent &&
    Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_SECONDS * 1000
  ) {
    return { ok: false, error: "COOLDOWN", providerIsDev: provider.isDev };
  }

  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: { phone, purpose, codeHash, expiresAt, userId },
  });

  await provider.sendOtp(phone, code);

  return {
    ok: true,
    providerIsDev: provider.isDev,
    devCode: provider.isDev ? code : undefined,
  };
}

export type VerifyOtpResult =
  | { ok: true }
  | { ok: false; error: "NOT_FOUND" | "EXPIRED" | "TOO_MANY_ATTEMPTS" | "INCORRECT" };

export async function verifyOtp(
  phone: string,
  purpose: OtpPurpose,
  code: string
): Promise<VerifyOtpResult> {
  const record = await prisma.otpCode.findFirst({
    where: { phone, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return { ok: false, error: "NOT_FOUND" };

  if (record.expiresAt < new Date()) {
    return { ok: false, error: "EXPIRED" };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "TOO_MANY_ATTEMPTS" };
  }

  const matches = record.codeHash === hashCode(code);

  if (!matches) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, error: "INCORRECT" };
  }

  await prisma.otpCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });

  return { ok: true };
}
