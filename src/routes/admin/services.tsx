import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Photo } from "@/components/salon/photo";
import { categoryLabel, categoryOrder, formatDuration, formatTsh } from "@/lib/salon/format";
import { stylistsOnTeam } from "@/lib/salon/data";
import { useSalonStore } from "@/lib/salon/store";
import type { Category, Service } from "@/lib/salon/types";

export const Route = createFileRoute("/admin/services")({ component: AdminServices });

function emptyService(): Service {
  return {
    id: `svc-${Date.now()}`,
    name: "",
    category: "hair",
    description: "",
    priceMin: 30000,
    priceMax: 60000,
    durationMin: 60,
    durationMax: 90,
    rating: 5,
    reviewCount: 0,
    image: "/images/braiding.jpg",
    gallery: ["/images/braiding.jpg"],
    includes: ["Consultation", "Styling", "Finishing"],
    depositPercent: 50,
    nextAvailable: "Today",
    featuredReview: { quote: "", name: "" },
    available: true,
  };
}

function AdminServices() {
  const items = useSalonStore((s) => s.catalog);
  const updateService = useSalonStore((s) => s.updateService);
  const addService = useSalonStore((s) => s.addService);
  const removeService = useSalonStore((s) => s.removeService);
  const [edit, setEdit] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);

  function openCreate() {
    setCreating(true);
    setEdit(emptyService());
  }

  function saveFromForm(fd: FormData, current: Service) {
    const name = String(fd.get("name") ?? current.name).trim();
    if (!name) return;
    const patch: Partial<Service> = {
      name,
      description: String(fd.get("description") ?? current.description),
      category: (String(fd.get("category") ?? current.category) as Category) || current.category,
      priceMin: Number(fd.get("priceMin") ?? current.priceMin),
      priceMax: Number(fd.get("priceMax") || 0) || undefined,
      durationMin: Number(fd.get("durationMin") ?? current.durationMin),
      durationMax: Number(fd.get("durationMax") || 0) || undefined,
      depositPercent: Number(fd.get("depositPercent") ?? current.depositPercent),
      image: String(fd.get("image") ?? current.image).trim() || current.image,
      available: fd.get("available") === "on" || fd.get("available") === "true",
    };
    const galleryRaw = String(fd.get("gallery") ?? "").trim();
    if (galleryRaw) {
      patch.gallery = galleryRaw.split("\n").map((l) => l.trim()).filter(Boolean);
    } else if (patch.image) {
      patch.gallery = [patch.image];
    }

    if (creating) {
      addService({ ...current, ...patch, id: current.id || `svc-${Date.now()}` });
    } else {
      updateService(current.id, patch);
    }
    setEdit(null);
    setCreating(false);
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-title font-normal">Services</h1>
          <p className="mt-2 text-body text-muted">
            Set prices, duration, deposit, images. This catalogue feeds booking, staff, and the public site.
          </p>
        </div>
        <Button className="h-12 gap-2" onClick={openCreate}>
          <Plus className="size-4" strokeWidth={1.75} />
          Add service
        </Button>
      </div>

      {categoryOrder.map((cat) => (
        <section key={cat} className="mt-10">
          <p className="text-micro uppercase tracking-[0.16em] text-muted">{categoryLabel(cat)}</p>
          <ul className="mt-3 space-y-2">
            {items
              .filter((s) => s.category === cat)
              .map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setCreating(false);
                      setEdit(s);
                    }}
                    className="flex w-full items-center gap-4 rounded-[24px] bg-surface p-3 text-left"
                  >
                    <Photo src={s.image} alt="" className="size-16 rounded-2xl" />
                    <span className="flex-1">
                      <span className="block text-body font-medium">{s.name}</span>
                      <span className="text-support text-muted">
                        {formatTsh(s.priceMin)}
                        {s.priceMax ? ` – ${formatTsh(s.priceMax)}` : ""} ·{" "}
                        {formatDuration(s.durationMin, s.durationMax)}
                      </span>
                    </span>
                    <span className="text-support text-success">
                      {s.available === false ? "Hidden" : "Active"}
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        </section>
      ))}

      {edit && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <form
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[28px] bg-bg p-6 shadow-float"
            onSubmit={(e) => {
              e.preventDefault();
              saveFromForm(new FormData(e.currentTarget), edit);
            }}
          >
            <p className="text-section font-normal">{creating ? "New service" : "Edit service"}</p>

            <Label className="mt-5">Service name</Label>
            <Input name="name" defaultValue={edit.name} required placeholder="e.g. Knotless Braids" />

            <Label className="mt-4">Category</Label>
            <select
              name="category"
              defaultValue={edit.category}
              className="mt-1 flex h-12 w-full rounded-2xl border border-line bg-surface px-4 text-body"
            >
              {categoryOrder.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c)}
                </option>
              ))}
            </select>

            <Label className="mt-4">Description</Label>
            <Textarea name="description" defaultValue={edit.description} placeholder="What the guest gets" />

            <Label className="mt-4">Cover image URL</Label>
            <Input name="image" defaultValue={edit.image} placeholder="/images/braiding.jpg or https://…" />
            <p className="mt-1 text-support text-muted">
              Use a path under /images/ or a full URL. Shown on cards and service detail.
            </p>

            <Label className="mt-4">Gallery image URLs (one per line)</Label>
            <Textarea
              name="gallery"
              defaultValue={(edit.gallery ?? []).join("\n")}
              placeholder={"/images/gallery-braids.jpg\n/images/sig-braiding.jpg"}
              rows={3}
            />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <Label>Price from (TSh)</Label>
                <Input name="priceMin" type="number" defaultValue={edit.priceMin} required />
              </div>
              <div>
                <Label>Price to</Label>
                <Input name="priceMax" type="number" defaultValue={edit.priceMax ?? ""} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <Label>Duration min (min)</Label>
                <Input name="durationMin" type="number" defaultValue={edit.durationMin} required />
              </div>
              <div>
                <Label>Duration max</Label>
                <Input name="durationMax" type="number" defaultValue={edit.durationMax ?? ""} />
              </div>
            </div>
            <Label className="mt-4">Deposit %</Label>
            <Input name="depositPercent" type="number" defaultValue={edit.depositPercent} />

            <label className="mt-4 flex items-center gap-3 text-body">
              <input
                type="checkbox"
                name="available"
                defaultChecked={edit.available !== false}
                className="size-5 rounded-md border-line"
              />
              Visible for booking
            </label>

            {!creating && (
              <p className="mt-4 text-support text-muted">
                Staff:{" "}
                {stylistsOnTeam()
                  .filter((s) => s.serviceIds.includes(edit.id))
                  .map((s) => s.name)
                  .join(", ") || "unassigned"}
              </p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                className="h-12"
                onClick={() => {
                  setEdit(null);
                  setCreating(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="h-12">
                {creating ? "Create service" : "Save changes"}
              </Button>
            </div>
            {!creating && (
              <Button
                type="button"
                variant="danger"
                className="mt-3 h-12 w-full"
                onClick={() => {
                  if (window.confirm(`Remove ${edit.name}?`)) {
                    removeService(edit.id);
                    setEdit(null);
                  }
                }}
              >
                Remove service
              </Button>
            )}
          </form>
        </div>
      )}
    </main>
  );
}
