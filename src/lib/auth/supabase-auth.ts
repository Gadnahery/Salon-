/**
 * Staff/admin authentication via Supabase Auth (email + password).
 * Replaces Better Auth for /setup and /login.
 * Session is stored in localStorage; never put secrets in the client beyond the anon key.
 */
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/salon/supabase";

const SESSION_KEY = "salon-supabase-session";

export type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: {
    id: string;
    email?: string;
    user_metadata?: { name?: string };
  };
};

export type StaffRole = "admin" | "manager" | "receptionist" | "stylist";

export type StaffAccount = {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  teamMemberId: string | null;
};

function base() {
  return (
    (typeof import.meta !== "undefined" ? import.meta.env.VITE_SUPABASE_URL : undefined) ||
    SUPABASE_URL
  );
}

function anon() {
  return (
    (typeof import.meta !== "undefined" ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined) ||
    SUPABASE_ANON_KEY
  );
}

export function loadSession(): SupabaseSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SupabaseSession;
  } catch {
    return null;
  }
}

export function saveSession(session: SupabaseSession | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function supabaseSignUp(input: {
  email: string;
  password: string;
  name: string;
}): Promise<{ session: SupabaseSession | null; userId: string; error?: string }> {
  const res = await fetch(`${base()}/auth/v1/signup`, {
    method: "POST",
    headers: {
      apikey: anon(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      data: { name: input.name },
    }),
  });
  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    user?: { id: string; email?: string; user_metadata?: { name?: string } };
    id?: string;
    email?: string;
    msg?: string;
    error_description?: string;
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    return {
      session: null,
      userId: "",
      error: json.msg || json.error_description || json.message || json.error || `Sign up failed (${res.status})`,
    };
  }

  // Signup may return user without session if email confirm is required
  const userId = json.user?.id || json.id || "";
  if (json.access_token && json.user) {
    const session: SupabaseSession = {
      access_token: json.access_token,
      refresh_token: json.refresh_token || "",
      expires_at: json.expires_at,
      user: json.user,
    };
    saveSession(session);
    return { session, userId: json.user.id };
  }

  if (userId) {
    // Try password grant immediately (confirm email disabled)
    const signed = await supabaseSignIn({ email: input.email, password: input.password });
    if (signed.session) return { session: signed.session, userId: signed.session.user.id };
    return { session: null, userId, error: signed.error };
  }

  return { session: null, userId: "", error: "Sign up returned no user id." };
}

export async function supabaseSignIn(input: {
  email: string;
  password: string;
}): Promise<{ session: SupabaseSession | null; error?: string }> {
  const res = await fetch(`${base()}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anon(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    }),
  });
  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    user?: { id: string; email?: string; user_metadata?: { name?: string } };
    msg?: string;
    error_description?: string;
    error?: string;
    message?: string;
  };

  if (!res.ok || !json.access_token || !json.user) {
    return {
      session: null,
      error:
        json.msg ||
        json.error_description ||
        json.message ||
        json.error ||
        `Sign in failed (${res.status})`,
    };
  }

  const session: SupabaseSession = {
    access_token: json.access_token,
    refresh_token: json.refresh_token || "",
    expires_at: json.expires_at,
    user: json.user,
  };
  saveSession(session);
  return { session };
}

export async function supabaseSignOut() {
  const session = loadSession();
  if (session?.access_token) {
    try {
      await fetch(`${base()}/auth/v1/logout`, {
        method: "POST",
        headers: {
          apikey: anon(),
          Authorization: `Bearer ${session.access_token}`,
        },
      });
    } catch {
      /* ignore */
    }
  }
  saveSession(null);
}

/**
 * Persist staff/admin profile for this Supabase Auth user.
 * Uses `salon_staff` (open RLS) because `salon_staff_accounts` is locked by RLS
 * until SQL policies are applied in the Supabase SQL editor.
 */
export async function ensureStaffAccount(input: {
  userId: string;
  email: string;
  name: string;
  role: StaffRole;
  accessToken?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const headers: Record<string, string> = {
    apikey: anon(),
    Authorization: `Bearer ${input.accessToken || anon()}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=minimal",
  };

  const title =
    input.role === "admin"
      ? "Owner"
      : input.role === "manager"
        ? "Manager"
        : input.role === "receptionist"
          ? "Reception"
          : "Stylist";

  const res = await fetch(`${base()}/rest/v1/salon_staff?on_conflict=id`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      id: input.userId,
      name: input.name,
      title,
      role: input.role,
      email: input.email.trim().toLowerCase(),
      phone: null,
      active: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    // Still try salon_staff_accounts if policies were added
    const res2 = await fetch(`${base()}/rest/v1/salon_staff_accounts?on_conflict=id`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        id: input.userId,
        email: input.email.trim().toLowerCase(),
        name: input.name,
        role: input.role,
        active: true,
      }),
    });
    if (!res2.ok) {
      return { ok: false, error: text || `Could not save staff account (${res.status})` };
    }
  }
  return { ok: true };
}

function mapStaffRow(r: {
  id: string;
  email?: string | null;
  name: string;
  role: string;
  team_member_id?: string | null;
}): StaffAccount {
  const role = (["admin", "manager", "receptionist", "stylist"].includes(r.role)
    ? r.role
    : "stylist") as StaffRole;
  return {
    id: r.id,
    email: r.email || "",
    name: r.name,
    role,
    teamMemberId: r.team_member_id ?? r.id,
  };
}

/**
 * Resolve staff/admin for the signed-in Supabase user.
 * Matches by auth user id first, then by email (legacy rows like id "lewis").
 * When email matches, re-keys the row to the auth user id so future logins work.
 */
export async function fetchMyStaffAccount(
  accessToken?: string,
  userId?: string,
  emailHint?: string,
): Promise<StaffAccount | null> {
  const session = loadSession();
  const token = accessToken || session?.access_token || anon();
  const uid = userId || session?.user?.id;
  const email = (emailHint || session?.user?.email || "").trim().toLowerCase();
  if (!uid && !email) return null;

  const headers = {
    apikey: anon(),
    Authorization: `Bearer ${token}`,
  };

  // 1) By auth user id
  if (uid) {
    const res = await fetch(
      `${base()}/rest/v1/salon_staff?id=eq.${encodeURIComponent(uid)}&active=eq.true&select=id,email,name,role`,
      { headers },
    );
    if (res.ok) {
      const rows = (await res.json()) as Array<{
        id: string;
        email: string | null;
        name: string;
        role: string;
      }>;
      if (rows[0]) return mapStaffRow(rows[0]);
    }

    const resAcc = await fetch(
      `${base()}/rest/v1/salon_staff_accounts?id=eq.${encodeURIComponent(uid)}&active=eq.true&select=id,email,name,role,team_member_id`,
      { headers: { apikey: anon(), Authorization: `Bearer ${anon()}` } },
    );
    if (resAcc.ok) {
      const rows = (await resAcc.json()) as Array<{
        id: string;
        email: string;
        name: string;
        role: StaffRole;
        team_member_id: string | null;
      }>;
      if (rows[0]) return mapStaffRow(rows[0]);
    }
  }

  // 2) By email (seeded "lewis" / "admin-profile" rows)
  if (email) {
    const res = await fetch(
      `${base()}/rest/v1/salon_staff?email=eq.${encodeURIComponent(email)}&active=eq.true&select=id,email,name,role`,
      { headers },
    );
    if (res.ok) {
      const rows = (await res.json()) as Array<{
        id: string;
        email: string | null;
        name: string;
        role: string;
      }>;
      const r = rows.find((x) => x.role === "admin") || rows[0];
      if (r && uid) {
        // Re-key to auth user id so id-based lookups succeed next time
        await ensureStaffAccount({
          userId: uid,
          email,
          name: r.name,
          role: (["admin", "manager", "receptionist", "stylist"].includes(r.role)
            ? r.role
            : "stylist") as StaffRole,
          accessToken: token,
        });
        return mapStaffRow({ ...r, id: uid, email });
      }
      if (r) return mapStaffRow(r);
    }
  }

  return null;
}

/**
 * After a successful password login: if no staff row yet but email is the
 * known owner email, promote this auth user to admin on salon_staff.
 */
export async function claimStaffAfterLogin(input: {
  userId: string;
  email: string;
  name?: string;
  accessToken: string;
}): Promise<StaffAccount | null> {
  const email = input.email.trim().toLowerCase();
  const account = await fetchMyStaffAccount(input.accessToken, input.userId, email);
  if (account) return account;

  // Owner email always allowed to claim admin once signed in via Supabase Auth
  const ownerEmails = ["gadnahery7@gmail.com"];
  if (ownerEmails.includes(email)) {
    const ensured = await ensureStaffAccount({
      userId: input.userId,
      email,
      name: input.name || "Admin",
      role: "admin",
      accessToken: input.accessToken,
    });
    if (ensured.ok) {
      return {
        id: input.userId,
        email,
        name: input.name || "Admin",
        role: "admin",
        teamMemberId: input.userId,
      };
    }
  }

  return null;
}

export async function countActiveAdmins(): Promise<number> {
  // Use salon_staff (open RLS). Fall back to staff_accounts if needed.
  const res = await fetch(
    `${base()}/rest/v1/salon_staff?role=eq.admin&active=eq.true&select=id`,
    {
      headers: {
        apikey: anon(),
        Authorization: `Bearer ${anon()}`,
      },
    },
  );
  if (res.ok) {
    const rows = (await res.json()) as unknown[];
    if (Array.isArray(rows) && rows.length > 0) return rows.length;
  }
  const res2 = await fetch(
    `${base()}/rest/v1/salon_staff_accounts?role=eq.admin&active=eq.true&select=id`,
    {
      headers: {
        apikey: anon(),
        Authorization: `Bearer ${anon()}`,
      },
    },
  );
  if (!res2.ok) return 0;
  const rows2 = (await res2.json()) as unknown[];
  return Array.isArray(rows2) ? rows2.length : 0;
}

export async function bootstrapAdminWithSupabase(input: {
  email: string;
  password: string;
  name: string;
}): Promise<{ ok: true; account: StaffAccount } | { ok: false; error: string }> {
  // Always prefer sign-in + claim (handles seeded lewis/admin-profile rows)
  const signedEarly = await supabaseSignIn(input);
  if (signedEarly.session) {
    const claimed = await claimStaffAfterLogin({
      userId: signedEarly.session.user.id,
      email: input.email,
      name: input.name,
      accessToken: signedEarly.session.access_token,
    });
    if (claimed?.role === "admin") {
      return { ok: true, account: claimed };
    }
  }

  const admins = await countActiveAdmins();
  if (admins > 0 && !signedEarly.session) {
    return {
      ok: false,
      error:
        signedEarly.error ||
        "An admin profile already exists. Sign in at /login with the correct password.",
    };
  }

  let userId = "";
  let accessToken: string | undefined;

  const up = await supabaseSignUp(input);
  if (up.error && !up.userId) {
    // Maybe already registered
    const signed = await supabaseSignIn(input);
    if (!signed.session) {
      return { ok: false, error: up.error || signed.error || "Could not create account." };
    }
    userId = signed.session.user.id;
    accessToken = signed.session.access_token;
  } else {
    userId = up.userId;
    accessToken = up.session?.access_token;
    if (!accessToken) {
      const signed = await supabaseSignIn(input);
      accessToken = signed.session?.access_token;
      userId = signed.session?.user.id || userId;
      if (!accessToken) {
        return {
          ok: false,
          error:
            signed.error ||
            up.error ||
            "Account created but could not sign in. Disable “Confirm email” in Supabase Auth settings, then try again.",
        };
      }
    }
  }

  const ensured = await ensureStaffAccount({
    userId,
    email: input.email,
    name: input.name,
    role: "admin",
    accessToken,
  });
  if (!ensured.ok) {
    return { ok: false, error: ensured.error || "Could not save admin profile." };
  }

  return {
    ok: true,
    account: {
      id: userId,
      email: input.email.trim().toLowerCase(),
      name: input.name,
      role: "admin",
      teamMemberId: null,
    },
  };
}
