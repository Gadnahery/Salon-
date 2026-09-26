import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { authEnabled } from "@/lib/auth/client";
import type { StaffRole } from "@/lib/auth/staff-actions";
import { useStaffAccount } from "@/lib/auth/use-staff-account";
import { useSalonStore } from "@/lib/salon/store";
import type { Portal } from "@/lib/salon/types";

/**
 * Gates `/admin` and `/staff` behind a real signed-in staff account with an
 * allowed role. With `VITE_AUTH_ENABLED=false` (local preview default) this
 * is a no-op — the existing `/enter` demo picker keeps working unchanged.
 *
 * On success it also mirrors the resolved identity into the local salon
 * store's `session` so the rest of the app (which reads `session.portal` /
 * `session.actorId` / `session.name`) keeps working unmodified.
 */
export function useRequireStaffRole(portal: Portal, allowed: StaffRole[]) {
  const navigate = useNavigate();
  const enterAs = useSalonStore((s) => s.enterAs);
  const { account, isPending } = useStaffAccount();

  useEffect(() => {
    if (!authEnabled) return; // local preview — /enter's demo picker handles this
    if (isPending) return;
    if (!account) {
      void navigate({ to: "/login" });
      return;
    }
    if (!allowed.includes(account.role)) return; // "not authorized" screen below
    enterAs({
      portal,
      actorId: account.teamMemberId ?? account.id,
      name: account.name,
      role: account.role,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once the account resolves
  }, [authEnabled, isPending, account, portal]);

  if (!authEnabled) return { status: "ok" as const };
  if (isPending) return { status: "pending" as const };
  if (!account) return { status: "redirecting" as const };
  if (!allowed.includes(account.role)) return { status: "forbidden" as const, account };
  return { status: "ok" as const, account };
}

export function NotAuthorizedScreen({ email }: { email?: string }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-5 text-center">
      <div>
        <p className="text-body font-medium">Not authorized</p>
        <p className="mt-1 text-support text-muted">
          {email ? `${email} is` : "This account is"} signed in but doesn't have access to this area.
        </p>
        <a href="/login" className="mt-4 inline-block text-support text-muted underline underline-offset-4">
          Sign in with a different account
        </a>
      </div>
    </div>
  );
}
