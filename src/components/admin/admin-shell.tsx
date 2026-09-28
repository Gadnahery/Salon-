import { NotifyPrompt } from "@/components/salon/notify-prompt";
import { InstallPrompt } from "@/components/salon/install-prompt";
import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  CreditCard,
  Images,
  LayoutDashboard,
  LayoutList,
  Menu,
  Settings,
  Sparkles,
  Star,
  Users,
  UserRound,
  Scissors,
  BarChart3,
  ScrollText,
  X,
} from "lucide-react";
import { LogoWord } from "@/components/salon/logo";
import { NotAuthorizedScreen, useRequireStaffRole } from "@/components/auth/require-staff-role";
import { useSalonStore } from "@/lib/salon/store";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/bookings", label: "Bookings", icon: ScrollText },
  { to: "/admin/queue", label: "Queue", icon: LayoutList },
  { to: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/staff", label: "Staff", icon: UserRound },
  { to: "/admin/services", label: "Services", icon: Scissors },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/marketing", label: "Marketing", icon: Sparkles },
  { to: "/admin/gallery", label: "Gallery", icon: Images },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
];

const lower = [
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/settings", label: "Settings", icon: Settings },
  { to: "/admin/audit", label: "Audit log", icon: ScrollText },
];

export function AdminShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const session = useSalonStore((s) => s.session);
  const toast = useSalonStore((s) => s.toast);
  const setToast = useSalonStore((s) => s.setToast);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const gate = useRequireStaffRole("admin", ["admin", "manager"]);

  useEffect(() => {
    if (gate.status !== "ok") return;
    if (session.portal !== "admin") {
      void navigate({ to: "/enter", search: { as: "admin" } });
    }
  }, [gate.status, session.portal, navigate]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast, setToast]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (gate.status === "pending" || gate.status === "redirecting") return null;
  if (gate.status === "forbidden") return <NotAuthorizedScreen email={gate.account.email} />;

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface px-5 py-7 lg:flex">
        <Link to="/admin">
          <LogoWord />
        </Link>
        <p className="mt-2 text-micro uppercase tracking-[0.16em] text-muted">Admin</p>
        <NavList pathname={pathname} />
        <div className="mt-auto flex items-center gap-3 px-2 pt-4">
          <span className="flex size-9 items-center justify-center rounded-full bg-ink font-display text-sm text-white">
            L
          </span>
          <div>
            <p className="text-support font-medium">Lewis</p>
            <p className="text-micro uppercase tracking-[0.12em] text-muted">Admin</p>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-bg/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <button type="button" aria-label="Open menu" className="flex size-11 items-center justify-center" onClick={() => setOpen(true)}>
          <Menu className="size-5" strokeWidth={1.75} />
        </button>
        <LogoWord />
        <Link to="/admin/notifications" className="flex size-11 items-center justify-center">
          <Bell className="size-5" strokeWidth={1.75} />
        </Link>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface px-5 py-6">
            <div className="flex items-center justify-between">
              <LogoWord />
              <button type="button" className="flex size-11 items-center justify-center" onClick={() => setOpen(false)}>
                <X className="size-5" />
              </button>
            </div>
            <NavList pathname={pathname} />
          </div>
        </div>
      )}

      <div className="lg:pl-60">
        <NotifyPrompt />
        <InstallPrompt portal="admin" />
        <Outlet />
      </div>

      {toast && (
        <div className="fixed inset-x-0 bottom-8 z-50 flex justify-center px-5">
          <p className="rounded-full bg-ink px-4 py-2.5 text-support text-white shadow-float">{toast}</p>
        </div>
      )}
    </div>
  );
}

function NavList({ pathname }: { pathname: string }) {
  return (
    <>
      <nav className="mt-8 flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {nav.map((item) => (
          <AdminLink key={item.to} item={item} pathname={pathname} />
        ))}
        <div className="my-4 border-t border-line" />
        {lower.map((item) => (
          <AdminLink key={item.to} item={item} pathname={pathname} />
        ))}
      </nav>
      <Link to="/enter" className="mt-4 px-3 text-support text-muted hover:text-ink">
        Switch role
      </Link>
    </>
  );
}

function AdminLink({
  item,
  pathname,
}: {
  item: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
  pathname: string;
}) {
  const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-support",
        active ? "bg-bg font-medium text-ink" : "text-muted hover:bg-bg hover:text-ink",
      )}
    >
      <Icon className="size-4" strokeWidth={1.75} />
      {item.label}
    </Link>
  );
}
