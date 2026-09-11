"use client";

import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <PageShell title={t("settings.title")}>
      <div className="not-prose max-w-md space-y-5">
        <Card>
          <h3 className="font-semibold text-ink">{t("settings.language")}</h3>
          <div className="mt-3 flex gap-2">
            {SUPPORTED_LANGUAGES.map((option) => (
              <button
                key={option.code}
                type="button"
                onClick={() => setLanguage(option.code)}
                className={cn(
                  "flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors",
                  language === option.code
                    ? "border-brand bg-brand/5 text-brand"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                )}
              >
                {t(`language.${option.labelKey}`)}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-ink">{t("settings.location")}</h3>
          <p className="mt-1 text-sm text-slate-500">
            Manage your saved address and location preference from here.
          </p>
        </Card>

        <Card>
          <h3 className="font-semibold text-ink">
            {t("settings.notifications")}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            SMS and email notification preferences will appear here.
          </p>
        </Card>
      </div>
    </PageShell>
  );
}
