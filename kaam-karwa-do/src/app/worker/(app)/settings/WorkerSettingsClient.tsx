"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/apiFetch";
import { cn } from "@/lib/utils";

interface SettingsForm {
  language: "EN" | "HINGLISH";
  locationPreference: "DEVICE_GPS" | "MANUAL";
  notificationsEnabled: boolean;
  smsNotifications: boolean;
  emailNotifications: boolean;
}

export function WorkerSettingsClient({
  initial,
  phone,
}: {
  initial: SettingsForm;
  phone: string | null;
}) {
  const { t, setLanguage } = useLanguage();
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  async function persist(next: SettingsForm) {
    setForm(next);
    setSaving(true);
    setMessage(null);
    try {
      await apiFetch("/api/worker/settings", {
        method: "PATCH",
        body: JSON.stringify(next),
      });
      if (next.language !== form.language) {
        setLanguage(next.language === "HINGLISH" ? "hinglish" : "en");
      }
      setMessage("Saved.");
    } catch {
      setMessage(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-2xl font-bold text-ink">{t("settings.title")}</h1>

      <Card>
        <h3 className="font-semibold text-ink">{t("settings.language")}</h3>
        <div className="mt-3 flex gap-2">
          {SUPPORTED_LANGUAGES.map((option) => {
            const value = option.code === "hinglish" ? "HINGLISH" : "EN";
            return (
              <button
                key={option.code}
                type="button"
                onClick={() => persist({ ...form, language: value })}
                className={cn(
                  "flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors",
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
      </Card>

      <Card>
        <h3 className="font-semibold text-ink">{t("settings.location")}</h3>
        <div className="mt-3 flex gap-2">
          {(
            [
              { value: "DEVICE_GPS", label: "Use device location" },
              { value: "MANUAL", label: "Choose manually" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => persist({ ...form, locationPreference: option.value })}
              className={cn(
                "flex-1 rounded-xl border-2 px-3 py-3 text-sm font-medium transition-colors",
                form.locationPreference === option.value
                  ? "border-brand bg-brand/5 text-brand"
                  : "border-slate-200 text-slate-600"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-ink">{t("settings.notifications")}</h3>
        <div className="mt-3 space-y-3">
          {(
            [
              { key: "notificationsEnabled", label: "All notifications" },
              { key: "smsNotifications", label: "SMS notifications" },
              { key: "emailNotifications", label: "Email notifications" },
            ] as const
          ).map((toggle) => (
            <label key={toggle.key} className="flex items-center justify-between">
              <span className="text-sm text-slate-600">{toggle.label}</span>
              <input
                type="checkbox"
                checked={form[toggle.key]}
                onChange={(e) => persist({ ...form, [toggle.key]: e.target.checked })}
                className="h-5 w-5 accent-brand"
              />
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-ink">Account</h3>
        <p className="mt-1 text-sm text-slate-500">Mobile: {phone}</p>
        <Button
          variant="outline"
          className="mt-4 border-red-300 text-red-600 hover:bg-red-50"
          onClick={handleLogout}
          disabled={loggingOut}
          fullWidth
        >
          {loggingOut ? "..." : t("customer.logout")}
        </Button>
      </Card>

      {saving && <p className="text-xs text-slate-400">Saving...</p>}
      {message && !saving && <p className="text-xs text-green-600">{message}</p>}
    </div>
  );
}
