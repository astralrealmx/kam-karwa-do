"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function AudienceSplit() {
  const { t } = useLanguage();

  return (
    <section className="py-14">
      <div className="container-app grid gap-5 sm:grid-cols-2">
        <Card className="flex flex-col">
          <h3 className="text-xl font-bold text-ink">
            {t("home.forCustomersTitle")}
          </h3>
          <p className="mt-2 flex-1 text-sm text-slate-500">
            Post any local task — from a quick errand to shop assistance —
            and connect with a trusted worker near you.
          </p>
          <Button className="mt-5" variant="secondary">
            {t("home.postTaskCta")}
          </Button>
        </Card>

        <Card className="flex flex-col">
          <h3 className="text-xl font-bold text-ink">
            {t("home.forWorkersTitle")}
          </h3>
          <p className="mt-2 flex-1 text-sm text-slate-500">
            Find local tasks near you, offer your services, and grow your
            income on your own schedule.
          </p>
          <Button className="mt-5" variant="outline">
            {t("home.joinWorkerCta")}
          </Button>
        </Card>
      </div>
    </section>
  );
}
