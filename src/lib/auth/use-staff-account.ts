import { useEffect, useState } from "react";
import { getMyStaffAccountFn, type StaffAccount } from "./staff-actions";
import { useCurrentUserState } from "./use-current-user";

export type StaffAccountState = {
  account: StaffAccount | null;
  /** True while the auth session OR the staff-account lookup is still resolving. */
  isPending: boolean;
};

/**
 * Resolves to the signed-in user's staff/admin account (role + linked team
 * profile), or `null` once we know they have none. Waits out the auth
 * session first so it never fires a lookup for a signed-out visitor.
 */
export function useStaffAccount(): StaffAccountState {
  const { user, isPending: userPending } = useCurrentUserState();
  const [account, setAccount] = useState<StaffAccount | null>(null);
  const [lookupPending, setLookupPending] = useState(true);

  useEffect(() => {
    if (userPending) return;
    if (!user) {
      setAccount(null);
      setLookupPending(false);
      return;
    }
    let cancelled = false;
    setLookupPending(true);
    getMyStaffAccountFn()
      .then((result) => {
        if (!cancelled) setAccount(result);
      })
      .catch(() => {
        if (!cancelled) setAccount(null);
      })
      .finally(() => {
        if (!cancelled) setLookupPending(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, userPending]);

  return { account, isPending: userPending || lookupPending };
}
