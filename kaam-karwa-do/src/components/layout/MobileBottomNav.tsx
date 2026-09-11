"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const ITEMS: { href: string; key: string; icon: string }[] = [
  { href: "/", key: "home", icon: "🏠" },
  { href: "/categories", key: "categories", icon: "🗂️" },
  { href: "/post-task", key: "postTask", icon: "➕" },
  { href: "/join-as-worker", key: "joinAsWorker", icon: "🧰" },
  { href: "/login", key: "login", icon: "👤" },
];

export function MobileBottomNav() {
  const { t } = useLanguage();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white md:hidden">
      <div className="grid grid-cols-5">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-slate-600 active:bg-slate-50"
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="truncate px-1">{t(`nav.${item.key}`)}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
