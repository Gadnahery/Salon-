import { NotifyPrompt } from "@/components/salon/notify-prompt";
import { InstallPrompt } from "@/components/salon/install-prompt";
import { useEffect } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { CalendarDays, LayoutList, MoreHorizontal, SunMedium } from "lucide-react";
import { LogoWord } from "@/components/salon/logo";
import { NotAuthorizedScreen, useRequireStaffRole } from "@/components/auth/require-staff-role";
import { useSalonStore } from "@/lib/salon/store";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/staff", label: "Today", icon: SunMedium, exact: true },
  { to: "/staff/queue", label: "Queue", icon: LayoutList, exact: false },
  { to: "/staff/calendar", label: "Calendar", icon: CalendarDays, exact: false },
  { to: "/staff/more", label: "More", icon: MoreHorizontal, exact: false },
] as const;

export function StaffShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const session = useSalonStore((s) => s.session);
  const toast = useSalonStore((s) => s.toast);
  const setToast = useSalonStore((s) => s.setToast);
  const navigate = useNavigate();
  const gate = useRequireStaffRole("staff", ["admin", "manager", "receptionist", "stylist"]);
  const hideNav =
    pathname.includes("/walk-in") ||
    pathname.includes("/availability") ||
    pathname.includes("/profile") ||
    /\/staff\/appointments\//.test(pathname) ||
    /\/staff\/customers\//.test(pathname);

  useEffect(() => {
    if (gate.status !== "ok") return;
    if (session.portal !== "staff" && session.portal !== "admin") {
      void navigate({ to: "/enter", search: { as: "staff" } });
    }
  }, [gate.status, session.portal, navigate]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast, setToast]);

  if (gate.status === "pending" || gate.status === "redirecting") return null;
  if (gate.status === "forbidden") return <NotAuthorizedScreen email={gate.account.email} />;

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-line bg-surface px-5 py-8 lg:flex">
        <Link to="/staff">
          <LogoWord />
        </Link>
        <p className="mt-2 text-micro uppercase tracking-[0.16em] text-muted">Staff</p>
        <nav className="mt-10 flex flex-1 flex-col gap-1">
          {tabs.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "rounded-2xl px-3 py-3 text-body",
                  active ? "bg-bg font-medium" : "text-muted hover:bg-bg hover:text-ink",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <Link to="/enter" className="text-support text-muted hover:text-ink">
          Switch role
        </Link>
      </aside>

      <div className={cn("lg:pl-56", hideNav ? "pb-0" : "pb-24 lg:pb-0")}>
        <NotifyPrompt />
        <InstallPrompt portal="staff" />
        <Outlet />
      </div>

      {!hideNav && (
        <>
          <nav className="glass-nav fixed inset-x-0 bottom-0 z-40 border-t border-line lg:hidden">
            <div className="mx-auto grid max-w-lg grid-cols-4 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
              {tabs.map((t) => (
                <TabLink key={t.to} tab={t} pathname={pathname} />
              ))}
            </div>
          </nav>
          <Link
            to="/staff/walk-in"
            className="fixed right-5 z-40 flex h-14 items-center gap-2 rounded-full bg-ink px-5 text-support font-medium text-white shadow-float lg:right-8"
            style={{ bottom: hideNav ? 24 : "calc(5.5rem + env(safe-area-inset-bottom))" }}
          >
            + Walk-in
          </Link>
        </>
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-28 z-50 flex justify-center px-5 lg:bottom-8">
          <p className="rounded-full bg-ink px-4 py-2.5 text-support text-white shadow-float">{toast}</p>
        </div>
      )}
    </div>
  );
}

function TabLink({ tab, pathname }: { tab: (typeof tabs)[number]; pathname: string }) {
  const active = tab.exact ? pathname === tab.to : pathname.startsWith(tab.to);
  const Icon = tab.icon;
  return (
    <Link
      to={tab.to}
      className={cn("flex flex-col items-center gap-1 py-1", active ? "text-ink" : "text-muted")}
    >
      <Icon className="size-5" strokeWidth={active ? 2 : 1.75} />
      <span className="text-support">{tab.label}</span>
    </Link>
  );
}
