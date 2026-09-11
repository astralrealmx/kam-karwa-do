"use client";

import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function LanguageStep({ onContinue }: { onContinue: () => void }) {
  const { language, setLanguage, t } = useLanguage();
  const [selected, setSelected] = useState(language);

  function handleContinue() {
    setLanguage(selected);
    onContinue();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand/5 to-surface px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-2xl font-bold text-white">
            KKD
          </div>
          <h1 className="text-2xl font-bold text-ink">{t("language.chooseTitle")}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {t("language.chooseSubtitle")}
          </p>
        </div>

        <div className="space-y-3">
          {SUPPORTED_LANGUAGES.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => setSelected(option.code)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border-2 bg-white px-5 py-4 text-left transition-colors",
                selected === option.code
                  ? "border-brand bg-brand/5"
                  : "border-slate-200 hover:border-slate-300"
              )}
              aria-pressed={selected === option.code}
            >
              <span className="text-base font-semibold text-ink">
                {t(`language.${option.labelKey}`)}
              </span>
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border-2",
                  selected === option.code
                    ? "border-brand bg-brand"
                    : "border-slate-300"
                )}
              >
                {selected === option.code && (
                  <span className="h-2 w-2 rounded-full bg-white" />
                )}
              </span>
            </button>
          ))}
        </div>

        <Button
          fullWidth
          size="lg"
          className="mt-8"
          onClick={handleContinue}
        >
          {t("language.continue")}
        </Button>
      </div>
    </div>
  );
}
