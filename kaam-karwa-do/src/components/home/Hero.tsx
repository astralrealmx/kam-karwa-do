"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";

export function Hero() {
  const { t } = useLanguage();

  return (
    <section className="bg-gradient-to-b from-brand/5 to-transparent">
      <div className="container-app flex flex-col items-center py-14 text-center sm:py-20">
        <h1 className="max-w-2xl text-3xl font-extrabold leading-tight text-ink sm:text-5xl">
          {t("brand.tagline_line1")}
          <br />
          <span className="text-brand">{t("brand.tagline_line2")}</span>
        </h1>
        <p className="mt-4 max-w-md text-base text-slate-500 sm:text-lg">
          {t("brand.supporting")}
        </p>
        <div className="mt-8 flex w-full max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row">
          <Button size="lg" fullWidth>
            {t("home.postTaskCta")}
          </Button>
          <Button size="lg" variant="outline" fullWidth>
            {t("home.joinWorkerCta")}
          </Button>
        </div>
      </div>
    </section>
  );
}
