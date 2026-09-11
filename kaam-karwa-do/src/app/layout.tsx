import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE,
  isSupportedLanguage,
} from "@/lib/i18n";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { SiteNavbar } from "@/components/layout/SiteNavbar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export const metadata: Metadata = {
  title: "KAAM KARWA DO — Koi bhi local kaam hai? Kaam Karwa Do.",
  description:
    "Post a task, find a trusted local worker, and get it done. KAAM KARWA DO is India's local task marketplace.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0F766E",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const cookieLang = cookieStore.get(LANGUAGE_COOKIE)?.value;
  const initialLanguage = isSupportedLanguage(cookieLang)
    ? cookieLang
    : DEFAULT_LANGUAGE;

  return (
    <html lang="en">
      <body className="min-h-screen bg-surface font-sans antialiased">
        <LanguageProvider initialLanguage={initialLanguage}>
          <OnboardingGate>
            <SiteNavbar />
            <main className="pb-16 md:pb-0">{children}</main>
            <SiteFooter />
            <MobileBottomNav />
          </OnboardingGate>
        </LanguageProvider>
      </body>
    </html>
  );
}
