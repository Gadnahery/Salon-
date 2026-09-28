import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getNotifyPermission,
  hasPromptedNotify,
  markPromptedNotify,
  notificationSupported,
  requestNotifyPermission,
} from "@/lib/notifications/web-push";

/**
 * Soft prompt asking the user to allow notifications when they open
 * the web app or installed PWA. Shown once per browser until they choose.
 */
export function NotifyPrompt() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!notificationSupported()) return;
    if (hasPromptedNotify()) return;
    if (getNotifyPermission() === "granted" || getNotifyPermission() === "denied") {
      markPromptedNotify();
      return;
    }
    // Slight delay so it doesn't fight the first paint.
    const t = window.setTimeout(() => setVisible(true), 1200);
    return () => window.clearTimeout(t);
  }, []);

  if (!visible) return null;

  async function enable() {
    setBusy(true);
    await requestNotifyPermission();
    markPromptedNotify();
    setBusy(false);
    setVisible(false);
  }

  function dismiss() {
    markPromptedNotify();
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 px-4 lg:bottom-6 lg:left-auto lg:right-6 lg:w-96">
      <div className="rounded-[24px] border border-line bg-surface p-4 shadow-soft">
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-ink">
            <Bell className="size-5" strokeWidth={1.75} />
          </span>
          <div className="flex-1">
            <p className="text-body font-medium">Stay updated</p>
            <p className="mt-1 text-support text-muted">
              Get alerts for new requests, confirmations, and payments — even when Booking is in the background.
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" className="h-10 flex-1" disabled={busy} onClick={() => void enable()}>
                {busy ? "…" : "Allow"}
              </Button>
              <Button size="sm" variant="secondary" className="h-10 flex-1" onClick={dismiss}>
                Not now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
