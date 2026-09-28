import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getNotifyPermission,
  notificationSupported,
  requestNotifyPermission,
} from "@/lib/notifications/web-push";
import { subscribeStaffPush } from "@/lib/notifications/push-client";

type Portal = "staff" | "admin";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const KEY = (portal: Portal) => `booking-install-${portal}`;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    ("standalone" in navigator && Boolean((navigator as { standalone?: boolean }).standalone))
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Staff / admin only: prompt to install Booking as a home-screen app
 * so they stay signed in and can receive browser notifications.
 * Customer is not prompted (by design).
 */
export function InstallPrompt({ portal }: { portal: Portal }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;
    if (localStorage.getItem(KEY(portal)) === "1") return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    // iOS has no beforeinstallprompt — show Share instructions after a delay
    const t = window.setTimeout(() => {
      if (isStandalone()) return;
      if (localStorage.getItem(KEY(portal)) === "1") return;
      if (isIos()) {
        setIosHint(true);
        setVisible(true);
      } else if (!deferred) {
        // Chromium may fire BIP later; still show a soft card
        setVisible(true);
      }
    }, 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portal]);

  if (!visible || isStandalone()) return null;

  const title = portal === "admin" ? "Install Admin app" : "Install Staff app";
  const body =
    portal === "admin"
      ? "Add Booking Admin to your home screen. Stay signed in and get payment & booking alerts on your phone."
      : "Add Booking Staff to your home screen. Stay signed in and get new request alerts so you can confirm bookings.";

  function dismiss() {
    localStorage.setItem(KEY(portal), "1");
    setVisible(false);
  }

  async function install() {
    setBusy(true);
    if (notificationSupported() && getNotifyPermission() === "default") {
      await requestNotifyPermission();
    }
    // Register Web Push so alerts work when app is closed
    void subscribeStaffPush({ portal });
    if (deferred) {
      try {
        await deferred.prompt();
        await deferred.userChoice;
      } catch {
        /* user dismissed native sheet */
      }
      setDeferred(null);
      localStorage.setItem(KEY(portal), "1");
      setVisible(false);
    } else if (isIos()) {
      setIosHint(true);
    }
    setBusy(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 px-4 lg:bottom-6 lg:left-auto lg:right-6 lg:w-96">
      <div className="rounded-[24px] border border-line bg-surface p-4 shadow-soft">
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-white">
            <Download className="size-5" strokeWidth={1.75} />
          </span>
          <div className="flex-1">
            <p className="text-body font-medium">{title}</p>
            <p className="mt-1 text-support text-muted">{body}</p>
            {iosHint && (
              <p className="mt-2 flex items-start gap-2 text-support text-muted">
                <Share className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
                <span>
                  On iPhone: tap <strong>Share</strong> → <strong>Add to Home Screen</strong>. Open that icon to stay in{" "}
                  {portal === "admin" ? "Admin" : "Staff"}.
                </span>
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <Button size="sm" className="h-10 flex-1 bg-ink text-white" disabled={busy} onClick={() => void install()}>
                {busy ? "…" : deferred ? "Install" : isIos() ? "How to install" : "Install"}
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
