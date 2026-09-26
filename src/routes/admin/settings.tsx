import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { SALON } from "@/lib/salon/data";
import { useSalonStore } from "@/lib/salon/store";

export const Route = createFileRoute("/admin/settings")({ component: AdminSettings });

function AdminSettings() {
  const settings = useSalonStore((s) => s.settings);
  const updateSettings = useSalonStore((s) => s.updateSettings);

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
      <h1 className="text-title font-normal">Settings</h1>
      <p className="mt-2 text-body text-muted">Organised by how the salon actually runs.</p>

      <form
        className="mt-8 space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          updateSettings({
            name: String(fd.get("name")),
            phone: String(fd.get("phone")),
            addressLine1: String(fd.get("addressLine1")),
            addressLine2: String(fd.get("addressLine2")),
            hours: String(fd.get("hours")),
            leadMinutes: Number(fd.get("leadMinutes")),
            cancellationHours: Number(fd.get("cancellationHours")),
            depositPercentDefault: Number(fd.get("depositPercentDefault")),
            mpesaEnabled: fd.get("mpesa") === "on",
            airtelEnabled: fd.get("airtel") === "on",
            tigoEnabled: fd.get("tigo") === "on",
          });
        }}
      >
        <section className="rounded-[24px] bg-surface p-5">
          <p className="text-micro uppercase tracking-[0.16em] text-muted">Salon</p>
          <Label className="mt-4">Business name</Label>
          <Input name="name" defaultValue={settings.name} />
          <Label className="mt-4">Phone</Label>
          <Input name="phone" defaultValue={settings.phone} />
          <Label className="mt-4">Street</Label>
          <Input name="addressLine1" defaultValue={settings.addressLine1} />
          <Label className="mt-4">City</Label>
          <Input name="addressLine2" defaultValue={settings.addressLine2} />
          <Label className="mt-4">Opening hours</Label>
          <Input name="hours" defaultValue={settings.hours} />
        </section>

        <section className="rounded-[24px] bg-surface p-5">
          <p className="text-micro uppercase tracking-[0.16em] text-muted">Booking</p>
          <Label className="mt-4">Lead time (minutes)</Label>
          <Input name="leadMinutes" type="number" defaultValue={settings.leadMinutes} />
          <Label className="mt-4">Cancellation window (hours)</Label>
          <Input name="cancellationHours" type="number" defaultValue={settings.cancellationHours} />
          <Label className="mt-4">Default deposit %</Label>
          <Input name="depositPercentDefault" type="number" defaultValue={settings.depositPercentDefault} />
          <p className="mt-4 text-support text-muted">{SALON.cancellationPolicy}</p>
        </section>

        <section className="rounded-[24px] bg-surface p-5">
          <p className="text-micro uppercase tracking-[0.16em] text-muted">Payments</p>
          <label className="mt-4 flex items-center gap-3 text-body">
            <input type="checkbox" name="mpesa" defaultChecked={settings.mpesaEnabled} /> M-Pesa
          </label>
          <label className="mt-3 flex items-center gap-3 text-body">
            <input type="checkbox" name="airtel" defaultChecked={settings.airtelEnabled} /> Airtel Money
          </label>
          <label className="mt-3 flex items-center gap-3 text-body">
            <input type="checkbox" name="tigo" defaultChecked={settings.tigoEnabled} /> Tigo Pesa
          </label>
          <p className="mt-4 text-support text-muted">Mobile money is collected through HarakaPay USSD push. SMS, WhatsApp, and email stay unconnected until those providers are added.</p>
        </section>

        <section className="rounded-[24px] bg-surface p-5">
          <p className="text-micro uppercase tracking-[0.16em] text-muted">Team</p>
          <p className="mt-3 text-body">Roles: Stylist · Reception · Manager · Admin</p>
          <p className="mt-1 text-support text-muted">Permissions are enforced in the staff engines, not only in the menu.</p>
        </section>

        <Button type="submit" className="h-12 w-full">
          Save settings
        </Button>
      </form>
    </main>
  );
}
