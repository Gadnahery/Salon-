import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronRight, CircleHelp, CreditCard, Heart, Calendar, LogOut, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const enterAs = useSalonStore((s) => s.enterAs);
  const navigate = useNavigate();
  const initial = profile.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  function signOut() {
    enterAs({ portal: "customer", actorId: "guest", name: "Guest", role: "customer" });
    setProfile({ name: "", phone: "", mpesaPhone: "" });
    void navigate({ to: "/enter", search: { as: "customer" } });
  }

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-5 pb-10 pt-6">
      <h1 className="text-title font-normal">Profile</h1>
      <div className="mt-8 flex items-center gap-4">
        <span className="flex size-16 items-center justify-center rounded-full bg-ink font-display text-xl text-white">
          {hydrated && initial ? initial : "—"}
        </span>
        <div>
          <p className="text-section font-normal">{hydrated ? profile.name || "Guest" : ""}</p>
          <p className="text-support text-muted">{hydrated ? profile.phone || "No phone yet" : ""}</p>
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
            onChange={(e) => setProfile({ phone: e.target.value, mpesaPhone: e.target.value })}
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

      <div className="mt-8">
        <Button
          type="button"
          variant="secondary"
          className="h-13 w-full gap-2"
          onClick={signOut}
        >
          <LogOut className="size-4" strokeWidth={1.75} />
          Sign out
        </Button>
      </div>
      <p className="mt-10 text-center text-support text-muted">Salon · Dar es Salaam</p>
    </main>
  );
}
