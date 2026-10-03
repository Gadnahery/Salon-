export type ThemeId = "noir" | "ivory";

const KEY = "warembo-theme-v2";

export function getStoredTheme(): ThemeId | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(KEY);
  return v === "noir" || v === "ivory" ? v : null;
}

export function applyTheme(theme: ThemeId) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* ignore */
  }
}

/** Light Ivory is always the default. Dark (noir) only if user chose it in Preferences. */
export function themeForPortal(
  _portal: "customer" | "staff" | "admin" | "public",
): ThemeId {
  const stored = getStoredTheme();
  if (stored === "noir") return "noir";
  return "ivory";
}

export function setThemePreference(theme: ThemeId) {
  applyTheme(theme);
}
