import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { StatusPill } from "@/components/salon/status-pill";
import { StylistAvatar } from "@/components/salon/stylist-avatar";
import {
  ensureStaffAccount,
  type StaffAccount,
  type StaffRole as LoginRole,
  supabaseSignUp,
} from "@/lib/auth/supabase-auth";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/salon/supabase";
import { services } from "@/lib/salon/data";
import { todayKey } from "@/lib/engines/schedule";
import { effectiveShift, useSalonStore } from "@/lib/salon/store";
import type { StaffRole, TeamMember } from "@/lib/salon/types";

export const Route = createFileRoute("/admin/staff/")({ component: AdminStaff });

function AdminStaff() {
  const appointments = useSalonStore((s) => s.appointments);
  const staffStatus = useSalonStore((s) => s.staffStatus);
  const team = useSalonStore((s) => s.team);
  const addStaff = useSalonStore((s) => s.addStaff);
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [logins, setLogins] = useState<StaffAccount[] | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const today = todayKey();

  useEffect(() => {
    const base = SUPABASE_URL;
    const anon = SUPABASE_ANON_KEY;
    fetch(`${base}/rest/v1/salon_staff?active=eq.true&select=id,email,name,role&order=name.asc`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
    })
      .then(async (r) => {
        if (!r.ok) return [];
        const rows = (await r.json()) as Array<{ id: string; email: string | null; name: string; role: string }>;
        return rows
          .filter((x) => x.email && ["admin", "manager", "receptionist", "stylist"].includes(x.role))
          .map((x) => ({
            id: x.id,
            email: x.email || "",
            name: x.name,
            role: x.role as LoginRole,
            teamMemberId: x.id,
          }));
      })
      .then(setLogins)
      .catch(() => setLogins([]));
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <div className="flex items-end justify-between">
        <h1 className="text-title font-normal">Staff</h1>
        <Button className="h-11" onClick={() => setOpen(true)}>
          Add staff
        </Button>
      </div>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((m) => {
          const shift = effectiveShift(m.id, appointments, staffStatus[m.id] ?? "available");
          const n = appointments.filter((a) => a.date === today && a.stylistId === m.id).length;
          return (
            <li key={m.id}>
              <Link to="/admin/staff/$id" params={{ id: m.id }} className="block rounded-[24px] bg-surface p-5">
                <div className="flex items-center gap-4">
                  <StylistAvatar stylist={m} />
                  <div>
                    <p className="text-body font-medium">{m.name}</p>
                    <p className="text-support text-muted">{m.title}</p>
                    <div className="mt-1">
                      <StatusPill status={shift} />
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-support text-muted">Today’s appointments · {n}</p>
              </Link>
            </li>
          );
        })}
      </ul>

      {true && (
        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-section font-normal">Staff logins</h2>
              <p className="mt-1 text-support text-muted">Who can sign in to the staff and admin apps.</p>
            </div>
            <Button variant="secondary" className="h-11" onClick={() => setLoginOpen(true)}>
              Create login
            </Button>
          </div>
          <ul className="mt-4 space-y-2">
            {(logins ?? []).map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-[20px] bg-surface px-4 py-3 text-support"
              >
                <span>
                  <span className="block font-medium text-ink">{a.name}</span>
                  <span className="text-muted">{a.email}</span>
                </span>
                <span className="capitalize text-muted">{a.role}</span>
              </li>
            ))}
            {logins?.length === 0 && <p className="text-support text-muted">No staff logins yet.</p>}
          </ul>
        </section>
      )}

      {loginOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <form
            className="w-full max-w-lg rounded-[24px] bg-surface p-6"
            onSubmit={(e) => {
              e.preventDefault();
              setLoginError(null);
              const fd = new FormData(e.currentTarget);
              const name = String(fd.get("name"));
              const email = String(fd.get("email"));
              const password = String(fd.get("password"));
              const role = String(fd.get("role")) as LoginRole;
              void (async () => {
                try {
                  const up = await supabaseSignUp({ email, password, name });
                  if (up.error && !up.userId) {
                    setLoginError(up.error);
                    return;
                  }
                  const userId = up.userId;
                  const ensured = await ensureStaffAccount({
                    userId,
                    email,
                    name,
                    role,
                    accessToken: up.session?.access_token,
                  });
                  if (!ensured.ok) {
                    setLoginError(ensured.error || "Could not save staff profile.");
                    return;
                  }
                  setLogins((prev) => [
                    ...(prev ?? []).filter((x) => x.id !== userId),
                    { id: userId, email, name, role, teamMemberId: userId },
                  ]);
                  setLoginOpen(false);
                } catch (err) {
                  setLoginError(err instanceof Error ? err.message : "Could not create the login.");
                }
              })();
            }}
          >
            <p className="text-section font-normal">Create staff login</p>
            <Label className="mt-4">Name</Label>
            <Input name="name" required />
            <Label className="mt-4">Email</Label>
            <Input name="email" type="email" required />
            <Label className="mt-4">Temporary password</Label>
            <Input name="password" type="password" minLength={8} required />
            <Label className="mt-4">Role</Label>
            <select name="role" className="h-13 w-full rounded-2xl border border-line bg-surface px-4 text-body">
              <option value="stylist">Stylist</option>
              <option value="receptionist">Receptionist</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            {loginError && <p className="mt-3 rounded-2xl bg-brand-soft px-4 py-3 text-support text-brand">{loginError}</p>}
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button type="button" variant="secondary" className="h-12" onClick={() => setLoginOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="h-12">
                Create
              </Button>
            </div>
          </form>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <form
            className="w-full max-w-lg rounded-[24px] bg-surface p-6"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const name = String(fd.get("name"));
              const role = String(fd.get("role")) as StaffRole;
              const department = String(fd.get("department") || "hair") as import("@/lib/salon/types").Category;
              const id = name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now().toString(36).slice(-4);
              const member: TeamMember = {
                id,
                name,
                title: String(fd.get("title") || role),
                bio: "",
                specialties: [department],
                initials: name.slice(0, 1).toUpperCase(),
                rating: 5,
                role,
                phone: String(fd.get("phone")),
                email: `${id}@salon.local`,
                serviceIds:
                  role === "stylist"
                    ? services.filter((s) => s.category === department).map((s) => s.id)
                    : [],
                hours: [
                  ...[1, 2, 3, 4, 5, 6].map((day) => ({ day, start: "09:00", end: "19:00" })),
                  { day: 0, start: "00:00", end: "00:00", off: true },
                ],
                active: true,
              };
              addStaff(member);
              setOpen(false);
            }}
          >
            <p className="text-section font-normal">Add staff</p>
            <Label className="mt-4">Name</Label>
            <Input name="name" required />
            <Label className="mt-4">Title</Label>
            <Input name="title" placeholder="Braiding Specialist" />
            <Label className="mt-4">Phone</Label>
            <Input name="phone" required placeholder="+255" />
            <Label className="mt-4">Role</Label>
            <select name="role" className="h-13 w-full rounded-2xl border border-line bg-surface px-4 text-body">
              <option value="stylist">Stylist (department)</option>
              <option value="receptionist">Receptionist</option>
              <option value="manager">Manager</option>
            </select>
            <Label className="mt-4">Department</Label>
            <select name="department" className="h-13 w-full rounded-2xl border border-line bg-surface px-4 text-body">
              <option value="hair">Hair</option>
              <option value="nails">Nails</option>
              <option value="makeup">Makeup</option>
              <option value="treatments">Treatments</option>
            </select>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button type="button" variant="secondary" className="h-12" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="h-12">
                Add
              </Button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
