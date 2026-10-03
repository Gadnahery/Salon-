import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ScreenHeader } from "@/components/salon/screen-header";
import { useSalonStore } from "@/lib/salon/store";
import {
  applyTheme,
  getStoredTheme,
  setThemePreference,
  type ThemeId,
} from "@/lib/theme";
import { cn, useHydrated } from "@/lib/utils";

export const Route = createFileRoute("/app/preferences")({ component: PrefsPage });

function PrefsPage() {
  const profile = useSalonStore((s) => s.profile);
  const setProfile = useSalonStore((s) => s.setProfile);
  const hydrated = useHydrated();
  const [theme, setTheme] = useState<ThemeId>("ivory");

  useEffect(() => {
    const t = getStoredTheme() ?? "ivory";
    setTheme(t);
    applyTheme(t);
  }, []);

  return (
    <main className="mx-auto min-h-dvh max-w-lg bg-bg">
      <ScreenHeader title="Preferences" backTo="/app/profile" />
      <ul className="mx-5 overflow-hidden rounded-[28px] bg-surface shadow-soft">
        <ToggleRow
          label="Appointment reminders"
          hint="The morning of your visit"
          on={hydrated && profile.reminders}
          onChange={(v) => setProfile({ reminders: v })}
        />
        <ToggleRow
          label="Stylist ready alerts"
          hint="When your appointment is starting"
          on={hydrated && profile.stylistReadyAlerts}
          onChange={(v) => setProfile({ stylistReadyAlerts: v })}
        />
      </ul>

      <p className="mx-5 mt-8 text-micro uppercase tracking-[0.16em] text-muted">Appearance</p>
      <ul className="mx-5 mt-3 overflow-hidden rounded-[28px] bg-surface shadow-soft">
        <li className="flex items-center justify-between gap-4 px-5 py-4">
          <span>
            <span className="block text-body">Dark mode</span>
            <span className="block text-support text-muted">Optional. Light is the default.</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={theme === "noir"}
            onClick={() => {
              const next: ThemeId = theme === "noir" ? "ivory" : "noir";
              setTheme(next);
              setThemePreference(next);
            }}
            className={cn(
              "relative h-7 w-12 rounded-full transition-colors duration-200",
              theme === "noir" ? "bg-ink" : "bg-line",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 size-6 rounded-full bg-surface transition-transform duration-200",
                theme === "noir" && "translate-x-5",
              )}
            />
          </button>
        </li>
      </ul>
    </main>
  );
}

function ToggleRow({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 last:border-0">
      <span>
        <span className="block text-body">{label}</span>
        <span className="block text-support text-muted">{hint}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={cn("relative h-7 w-12 rounded-full transition-colors duration-200", on ? "bg-ink" : "bg-line")}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-6 rounded-full bg-surface transition-transform duration-200",
            on && "translate-x-5",
          )}
        />
      </button>
    </li>
  );
}
