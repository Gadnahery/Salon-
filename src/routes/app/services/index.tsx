import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";
import { ServiceCard, ServiceRow } from "@/components/salon/service-card";
import { Photo } from "@/components/salon/photo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { services as seedServices } from "@/lib/salon/data";
import { useSalonStore } from "@/lib/salon/store";
import { categoryLabel, categoryOrder, formatDuration, formatPriceRange, dateHasAvailability } from "@/lib/salon/format";
import { averageRating } from "@/lib/engines/review";
import { todayKey } from "@/lib/engines/schedule";
import type { Category } from "@/lib/salon/types";
import { cn } from "@/lib/utils";

type Search = { category?: Category; q?: string };

export const Route = createFileRoute("/app/services/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    category: typeof s.category === "string" ? (s.category as Category) : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { category: initial } = Route.useSearch();
  const [category, setCategory] = useState<Category | "all">(initial ?? "all");
  const [q, setQ] = useState("");
  const [priceMax, setPriceMax] = useState<number | "">("");
  const [availableToday, setAvailableToday] = useState(false);
  const reviews = useSalonStore((s) => s.reviews);
  const team = useSalonStore((s) => s.team);
  const [stylistId, setStylistId] = useState<string>("any");
  const catalog = useSalonStore((s) => s.catalog);
  const services = catalog.length ? catalog : seedServices;
  const searching = q.trim().length > 0;
  const filtered = services.filter((s) => {
    if (s.available === false) return false;
    if (category !== "all" && s.category !== category) return false;
    if (q && !`${s.name} ${s.description}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (priceMax !== "" && s.priceMin > Number(priceMax)) return false;
    if (stylistId !== "any") {
      const member = team.find((m) => m.id === stylistId);
      if (member?.serviceIds?.length && !member.serviceIds.includes(s.id)) return false;
    }
    if (availableToday) {
      const providers = team.filter(
        (m) => m.active !== false && (m.serviceIds?.includes(s.id) || !m.serviceIds?.length),
      );
      if (!providers.length) return false;
      // At least one provider has availability hash for today
      const ok = providers.some((m) => dateHasAvailability(todayKey(), m.id));
      if (!ok) return false;
    }
    return true;
  });
  const featured = filtered.filter((s) => s.popular);
  const rest = filtered.filter((s) => !s.popular);

  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-5 pb-10 pt-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-title font-normal">Explore</h1>
          <p className="mt-1 text-body text-muted">Find something for you.</p>
        </div>
        <Link
          to="/app/notifications"
          aria-label="Notifications"
          className="flex size-11 items-center justify-center rounded-full bg-surface"
        >
          <Bell className="size-5" strokeWidth={1.75} />
        </Link>
      </div>

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" strokeWidth={1.75} />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searching ? "Search braiding, nails, makeup..." : "Search services"}
          className="h-13 pl-11"
        />
      </div>

      {!searching && (
        <div className="mt-4 flex gap-2 overflow-x-auto hide-scroll pb-1">
          {(["all", ...categoryOrder] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "h-10 shrink-0 rounded-full px-4 text-support transition-colors duration-150",
                category === c ? "bg-ink text-white" : "border border-line bg-transparent text-ink",
              )}
            >
              {c === "all" ? "All" : categoryLabel(c)}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <select
          value={priceMax === "" ? "" : String(priceMax)}
          onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : "")}
          className="h-10 rounded-full border border-line bg-surface px-3 text-support"
        >
          <option value="">Any price</option>
          <option value="15000">Under 15,000</option>
          <option value="30000">Under 30,000</option>
          <option value="50000">Under 50,000</option>
          <option value="100000">Under 100,000</option>
        </select>
        <button
          type="button"
          onClick={() => setAvailableToday((v) => !v)}
          className={cn(
            "h-10 rounded-full border px-3 text-support",
            availableToday ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink",
          )}
        >
          Available today
        </button>
        <select
          value={stylistId}
          onChange={(e) => setStylistId(e.target.value)}
          className="h-10 rounded-full border border-line bg-surface px-3 text-support"
        >
          <option value="any">Any provider</option>
          {team
            .filter((m) => m.role === "stylist" && m.active !== false)
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
        </select>
      </div>

      {searching ? (
        <div className="mt-8">
          <p className="text-support text-muted">
            {filtered.length} result{filtered.length === 1 ? "" : "s"} for “{q.trim()}”
          </p>
          <div className="mt-4 divide-y divide-line">
            {filtered.map((s) => (
              <ServiceRow key={s.id} service={s} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="pt-16 text-center">
              <p className="text-section font-normal">No services found</p>
              <p className="mt-2 text-body text-muted">Try another search or browse our categories.</p>
              <Button className="mt-6 h-12" onClick={() => setQ("")}>
                Browse all services
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          {featured[0] && (
            <section className="mt-8">
              <div className="flex items-end justify-between">
                <h2 className="text-section font-normal">Popular</h2>
              </div>
              <Link
                to="/app/services/$serviceId"
                params={{ serviceId: featured[0].id }}
                className="group mt-4 block"
              >
                <div className="relative overflow-hidden rounded-[24px]">
                  <Photo
                    src={featured[0].image}
                    alt={featured[0].name}
                    className="h-80 w-full md:h-96"
                    imgClassName="transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink/55 to-transparent p-5 text-surface">
                    <p className="text-section font-normal">{featured[0].name}</p>
                    <p className="mt-1 text-support text-surface/85">
                      ★ {featured[0].rating.toFixed(1)}
                      <span className="mx-2">·</span>
                      {formatDuration(featured[0].durationMin, featured[0].durationMax)}
                      <span className="mx-2">·</span>
                      {formatPriceRange(featured[0].priceMin, featured[0].priceMax)}
                    </p>
                  </div>
                </div>
              </Link>
            </section>
          )}

          <section className="mt-10">
            <h2 className="text-section font-normal">All services</h2>
            <div className="mt-4 divide-y divide-line">
              {(featured.slice(1).length || rest.length ? [...featured.slice(1), ...rest] : filtered).map((s) => (
                <ServiceRow key={s.id} service={s} />
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
