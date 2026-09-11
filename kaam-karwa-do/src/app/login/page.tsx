"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/apiFetch";
import { cn } from "@/lib/utils";

type Mode = "password" | "otp";

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("password");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await apiFetch<{ ok: true; role: string }>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ phone, password }),
        }
      );

      router.push(
        result.role === "CUSTOMER"
          ? "/customer/dashboard"
          : result.role === "WORKER"
            ? "/worker/onboarding"
            : "/"
      );
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        // Phone not verified yet — send them to finish verification.
        const params = new URLSearchParams({ phone, purpose: "LOGIN" });
        try {
          const otpResult = await apiFetch<{ devCode?: string }>(
            "/api/auth/otp/request",
            {
              method: "POST",
              body: JSON.stringify({ phone, purpose: "LOGIN" }),
            }
          );
          if (otpResult.devCode) params.set("devCode", otpResult.devCode);
        } catch {
          // ignore — verify page has its own resend
        }
        router.push(`/verify?${params.toString()}`);
        return;
      }
      setError(t("auth.invalidCredentials"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequestOtpLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await apiFetch<{ ok: true; devCode?: string }>(
        "/api/auth/otp/request",
        {
          method: "POST",
          body: JSON.stringify({ phone, purpose: "LOGIN" }),
        }
      );

      const params = new URLSearchParams({ phone, purpose: "LOGIN" });
      if (result.devCode) params.set("devCode", result.devCode);
      router.push(`/verify?${params.toString()}`);
    } catch {
      setError(t("auth.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-ink">{t("auth.loginTitle")}</h1>
          <p className="mt-2 text-sm text-slate-500">{t("auth.loginSubtitle")}</p>
        </div>

        <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
          {(["password", "otp"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
                mode === m ? "bg-white text-ink shadow-sm" : "text-slate-500"
              )}
            >
              {m === "password" ? t("auth.loginWithPassword") : t("auth.loginWithOtp")}
            </button>
          ))}
        </div>

        <form
          onSubmit={mode === "password" ? handlePasswordLogin : handleRequestOtpLogin}
          className="space-y-4"
        >
          <Input
            label={t("auth.mobile")}
            name="phone"
            type="tel"
            inputMode="numeric"
            placeholder="98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            required
          />

          {mode === "password" && (
            <Input
              label={t("auth.password")}
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" fullWidth size="lg" disabled={submitting}>
            {submitting ? "..." : mode === "password" ? t("auth.loginCta") : t("auth.sendOtp")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {t("auth.noAccount")}{" "}
          <Link href="/signup" className="font-semibold text-brand">
            {t("auth.signupLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
