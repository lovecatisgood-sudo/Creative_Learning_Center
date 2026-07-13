"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { dict, type DictKey, type Lang } from "./dictionary";

type LangContext = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: DictKey) => string;
};

const Ctx = createContext<LangContext | null>(null);
const STORAGE_KEY = "sccc_lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Thai is the default (PRD §2); persisted per device in localStorage.
  const [lang, setLangState] = useState<Lang>("th");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "th") setLangState(saved);
  }, []);

  // Keep <html lang> in sync with the active language (a11y: screen readers /
  // browser translation use this attribute) — on mount-from-storage and on
  // every subsequent change, whether via setLang or toggle.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const toggle = useCallback(() => {
    setLangState((prev) => {
      const next = prev === "th" ? "en" : "th";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const t = useCallback((key: DictKey) => dict[key][lang], [lang]);

  return <Ctx.Provider value={{ lang, setLang, toggle, t }}>{children}</Ctx.Provider>;
}

export function useLang(): LangContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
