"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";

export function FinalCta() {
  const { t } = useLanguage();

  return (
    <section className="bg-brand py-14">
      <div className="container-app flex flex-col items-center text-center">
        <h2 className="max-w-lg text-2xl font-bold text-white sm:text-3xl">
          {t("home.finalCtaTitle")}
        </h2>
        <p className="mt-2 max-w-md text-sm text-white/80">
          {t("home.finalCtaSubtitle")}
        </p>
        <div className="mt-6 flex w-full max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row">
          <Button size="lg" variant="secondary" fullWidth>
            {t("home.postTaskCta")}
          </Button>
          <Button
            size="lg"
            fullWidth
            className="border border-white bg-transparent text-white hover:bg-white/10"
          >
            {t("home.joinWorkerCta")}
          </Button>
        </div>
      </div>
    </section>
  );
}
