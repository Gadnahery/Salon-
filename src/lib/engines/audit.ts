import type { AuditEvent } from "@/lib/salon/types";

export function makeAudit(
  actor: string,
  action: string,
  target: string,
  before?: string,
  after?: string,
): AuditEvent {
  return {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    actor,
    action,
    target,
    before,
    after,
    at: new Date().toISOString(),
  };
}
