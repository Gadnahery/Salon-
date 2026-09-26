import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { getService, getStylist } from "@/lib/salon/data";
import { useSalonStore } from "@/lib/salon/store";

export const Route = createFileRoute("/admin/reviews")({ component: AdminReviews });

function AdminReviews() {
  const reviews = useSalonStore((s) => s.reviews);
  const publishReview = useSalonStore((s) => s.publishReview);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
      <h1 className="text-title font-normal">Reviews</h1>
      <p className="mt-2 font-display text-title">★ {avg.toFixed(1)}</p>
      <ul className="mt-8 space-y-3">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-[24px] bg-surface p-5">
            <p className="text-body font-medium">{r.customerName}</p>
            <p className="text-support text-muted">
              {getService(r.serviceId)?.name} · {getStylist(r.stylistId)?.name}
            </p>
            <p className="mt-2 text-body">{"★".repeat(r.rating)}</p>
            <p className="mt-2 text-body">{r.quote}</p>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" className="h-11" onClick={() => publishReview(r.id, !r.published)}>
                {r.published ? "Hide" : "Publish"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
