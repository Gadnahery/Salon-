export type ThemeId = "noir" | "ivory";

const KEY = "warembo-theme";

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

export function themeForPortal(portal: "customer" | "staff" | "admin" | "public"): ThemeId {
  const stored = getStoredTheme();
  if (stored) return stored;
  if (portal === "staff" || portal === "admin") return "ivory";
  return "noir";
}
