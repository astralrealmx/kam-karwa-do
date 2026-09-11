"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/apiFetch";

export default function SignupPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    acceptedTerms: false,
    acceptedPrivacy: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError(null);

    if (!form.acceptedTerms || !form.acceptedPrivacy) {
      setFormError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiFetch<{
        ok: true;
        phone: string;
        providerIsDev: boolean;
        devCode?: string;
      }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(form),
      });

      const params = new URLSearchParams({
        phone: result.phone,
        purpose: "SIGNUP",
      });
      if (result.devCode) params.set("devCode", result.devCode);

      router.push(`/verify?${params.toString()}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setFormError("An account with this mobile number or email already exists.");
        } else if (err.payload && typeof err.payload === "object" && "issues" in err.payload) {
          setFormError("Please check the highlighted fields.");
        } else if (err.status === 503 && err.message === "DATABASE_UNAVAILABLE") {
          setFormError(
            "We can't reach the database right now. Please try again in a moment."
          );
        } else if (err.status === 503 && err.message === "DATABASE_NOT_MIGRATED") {
          setFormError(
            "The app isn't fully set up yet (database tables are missing). Please contact support."
          );
        } else if (err.status === 503 && err.message === "DATABASE_PERMISSION_DENIED") {
          setFormError(
            "The app can't write to the database right now due to a permissions issue. Please contact support."
          );
        } else {
          setFormError(t("auth.genericError"));
        }
      } else {
        setFormError(t("auth.genericError"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-ink">{t("auth.signupTitle")}</h1>
          <p className="mt-2 text-sm text-slate-500">{t("auth.signupSubtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t("auth.name")}
            name="name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            error={errors.name}
            autoComplete="name"
            required
          />
          <Input
            label={t("auth.mobile")}
            name="phone"
            type="tel"
            inputMode="numeric"
            placeholder="98765 43210"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            error={errors.phone}
            autoComplete="tel"
            required
          />
          <Input
            label={t("auth.email")}
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label={t("auth.password")}
            name="password"
            type="password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            error={errors.password}
            autoComplete="new-password"
            required
          />

          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={form.acceptedTerms}
              onChange={(e) => update("acceptedTerms", e.target.checked)}
            />
            <span>
              {t("auth.acceptTerms")} (
              <Link href="/terms" className="text-brand">
                Terms
              </Link>
              )
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={form.acceptedPrivacy}
              onChange={(e) => update("acceptedPrivacy", e.target.checked)}
            />
            <span>
              {t("auth.acceptPrivacy")} (
              <Link href="/privacy" className="text-brand">
                Privacy
              </Link>
              )
            </span>
          </label>

          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}

          <Button type="submit" fullWidth size="lg" disabled={submitting}>
            {submitting ? "..." : t("auth.signupCta")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {t("auth.haveAccount")}{" "}
          <Link href="/login" className="font-semibold text-brand">
            {t("auth.loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
