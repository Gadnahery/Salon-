import { en, type Dict } from "./en";
import { sw } from "./sw";

export type Locale = "en" | "sw";

const KEY = "warembo-locale";

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const v = localStorage.getItem(KEY);
  return v === "sw" ? "sw" : "en";
}

export function setStoredLocale(locale: Locale) {
  try {
    localStorage.setItem(KEY, locale);
  } catch {
    /* ignore */
  }
}

export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language?.toLowerCase() ?? "";
  if (lang.startsWith("sw")) return "sw";
  return getStoredLocale();
}

export function t(locale: Locale): Dict {
  return locale === "sw" ? sw : en;
}

export { en, sw };
