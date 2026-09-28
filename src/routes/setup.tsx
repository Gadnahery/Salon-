import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogoWord } from "@/components/salon/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import { bootstrapAdminFn, staffSetupNeededFn } from "@/lib/auth/staff-actions";

export const Route = createFileRoute("/setup")({ component: Setup });

function Setup() {
  const navigate = useNavigate();
  const [needed, setNeeded] = useState<boolean | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [name, setName] = useState("Lewis");
  const [email, setEmail] = useState("gadnahery7@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    staffSetupNeededFn()
      .then((v) => {
        setNeeded(v);
        setCheckError(null);
      })
      .catch((err) => {
        setNeeded(true);
        setCheckError(
          err instanceof Error
            ? err.message
            : "Could not reach the database. You can still try creating the admin account.",
        );
      });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // Server-side bootstrap: creates Better Auth user + admin staff row.
      await bootstrapAdminFn({
        data: { email: email.trim(), password, name: name.trim() || "Admin" },
      });
      // Best-effort browser session so /admin works immediately.
      const { error: signInError } = await authClient.signIn.email({
        email: email.trim(),
        password,
      });
      if (signInError) {
        // Account exists; send them to login with a clear message.
        setError(
          `Admin created, but automatic sign-in failed (${signInError.message}). Go to Sign in with the same email and password.`,
        );
        setBusy(false);
        return;
      }
      void navigate({ to: "/admin" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Could not create the admin account.");
    } finally {
      setBusy(false);
    }
  }

  if (needed === null) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg px-5">
        <p className="text-support text-muted">Checking setup…</p>
      </main>
    );
  }

  if (needed === false) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg px-5 text-center">
        <div className="max-w-sm">
          <p className="text-body">An admin account may already exist.</p>
          <p className="mt-2 text-support text-muted">
            Try signing in with <strong>gadnahery7@gmail.com</strong> and your password.
          </p>
          <a
            href="/login"
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-ink text-white"
          >
            Go to sign in
          </a>
          <button
            type="button"
            className="mt-4 w-full text-support text-muted underline underline-offset-4"
            onClick={() => setNeeded(true)}
          >
            Create / claim admin anyway
          </button>
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
          One-time setup. After this, use the same email and password on Staff sign in.
        </p>

        {checkError && (
          <p className="mt-4 rounded-2xl bg-brand-soft px-4 py-3 text-support text-brand">{checkError}</p>
        )}

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
              placeholder="At least 8 characters"
            />
          </div>
          {error && (
            <p className="rounded-2xl bg-brand-soft px-4 py-3 text-support text-brand whitespace-pre-wrap">
              {error}
            </p>
          )}
          <Button type="submit" className="h-13 w-full bg-ink text-white" disabled={busy}>
            {busy ? "Creating…" : "Create admin account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-support text-muted">
          Already created?{" "}
          <a href="/login" className="text-ink underline underline-offset-4">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
