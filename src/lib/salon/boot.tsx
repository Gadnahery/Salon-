import { useEffect } from "react";
import { setLiveServices, setLiveTeam, team as teamSeed, services as catalogSeed } from "./data";
import { pullCatalogFromSupabase } from "./remote";
import { useSalonStore } from "./store";

/**
 * Boot sequence:
 * 1. Rehydrate local persistence
 * 2. Prefer live Supabase catalog (services, staff, offers) when available
 * 3. Fall back to seed + local store
 * 4. Pull appointments/customers from server when possible
 */
export function SalonBoot() {
  useEffect(() => {
    void (async () => {
      await useSalonStore.persist.rehydrate();
      const local = useSalonStore.getState();

      let catalog = local.catalog.length ? local.catalog : catalogSeed;
      let team = local.team.length ? local.team : teamSeed;
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
          if (remoteState.appointments.length > 0) {
            useSalonStore.setState({
              seeded: true,
              appointments: remoteState.appointments,
              customers: remoteState.customers.length ? remoteState.customers : local.customers,
              payments: remoteState.payments,
              queue: remoteState.queue,
              notices: remoteState.notices,
              reviews: remoteState.reviews.length ? remoteState.reviews : local.reviews,
              audit: remoteState.audit,
              catalog,
              team,
              offers,
            });
            setLiveServices(catalog);
            setLiveTeam(team);
            return;
          }
        } catch {
          /* stay on local seed */
        }
      }

      useSalonStore.getState().seedIfNeeded();
    })();
  }, []);
  return null;
}
