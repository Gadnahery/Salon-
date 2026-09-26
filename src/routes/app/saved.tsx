import { createFileRoute } from "@tanstack/react-router";
import { ScreenHeader } from "@/components/salon/screen-header";
import { ServiceRow } from "@/components/salon/service-card";
import { services } from "@/lib/salon/data";
import { useSalonStore } from "@/lib/salon/store";
import { useHydrated } from "@/lib/utils";

export const Route = createFileRoute("/app/saved")({ component: SavedPage });

function SavedPage() {
  const ids = useSalonStore((s) => s.savedServiceIds);
  const hydrated = useHydrated();
  const list = services.filter((s) => ids.includes(s.id));

  return (
    <main className="mx-auto min-h-dvh max-w-lg">
      <ScreenHeader title="Saved services" backTo="/app/profile" />
      <div className="px-5 pb-10">
        {hydrated && list.map((s) => <ServiceRow key={s.id} service={s} />)}
        {hydrated && list.length === 0 && (
          <p className="pt-10 text-center text-body text-muted">
            Save a service from its page to find it here.
          </p>
        )}
      </div>
    </main>
  );
}
