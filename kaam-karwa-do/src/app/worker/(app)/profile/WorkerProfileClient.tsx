"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/apiFetch";
import { cn } from "@/lib/utils";
import type { CategoryDef } from "@/lib/categories";

interface ProfileData {
  name: string;
  phone: string;
  avatarUrl: string;
  bio: string;
  experienceYears: number | null;
  languages: string[];
  skills: string[];
  categorySlugs: string[];
  area: string | null;
  rating: number | null;
  completedCount: number;
  completionRate: number | null;
  verificationStatus: string;
}

export function WorkerProfileClient({
  categories,
  initial,
}: {
  categories: CategoryDef[];
  initial: ProfileData;
}) {
  const { t, language } = useLanguage();
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [bio, setBio] = useState(initial.bio);
  const [experienceYears, setExperienceYears] = useState(
    initial.experienceYears?.toString() ?? ""
  );
  const [languages, setLanguages] = useState(initial.languages.join(", "));
  const [skills, setSkills] = useState(initial.skills.join(", "));
  const [categorySlugs, setCategorySlugs] = useState(initial.categorySlugs);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleCategory(slug: string) {
    setCategorySlugs((list) =>
      list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await apiFetch("/api/worker/profile", {
        method: "PATCH",
        body: JSON.stringify({
          avatarUrl,
          bio,
          experienceYears: experienceYears ? Number(experienceYears) : undefined,
          languages: languages
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          skills: skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          categorySlugs,
        }),
      });
      setMessage("Profile updated.");
    } catch {
      setError(t("auth.genericError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-2xl font-bold text-ink">{t("worker.profileTitle")}</h1>

      {/* Public-safe summary — this is what a customer would see about
          this worker; never bank details, government IDs, or private
          phone number. */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-brand/10 text-2xl font-bold text-brand">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (initial.name[0] ?? "?").toUpperCase()
            )}
          </div>
          <div>
            <p className="font-semibold text-ink">{initial.name}</p>
            <p className="text-sm text-slate-500">{initial.area ?? "Location not set"}</p>
            {initial.verificationStatus === "VERIFIED" && (
              <span className="mt-1 inline-block rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                ✓ Verified
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-center">
          <div>
            <p className="font-bold text-ink">
              {initial.rating !== null ? initial.rating.toFixed(1) : "—"}
            </p>
            <p className="text-xs text-slate-500">{t("worker.rating")}</p>
          </div>
          <div>
            <p className="font-bold text-ink">{initial.completedCount}</p>
            <p className="text-xs text-slate-500">{t("worker.completedTasksLabel")}</p>
          </div>
          <div>
            <p className="font-bold text-ink">
              {initial.completionRate !== null ? `${initial.completionRate}%` : "—"}
            </p>
            <p className="text-xs text-slate-500">{t("worker.completionRate")}</p>
          </div>
        </div>
      </Card>

      <Card>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label={t("worker.profilePhoto")}
            placeholder="https://..."
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Bio</label>
            <textarea
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <Input
            label={t("auth.mobile")}
            value={initial.phone}
            disabled
            className="bg-slate-50 text-slate-500"
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              {t("worker.categories")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => toggleCategory(cat.slug)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-left text-sm font-medium",
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
          </div>

          <Input
            label={t("worker.skills")}
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
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
          />

          {message && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>
          )}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? "..." : t("customer.save")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
