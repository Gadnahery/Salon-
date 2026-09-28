import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogoWord } from "@/components/salon/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { claimStaffAfterLogin, supabaseSignIn } from "@/lib/auth/supabase-auth";
import { useSalonStore } from "@/lib/salon/store";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const navigate = useNavigate();
  const enterAs = useSalonStore((s) => s.enterAs);
  const [email, setEmail] = useState("gadnahery7@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { session, error: signInError } = await supabaseSignIn({ email, password });
    if (!session) {
      setBusy(false);
      setError(signInError ?? "Could not sign in. Check your email and password.");
      return;
    }
    const account = await claimStaffAfterLogin({
      userId: session.user.id,
      email: session.user.email || email,
      name: session.user.user_metadata?.name,
      accessToken: session.access_token,
    });
    setBusy(false);
    if (!account) {
      setError("Signed in, but this account is not staff/admin. Run /setup first.");
      return;
    }
    enterAs({
      portal: account.role === "admin" || account.role === "manager" ? "admin" : "staff",
      actorId: account.id,
      name: account.name,
      role: account.role,
    });
    if (account.role === "admin" || account.role === "manager") {
      void navigate({ to: "/admin" });
    } else {
      void navigate({ to: "/staff" });
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <LogoWord />
        </div>
        <h1 className="mt-6 text-center text-title font-normal">Staff sign in</h1>
        <p className="mt-1 text-center text-support text-muted">Supabase Auth — staff and admin only.</p>

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
          {error && (
            <p className="rounded-2xl bg-brand-soft px-4 py-3 text-support text-brand whitespace-pre-wrap">
              {error}
            </p>
          )}
          <Button type="submit" className="h-13 w-full bg-ink text-white" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-support text-muted">
          First time?{" "}
          <Link to="/setup" className="font-medium text-ink underline underline-offset-4">
            Create admin
          </Link>
          {" · "}
          Customer?{" "}
          <Link to="/enter" className="font-medium text-ink underline underline-offset-4">
            Continue here
          </Link>
        </p>
      </div>
    </main>
  );
}
