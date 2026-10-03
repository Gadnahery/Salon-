import { ThemePortal } from "@/components/theme-portal";
import { PageTransition } from "@/components/page-transition";
import { m } from "motion/react";
import { ReminderWatcher } from "@/components/salon/reminder-watcher";
import { useEffect, useState } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Home, Calendar, Plus, User, Bell } from "lucide-react";
import { BookSheet } from "./book-sheet";
import { NotifyPrompt } from "./notify-prompt";
import { InstallPrompt } from "./install-prompt";
import { LogoWord } from "./logo";
import { Button } from "@/components/ui/button";
import { useSalonStore } from "@/lib/salon/store";
import { pullCatalogFromSupabase } from "@/lib/salon/remote";
import { setLiveServices, setLiveTeam } from "@/lib/salon/data";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/app", label: "Home", icon: Home, exact: true },
  { to: "/app/appointments", label: "Appointments", icon: Calendar, exact: false },
  { to: "/app/activity", label: "Activity", icon: Bell, exact: false },
  { to: "/app/profile", label: "Profile", icon: User, exact: false },
] as const;

const desktopNav = [
  { to: "/app", label: "Home", exact: true },
  { to: "/app/services", label: "Book", exact: false },
  { to: "/app/appointments", label: "Appointments", exact: false },
  { to: "/app/activity", label: "Activity", exact: false },
  { to: "/app/profile", label: "Profile", exact: false },
] as const;

export function AppShell() {
  const [bookOpen, setBookOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const toast = useSalonStore((s) => s.toast);
  const setToast = useSalonStore((s) => s.setToast);
  const reviewPromptId = useSalonStore((s) => s.reviewPromptId);
  const clearReviewPrompt = useSalonStore((s) => s.clearReviewPrompt);
  const submitReview = useSalonStore((s) => s.submitReview);
  const hideNav =
    pathname.includes("/book") ||
    /\/services\/[^/]+/.test(pathname) ||
    /\/appointments\/[^/]+/.test(pathname);

  useEffect(() => {
    void (async () => {
      await useSalonStore.persist.rehydrate();
      try {
        const remote = await pullCatalogFromSupabase();
        if (remote.services.length || remote.team.length) {
          const catalog = remote.services.length ? remote.services : useSalonStore.getState().catalog;
          const team = remote.team.length ? remote.team : useSalonStore.getState().team;
          const offers = remote.offers.length ? remote.offers : useSalonStore.getState().offers;
          setLiveServices(catalog);
          setLiveTeam(team);
          useSalonStore.setState({ catalog, team, offers });
        }
      } catch { /* local */ }
      useSalonStore.getState().seedIfNeeded();
    })();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast, setToast]);

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <ThemePortal portal="customer" />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface px-6 py-8 lg:flex">
        <Link to="/">
          <LogoWord />
        </Link>
        <nav className="mt-12 flex flex-1 flex-col gap-1">
          {desktopNav.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "rounded-2xl px-3 py-3 text-body transition-colors duration-150",
                  active ? "bg-bg font-medium text-ink" : "text-muted hover:bg-bg hover:text-ink",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <Link to="/app/help" className="mb-4 text-support text-muted hover:text-ink">
          Help
        </Link>
        <Button className="h-14 w-full bg-ink text-white" onClick={() => setBookOpen(true)}>
          Book appointment
        </Button>
      </aside>

      <div className={cn("lg:pl-60", hideNav ? "pb-0" : "pb-24 lg:pb-0")}>
        {reviewPromptId && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-[28px] bg-bg p-6 shadow-float">
            <p className="text-section font-normal">How was your visit?</p>
            <p className="mt-2 text-support text-muted">Leave a quick review for your completed service.</p>
            <div className="mt-5 flex gap-2">
              {[5, 4, 3, 2, 1].map((stars) => (
                <Button
                  key={stars}
                  type="button"
                  variant="secondary"
                  className="h-11 flex-1"
                  onClick={() => {
                    submitReview({ appointmentId: reviewPromptId, rating: stars, quote: "" });
                    clearReviewPrompt();
                  }}
                >
                  {stars}★
                </Button>
              ))}
            </div>
            <Button type="button" variant="secondary" className="mt-4 h-11 w-full" onClick={() => clearReviewPrompt()}>
              Not now
            </Button>
          </div>
        </div>
      )}
      <PageTransition routeKey={pathname}>
        <Outlet />
      </PageTransition>
      </div>

      {!hideNav && (
        <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
          <div className="pointer-events-auto relative mx-auto grid max-w-lg grid-cols-5 rounded-[28px] border border-line/80 bg-[var(--glass-nav)] px-1 py-1.5 shadow-nav backdrop-blur-xl">
            <TabLink tab={tabs[0]} pathname={pathname} />
            <TabLink tab={tabs[1]} pathname={pathname} />
            <div className="relative flex justify-center">
              <button
                type="button"
                aria-label="Book appointment"
                onClick={() => setBookOpen(true)}
                className="absolute -top-8 flex size-14 items-center justify-center rounded-full bg-ink text-[var(--brand-ink)] shadow-float transition-transform duration-150 ease-out active:scale-[0.96]"
              >
                <Plus className="size-6" strokeWidth={1.75} />
              </button>
            </div>
            <TabLink tab={tabs[2]} pathname={pathname} />
            <TabLink tab={tabs[3]} pathname={pathname} />
          </div>
        </nav>
      )}

      <BookSheet open={bookOpen} onOpenChange={setBookOpen} />
      <ReminderWatcher />
      <NotifyPrompt />
      <InstallPrompt portal="customer" />

      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-5 lg:bottom-8">
          <p className="rounded-full bg-ink px-4 py-2.5 text-support text-white shadow-float">
            {toast}
          </p>
        </div>
      )}
    </div>
  );
}

function TabLink({
  tab,
  pathname,
}: {
  tab: (typeof tabs)[number];
  pathname: string;
}) {
  const active = tab.exact ? pathname === tab.to : pathname.startsWith(tab.to);
  const Icon = tab.icon;
  return (
    <Link
      to={tab.to}
      className={cn(
        "relative flex flex-col items-center gap-0.5 rounded-2xl py-2 text-micro tracking-[0.08em] uppercase transition-colors duration-150",
        active ? "text-ink" : "text-muted",
      )}
    >
      {active && (
        <m.span
          layoutId="customer-tab-pill"
          className="absolute inset-0 -z-10 rounded-2xl bg-surface-2/80"
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
        />
      )}
      <Icon className="size-5" strokeWidth={active ? 2 : 1.75} />
      <span className="normal-case tracking-normal text-support">{tab.label}</span>
    </Link>
  );
}
