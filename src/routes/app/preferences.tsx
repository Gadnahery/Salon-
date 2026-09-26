import { createFileRoute } from "@tanstack/react-router";
import { ScreenHeader } from "@/components/salon/screen-header";
import { useSalonStore } from "@/lib/salon/store";
import { cn, useHydrated } from "@/lib/utils";

export const Route = createFileRoute("/app/preferences")({ component: PrefsPage });

function PrefsPage() {
  const profile = useSalonStore((s) => s.profile);
  const setProfile = useSalonStore((s) => s.setProfile);
  const hydrated = useHydrated();

  return (
    <main className="mx-auto min-h-dvh max-w-lg">
      <ScreenHeader title="Preferences" backTo="/app/profile" />
      <ul className="mx-5 overflow-hidden rounded-[24px] bg-surface">
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
