import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Photo } from "@/components/salon/photo";
import { ServiceCard } from "@/components/salon/service-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getService, getStylist, offer, SALON, services } from "@/lib/salon/data";
import {
  categoryLabel,
  categoryOrder,
  displayPhase,
  formatApptWhen,
  greeting,
  phaseCopy,
} from "@/lib/salon/format";
import { useSalonStore, useUpcoming } from "@/lib/salon/store";
import { cn, useHydrated } from "@/lib/utils";

export const Route = createFileRoute("/app/")({ component: AppHome });

function AppHome() {
  const hydrated = useHydrated();
  const profile = useSalonStore((s) => s.profile);
  const noticesAll = useSalonStore((s) => s.notices);
  const notices = noticesAll.filter((n) => n.audience === "customer");
  const upcoming = useUpcoming();
  const next = upcoming[0];
  const unread = notices.filter((n) => !n.read).length;
  const popular = services.filter((s) => s.popular);
  const firstName = profile.name.split(" ")[0];

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-5 pb-10 pt-6 lg:max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-micro uppercase tracking-[0.16em] text-muted">{greeting()}</p>
          <h1 className="mt-2 text-title font-normal tracking-tight">
            {hydrated ? `Ready for your next look${firstName ? `, ${firstName}` : ""}?` : "Ready for your next look?"}
          </h1>
          <p className="mt-2 text-body text-muted">What would you like to book today?</p>
        </div>
        <Link
          to="/app/notifications"
          aria-label="Notifications"
          className="relative flex size-11 items-center justify-center overflow-hidden rounded-full bg-surface"
        >
          {hydrated ? (
            <span className="flex size-11 items-center justify-center rounded-full bg-ink font-display text-sm text-white">
              {firstName?.[0] ?? "G"}
            </span>
          ) : (
            <Bell className="size-5" strokeWidth={1.75} />
          )}
          {hydrated && unread > 0 && (
            <span className="absolute top-1 right-1 size-2 rounded-full bg-brand" />
          )}
        </Link>
      </div>

      <div className="mt-8">
        {!hydrated ? (
          <Skeleton className="h-52 w-full rounded-[24px]" />
        ) : next ? (
          <NextCard id={next.id} />
        ) : (
          <div className="overflow-hidden rounded-[24px]">
            <Photo src="/images/waiting.jpg" alt="" className="h-44 w-full" />
            <div className="bg-surface px-6 py-6">
              <p className="text-section font-normal">No upcoming appointments</p>
              <p className="mt-2 text-body text-muted">Ready for your next look?</p>
              <Link to="/app/book" className="mt-5 block">
                <Button className="h-12 w-full">Book an appointment</Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <section className="mt-12">
        <p className="text-micro uppercase tracking-[0.16em] text-muted">Book something new</p>
        <h2 className="mt-2 text-section font-normal">What are you looking for?</h2>
        <div className="mt-4 flex gap-2 overflow-x-auto hide-scroll">
          {categoryOrder.map((c) => (
            <Link
              key={c}
              to="/app/services"
              search={{ category: c }}
              className="flex h-11 shrink-0 items-center rounded-full border border-line bg-surface px-4 text-support"
            >
              {categoryLabel(c)}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between">
          <h2 className="text-section font-normal">Popular services</h2>
          <Link to="/app/services" className="text-support text-muted">
            See all →
          </Link>
        </div>
        <div className="mt-5 flex gap-5 overflow-x-auto pb-2 hide-scroll">
          {popular.map((s) => (
            <ServiceCard key={s.id} service={s} large />
          ))}
        </div>
      </section>

      <section className="mt-12 overflow-hidden rounded-[24px]">
        <div className="relative">
          <Photo src={offer.image} alt="" className="h-56 w-full md:h-64" />
          <div className="absolute inset-0 bg-linear-to-t from-ink/70 via-ink/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-surface">
            <p className="text-micro uppercase tracking-[0.18em] text-surface/80">{offer.label}</p>
            <p className="mt-2 font-display text-title font-normal">{offer.title}</p>
            <p className="mt-1 text-support text-surface/80">{offer.copy}</p>
            <Link
              to="/app/services/$serviceId"
              params={{ serviceId: offer.serviceId }}
              className="mt-4 inline-flex text-support"
            >
              Explore offer →
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-12 flex items-start justify-between gap-4 border-t border-line pt-8">
        <div>
          <p className="text-body font-medium">{SALON.name}</p>
          <p className="mt-1 text-support text-muted">
            {SALON.addressLine1}, {SALON.addressLine2}
          </p>
          <p className="mt-1 text-support text-muted">Open today · {SALON.hoursShort}</p>
        </div>
        <div className="flex gap-2">
          <a
            href={SALON.mapsApp}
            target="_blank"
            rel="noreferrer"
            className="flex size-11 items-center justify-center rounded-full border border-line bg-surface"
            aria-label="Directions"
          >
            <MapPin className="size-4" strokeWidth={1.75} />
          </a>
          <a
            href={SALON.phoneHref}
            className="flex size-11 items-center justify-center rounded-full border border-line bg-surface"
            aria-label="Call"
          >
            <Phone className="size-4" strokeWidth={1.75} />
          </a>
        </div>
      </section>
    </main>
  );
}

function NextCard({ id }: { id: string }) {
  const appt = useSalonStore((s) => s.appointments.find((a) => a.id === id));
  if (!appt) return null;
  const service = getService(appt.serviceId);
  const stylist = appt.anyStylist ? null : getStylist(appt.stylistId);
  if (!service) return null;
  const phase = displayPhase(appt);
  const copy = phaseCopy(phase, appt.time);

  return (
    <Link to="/app/appointments/$id" params={{ id }} className="block overflow-hidden rounded-[24px] bg-surface">
      <Photo src={service.image} alt="" className="h-40 w-full" position={service.imagePosition} />
      <div className="px-5 py-5">
        <p className="text-micro uppercase tracking-[0.16em] text-muted">Upcoming appointment</p>
        <p className="mt-2 text-section font-normal">{service.name}</p>
        <p className="mt-1 text-body text-muted">{formatApptWhen(appt.date, appt.time)}</p>
        <p className="mt-1 text-support text-muted">
          {stylist ? `${stylist.name} · ${stylist.title}` : "Your assigned stylist will be confirmed by the salon."}
        </p>
        <p className={cn("mt-3 text-support", phase === "cancelled" ? "text-danger" : "text-success")}>
          {copy.title}
        </p>
        <p className="mt-4 text-body">View appointment →</p>
      </div>
    </Link>
  );
}
