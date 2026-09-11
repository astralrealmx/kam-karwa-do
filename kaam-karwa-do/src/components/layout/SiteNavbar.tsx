"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/apiFetch";

const NAV_LINKS: { href: string; key: string }[] = [
  { href: "/how-it-works", key: "howItWorks" },
  { href: "/categories", key: "categories" },
  { href: "/join-as-worker", key: "joinAsWorker" },
  { href: "/safety", key: "safety" },
  { href: "/faq", key: "faq" },
];

export function SiteNavbar() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  // Best-effort client-side session check purely for nav display (show
  // "Dashboard" vs "Login"). This is NOT an authorization check — every
  // /customer/* and /worker/* page and API route independently
  // re-validates the session server-side via requireCustomer()/
  // requireWorker(), so a stale/absent value here can never grant access
  // to anything.
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ user: { role: string } | null }>("/api/auth/me")
      .then((res) => setRole(res.user?.role ?? null))
      .catch(() => setRole(null));
  }, []);

  const accountHref =
    role === "CUSTOMER" ? "/customer/dashboard" : role === "WORKER" ? "/worker/dashboard" : "/login";
  const accountLabel =
    role === "CUSTOMER"
      ? t("customer.dashboard")
      : role === "WORKER"
        ? t("worker.dashboard")
        : t("nav.login");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
            KKD
          </span>
          <span className="text-lg font-bold tracking-tight text-ink">
            KAAM KARWA DO
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 hover:text-ink"
            >
              {t(`nav.${link.key}`)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href={accountHref}
            className="text-sm font-medium text-slate-600 hover:text-ink"
          >
            {accountLabel}
          </Link>
          <Link href="/post-task">
            <Button size="sm" variant="secondary">
              {t("nav.postTask")}
            </Button>
          </Link>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span className="text-2xl leading-none">{open ? "×" : "≡"}</span>
        </button>
      </div>

      {open && (
        <nav className="border-t border-slate-100 bg-white md:hidden">
          <div className="container-app flex flex-col py-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-3 text-sm font-medium text-slate-700"
                onClick={() => setOpen(false)}
              >
                {t(`nav.${link.key}`)}
              </Link>
            ))}
            <Link
              href={accountHref}
              className="py-3 text-sm font-medium text-slate-700"
              onClick={() => setOpen(false)}
            >
              {accountLabel}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
