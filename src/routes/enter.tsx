import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { LogoWord } from "@/components/salon/logo";
import { StylistAvatar } from "@/components/salon/stylist-avatar";
import { authEnabled } from "@/lib/auth/client";
import { team } from "@/lib/salon/data";
import { useSalonStore } from "@/lib/salon/store";
import type { Session, StaffRole } from "@/lib/salon/types";
import { cn } from "@/lib/utils";

type Search = { as?: "staff" | "admin" | "customer" };

export const Route = createFileRoute("/enter")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    as: s.as === "staff" || s.as === "admin" || s.as === "customer" ? s.as : undefined,
  }),
  component: EnterPage,
});

function slugId(name: string, phone: string) {
  const clean = phone.replace(/\D/g, "").slice(-9) || "guest";
  const n = name.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 24) || "customer";
  return `cust-${n}-${clean}`;
}

function EnterPage() {
  const { as } = Route.useSearch();
  const enterAs = useSalonStore((s) => s.enterAs);
  const setProfile = useSalonStore((s) => s.setProfile);
  const navigate = useNavigate();
  const staff = team.filter((t) => t.role === "stylist" || t.role === "receptionist");
  const admin = team.filter((t) => t.role === "admin" || t.role === "manager");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  function go(session: Session, to: "/app" | "/staff" | "/admin") {
    enterAs(session);
    void navigate({ to });
  }

  function continueAsCustomer(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    const p = phone.trim();
    if (!n || n.length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (!p || p.replace(/\D/g, "").length < 9) {
      setError("Please enter a valid phone number.");
      return;
    }
    setError(null);
    setProfile({ name: n, phone: p, mpesaPhone: p });
    go(
      {
        portal: "customer",
        actorId: slugId(n, p),
        name: n,
        role: "customer",
      },
      "/app",
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-5 py-10">
      <LogoWord />
      <p className="mt-8 text-micro uppercase tracking-[0.16em] text-muted">Salon</p>
      <h1 className="mt-2 text-title font-normal">Welcome</h1>
      <p className="mt-2 text-body text-muted">
        Sign in as a customer with your name and phone, or continue as staff / admin.
      </p>

      <section className="mt-10">
        <p className="text-support font-medium text-muted">Customer</p>
        <form
          onSubmit={continueAsCustomer}
          className={cn(
            "mt-3 space-y-4 rounded-[24px] border border-line bg-surface p-5",
            as === "customer" && "border-ink",
          )}
        >
          <div>
            <Label htmlFor="customer-name">Full name</Label>
            <Input
              id="customer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              required
            />
          </div>
          <div>
            <Label htmlFor="customer-phone">Phone number</Label>
            <Input
              id="customer-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+255 …"
              autoComplete="tel"
              required
            />
          </div>
          {error && (
            <p className="rounded-2xl bg-brand-soft px-4 py-3 text-support text-brand">{error}</p>
          )}
          <Button type="submit" className="h-13 w-full">
            Continue
          </Button>
          <p className="text-center text-support text-muted">
            No OTP needed. We use your number for bookings and mobile-money prompts.
          </p>
        </form>
      </section>

      <section className="mt-10">
        <p className="text-support font-medium text-muted">Staff &amp; admin</p>
        {authEnabled ? (
          <Link
            to="/login"
            className="mt-3 flex w-full items-center justify-between rounded-[24px] bg-ink px-5 py-4 text-left text-white"
          >
            <span>
              <span className="block text-body font-medium">Staff sign in</span>
              <span className="mt-1 block text-support text-surface/70">Requires a staff or admin login</span>
            </span>
          </Link>
        ) : (
          <>
            <ul className="mt-3 space-y-2">
              {staff.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() =>
                      go(
                        { portal: "staff", actorId: m.id, name: m.name, role: m.role as StaffRole },
                        "/staff",
                      )
                    }
                    className="flex w-full items-center gap-4 rounded-[24px] border border-line bg-surface px-4 py-3 text-left"
                  >
                    <StylistAvatar stylist={m} size="sm" />
                    <span>
                      <span className="block text-body font-medium">{m.name}</span>
                      <span className="text-support text-muted">{m.title}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <ul className="mt-3 space-y-2">
              {admin.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() =>
                      go({ portal: "admin", actorId: m.id, name: m.name, role: m.role as StaffRole }, "/admin")
                    }
                    className="flex w-full items-center gap-4 rounded-[24px] bg-ink px-4 py-3 text-left text-white"
                  >
                    <span className="flex size-10 items-center justify-center rounded-full bg-surface/15 font-display">
                      {m.initials}
                    </span>
                    <span>
                      <span className="block text-body font-medium">{m.name}</span>
                      <span className="text-support text-surface/70">{m.title} · management</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <div className="mt-12">
        <Button variant="ghost" className="w-full" onClick={() => void navigate({ to: "/" })}>
          Back to the salon
        </Button>
      </div>
    </main>
  );
}
