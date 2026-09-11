"use client";

import { useState } from "react";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LOCATION_PREF_COOKIE } from "@/lib/i18n";
import { getCurrentPosition } from "@/lib/location/geolocation";
import { reverseGeocode } from "@/lib/location/geocode";
import { ResolvedAddress } from "@/lib/location/types";
import { ManualLocationSearch } from "./ManualLocationSearch";

type Mode = "choose" | "detecting" | "manual" | "confirm" | "error";

export function LocationStep({ onFinish }: { onFinish: () => void }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>("choose");
  const [address, setAddress] = useState<ResolvedAddress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleAllowLocation() {
    setMode("detecting");
    setErrorMessage(null);
    try {
      const coords = await getCurrentPosition();
      const resolved = await reverseGeocode(coords);
      setAddress(resolved);
      setMode("confirm");
    } catch (err) {
      // Common failure in this environment: no Google Maps API key configured yet.
      const message =
        err instanceof Error && err.message === "GOOGLE_MAPS_API_KEY_MISSING"
          ? "Google Maps is not configured yet. Please choose your location manually."
          : "We couldn't access your location. Please allow permission or choose manually.";
      setErrorMessage(message);
      setMode("error");
    }
  }

  function handleSkip() {
    Cookies.set(LOCATION_PREF_COOKIE, "SKIPPED", { expires: 365, sameSite: "lax" });
    onFinish();
  }

  function handleConfirm(source: "DEVICE_GPS" | "MANUAL") {
    Cookies.set(LOCATION_PREF_COOKIE, source, { expires: 365, sameSite: "lax" });
    onFinish();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand/5 to-surface px-6 py-10">
      <div className="w-full max-w-sm">
        {mode === "choose" || mode === "detecting" || mode === "error" ? (
          <>
            <div className="mb-8 text-center">
              <div className="mb-4 text-4xl">📍</div>
              <h1 className="text-2xl font-bold text-ink">{t("location.title")}</h1>
              <p className="mt-2 text-sm text-slate-500">
                {t("location.description")}
              </p>
            </div>

            {mode === "error" && errorMessage && (
              <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {errorMessage}
              </div>
            )}

            <div className="space-y-3">
              <Button
                fullWidth
                size="lg"
                onClick={handleAllowLocation}
                disabled={mode === "detecting"}
              >
                {mode === "detecting" ? t("location.detecting") : t("location.allow")}
              </Button>
              <Button
                fullWidth
                size="lg"
                variant="outline"
                onClick={() => setMode("manual")}
              >
                {t("location.manual")}
              </Button>
              <Button
                fullWidth
                size="md"
                variant="ghost"
                onClick={handleSkip}
              >
                {t("location.skip")}
              </Button>
            </div>
          </>
        ) : null}

        {mode === "manual" && (
          <ManualLocationSearch
            onSelect={(resolved) => {
              setAddress(resolved);
              setMode("confirm");
            }}
            onBack={() => setMode("choose")}
          />
        )}

        {mode === "confirm" && address && (
          <div>
            <div className="mb-6 text-center">
              <div className="mb-4 text-4xl">✅</div>
              <h1 className="text-xl font-bold text-ink">
                {t("location.currentLocation")}
              </h1>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="font-semibold text-ink">{address.formatted}</p>
              <p className="mt-1 text-sm text-slate-500">
                {[address.area, address.city, address.state, address.pincode]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>

            {/* Static map preview placeholder — rendered via Google Static Maps
                using the resolved coordinates when available. Exact coordinates
                are never displayed as raw text to the user or to other users. */}
            {address.coordinates && (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                <div className="flex h-36 items-center justify-center bg-slate-100 text-sm text-slate-400">
                  Map preview
                </div>
              </div>
            )}

            <p className="mt-4 text-center text-xs text-slate-400">
              {t("location.changeLater")}
            </p>

            <Button
              fullWidth
              size="lg"
              className="mt-4"
              onClick={() => handleConfirm(address.source)}
            >
              {t("location.confirm")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
