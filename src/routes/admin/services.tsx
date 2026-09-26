import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Photo } from "@/components/salon/photo";
import { categoryLabel, categoryOrder, formatDuration, formatTsh } from "@/lib/salon/format";
import { stylistsOnTeam } from "@/lib/salon/data";
import { useSalonStore } from "@/lib/salon/store";
import type { Service } from "@/lib/salon/types";

export const Route = createFileRoute("/admin/services")({ component: AdminServices });

function AdminServices() {
  const items = useSalonStore((s) => s.catalog);
  const updateService = useSalonStore((s) => s.updateService);
  const [edit, setEdit] = useState<Service | null>(null);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <h1 className="text-title font-normal">Services</h1>
      <p className="mt-2 text-body text-muted">One catalogue feeds booking, staff, and the public site.</p>
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
                    onClick={() => setEdit(s)}
                    className="flex w-full items-center gap-4 rounded-[20px] bg-surface p-3 text-left"
                  >
                    <Photo src={s.image} alt="" className="size-16 rounded-2xl" />
                    <span className="flex-1">
                      <span className="block text-body font-medium">{s.name}</span>
                      <span className="text-support text-muted">
                        {formatTsh(s.priceMin)}
                        {s.priceMax ? ` – ${formatTsh(s.priceMax)}` : ""} · {formatDuration(s.durationMin, s.durationMax)}
                      </span>
                    </span>
                    <span className="text-support text-success">{s.available === false ? "Hidden" : "Active"}</span>
                  </button>
                </li>
              ))}
          </ul>
        </section>
      ))}

      {edit && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <form
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[24px] bg-surface p-6"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              updateService(edit.id, {
                name: String(fd.get("name") ?? edit.name),
                description: String(fd.get("description") ?? edit.description),
                priceMin: Number(fd.get("priceMin") ?? edit.priceMin),
                priceMax: Number(fd.get("priceMax") || 0) || undefined,
                durationMin: Number(fd.get("durationMin") ?? edit.durationMin),
                durationMax: Number(fd.get("durationMax") || 0) || undefined,
                depositPercent: Number(fd.get("depositPercent") ?? edit.depositPercent),
              });
              setEdit(null);
            }}
          >
            <p className="text-section font-normal">Edit service</p>
            <Label className="mt-5">Service name</Label>
            <Input name="name" defaultValue={edit.name} />
            <Label className="mt-4">Description</Label>
            <Textarea name="description" defaultValue={edit.description} />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <Label>Price from (TSh)</Label>
                <Input name="priceMin" type="number" defaultValue={edit.priceMin} />
              </div>
              <div>
                <Label>Price to</Label>
                <Input name="priceMax" type="number" defaultValue={edit.priceMax ?? ""} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <Label>Duration min</Label>
                <Input name="durationMin" type="number" defaultValue={edit.durationMin} />
              </div>
              <div>
                <Label>Duration max</Label>
                <Input name="durationMax" type="number" defaultValue={edit.durationMax ?? ""} />
              </div>
            </div>
            <Label className="mt-4">Deposit %</Label>
            <Input name="depositPercent" type="number" defaultValue={edit.depositPercent} />
            <p className="mt-4 text-support text-muted">
              Category {categoryLabel(edit.category)} · Staff {stylistsOnTeam().filter((s) => s.serviceIds.includes(edit.id)).map((s) => s.name).join(", ") || "unassigned"}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button type="button" variant="secondary" className="h-12" onClick={() => setEdit(null)}>
                Cancel
              </Button>
              <Button type="submit" className="h-12">
                Save changes
              </Button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
