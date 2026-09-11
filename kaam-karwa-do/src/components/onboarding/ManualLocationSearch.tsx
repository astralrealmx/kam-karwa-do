"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { resolvePlaceById, searchPlaces } from "@/lib/location/geocode";
import { ResolvedAddress } from "@/lib/location/types";

export function ManualLocationSearch({
  onSelect,
  onBack,
}: {
  onSelect: (address: ResolvedAddress) => void;
  onBack: () => void;
}) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length < 3) {
      setPredictions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await searchPlaces(query);
        setPredictions(results);
      } catch {
        setError(
          "Google Maps is not configured yet, so search isn't available in this environment."
        );
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  async function handlePick(placeId: string) {
    try {
      const resolved = await resolvePlaceById(placeId);
      onSelect(resolved);
    } catch {
      setError("Couldn't load that location. Please try another search.");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-sm font-medium text-brand"
      >
        ← Back
      </button>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("location.searchPlaceholder")}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        autoFocus
      />

      {loading && (
        <p className="mt-3 text-sm text-slate-400">Searching...</p>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
        </p>
      )}

      {predictions.length > 0 && (
        <ul className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {predictions.map((prediction) => (
            <li key={prediction.place_id}>
              <button
                type="button"
                onClick={() => handlePick(prediction.place_id)}
                className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50"
              >
                {prediction.description}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
