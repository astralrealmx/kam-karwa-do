"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/apiFetch";
import { cn } from "@/lib/utils";
import { getCurrentPosition } from "@/lib/location/geolocation";
import { reverseGeocode } from "@/lib/location/geocode";
import { ManualLocationSearch } from "@/components/onboarding/ManualLocationSearch";
import { ResolvedAddress } from "@/lib/location/types";

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

export function WorkerAvailabilityClient({
  initial,
}: {
  initial: {
    isAvailable: boolean;
    workingDays: string[];
    startTime: string;
    endTime: string;
    radiusKm: number;
    currentArea: string | null;
  };
}) {
  const { t } = useLanguage();
  const [isAvailable, setIsAvailable] = useState(initial.isAvailable);
  const [workingDays, setWorkingDays] = useState(initial.workingDays);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [endTime, setEndTime] = useState(initial.endTime);
  const [radiusKm, setRadiusKm] = useState(initial.radiusKm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [changingLocation, setChangingLocation] = useState(false);
  const [locationMode, setLocationMode] = useState<"choose" | "search">("choose");
  const [currentArea, setCurrentArea] = useState(initial.currentArea);
  const [detecting, setDetecting] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  function toggleDay(day: string) {
    setWorkingDays((list) =>
      list.includes(day) ? list.filter((d) => d !== day) : [...list, day]
    );
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      await apiFetch("/api/worker/availability", {
        method: "PATCH",
        body: JSON.stringify({ isAvailable, workingDays, startTime, endTime, radiusKm }),
      });
      setMessage("Saved.");
    } catch {
      setMessage(null);
    } finally {
      setSaving(false);
    }
  }

  async function saveLocation(address: ResolvedAddress) {
    if (!address.city || !address.state) {
      setLocationError("Couldn't determine a city for that location.");
      return;
    }
    try {
      await apiFetch("/api/worker/location", {
        method: "PATCH",
        body: JSON.stringify({
          cityName: address.city,
          stateName: address.state,
          areaName: address.area,
          latitude: address.coordinates?.latitude,
          longitude: address.coordinates?.longitude,
          source: address.source,
        }),
      });
      setCurrentArea([address.area, address.city].filter(Boolean).join(", "));
      setChangingLocation(false);
      setLocationMode("choose");
    } catch {
      setLocationError(t("auth.genericError"));
    }
  }

  async function handleUseCurrentLocation() {
    setDetecting(true);
    setLocationError(null);
    try {
      const coords = await getCurrentPosition();
      const address = await reverseGeocode(coords);
      await saveLocation(address);
    } catch {
      setLocationError(
        "Couldn't detect your location (Google Maps may not be configured). Please search manually instead."
      );
    } finally {
      setDetecting(false);
    }
  }

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-2xl font-bold text-ink">{t("worker.availability")}</h1>

      <Card>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsAvailable(true)}
            className={cn(
              "flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-medium",
              isAvailable ? "border-brand bg-brand/5 text-brand" : "border-slate-200 text-slate-600"
            )}
          >
            {t("worker.available")}
          </button>
          <button
            type="button"
            onClick={() => setIsAvailable(false)}
            className={cn(
              "flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-medium",
              !isAvailable ? "border-brand bg-brand/5 text-brand" : "border-slate-200 text-slate-600"
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
                workingDays.includes(day) ? "bg-brand text-white" : "bg-slate-100 text-slate-600"
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

        <label className="mb-1.5 mt-4 block text-sm font-medium text-ink">
          {t("worker.serviceRadius")}: {radiusKm} km
        </label>
        <input
          type="range"
          min={1}
          max={50}
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          className="w-full accent-brand"
        />

        {message && <p className="mt-3 text-xs text-green-600">{message}</p>}

        <Button className="mt-4" onClick={handleSave} disabled={saving}>
          {saving ? "..." : t("customer.save")}
        </Button>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink">{t("worker.manageLocation")}</h2>
          {!changingLocation && (
            <button
              type="button"
              onClick={() => setChangingLocation(true)}
              className="text-sm font-medium text-brand"
            >
              {t("customer.edit")}
            </button>
          )}
        </div>

        {!changingLocation && (
          <p className="mt-2 text-sm text-slate-500">{currentArea ?? "Not set"}</p>
        )}

        {changingLocation && locationMode === "choose" && (
          <div className="mt-3 space-y-2">
            <Button fullWidth onClick={handleUseCurrentLocation} disabled={detecting}>
              {detecting ? "..." : "📍 Use current location"}
            </Button>
            <Button fullWidth variant="outline" onClick={() => setLocationMode("search")}>
              🔍 Search manually
            </Button>
            <Button fullWidth variant="ghost" onClick={() => setChangingLocation(false)}>
              {t("customer.cancel")}
            </Button>
          </div>
        )}

        {changingLocation && locationMode === "search" && (
          <div className="mt-3">
            <ManualLocationSearch onSelect={saveLocation} onBack={() => setLocationMode("choose")} />
          </div>
        )}

        {locationError && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {locationError}
          </p>
        )}
      </Card>
    </div>
  );
}
