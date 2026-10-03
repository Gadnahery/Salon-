import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ALL_TEMPLATES } from "@/lib/messaging/templates";
import { getOutboxLog } from "@/lib/messaging/outbox";

export const Route = createFileRoute("/admin/integrations")({
  component: AdminIntegrations,
});

function AdminIntegrations() {
  const [log, setLog] = useState(() => getOutboxLog(30));
  const status = useMemo(
    () => ({
      whatsapp: {
        configured: false,
        provider: process.env.WHATSAPP_PROVIDER || "disabled",
        hint: "Set WHATSAPP_* env in Vercel, then WHATSAPP_PROVIDER=cloud_api",
      },
      sms: {
        configured: false,
        provider: process.env.SMS_PROVIDER || "disabled",
        hint: "Set SMS_* env, then SMS_PROVIDER=beem or africastalking",
      },
    }),
    [],
  );

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
      <h1 className="font-display text-title font-normal">Integrations</h1>
      <p className="mt-2 text-body text-muted">
        Messaging is provider-ready. Flags default OFF. Keys live only in server env — never in the
        browser.
      </p>

      <section className="mt-8 rounded-[28px] bg-surface p-5 shadow-soft">
        <h2 className="text-section font-normal">WhatsApp</h2>
        <p className="mt-2 text-support text-muted">
          Status: <strong>Not connected yet</strong> ({status.whatsapp.provider})
        </p>
        <p className="mt-1 text-support text-muted">{status.whatsapp.hint}</p>
        <p className="mt-3 text-support">
          Env checklist: WHATSAPP_PROVIDER, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID,
          WHATSAPP_VERIFY_TOKEN, WHATSAPP_APP_SECRET
        </p>
      </section>

      <section className="mt-4 rounded-[28px] bg-surface p-5 shadow-soft">
        <h2 className="text-section font-normal">SMS</h2>
        <p className="mt-2 text-support text-muted">
          Status: <strong>Not connected yet</strong> ({status.sms.provider})
        </p>
        <p className="mt-1 text-support text-muted">{status.sms.hint}</p>
        <p className="mt-3 text-support">
          Env checklist: SMS_PROVIDER, SMS_API_KEY, SMS_API_SECRET, SMS_SENDER_ID
        </p>
      </section>

      <section className="mt-4 rounded-[28px] bg-surface p-5 shadow-soft">
        <h2 className="text-section font-normal">OTP</h2>
        <p className="mt-2 text-support text-muted">
          Status: <strong>Off</strong> — cannot enable until SMS or WhatsApp works. Staff and admin
          always use email login.
        </p>
      </section>

      <section className="mt-4 rounded-[28px] bg-surface p-5 shadow-soft">
        <h2 className="text-section font-normal">Test message</h2>
        <p className="mt-2 text-support text-muted">
          Sends only when a provider is configured. Otherwise records{" "}
          <code className="text-micro">skipped_disabled</code> (honest, not fake success).
        </p>
        <Button
          className="mt-4 h-11"
          variant="secondary"
          onClick={async () => {
            const { enqueueAndSend } = await import("@/lib/messaging/outbox");
            await enqueueAndSend({
              channel: "whatsapp",
              eventType: "test_message",
              to: "255000000000",
              featureEnabled: false,
            });
            setLog(getOutboxLog(30));
          }}
        >
          Run test (will skip if not connected)
        </Button>
      </section>

      <section className="mt-4 rounded-[28px] bg-surface p-5 shadow-soft">
        <h2 className="text-section font-normal">Message log (session)</h2>
        <ul className="mt-3 space-y-2">
          {log.length === 0 && <li className="text-support text-muted">No messages yet.</li>}
          {log.map((m) => (
            <li key={m.id} className="border-b border-line py-2 text-support last:border-0">
              <span className="font-medium">{m.eventType}</span> · {m.channel} · {m.status}
              {m.error ? ` — ${m.error}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-[28px] bg-surface p-5 shadow-soft">
        <h2 className="text-section font-normal">Templates</h2>
        <p className="mt-1 text-support text-muted">
          Swahili marked needs native review. WhatsApp templates are draft until you submit to Meta.
        </p>
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
          {ALL_TEMPLATES.map((t) => (
            <li key={t.eventType} className="text-support">
              <span className="font-medium">{t.eventType}</span>
              {t.needsNativeReview ? " · SW needs review" : ""} · approval: draft
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-support text-muted">
        Full setup guide: <code>docs/INTEGRATIONS.md</code>
      </p>
    </main>
  );
}
