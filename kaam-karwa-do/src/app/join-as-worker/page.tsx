"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function JoinAsWorkerPage() {
  const { t } = useLanguage();

  return (
    <div className="container-app py-12 sm:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">
          {t("joinWorker.headline")}
        </h1>
        <p className="mt-3 text-slate-500">{t("joinWorker.supporting")}</p>
      </div>

      <div className="not-prose mt-8 grid gap-5 sm:grid-cols-3">
        <Card>
          <h3 className="font-semibold text-ink">{t("joinWorker.benefitFlexible")}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {t("joinWorker.benefitFlexibleDesc")}
          </p>
        </Card>
        <Card>
          <h3 className="font-semibold text-ink">{t("joinWorker.benefitLocal")}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {t("joinWorker.benefitLocalDesc")}
          </p>
        </Card>
        <Card>
          <h3 className="font-semibold text-ink">{t("joinWorker.benefitTrusted")}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {t("joinWorker.benefitTrustedDesc")}
          </p>
        </Card>
      </div>

      {/* Deliberately no earnings numbers/guarantees anywhere on this page. */}
      <p className="mt-6 max-w-2xl text-sm text-slate-400">
        {t("joinWorker.disclaimer")}
      </p>

      <Link href="/worker/onboarding">
        <Button size="lg" className="mt-6">
          {t("joinWorker.cta")}
        </Button>
      </Link>
    </div>
  );
}
