import { m } from "motion/react";
import { Link } from "@tanstack/react-router";
import { Photo } from "./photo";
import { formatDuration, formatPriceRange } from "@/lib/salon/format";
import type { Service } from "@/lib/salon/types";
import { cn } from "@/lib/utils";

export function ServiceCard({
  service,
  className,
  large,
}: {
  service: Service;
  className?: string;
  large?: boolean;
}) {
  return (
    <Link
      to="/app/services/$serviceId"
      params={{ serviceId: service.id }}
      className={cn(
        "group flex shrink-0 flex-col overflow-hidden text-left",
        large ? "w-64" : "w-full",
        className,
      )}
    >
      <m.div
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        layoutId={`svc-img-${service.id}`}
        className="overflow-hidden rounded-[28px]"
      >
      <Photo
        src={service.image}
        alt={service.name}
        position={service.imagePosition}
        transitionName={`svc-${service.id}`}
        className={cn("w-full rounded-[28px]", large ? "h-80" : "aspect-4/5")}
        imgClassName="transition-transform duration-700 group-hover:scale-[1.04]"
      />
      </m.div>
      <div className="flex flex-col gap-1 pt-3">
        <p className="text-body font-medium tracking-tight text-ink">{service.name}</p>
        <p className="text-support text-muted">
          ★ {service.rating.toFixed(1)}
          <span className="mx-1.5 text-line">·</span>
          {formatDuration(service.durationMin, service.durationMax)}
        </p>
        <p className="text-body text-ink">{formatPriceRange(service.priceMin, service.priceMax)}</p>
      </div>
    </Link>
  );
}

export function ServiceRow({ service }: { service: Service }) {
  return (
    <Link
      to="/app/services/$serviceId"
      params={{ serviceId: service.id }}
      className="flex items-center gap-4 rounded-2xl py-2 transition-transform duration-150 active:scale-[0.99]"
    >
      <Photo
        src={service.image}
        alt={service.name}
        position={service.imagePosition}
        className="size-20 shrink-0 rounded-2xl"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-body font-medium">{service.name}</span>
        <span className="mt-0.5 block text-support text-muted">
          ★ {service.rating.toFixed(1)} · {formatDuration(service.durationMin, service.durationMax)}
        </span>
        <span className="mt-0.5 block text-support text-ink">
          {formatPriceRange(service.priceMin, service.priceMax)}
        </span>
      </span>
      <span className="text-muted">→</span>
    </Link>
  );
}
