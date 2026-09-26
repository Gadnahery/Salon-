import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function ConfirmSheet({
  open,
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
  danger,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-[24px] bg-surface p-6 shadow-float">
        <p className="text-section font-normal">{title}</p>
        <div className="mt-3 text-body text-muted">{body}</div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="secondary" className="h-12" onClick={onCancel}>
            Back
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            className={danger ? "h-12 bg-danger text-white hover:bg-danger/90" : "h-12"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
