import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Photo } from "@/components/salon/photo";
import { ScreenHeader } from "@/components/salon/screen-header";
import { StylistAvatar } from "@/components/salon/stylist-avatar";
import { getService, SALON, stylistsFor } from "@/lib/salon/data";
import { formatClock, formatDuration, formatPriceRange, formatTsh, TIME_SLOTS } from "@/lib/salon/format";
import { useSalonStore } from "@/lib/salon/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/services/$serviceId")({
  component: ServiceDetail,
});

function ServiceDetail() {
  const allReviews = useSalonStore((s) => s.reviews);
  const { serviceId } = Route.useParams();
  const service = getService(serviceId);
  const saved = useSalonStore((s) => s.savedServiceIds.includes(serviceId));
  const toggle = useSalonStore((s) => s.toggleSaved);
  const setDraft = useSalonStore((s) => s.setDraft);
  const [photo, setPhoto] = useState(0);
  const [openPolicy, setOpenPolicy] = useState<string | null>(null);

  if (!service) {
    return (
      <main className="px-5 py-16 text-center">
        <p className="text-body">We couldn't find that service.</p>
        <Link to="/app/services" className="mt-4 inline-block text-ink">
          Back to services
        </Link>
      </main>
    );
  }

  const liveReviews = allReviews.filter((r) => r.published && r.serviceId === service.id);

  const people = stylistsFor(service.category);
  const previewTimes = TIME_SLOTS.slice(0, 3);

  return (
    <main className="mx-auto min-h-dvh max-w-5xl pb-28 lg:grid lg:grid-cols-2 lg:gap-12 lg:px-8 lg:pt-8 lg:pb-10">
      <div className="relative">
        <Photo
          src={service.gallery[photo] ?? service.image}
          alt={service.name}
          position={service.imagePosition}
          transitionName={`svc-${service.id}`}
          className="h-[48vh] w-full lg:h-full lg:min-h-[36rem] lg:rounded-[24px]"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3 lg:hidden">
          <ScreenHeader
            light
            backTo="/app/services"
            className="w-full px-0 pt-0 pb-0"
            action={
              <button
                type="button"
                aria-label={saved ? "Unsave" : "Save"}
                onClick={() => toggle(service.id)}
                className="flex size-11 items-center justify-center rounded-full glass-chip text-ink"
              >
                <Heart className={cn("size-5", saved && "fill-ink text-ink")} strokeWidth={1.75} />
              </button>
            }
          />
        </div>
        {service.gallery.length > 1 && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
            {service.gallery.map((src, i) => (
              <button
                key={src}
                type="button"
                aria-label={`Photo ${i + 1}`}
                onClick={() => setPhoto(i)}
                className={cn("size-1.5 rounded-full", i === photo ? "bg-surface" : "bg-surface/40")}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-5 pt-6 lg:px-0 lg:pt-2">
        <div className="hidden justify-end lg:flex">
          <button
            type="button"
            aria-label={saved ? "Unsave" : "Save"}
            onClick={() => toggle(service.id)}
            className="flex size-11 items-center justify-center rounded-full bg-surface"
          >
            <Heart className={cn("size-5", saved && "fill-ink text-ink")} strokeWidth={1.75} />
          </button>
        </div>
        <h1 className="text-title font-normal">{service.name}</h1>
        <p className="mt-2 text-body text-muted">
          ★ {service.rating.toFixed(1)} · {service.reviewCount} reviews
        </p>
        <div className="mt-5 border-t border-line pt-5">
          <p className="text-section font-normal">{formatPriceRange(service.priceMin, service.priceMax)}</p>
          <p className="mt-1 text-support text-muted">
            {formatDuration(service.durationMin, service.durationMax)}
          </p>
        </div>

        <h2 className="mt-8 text-body font-medium">About this service</h2>
        <p className="mt-2 max-w-md text-body text-muted">{service.description}</p>

        <h2 className="mt-8 text-body font-medium">What's included</h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 text-body text-muted">
          {service.includes.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="text-success">✓</span>
              {item}
            </li>
          ))}
        </ul>

        <h2 className="mt-8 text-body font-medium">Choose your stylist</h2>
        <div className="mt-4 flex gap-3 overflow-x-auto hide-scroll pb-1">
          <div className="flex w-28 shrink-0 flex-col items-center gap-2 rounded-[20px] border border-ink bg-brand-soft px-3 py-4 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-ink text-support text-white">
              Any
            </span>
            <p className="text-support font-medium">Any available</p>
            <p className="text-micro uppercase tracking-[0.12em] text-muted">Recommended</p>
          </div>
          {people.map((st) => (
            <div key={st.id} className="flex w-28 shrink-0 flex-col items-center gap-2 rounded-[20px] border border-line bg-surface px-3 py-4 text-center">
              <StylistAvatar stylist={st} />
              <p className="text-support font-medium">{st.name}</p>
              <p className="text-micro text-muted">★ {st.rating.toFixed(1)}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-8 text-body font-medium">Next available</h2>
        <p className="mt-1 text-support text-muted">{service.nextAvailable}</p>
        <div className="mt-3 flex gap-2">
          {previewTimes.map((t) => (
            <span key={t} className="rounded-xl border border-line bg-surface px-3 py-2 text-support tabular-nums">
              {formatClock(t)}
            </span>
          ))}
        </div>
        <Link
          to="/app/book"
          search={{ service: service.id }}
          onClick={() => setDraft({ serviceId: service.id })}
          className="mt-3 inline-block text-support"
        >
          View all times →
        </Link>

        <h2 className="mt-8 text-body font-medium">Client reviews</h2>
        <p className="mt-2 text-body">
          ★ {(liveReviews.length
            ? liveReviews.reduce((s, r) => s + r.rating, 0) / liveReviews.length
            : service.rating
          ).toFixed(1)}{" "}
          · {liveReviews.length || service.reviewCount} reviews
        </p>
        {liveReviews.slice(0, 5).map((r) => (
          <div key={r.id} className="mt-3 rounded-2xl border border-line bg-surface px-4 py-3">
            <p className="text-support">{"★".repeat(r.rating)}</p>
            <p className="mt-1 text-body">{r.quote}</p>
            <p className="mt-1 text-support text-muted">— {r.customerName}</p>
          </div>
        ))}
        {liveReviews.length === 0 && (
          <>
            <blockquote className="mt-3 text-body text-muted">“{service.featuredReview.quote}”</blockquote>
            <p className="mt-2 text-support text-muted">— {service.featuredReview.name}</p>
          </>
        )}

        <h2 className="mt-8 text-body font-medium">Recent work</h2>
        <div className="mt-3 flex gap-3 overflow-x-auto hide-scroll">
          {service.gallery.map((src) => (
            <Photo key={src} src={src} alt="" className="h-28 w-24 shrink-0 rounded-2xl" />
          ))}
        </div>

        <h2 className="mt-8 text-body font-medium">Before you book</h2>
        <div className="mt-2 divide-y divide-line">
          {[
            { id: "cancel", title: "Cancellation policy", body: SALON.cancellationPolicy },
            { id: "deposit", title: "Deposit policy", body: SALON.depositPolicy },
            { id: "bring", title: "What to bring", body: SALON.whatToBring },
          ].map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setOpenPolicy(openPolicy === row.id ? null : row.id)}
              className="flex w-full flex-col py-4 text-left"
            >
              <span className="flex w-full items-center justify-between text-body">
                {row.title}
                <ChevronDown
                  className={cn("size-4 text-muted transition-transform", openPolicy === row.id && "rotate-180")}
                  strokeWidth={1.75}
                />
              </span>
              {openPolicy === row.id && <span className="mt-2 text-support text-muted">{row.body}</span>}
            </button>
          ))}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line glass-bar px-5 py-3 lg:static lg:mt-10 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <div>
              <p className="text-body font-medium">{formatTsh(service.priceMin)}</p>
              <p className="text-support text-muted">
                {service.priceMax ? "Starting from" : "Fixed price"}
              </p>
            </div>
            <Link
              to="/app/book"
              search={{ service: service.id }}
              onClick={() => setDraft({ serviceId: service.id, stylistId: "any" })}
            >
              <Button className="h-13 min-w-36 bg-ink px-6 text-white">Book now</Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
