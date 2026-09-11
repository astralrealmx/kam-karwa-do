"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/apiFetch";
import { cn } from "@/lib/utils";
import { getCurrentPosition } from "@/lib/location/geolocation";
import { reverseGeocode } from "@/lib/location/geocode";
import { ResolvedAddress } from "@/lib/location/types";
import { ManualLocationSearch } from "@/components/onboarding/ManualLocationSearch";
import type { CategoryDef } from "@/lib/categories";

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

export function WorkerOnboardingForm({
  categories,
  defaultName,
  defaultPhone,
}: {
  categories: CategoryDef[];
  defaultName: string | null;
  defaultPhone: string | null;
}) {
  const { t, language } = useLanguage();
  const router = useRouter();

  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");

  const [locationMode, setLocationMode] = useState<"choose" | "search" | "set">("choose");
  const [resolvedLocation, setResolvedLocation] = useState<ResolvedAddress | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [radiusKm, setRadiusKm] = useState(5);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [categorySlugs, setCategorySlugs] = useState<string[]>([]);
  const [skills, setSkills] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [languages, setLanguages] = useState("");

  const [isAvailable, setIsAvailable] = useState(false);
  const [workingDays, setWorkingDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");

  const [addPayout, setAddPayout] = useState(false);
  const [payoutHolder, setPayoutHolder] = useState(defaultName ?? "");
  const [payoutAccount, setPayoutAccount] = useState("");
  const [payoutIfsc, setPayoutIfsc] = useState("");

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function toggleCategory(slug: string) {
    setCategorySlugs((list) =>
      list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]
    );
  }

  function toggleDay(day: string) {
    setWorkingDays((list) =>
      list.includes(day) ? list.filter((d) => d !== day) : [...list, day]
    );
  }

  async function handleUseCurrentLocation() {
    setDetecting(true);
    setLocationError(null);
    try {
      const coords = await getCurrentPosition();
      const address = await reverseGeocode(coords);
      setResolvedLocation(address);
      setLocationMode("set");
    } catch {
      setLocationError(
        "Couldn't detect your location (Google Maps may not be configured). Please search manually instead."
      );
    } finally {
      setDetecting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!resolvedLocation?.city || !resolvedLocation?.state) {
      setFormError("Please set your city before continuing.");
      return;
    }
    if (categorySlugs.length === 0) {
      setFormError("Choose at least one category.");
      return;
    }
    if (!acceptedTerms || !acceptedPrivacy) {
      setFormError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/api/worker/onboarding", {
        method: "POST",
        body: JSON.stringify({
          avatarUrl: avatarUrl || undefined,
          bio: bio || undefined,
          cityName: resolvedLocation.city,
          stateName: resolvedLocation.state,
          areaName: resolvedLocation.area || undefined,
          latitude: resolvedLocation.coordinates?.latitude,
          longitude: resolvedLocation.coordinates?.longitude,
          locationSource: resolvedLocation.source,
          radiusKm,
          categorySlugs,
          skills: skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          experienceYears: experienceYears ? Number(experienceYears) : undefined,
          languages: languages
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          isAvailable,
          workingDays,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          payout: addPayout
            ? {
                accountHolderName: payoutHolder,
                accountNumber: payoutAccount,
                ifsc: payoutIfsc,
              }
            : undefined,
          acceptedTerms,
          acceptedPrivacy,
        }),
      });

      router.push("/worker/dashboard");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        router.push("/worker/dashboard");
        return;
      }
      setFormError(t("auth.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-ink">{t("worker.onboardingProfileStep")}</h1>
          {defaultPhone && <p className="mt-1 text-sm text-slate-500">{defaultPhone}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Card>
            <h2 className="mb-3 font-semibold text-ink">{t("worker.profilePhoto")}</h2>
            <Input
              label={t("worker.profilePhoto")}
              placeholder="https://..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
            <label className="mt-4 block text-sm font-medium text-ink">Bio</label>
            <textarea
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short line about the work you do..."
            />
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-ink">
              {t("worker.city")} / {t("worker.area")}
            </h2>

            {locationMode === "choose" && (
              <div className="space-y-2">
                <Button
                  type="button"
                  fullWidth
                  onClick={handleUseCurrentLocation}
                  disabled={detecting}
                >
                  {detecting ? "..." : "📍 Use current location"}
                </Button>
                <Button
                  type="button"
                  fullWidth
                  variant="outline"
                  onClick={() => setLocationMode("search")}
                >
                  🔍 Search manually
                </Button>
              </div>
            )}

            {locationMode === "search" && (
              <ManualLocationSearch
                onSelect={(address) => {
                  setResolvedLocation(address);
                  setLocationMode("set");
                }}
                onBack={() => setLocationMode("choose")}
              />
            )}

            {locationError && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {locationError}
              </p>
            )}

            {locationMode === "set" && resolvedLocation && (
              <div>
                <p className="text-sm text-slate-600">{resolvedLocation.formatted}</p>
                <button
                  type="button"
                  onClick={() => setLocationMode("choose")}
                  className="mt-2 text-xs font-medium text-brand"
                >
                  Change
                </button>
              </div>
            )}

            <label className="mt-4 block text-sm font-medium text-ink">
              {t("worker.serviceRadius")}: {radiusKm} km
            </label>
            <input
              type="range"
              min={1}
              max={50}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="mt-2 w-full accent-brand"
            />
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-ink">{t("worker.categories")}</h2>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => toggleCategory(cat.slug)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-left text-sm font-medium transition-colors",
                    categorySlugs.includes(cat.slug)
                      ? "border-brand bg-brand/5 text-brand"
                      : "border-slate-200 text-slate-600"
                  )}
                >
                  <span>{cat.icon}</span>
                  <span className="truncate">
                    {language === "hinglish" ? cat.nameHinglish : cat.nameEn}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              <Input
                label={t("worker.skills")}
                placeholder={t("worker.skillsPlaceholder")}
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
              <Input
                label={t("worker.experience")}
                type="number"
                min={0}
                max={60}
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
              />
              <Input
                label={t("worker.languagesSpoken")}
                placeholder={t("worker.languagesPlaceholder")}
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
              />
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-ink">{t("worker.availability")}</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsAvailable(true)}
                className={cn(
                  "flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-medium",
                  isAvailable
                    ? "border-brand bg-brand/5 text-brand"
                    : "border-slate-200 text-slate-600"
                )}
              >
                {t("worker.available")}
              </button>
              <button
                type="button"
                onClick={() => setIsAvailable(false)}
                className={cn(
                  "flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-medium",
                  !isAvailable
                    ? "border-brand bg-brand/5 text-brand"
                    : "border-slate-200 text-slate-600"
                )}
              >
                {t("worker.unavailable")}
              </button>
            </div>

            <label className="mb-1.5 mt-4 block text-sm font-medium text-ink">
              {t("worker.workingDays")}
            </label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium",
                    workingDays.includes(day)
                      ? "bg-brand text-white"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Input
                label={t("worker.startTime")}
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <Input
                label={t("worker.endTime")}
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink">{t("worker.payoutInfo")}</h2>
              <button
                type="button"
                onClick={() => setAddPayout((v) => !v)}
                className="text-sm font-medium text-brand"
              >
                {addPayout ? t("customer.cancel") : "Add"}
              </button>
            </div>

            {addPayout ? (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-slate-400">{t("worker.payoutSecureNote")}</p>
                <Input
                  label={t("worker.payoutHolderName")}
                  value={payoutHolder}
                  onChange={(e) => setPayoutHolder(e.target.value)}
                />
                <Input
                  label={t("worker.payoutAccountNumber")}
                  value={payoutAccount}
                  onChange={(e) => setPayoutAccount(e.target.value)}
                  inputMode="numeric"
                />
                <Input
                  label={t("worker.payoutIfsc")}
                  value={payoutIfsc}
                  onChange={(e) => setPayoutIfsc(e.target.value.toUpperCase())}
                />
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">{t("worker.payoutSkip")}</p>
            )}
          </Card>

          <Card>
            <label className="flex items-start gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <span>
                {t("auth.acceptTerms")} (
                <Link href="/terms" className="text-brand">
                  Terms
                </Link>
                )
              </span>
            </label>
            <label className="mt-3 flex items-start gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
              />
              <span>
                {t("auth.acceptPrivacy")} (
                <Link href="/privacy" className="text-brand">
                  Privacy
                </Link>
                )
              </span>
            </label>
          </Card>

          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}

          <Button type="submit" fullWidth size="lg" disabled={submitting}>
            {submitting ? "..." : t("worker.submitOnboarding")}
          </Button>
        </form>
      </div>
    </div>
  );
}
