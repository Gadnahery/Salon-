import { useEffect } from "react";
import { setLiveServices, setLiveTeam } from "./data";
import { pullCatalogFromSupabase } from "./remote";
import { useSalonStore } from "./store";

/**
 * Boot: rehydrate local store, prefer live Supabase catalog, never inject demo bookings.
 */
export function SalonBoot() {
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
