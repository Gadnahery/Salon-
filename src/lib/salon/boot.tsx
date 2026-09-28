import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { setLiveServices, setLiveTeam } from "./data";
import { pullCatalogFromSupabase } from "./remote";
import { useSalonStore } from "./store";
import { registerBookingServiceWorker } from "@/lib/notifications/push-client";

/**
 * Boot: rehydrate local store, prefer live Supabase catalog, never inject demo bookings.
 */
export function SalonBoot() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Installed PWA: if staff/admin already signed in, open their portal (no re-login).
  useEffect(() => {
    void (async () => {
      await useSalonStore.persist.rehydrate();
      const session = useSalonStore.getState().session;
      const standalone =
        typeof window !== "undefined" &&
        (window.matchMedia("(display-mode: standalone)").matches ||
          Boolean((navigator as { standalone?: boolean }).standalone));
      if (!standalone) return;
      if (session.portal === "admin" && !pathname.startsWith("/admin") && !pathname.startsWith("/login")) {
        void navigate({ to: "/admin" });
      } else if (session.portal === "staff" && !pathname.startsWith("/staff") && !pathname.startsWith("/login")) {
        void navigate({ to: "/staff" });
      }
    })();
  }, [navigate, pathname]);

  useEffect(() => {
    void (async () => {
      await useSalonStore.persist.rehydrate();
      const local = useSalonStore.getState();

      let catalog = local.catalog;
      let team = local.team;
      let offers = local.offers;

      try {
        const remote = await pullCatalogFromSupabase();
        if (remote.services.length > 0) catalog = remote.services;
        if (remote.team.length > 0) team = remote.team;
        if (remote.offers.length > 0) offers = remote.offers;
      } catch {
        /* keep local */
      }

      setLiveServices(catalog);
      setLiveTeam(team);
      useSalonStore.setState({ catalog, team, offers });

      if (!local.seeded) {
        try {
          const { pullSalonStateFn } = await import("./sync-actions");
          const remoteState = await pullSalonStateFn();
          useSalonStore.setState({
            seeded: true,
            appointments: remoteState.appointments,
            customers: remoteState.customers,
            payments: remoteState.payments,
            queue: remoteState.queue,
            notices: remoteState.notices,
            reviews: remoteState.reviews,
            audit: remoteState.audit,
            catalog,
            team,
            offers,
          });
          setLiveServices(catalog);
          setLiveTeam(team);
          return;
        } catch {
          /* empty local */
        }
      }

      useSalonStore.getState().seedIfNeeded();
    })();
  }, []);
  return null;
}
