import { createFileRoute } from "@tanstack/react-router";
import { Input, Label } from "@/components/ui/input";
import { ScreenHeader } from "@/components/salon/screen-header";
import { useSalonStore } from "@/lib/salon/store";
import { useHydrated } from "@/lib/utils";

export const Route = createFileRoute("/app/payments")({ component: PaymentsPage });

function PaymentsPage() {
  const profile = useSalonStore((s) => s.profile);
  const setProfile = useSalonStore((s) => s.setProfile);
  const hydrated = useHydrated();

  return (
    <main className="mx-auto min-h-dvh max-w-lg">
      <ScreenHeader title="Payment methods" backTo="/app/profile" />
      <div className="space-y-6 px-5 pb-10">
        <p className="text-body text-muted">
          Deposits are taken by mobile money. We detect the network from your number and send a prompt automatically.
        </p>
        <div>
          <Label htmlFor="mpesa">Mobile money number</Label>
          <Input
            id="mpesa"
            value={hydrated ? profile.mpesaPhone : ""}
            onChange={(e) => setProfile({ mpesaPhone: e.target.value, phone: e.target.value || profile.phone })}
            placeholder="+255 …"
          />
        </div>
        <div className="rounded-[24px] bg-surface p-5">
          <p className="text-body font-medium">How payment works</p>
          <p className="mt-2 text-body text-muted">
            A deposit holds your chair. The remaining balance is settled at the salon after your service.
          </p>
        </div>
      </div>
    </main>
  );
}
