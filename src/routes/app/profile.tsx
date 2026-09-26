import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, ChevronRight, CircleHelp, CreditCard, Heart, Calendar, SlidersHorizontal } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { useSalonStore } from "@/lib/salon/store";
import { useHydrated } from "@/lib/utils";

export const Route = createFileRoute("/app/profile")({ component: ProfilePage });

const rows = [
  { to: "/app/appointments", label: "Appointments", icon: Calendar },
  { to: "/app/saved", label: "Saved services", icon: Heart },
  { to: "/app/notifications", label: "Notifications", icon: Bell },
  { to: "/app/payments", label: "Payment methods", icon: CreditCard },
  { to: "/app/preferences", label: "Preferences", icon: SlidersHorizontal },
  { to: "/app/help", label: "Help", icon: CircleHelp },
] as const;

function ProfilePage() {
  const hydrated = useHydrated();
  const profile = useSalonStore((s) => s.profile);
  const setProfile = useSalonStore((s) => s.setProfile);
  const initial = profile.name.split(" ").map((p) => p[0]).join("").slice(0, 2);

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-5 pb-10 pt-6">
      <h1 className="text-title font-normal">Profile</h1>
      <div className="mt-8 flex items-center gap-4">
        <span className="flex size-16 items-center justify-center rounded-full bg-ink font-display text-xl text-surface">
          {hydrated ? initial : "GH"}
        </span>
        <div>
          <p className="text-section font-normal">{hydrated ? profile.name : ""}</p>
          <p className="text-support text-muted">{hydrated ? profile.phone : ""}</p>
        </div>
      </div>
      <div className="mt-8 space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={hydrated ? profile.name : ""}
            onChange={(e) => setProfile({ name: e.target.value })}
            placeholder="Your name"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={hydrated ? profile.phone : ""}
            onChange={(e) => setProfile({ phone: e.target.value })}
            placeholder="+255 …"
          />
        </div>
      </div>
      <ul className="mt-10 divide-y divide-line overflow-hidden rounded-[24px] bg-surface">
        {rows.map((r) => (
          <li key={r.to}>
            <Link to={r.to} className="flex items-center gap-3 px-5 py-4">
              <r.icon className="size-5 text-muted" strokeWidth={1.75} />
              <span className="flex-1 text-body">{r.label}</span>
              <ChevronRight className="size-4 text-muted" strokeWidth={1.75} />
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-center text-support text-muted">Salon · Dar es Salaam</p>
    </main>
  );
}
