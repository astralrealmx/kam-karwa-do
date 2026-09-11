"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";

const STEPS_EN = [
  { title: "Post your task", desc: "Describe what you need done, when, and where." },
  { title: "Get matched", desc: "Trusted local workers near you respond." },
  { title: "Get it done", desc: "Choose a worker, get the task completed, and confirm." },
];

const STEPS_HI = [
  { title: "Apna task post karo", desc: "Batao kya karwana hai, kab aur kahan." },
  { title: "Worker se judo", desc: "Aapke aas-paas ke trusted workers respond karenge." },
  { title: "Kaam karwao", desc: "Worker choose karo, kaam complete karwao, aur confirm karo." },
];

export function HowItWorks() {
  const { t, language } = useLanguage();
  const steps = language === "hinglish" ? STEPS_HI : STEPS_EN;

  return (
    <section id="how-it-works" className="py-14">
      <div className="container-app">
        <h2 className="text-center text-2xl font-bold text-ink sm:text-3xl">
          {t("home.howItWorksTitle")}
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {steps.map((step, i) => (
            <Card key={step.title}>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                {i + 1}
              </div>
              <h3 className="text-base font-semibold text-ink">{step.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{step.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
