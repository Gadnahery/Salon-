import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Photo } from "@/components/salon/photo";
import { useSalonStore } from "@/lib/salon/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/gallery")({ component: AdminGallery });

const cats = ["All", "Hair", "Nails", "Makeup", "Salon", "Team"] as const;

function AdminGallery() {
  const items = useSalonStore((s) => s.galleryItems);
  const setGalleryVisible = useSalonStore((s) => s.setGalleryVisible);
  const [cat, setCat] = useState<(typeof cats)[number]>("All");
  const shown = items
    .filter((g) => (cat === "All" ? true : g.category === cat))
    .sort((a, b) => a.order - b.order);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <h1 className="text-title font-normal">Gallery</h1>
      <p className="mt-2 text-body text-muted">This is the public visual identity of Salon.</p>
      <div className="mt-6 flex gap-2 overflow-x-auto hide-scroll">
        {cats.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={cn(
              "h-10 shrink-0 rounded-full px-4 text-support",
              cat === c ? "bg-ink text-white" : "border border-line",
            )}
          >
            {c}
          </button>
        ))}
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        {shown.map((g) => (
          <li key={g.id} className="overflow-hidden rounded-[20px] bg-surface">
            <Photo src={g.src} alt={g.alt} className="aspect-[4/5] w-full" />
            <div className="flex items-center justify-between px-3 py-3">
              <p className="text-support text-muted">{g.alt}</p>
              <button type="button" className="text-support" onClick={() => setGalleryVisible(g.id, !g.visible)}>
                {g.visible ? "Hide" : "Show"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
