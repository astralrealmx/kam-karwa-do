"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { CATEGORIES } from "@/lib/categories";

export function PopularCategories() {
  const { t, language } = useLanguage();

  return (
    <section className="bg-white py-14">
      <div className="container-app">
        <h2 className="text-center text-2xl font-bold text-ink sm:text-3xl">
          {t("home.popularCategoriesTitle")}
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={`/categories#${category.slug}`}
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-surface p-5 text-center transition-colors hover:border-brand/40 hover:bg-brand/5"
            >
              <span className="text-3xl">{category.icon}</span>
              <span className="text-sm font-medium text-ink">
                {language === "hinglish" ? category.nameHinglish : category.nameEn}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
