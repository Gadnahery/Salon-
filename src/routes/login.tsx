import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogoWord } from "@/components/salon/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("gadnahery7@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: signInError } = await authClient.signIn.email({ email, password });
    setBusy(false);
    if (signInError) {
      setError(signInError.message ?? "Could not sign in. Check your email and password.");
      return;
    }
    void navigate({ to: "/enter" });
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <LogoWord />
        </div>
        <h1 className="mt-6 text-center text-title font-normal">Staff sign in</h1>
        <p className="mt-1 text-center text-support text-muted">For staff and admin accounts only.</p>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="rounded-2xl bg-brand-soft px-4 py-3 text-support text-brand">{error}</p>}
          <Button type="submit" className="h-13 w-full bg-ink text-white" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-support text-muted">
          Customer?{" "}
          <Link to="/enter" className="font-medium text-ink underline underline-offset-4">
            Continue here
          </Link>
        </p>
      </div>
    </main>
  );
}
