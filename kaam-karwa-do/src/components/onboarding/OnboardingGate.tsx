"use client";

import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { LANGUAGE_ONBOARDED_COOKIE } from "@/lib/i18n";
import { LanguageStep } from "./LanguageStep";
import { LocationStep } from "./LocationStep";

type Step = "checking" | "language" | "location" | "done";

/**
 * Wraps the whole app. On the very first open (no onboarding cookie yet),
 * shows the mandatory language selection screen, then the location
 * permission screen, before revealing the rest of the app.
 *
 * On subsequent visits, the cookie short-circuits straight to "done" so
 * returning users never see onboarding again (they can always change
 * language/location from Settings).
 */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState<Step>("checking");

  useEffect(() => {
    const onboarded = Cookies.get(LANGUAGE_ONBOARDED_COOKIE);
    setStep(onboarded === "true" ? "done" : "language");
  }, []);

  function completeOnboarding() {
    Cookies.set(LANGUAGE_ONBOARDED_COOKIE, "true", {
      expires: 365,
      sameSite: "lax",
    });
    setStep("done");
  }

  if (step === "checking") {
    // Avoid a flash of onboarding UI while we read the cookie client-side.
    return <div className="min-h-screen bg-surface" />;
  }

  if (step === "language") {
    return <LanguageStep onContinue={() => setStep("location")} />;
  }

  if (step === "location") {
    return <LocationStep onFinish={completeOnboarding} />;
  }

  return <>{children}</>;
}
