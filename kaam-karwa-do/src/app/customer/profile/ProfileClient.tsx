"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/apiFetch";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ProfileForm {
  name: string;
  phone: string;
  email: string;
  avatarUrl: string;
  language: "EN" | "HINGLISH";
}

export function ProfileClient({ initial }: { initial: ProfileForm }) {
  const { t, setLanguage } = useLanguage();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await apiFetch("/api/customer/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          avatarUrl: form.avatarUrl,
          language: form.language,
        }),
      });
      setLanguage(form.language === "HINGLISH" ? "hinglish" : "en");
      setMessage("Profile updated.");
    } catch {
      setError(t("auth.genericError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-2xl font-bold text-ink">{t("customer.profile")}</h1>

      <Card>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-brand/10 text-2xl font-bold text-brand">
              {form.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                (form.name?.[0] ?? "?").toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <Input
                label="Profile photo URL"
                name="avatarUrl"
                placeholder="https://..."
                value={form.avatarUrl}
                onChange={(e) => update("avatarUrl", e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-400">
                Direct file upload will be added once storage is configured.
              </p>
            </div>
          </div>

          <Input
            label={t("auth.name")}
            name="name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />

          <Input
            label={t("auth.mobile")}
            name="phone"
            value={form.phone}
            disabled
            className="bg-slate-50 text-slate-500"
          />
          <p className="-mt-3 text-xs text-slate-400">
            Mobile number is verified and can&apos;t be changed here yet.
          </p>

          <Input
            label={t("auth.email")}
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              {t("settings.language")}
            </label>
            <div className="flex gap-2">
              {SUPPORTED_LANGUAGES.map((option) => {
                const value = option.code === "hinglish" ? "HINGLISH" : "EN";
                return (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => update("language", value)}
                    className={cn(
                      "flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-colors",
                      form.language === value
                        ? "border-brand bg-brand/5 text-brand"
                        : "border-slate-200 text-slate-600"
                    )}
                  >
                    {t(`language.${option.labelKey}`)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              {t("settings.location")}
            </label>
            <Link
              href="/customer/addresses"
              className="block rounded-xl border border-slate-200 px-4 py-3 text-sm text-brand"
            >
              Manage saved addresses →
            </Link>
          </div>

          {message && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              {message}
            </p>
          )}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? "..." : t("customer.save")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
