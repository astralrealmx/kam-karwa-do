"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="container-app grid grid-cols-2 gap-8 py-10 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-xs font-bold text-white">
              KKD
            </span>
            <span className="text-base font-bold text-ink">KAAM KARWA DO</span>
          </div>
          <p className="text-sm text-slate-500">{t("brand.supporting")}</p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-ink">
            {t("footer.company")}
          </h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li><Link href="/about" className="hover:text-ink">About</Link></li>
            <li><Link href="/how-it-works" className="hover:text-ink">How It Works</Link></li>
            <li><Link href="/pricing" className="hover:text-ink">Pricing</Link></li>
            <li><Link href="/contact" className="hover:text-ink">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-ink">
            {t("footer.support")}
          </h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li><Link href="/safety" className="hover:text-ink">Safety</Link></li>
            <li><Link href="/faq" className="hover:text-ink">FAQ</Link></li>
            <li><Link href="/join-as-worker" className="hover:text-ink">Join as Worker</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-ink">
            {t("footer.legal")}
          </h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li><Link href="/terms" className="hover:text-ink">Terms</Link></li>
            <li><Link href="/privacy" className="hover:text-ink">Privacy</Link></li>
            <li><Link href="/cancellation-refund" className="hover:text-ink">Cancellation & Refund</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-100 py-4">
        <p className="container-app text-center text-xs text-slate-400">
          © {new Date().getFullYear()} KAAM KARWA DO. {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
