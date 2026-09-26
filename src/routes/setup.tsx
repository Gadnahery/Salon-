import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogoWord } from "@/components/salon/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import { claimFirstAdminFn, staffSetupNeededFn } from "@/lib/auth/staff-actions";

export const Route = createFileRoute("/setup")({ component: Setup });

function Setup() {
  const navigate = useNavigate();
  const [needed, setNeeded] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    staffSetupNeededFn()
      .then(setNeeded)
      .catch(() => setNeeded(false));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: signUpError } = await authClient.signUp.email({ email, password, name });
    if (signUpError) {
      setBusy(false);
      setError(signUpError.message ?? "Could not create the admin account.");
      return;
    }
    try {
      await claimFirstAdminFn();
      void navigate({ to: "/admin" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup already completed — sign in instead.");
    } finally {
      setBusy(false);
    }
  }

  if (needed === null) return null;

  if (needed === false) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg px-5 text-center">
        <div>
          <p className="text-body">Setup is already complete.</p>
          <a href="/login" className="mt-2 inline-block text-support text-muted underline underline-offset-4">
            Go to sign in
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <LogoWord />
        </div>
        <h1 className="mt-6 text-center text-title font-normal">Create the admin account</h1>
        <p className="mt-1 text-center text-support text-muted">
          One-time setup — this page stops working once the first admin exists.
        </p>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="name">Your name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="rounded-2xl bg-brand-soft px-4 py-3 text-support text-brand">{error}</p>}
          <Button type="submit" className="h-13 w-full bg-ink text-white" disabled={busy}>
            {busy ? "Creating…" : "Create admin account"}
          </Button>
        </form>
      </div>
    </main>
  );
}
