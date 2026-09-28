import { useEffect, useState } from "react";
import {
  fetchMyStaffAccount,
  loadSession,
  type StaffAccount,
} from "./supabase-auth";

export type StaffAccountState = {
  account: StaffAccount | null;
  isPending: boolean;
};

/**
 * Resolves staff/admin account from the Supabase Auth session in localStorage.
 */
export function useStaffAccount(): StaffAccountState {
  const [account, setAccount] = useState<StaffAccount | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const session = loadSession();
    if (!session) {
      setAccount(null);
      setIsPending(false);
      return;
    }
    fetchMyStaffAccount(session.access_token, session.user.id)
      .then((a) => {
        if (!cancelled) {
          setAccount(a);
          setIsPending(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAccount(null);
          setIsPending(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { account, isPending };
}
