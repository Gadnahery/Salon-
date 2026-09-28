import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Photo } from "@/components/salon/photo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useSalonStore } from "@/lib/salon/store";
import type { GalleryItem } from "@/lib/salon/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/gallery")({ component: AdminGallery });

const cats = ["All", "Hair", "Nails", "Makeup", "Salon", "Team"] as const;

function AdminGallery() {
  const items = useSalonStore((s) => s.galleryItems);
  const addGalleryItem = useSalonStore((s) => s.addGalleryItem);
  const updateGalleryItem = useSalonStore((s) => s.updateGalleryItem);
  const removeGalleryItem = useSalonStore((s) => s.removeGalleryItem);
  const setGalleryVisible = useSalonStore((s) => s.setGalleryVisible);
  const [cat, setCat] = useState<(typeof cats)[number]>("All");
  const [edit, setEdit] = useState<GalleryItem | null>(null);
  const [creating, setCreating] = useState(false);

  const shown = items
    .filter((g) => (cat === "All" ? true : g.category === cat))
    .sort((a, b) => a.order - b.order);

  function openNew() {
    setCreating(true);
    setEdit({
      id: `gal-${Date.now()}`,
      src: "",
      alt: "",
      category: "Salon",
      order: items.length + 1,
      visible: true,
    });
  }

  function save(fd: FormData) {
    if (!edit) return;
    const src = String(fd.get("src") ?? "").trim();
    const alt = String(fd.get("alt") ?? "").trim() || "Gallery photo";
    const category = String(fd.get("category") ?? "Salon");
    const order = Number(fd.get("order") ?? edit.order) || edit.order;
    if (!src) return;
    const next: GalleryItem = { ...edit, src, alt, category, order };
    if (creating) addGalleryItem(next);
    else updateGalleryItem(edit.id, next);
    setEdit(null);
    setCreating(false);
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-title font-normal">Gallery</h1>
          <p className="mt-2 text-body text-muted">Add, edit, hide, or remove public photos (image URL).</p>
        </div>
        <Button className="h-11 bg-ink text-white" onClick={openNew}>
          Add image
        </Button>
      </div>
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
            <button type="button" className="block w-full text-left" onClick={() => { setCreating(false); setEdit(g); }}>
              <Photo src={g.src} alt={g.alt} className="aspect-[4/5] w-full" />
            </button>
            <div className="flex items-center justify-between gap-2 px-3 py-3">
              <p className="truncate text-support text-muted">{g.alt}</p>
              <div className="flex shrink-0 gap-2">
                <button type="button" className="text-support" onClick={() => setGalleryVisible(g.id, !g.visible)}>
                  {g.visible ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  className="text-support text-brand"
                  onClick={() => {
                    if (confirm("Delete this image?")) removeGalleryItem(g.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {shown.length === 0 && (
        <p className="mt-10 text-center text-body text-muted">No images yet. Add a photo URL to start the gallery.</p>
      )}

      {edit && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <form
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[28px] bg-bg p-6 shadow-float"
            onSubmit={(e) => {
              e.preventDefault();
              save(new FormData(e.currentTarget));
            }}
          >
            <p className="text-section font-normal">{creating ? "New gallery image" : "Edit image"}</p>
            <Label className="mt-5">Image URL</Label>
            <Input name="src" defaultValue={edit.src} required placeholder="https://… or /images/…" />
            <p className="mt-1 text-support text-muted">Paste a direct image link (https). Prefer compressed JPG/WebP.</p>
            <Label className="mt-4">Caption</Label>
            <Input name="alt" defaultValue={edit.alt} placeholder="Short description" />
            <Label className="mt-4">Category</Label>
            <select
              name="category"
              defaultValue={edit.category}
              className="mt-1 flex h-12 w-full rounded-2xl border border-line bg-surface px-4 text-body"
            >
              {cats.filter((c) => c !== "All").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Label className="mt-4">Order</Label>
            <Input name="order" type="number" defaultValue={edit.order} />
            <div className="mt-6 flex gap-3">
              <Button type="button" variant="secondary" className="h-12 flex-1" onClick={() => setEdit(null)}>
                Cancel
              </Button>
              <Button type="submit" className="h-12 flex-1 bg-ink text-white">
                Save
              </Button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
