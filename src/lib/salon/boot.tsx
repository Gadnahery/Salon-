import { useEffect } from "react";
import { applyTestPrices, setLiveServices, setLiveTeam, team as teamSeed, services as catalogSeed } from "./data";
import { useSalonStore } from "./store";

export function SalonBoot() {
  useEffect(() => {
    void (async () => {
      await useSalonStore.persist.rehydrate();
      const local = useSalonStore.getState();
      const catalog = applyTestPrices(local.catalog.length ? local.catalog : catalogSeed);
      const team = local.team.length ? local.team : teamSeed;
      setLiveServices(catalog);
      setLiveTeam(team);
      useSalonStore.setState({ catalog, team });

      if (!local.seeded) {
        try {
          const { pullSalonStateFn } = await import("./sync-actions");
          const remote = await pullSalonStateFn();
          if (remote.appointments.length > 0) {
            useSalonStore.setState({
              seeded: true,
              appointments: remote.appointments,
              customers: remote.customers.length ? remote.customers : local.customers,
              payments: remote.payments,
              queue: remote.queue,
              notices: remote.notices,
              reviews: remote.reviews.length ? remote.reviews : local.reviews,
              audit: remote.audit,
              catalog,
              team,
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