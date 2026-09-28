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

/** Ensure public.user + salon_staff_accounts rows exist for this Supabase user. */
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

  // Better Auth leftover table — insert so FK on salon_staff_accounts can succeed if present.
  await fetch(`${base()}/rest/v1/user?on_conflict=id`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      id: input.userId,
      name: input.name,
      email: input.email.trim().toLowerCase(),
      emailVerified: true,
    }),
  }).catch(() => null);

  const res = await fetch(`${base()}/rest/v1/salon_staff_accounts?on_conflict=id`, {
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

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: text || `Could not save staff account (${res.status})` };
  }
  return { ok: true };
}

export async function fetchMyStaffAccount(
  accessToken?: string,
  userId?: string,
): Promise<StaffAccount | null> {
  const session = loadSession();
  const token = accessToken || session?.access_token;
  const uid = userId || session?.user?.id;
  if (!token || !uid) return null;

  const res = await fetch(
    `${base()}/rest/v1/salon_staff_accounts?id=eq.${encodeURIComponent(uid)}&active=eq.true&select=id,email,name,role,team_member_id`,
    {
      headers: {
        apikey: anon(),
        Authorization: `Bearer ${token}`,
      },
    },
  );
  if (!res.ok) {
    // Fallback with anon key (RLS open)
    const res2 = await fetch(
      `${base()}/rest/v1/salon_staff_accounts?id=eq.${encodeURIComponent(uid)}&active=eq.true&select=id,email,name,role,team_member_id`,
      {
        headers: {
          apikey: anon(),
          Authorization: `Bearer ${anon()}`,
        },
      },
    );
    if (!res2.ok) return null;
    const rows2 = (await res2.json()) as Array<{
      id: string;
      email: string;
      name: string;
      role: StaffRole;
      team_member_id: string | null;
    }>;
    const r = rows2[0];
    if (!r) return null;
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      teamMemberId: r.team_member_id,
    };
  }
  const rows = (await res.json()) as Array<{
    id: string;
    email: string;
    name: string;
    role: StaffRole;
    team_member_id: string | null;
  }>;
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role,
    teamMemberId: r.team_member_id,
  };
}

export async function countActiveAdmins(): Promise<number> {
  const res = await fetch(
    `${base()}/rest/v1/salon_staff_accounts?role=eq.admin&active=eq.true&select=id`,
    {
      headers: {
        apikey: anon(),
        Authorization: `Bearer ${anon()}`,
        Prefer: "count=exact",
      },
    },
  );
  if (!res.ok) return 0;
  const rows = (await res.json()) as unknown[];
  return Array.isArray(rows) ? rows.length : 0;
}

export async function bootstrapAdminWithSupabase(input: {
  email: string;
  password: string;
  name: string;
}): Promise<{ ok: true; account: StaffAccount } | { ok: false; error: string }> {
  const admins = await countActiveAdmins();
  if (admins > 0) {
    // Allow re-claim if this email can sign in and becomes admin
    const signed = await supabaseSignIn(input);
    if (signed.session) {
      const existing = await fetchMyStaffAccount(signed.session.access_token, signed.session.user.id);
      if (existing?.role === "admin") {
        return { ok: true, account: existing };
      }
    }
    return { ok: false, error: "An admin already exists. Sign in at /login instead." };
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
