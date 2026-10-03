import { useEffect } from "react";
import { applyTheme, themeForPortal, type ThemeId } from "@/lib/theme";

export function ThemePortal({
  portal,
}: {
  portal: "customer" | "staff" | "admin" | "public";
}) {
  useEffect(() => {
    const t: ThemeId = themeForPortal(portal);
    applyTheme(t);
  }, [portal]);
  return null;
}
