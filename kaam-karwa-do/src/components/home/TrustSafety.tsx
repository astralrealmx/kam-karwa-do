"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";

const POINTS = [
  {
    title: "Verified profiles",
    desc: "Workers go through a profile verification process before appearing in search.",
  },
  {
    title: "Privacy-first location",
    desc: "Your exact address is only shared with a worker once a task is confirmed.",
  },
  {
    title: "Clear task lifecycle",
    desc: "Every task has a transparent status from posting to completion.",
  },
];

export function TrustSafety() {
  const { t } = useLanguage();

  return (
    <section className="py-14">
      <div className="container-app">
        <h2 className="text-center text-2xl font-bold text-ink sm:text-3xl">
          {t("home.trustSafetyTitle")}
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {POINTS.map((point) => (
            <Card key={point.title}>
              <h3 className="text-base font-semibold text-ink">{point.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{point.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
