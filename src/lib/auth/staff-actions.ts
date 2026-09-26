import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "./middleware";
import { DEV_USER_ID } from "./verify.server";

/**
 * NOT suffixed `.server.ts` on purpose: these `createServerFn` definitions are
 * called from client routes (`/login`, `/setup`, the admin staff page), and
 * the framework only code-splits handler bodies out of the client bundle for
 * files it's allowed to import. Node-only deps (`getSql`, the Better Auth
 * `auth` instance) are dynamic-imported inside each handler, never at module
 * top level, so the client bundle never has to resolve them (see
 * `./middleware` for the same pattern).
 */

export type StaffRole = "admin" | "manager" | "receptionist" | "stylist";

export type StaffAccount = {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  teamMemberId: string | null;
};

/** The signed-in user's staff account, or `null` if they have none (not staff). */
export const getMyStaffAccountFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<StaffAccount | null> => {
    if (context.userId === DEV_USER_ID) {
      return { id: DEV_USER_ID, email: "dev@example.com", name: "Dev Admin", role: "admin", teamMemberId: null };
    }
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ id: string; email: string; name: string; role: StaffRole; team_member_id: string | null }>`
      select id, email, name, role, team_member_id
      from salon_staff_accounts
      where id = ${context.userId} and active = true
    `;
    const row = rows[0];
    if (!row) return null;
    return { id: row.id, email: row.email, name: row.name, role: row.role, teamMemberId: row.team_member_id };
  });

/** True when no staff accounts exist yet — the one-time `/setup` page uses this. */
export const staffSetupNeededFn = createServerFn({ method: "GET" }).handler(async (): Promise<boolean> => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<{ count: string }>`select count(*)::text as count from salon_staff_accounts`;
  return (rows[0]?.count ?? "0") === "0";
});

/**
 * Claim the first admin account for the CURRENTLY signed-in user. Only
 * succeeds once, when `salon_staff_accounts` is empty — the sign-up form on
 * `/setup` calls `authClient.signUp.email(...)` first (which signs the
 * browser in), then this.
 */
export const claimFirstAdminFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<StaffAccount> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const existing = await sql<{ count: string }>`select count(*)::text as count from salon_staff_accounts`;
    if ((existing[0]?.count ?? "0") !== "0") {
      throw new Error("Setup already completed — sign in instead.");
    }
    const users = await sql<{ email: string; name: string }>`select email, name from "user" where id = ${context.userId}`;
    const user = users[0];
    if (!user) throw new Error("User not found");
    await sql`
      insert into salon_staff_accounts (id, email, name, role, active)
      values (${context.userId}, ${user.email}, ${user.name}, 'admin', true)
      on conflict (id) do nothing
    `;
    return { id: context.userId, email: user.email, name: user.name, role: "admin", teamMemberId: null };
  });

/**
 * Admin/manager-only: create a new staff or admin login. Creates the Better
 * Auth user server-side (does NOT touch the calling admin's browser session,
 * unlike `authClient.signUp.email` which would sign them out) and attaches a
 * role in one step.
 */
export const createStaffAccountFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: { email: string; password: string; name: string; role: StaffRole; teamMemberId?: string }) => input,
  )
  .handler(async ({ context, data }): Promise<StaffAccount> => {
    const { getSql } = await import("@/lib/db");
    const { auth } = await import("./server");
    const sql = await getSql();
    const callers = await sql<{ role: StaffRole }>`select role from salon_staff_accounts where id = ${context.userId} and active = true`;
    const isDevAdmin = context.userId === DEV_USER_ID;
    const callerRole = callers[0]?.role;
    if (!isDevAdmin && callerRole !== "admin" && callerRole !== "manager") {
      throw new Error("Only an admin or manager can create staff accounts.");
    }
    const result = await auth.api.signUpEmail({
      body: { email: data.email, password: data.password, name: data.name },
    });
    const newUserId = result?.user?.id;
    if (!newUserId) throw new Error("Could not create the login.");
    await sql`
      insert into salon_staff_accounts (id, email, name, role, team_member_id, active)
      values (${newUserId}, ${data.email}, ${data.name}, ${data.role}, ${data.teamMemberId ?? null}, true)
      on conflict (id) do update set role = excluded.role, team_member_id = excluded.team_member_id, active = true
    `;
    return { id: newUserId, email: data.email, name: data.name, role: data.role, teamMemberId: data.teamMemberId ?? null };
  });

/** List all staff/admin accounts — admin/manager only. */
export const listStaffAccountsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<StaffAccount[]> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    if (context.userId !== DEV_USER_ID) {
      const callers = await sql<{ role: StaffRole }>`select role from salon_staff_accounts where id = ${context.userId} and active = true`;
      const callerRole = callers[0]?.role;
      if (callerRole !== "admin" && callerRole !== "manager") {
        throw new Error("Only an admin or manager can view staff accounts.");
      }
    }
    const rows = await sql<{ id: string; email: string; name: string; role: StaffRole; team_member_id: string | null }>`
      select id, email, name, role, team_member_id from salon_staff_accounts where active = true order by created_at asc
    `;
    return rows.map((r) => ({ id: r.id, email: r.email, name: r.name, role: r.role, teamMemberId: r.team_member_id }));
  });

/** Deactivate a staff/admin login — admin only. */
export const deactivateStaffAccountFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string }) => input)
  .handler(async ({ context, data }): Promise<void> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const callers = await sql<{ role: StaffRole }>`select role from salon_staff_accounts where id = ${context.userId} and active = true`;
    if (context.userId !== DEV_USER_ID && callers[0]?.role !== "admin") {
      throw new Error("Only an admin can remove staff accounts.");
    }
    if (data.id === context.userId) throw new Error("You cannot deactivate your own account.");
    await sql`update salon_staff_accounts set active = false where id = ${data.id}`;
  });
