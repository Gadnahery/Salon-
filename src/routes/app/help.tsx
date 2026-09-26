import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ScreenHeader } from "@/components/salon/screen-header";
import { SALON } from "@/lib/salon/data";

export const Route = createFileRoute("/app/help")({ component: HelpPage });

const faqs = [
  {
    q: "How does the deposit work?",
    a: "A deposit equal to half the service price holds your chair. The rest is paid at the salon after your appointment.",
  },
  {
    q: "Can I change my stylist?",
    a: "Yes — reschedule from the appointment, or message us on WhatsApp and we'll move you.",
  },
  {
    q: "What if I'm running late?",
    a: "Call or WhatsApp the salon. If you're more than 15 minutes behind, we may need to rebook the remaining time.",
  },
  {
    q: "Do you take walk-ins?",
    a: "When a chair opens, yes. Booking is the surest way to be seen.",
  },
];

function HelpPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-lg">
      <ScreenHeader title="Help" backTo="/app/profile" />
      <div className="px-5 pb-10">
        <div className="space-y-6">
          {faqs.map((f) => (
            <div key={f.q}>
              <h2 className="text-body font-medium">{f.q}</h2>
              <p className="mt-2 text-body text-muted">{f.a}</p>
            </div>
          ))}
        </div>
        <a href={SALON.whatsapp} className="mt-10 block">
          <Button className="h-13 w-full">Message on WhatsApp</Button>
        </a>
        <a href={SALON.phoneHref} className="mt-3 block">
          <Button variant="secondary" className="h-12 w-full">
            Call the salon
          </Button>
        </a>
      </div>
    </main>
  );
}
