"use client";

import Cookies from "js-cookie";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LANGUAGE,
  Dictionary,
  LANGUAGE_COOKIE,
  Language,
  getDictionary,
  translate,
} from "./index";

interface LanguageContextValue {
  language: Language;
  dict: Dictionary;
  t: (path: string) => string;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  initialLanguage,
  children,
}: {
  initialLanguage: Language;
  children: React.ReactNode;
}) {
  const [language, setLanguageState] = useState<Language>(
    initialLanguage ?? DEFAULT_LANGUAGE
  );

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    // Persist for 1 year. Cookie (not just localStorage) so the server
    // component can read the preference on the next request too.
    Cookies.set(LANGUAGE_COOKIE, lang, { expires: 365, sameSite: "lax" });
  }, []);

  const dict = useMemo(() => getDictionary(language), [language]);
  const t = useCallback((path: string) => translate(dict, path), [dict]);

  const value = useMemo(
    () => ({ language, dict, t, setLanguage }),
    [language, dict, t, setLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
