import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Photo } from "@/components/salon/photo";
import { services } from "@/lib/salon/data";
import { useSalonStore } from "@/lib/salon/store";

export const Route = createFileRoute("/admin/marketing")({ component: AdminMarketing });

function AdminMarketing() {
  const offers = useSalonStore((s) => s.offers);
  const toggleOffer = useSalonStore((s) => s.toggleOffer);
  const addOffer = useSalonStore((s) => s.addOffer);
  const [open, setOpen] = useState(false);

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-title font-normal">Marketing</h1>
          <p className="mt-2 text-body text-muted">Offers appear on the landing page, home, and service detail.</p>
        </div>
        <Button className="h-11" onClick={() => setOpen(true)}>
          New offer
        </Button>
      </div>
      <section className="mt-8">
        <p className="text-micro uppercase tracking-[0.16em] text-muted">Offers</p>
        <ul className="mt-4 space-y-3">
          {offers.map((o) => (
            <li key={o.id} className="overflow-hidden rounded-[24px] bg-surface">
              {(() => {
                const svc = services.find((s) => s.id === o.serviceId);
                const src = svc?.image ?? "/images/hero.jpg";
                return <Photo src={src} alt="" className="h-36 w-full" />;
              })()}
              <div className="p-5">
                <p className="text-section font-normal">{o.title}</p>
                <p className="mt-1 text-body text-muted">{o.copy}</p>
                <p className="mt-3 text-support text-muted">
                  {o.active ? "Active" : "Off"} · {o.start} – {o.end} · {o.discountPercent}%
                </p>
                <Button variant="secondary" className="mt-4 h-11" onClick={() => toggleOffer(o.id, !o.active)}>
                  {o.active ? "Pause offer" : "Activate"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-10 rounded-[24px] bg-surface p-5">
        <p className="text-micro uppercase tracking-[0.16em] text-muted">Campaigns</p>
        <p className="mt-3 text-body text-muted">
          WhatsApp, SMS, and email campaigns stay unconnected until those providers are added.
        </p>
      </section>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <form
            className="w-full max-w-lg rounded-[24px] bg-surface p-6"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              addOffer({
                title: String(fd.get("title")),
                copy: String(fd.get("copy")),
                serviceId: String(fd.get("serviceId")) || undefined,
                discountPercent: Number(fd.get("discountPercent")),
                start: String(fd.get("start")),
                end: String(fd.get("end")),
                active: true,
              });
              setOpen(false);
            }}
          >
            <p className="text-section font-normal">New offer</p>
            <Label className="mt-4">Title</Label>
            <Input name="title" required placeholder="10% off Hair Braiding" />
            <Label className="mt-4">Copy</Label>
            <Textarea name="copy" required placeholder="For selected weekday appointments." />
            <Label className="mt-4">Service</Label>
            <select name="serviceId" className="h-13 w-full rounded-2xl border border-line bg-surface px-4 text-body">
              <option value="">All services</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div>
                <Label>%</Label>
                <Input name="discountPercent" type="number" defaultValue={10} />
              </div>
              <div>
                <Label>Start</Label>
                <Input name="start" type="date" required />
              </div>
              <div>
                <Label>End</Label>
                <Input name="end" type="date" required />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button type="button" variant="secondary" className="h-12" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="h-12">
                Create
              </Button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
