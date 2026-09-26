import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";
import { ServiceCard, ServiceRow } from "@/components/salon/service-card";
import { Photo } from "@/components/salon/photo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { services } from "@/lib/salon/data";
import { categoryLabel, categoryOrder, formatDuration, formatPriceRange } from "@/lib/salon/format";
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
  const searching = q.trim().length > 0;
  const filtered = services.filter((s) => {
    if (category !== "all" && s.category !== category) return false;
    if (q && !`${s.name} ${s.description}`.toLowerCase().includes(q.toLowerCase())) return false;
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
