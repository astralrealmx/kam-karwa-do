"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const FAQS = [
  {
    q: "How do I post a task?",
    a: "Tap 'Post a Task', describe what you need, set your location, and submit.",
  },
  {
    q: "How are workers verified?",
    a: "Workers complete a profile verification step before they can accept tasks.",
  },
  {
    q: "Is my location shared publicly?",
    a: "No. Only an approximate area is shown publicly. Your exact address is shared only with the assigned worker at the right point in the task.",
  },
];

export function FaqPreview() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-white py-14">
      <div className="container-app max-w-2xl">
        <h2 className="text-center text-2xl font-bold text-ink sm:text-3xl">
          {t("home.faqTitle")}
        </h2>
        <div className="mt-8 divide-y divide-slate-100 rounded-2xl border border-slate-100">
          {FAQS.map((faq, i) => (
            <div key={faq.q}>
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
                aria-expanded={openIndex === i}
              >
                <span className="text-sm font-medium text-ink">{faq.q}</span>
                <span className="text-slate-400">{openIndex === i ? "−" : "+"}</span>
              </button>
              {openIndex === i && (
                <p className="px-5 pb-4 text-sm text-slate-500">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
