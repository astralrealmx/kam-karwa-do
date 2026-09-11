"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/apiFetch";

function VerifyForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useSearchParams();

  const phone = params.get("phone") ?? "";
  const purpose = params.get("purpose") === "LOGIN" ? "LOGIN" : "SIGNUP";
  const initialDevCode = params.get("devCode");

  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState(initialDevCode);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!phone) {
      router.replace("/signup");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await apiFetch<{ ok: true; role: string }>(
        "/api/auth/otp/verify",
        {
          method: "POST",
          body: JSON.stringify({ phone, purpose, code }),
        }
      );

      if (result.role === "CUSTOMER") {
        router.push("/customer/dashboard");
      } else if (result.role === "WORKER") {
        router.push("/worker/onboarding");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        const messages: Record<string, string> = {
          NOT_FOUND: "No pending code found. Please request a new one.",
          EXPIRED: "This code has expired. Please request a new one.",
          TOO_MANY_ATTEMPTS: "Too many attempts. Please request a new code.",
          INCORRECT: "That code is incorrect. Please try again.",
          DATABASE_UNAVAILABLE:
            "We can't reach the database right now. Please try again in a moment.",
          DATABASE_NOT_MIGRATED:
            "The app isn't fully set up yet (database tables are missing). Please contact support.",
          DATABASE_PERMISSION_DENIED:
            "The app can't write to the database right now due to a permissions issue. Please contact support.",
        };
        setError(
          (typeof err.payload === "object" &&
            err.payload &&
            "error" in err.payload &&
            messages[(err.payload as { error: string }).error]) ||
            messages[err.message] ||
            t("auth.genericError")
        );
      } else {
        setError(t("auth.genericError"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setResendMessage(null);
    setError(null);
    try {
      const result = await apiFetch<{
        ok: true;
        providerIsDev: boolean;
        devCode?: string;
      }>("/api/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({ phone, purpose }),
      });
      setDevCode(result.devCode ?? null);
      setResendMessage("A new code has been sent.");
    } catch {
      setError(t("auth.genericError"));
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 text-4xl">📱</div>
          <h1 className="text-2xl font-bold text-ink">{t("auth.verifyTitle")}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {t("auth.verifySubtitle")} <strong>{phone}</strong>
          </p>
        </div>

        {devCode && (
          <div className="mb-4 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 px-4 py-3 text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
              {t("auth.devOtpBanner")}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-[0.3em] text-amber-800">
              {devCode}
            </p>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <Input
            label="6-digit code"
            name="code"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="text-center text-2xl tracking-[0.4em]"
            autoFocus
            required
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {resendMessage && !error && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              {resendMessage}
            </p>
          )}

          <Button type="submit" fullWidth size="lg" disabled={submitting || code.length !== 6}>
            {submitting ? "..." : t("auth.verifyCta")}
          </Button>

          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? "..." : t("auth.resendOtp")}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyForm />
    </Suspense>
  );
}
