import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { LogoWord } from "@/components/salon/logo";
import { useSalonStore } from "@/lib/salon/store";
import { customerIdFromPhone, isValidLocalTzPhone, toLocalTzPhone } from "@/lib/salon/format";
import { cn } from "@/lib/utils";
import { subscribePush, registerBookingServiceWorker } from "@/lib/notifications/push-client";

type Search = { as?: "staff" | "admin" | "customer" };

export const Route = createFileRoute("/enter")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    as: s.as === "staff" || s.as === "admin" || s.as === "customer" ? s.as : undefined,
  }),
  component: EnterPage,
});

function EnterPage() {
  const enterAs = useSalonStore((s) => s.enterAs);
  const setProfile = useSalonStore((s) => s.setProfile);
  const upsertCustomer = useSalonStore((s) => s.upsertCustomer);
  const customers = useSalonStore((s) => s.customers);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  function continueAsCustomer(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim().replace(/\s+/g, " ");
    const p = toLocalTzPhone(phone);
    if (!n || n.length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (!isValidLocalTzPhone(p)) {
      setError("Use a Tanzanian number like 07XXXXXXXX or 06XXXXXXXX.");
      return;
    }
    setError(null);

    // Identity = phone only. Name is display; casing/spelling never creates a new account.
    const actorId = customerIdFromPhone(p);
    const existing = customers.find(
      (c) => c.id === actorId || c.phone.replace(/\D/g, "").slice(-9) === p.replace(/\D/g, "").slice(-9),
    );
    // Keep a sensible display name: prefer longer typed name, else existing
    const displayName =
      existing && existing.name.trim().length > n.length ? existing.name.trim() : n;

    upsertCustomer({ id: actorId, name: displayName, phone: p });
    setProfile({ name: displayName, phone: p, mpesaPhone: p });
    enterAs({
      portal: "customer",
      actorId,
      name: displayName,
      role: "customer",
    });
    void registerBookingServiceWorker();
    void subscribePush({ portal: "customer", actorId });
    void navigate({ to: "/app" });
  }

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-5 py-10">
      <LogoWord />
      <p className="mt-8 text-micro uppercase tracking-[0.16em] text-muted">Booking</p>
      <h1 className="mt-2 text-title font-normal">Welcome</h1>
      <p className="mt-2 text-body text-muted">
        Enter your name and phone. Your phone number is your account — spelling of the name does not matter.
      </p>

      <section className="mt-10">
        <p className="text-support font-medium text-muted">Customer</p>
        <form
          onSubmit={continueAsCustomer}
          className="mt-3 space-y-4 rounded-[24px] border border-line bg-surface p-5"
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
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9+\s]/g, ""))}
              inputMode="tel"
              autoComplete="tel"
              placeholder="07XXXXXXXX"
              autoComplete="tel"
              required
            />
          </div>
          {error && (
            <p className="rounded-2xl bg-brand-soft px-4 py-3 text-support text-brand">{error}</p>
          )}
          <Button type="submit" className="h-13 w-full bg-ink text-white">
            Continue
          </Button>
          <p className="text-center text-support text-muted">
            Your phone is your login. Name is only for greetings and bookings.
          </p>
        </form>
      </section>

      <section className="mt-10">
        <p className="text-support font-medium text-muted">Staff &amp; admin</p>
        <Link
          to="/login"
          className="mt-3 flex w-full items-center justify-between rounded-[24px] bg-ink px-5 py-4 text-left text-white"
        >
          <span>
            <span className="block text-body font-medium">Staff sign in</span>
            <span className="mt-1 block text-support text-surface/70">
              Email and password — no demo access
            </span>
          </span>
        </Link>
      </section>
    </main>
  );
}
