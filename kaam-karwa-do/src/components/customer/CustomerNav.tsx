"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/apiFetch";
import type { SessionUser } from "@/lib/auth/session";

const LINKS: { href: string; key: string; icon: string }[] = [
  { href: "/customer/dashboard", key: "dashboard", icon: "📊" },
  { href: "/customer/tasks", key: "myTasks", icon: "🗒️" },
  { href: "/customer/addresses", key: "addresses", icon: "📍" },
  { href: "/customer/notifications", key: "notifications", icon: "🔔" },
  { href: "/customer/profile", key: "profile", icon: "👤" },
  { href: "/customer/settings", key: "settings", icon: "⚙️" },
];

export function CustomerNav({ user }: { user: SessionUser }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-56 flex-shrink-0 md:block">
        <div className="mb-4 rounded-xl bg-white p-4 shadow-card">
          <p className="text-sm font-semibold text-ink">{user.name ?? "Customer"}</p>
          <p className="text-xs text-slate-500">{user.phone}</p>
        </div>
        <nav className="space-y-1 rounded-xl bg-white p-2 shadow-card">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium",
                pathname === link.href
                  ? "bg-brand/10 text-brand"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <span>{link.icon}</span>
              {t(`customer.${link.key}`)}
            </Link>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <span>🚪</span>
            {t("customer.logout")}
          </button>
        </nav>
      </aside>

      {/* Mobile top scroll tabs */}
      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:hidden">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap",
              pathname === link.href
                ? "bg-brand text-white"
                : "bg-white text-slate-600 shadow-card"
            )}
          >
            {link.icon} {t(`customer.${link.key}`)}
          </Link>
        ))}
        <button
          type="button"
          onClick={handleLogout}
          className="flex-shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-card"
        >
          🚪 {t("customer.logout")}
        </button>
      </nav>
    </>
  );
}
