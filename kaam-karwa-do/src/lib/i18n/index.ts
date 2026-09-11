import en from "@/locales/en/common.json";
import hinglish from "@/locales/hinglish/common.json";

// Supported languages for Phase 1.
// Architecture is designed so future languages (Hindi, Punjabi, Bengali,
// Marathi, etc.) can be added by:
//   1. Creating /src/locales/<lang>/common.json with the same key shape
//   2. Adding the language code to `Language` below
//   3. Registering the dictionary in `dictionaries`
export type Language = "en" | "hinglish";

export const SUPPORTED_LANGUAGES: { code: Language; labelKey: "english" | "hinglish" }[] = [
  { code: "en", labelKey: "english" },
  { code: "hinglish", labelKey: "hinglish" },
];

export const DEFAULT_LANGUAGE: Language = "en";

export const LANGUAGE_COOKIE = "kkd_lang";
export const LANGUAGE_ONBOARDED_COOKIE = "kkd_onboarded";
export const LOCATION_PREF_COOKIE = "kkd_location_pref";

// Deeply-nested string dictionary type derived from the English source of truth.
export type Dictionary = typeof en;

const dictionaries: Record<Language, Dictionary> = {
  en,
  hinglish: hinglish as Dictionary,
};

export function getDictionary(lang: Language): Dictionary {
  return dictionaries[lang] ?? dictionaries[DEFAULT_LANGUAGE];
}

// Simple dot-path translator, e.g. t(dict, "location.title")
export function translate(dict: Dictionary, path: string): string {
  const parts = path.split(".");

  let current: any = dict;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return path; // fallback: show the key so missing strings are obvious in dev
    }
  }
  return typeof current === "string" ? current : path;
}

export function isSupportedLanguage(value: string | undefined | null): value is Language {
  return value === "en" || value === "hinglish";
}
