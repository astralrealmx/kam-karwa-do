"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiFetch } from "@/lib/apiFetch";
import { ManualLocationSearch } from "@/components/onboarding/ManualLocationSearch";
import { getCurrentPosition } from "@/lib/location/geolocation";
import { reverseGeocode } from "@/lib/location/geocode";
import { ResolvedAddress } from "@/lib/location/types";

interface AddressRow {
  id: string;
  label: string | null;
  formatted: string;
  pincode: string | null;
  isDefault: boolean;
}

export function AddressesClient({
  initialAddresses,
}: {
  initialAddresses: AddressRow[];
}) {
  const { t } = useLanguage();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const result = await apiFetch<{ addresses: AddressRow[] }>(
      "/api/customer/addresses"
    );
    setAddresses(result.addresses);
  }

  async function handleSetDefault(id: string) {
    setBusyId(id);
    try {
      await apiFetch(`/api/customer/addresses/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isDefault: true }),
      });
      await refresh();
    } catch {
      setError(t("auth.genericError"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await apiFetch(`/api/customer/addresses/${id}`, { method: "DELETE" });
      await refresh();
    } catch {
      setError(t("auth.genericError"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">{t("customer.addresses")}</h1>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            {t("customer.addAddress")}
          </Button>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {adding && (
        <AddAddressForm
          onCancel={() => setAdding(false)}
          onSaved={async () => {
            setAdding(false);
            await refresh();
          }}
        />
      )}

      {addresses.length === 0 && !adding ? (
        <Card className="flex flex-col items-center py-10 text-center">
          <div className="mb-3 text-4xl">📍</div>
          <p className="font-semibold text-ink">{t("customer.noAddresses")}</p>
        </Card>
      ) : (
        <div className="mt-4 space-y-3">
          {addresses.map((address) =>
            editingId === address.id ? (
              <EditAddressCard
                key={address.id}
                address={address}
                onCancel={() => setEditingId(null)}
                onSaved={async () => {
                  setEditingId(null);
                  await refresh();
                }}
              />
            ) : (
              <Card key={address.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-ink">
                        {address.label || "Address"}
                      </p>
                      {address.isDefault && (
                        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                          {t("customer.default")}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{address.formatted}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!address.isDefault && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === address.id}
                      onClick={() => handleSetDefault(address.id)}
                    >
                      {t("customer.setDefault")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(address.id)}
                  >
                    {t("customer.edit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                    disabled={busyId === address.id}
                    onClick={() => handleDelete(address.id)}
                  >
                    {t("customer.delete")}
                  </Button>
                </div>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}

function AddAddressForm({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { t } = useLanguage();
  const [resolved, setResolved] = useState<ResolvedAddress | null>(null);
  const [label, setLabel] = useState("");
  const [mode, setMode] = useState<"choose" | "search" | "confirm">("choose");
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUseCurrentLocation() {
    setDetecting(true);
    setError(null);
    try {
      const coords = await getCurrentPosition();
      const address = await reverseGeocode(coords);
      setResolved(address);
      setMode("confirm");
    } catch {
      setError(
        "Couldn't detect your location (Google Maps may not be configured). Please search manually instead."
      );
    } finally {
      setDetecting(false);
    }
  }

  async function handleSave() {
    if (!resolved) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/customer/addresses", {
        method: "POST",
        body: JSON.stringify({
          label: label || undefined,
          formatted: resolved.formatted,
          pincode: resolved.pincode,
          latitude: resolved.coordinates?.latitude,
          longitude: resolved.coordinates?.longitude,
          source: resolved.source,
        }),
      });
      onSaved();
    } catch {
      setError(t("auth.genericError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mb-4">
      {mode === "choose" && (
        <div className="space-y-2">
          <Button fullWidth onClick={handleUseCurrentLocation} disabled={detecting}>
            {detecting ? "..." : "📍 Use current location"}
          </Button>
          <Button fullWidth variant="outline" onClick={() => setMode("search")}>
            🔍 Search manually
          </Button>
          <Button fullWidth variant="ghost" onClick={onCancel}>
            {t("customer.cancel")}
          </Button>
        </div>
      )}

      {mode === "search" && (
        <ManualLocationSearch
          onSelect={(address) => {
            setResolved(address);
            setMode("confirm");
          }}
          onBack={() => setMode("choose")}
        />
      )}

      {mode === "confirm" && resolved && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">{resolved.formatted}</p>
          <Input
            label="Label (e.g. Home, Shop)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "..." : t("customer.save")}
            </Button>
            <Button variant="ghost" onClick={onCancel}>
              {t("customer.cancel")}
            </Button>
          </div>
        </div>
      )}

      {error && mode === "choose" && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
        </p>
      )}
    </Card>
  );
}

function EditAddressCard({
  address,
  onCancel,
  onSaved,
}: {
  address: AddressRow;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { t } = useLanguage();
  const [label, setLabel] = useState(address.label ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/api/customer/addresses/${address.id}`, {
        method: "PATCH",
        body: JSON.stringify({ label }),
      });
      onSaved();
    } catch {
      setError(t("auth.genericError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <p className="mb-2 text-sm text-slate-500">{address.formatted}</p>
      <Input
        label="Label (e.g. Home, Shop)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "..." : t("customer.save")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          {t("customer.cancel")}
        </Button>
      </div>
    </Card>
  );
}
