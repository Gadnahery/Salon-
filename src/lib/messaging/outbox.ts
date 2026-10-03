import { resolveProvider } from "./resolve-provider";
import { renderTemplate } from "./templates";
import type { MessageChannel, MessageEventType, OutboxStatus } from "./types";

export type OutboxRecord = {
  id: string;
  channel: MessageChannel;
  eventType: MessageEventType;
  to: string;
  body: string;
  locale: string;
  status: OutboxStatus;
  provider?: string;
  providerMessageId?: string;
  error?: string;
  appointmentId?: string;
  createdAt: string;
};

const memoryLog: OutboxRecord[] = [];

export function getOutboxLog(limit = 50): OutboxRecord[] {
  return memoryLog.slice(0, limit);
}

/**
 * Enqueue and attempt send. Never claims success when provider is disabled.
 * Client must not call this — server functions only.
 */
export async function enqueueAndSend(input: {
  channel: MessageChannel;
  eventType: MessageEventType;
  to: string;
  vars?: Record<string, string>;
  locale?: "en" | "sw";
  appointmentId?: string;
  featureEnabled?: boolean;
}): Promise<OutboxRecord> {
  const locale = input.locale ?? "en";
  const body =
    input.channel === "in_app" || input.channel === "push"
      ? renderTemplate(input.eventType, input.vars ?? {}, locale)
      : renderTemplate(input.eventType, input.vars ?? {}, locale);

  const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const base: OutboxRecord = {
    id,
    channel: input.channel,
    eventType: input.eventType,
    to: input.to,
    body,
    locale,
    status: "pending",
    appointmentId: input.appointmentId,
    createdAt: new Date().toISOString(),
  };

  if (input.featureEnabled === false) {
    const row = { ...base, status: "skipped_disabled" as const, error: "Feature flag off" };
    memoryLog.unshift(row);
    return row;
  }

  if (input.channel === "push" || input.channel === "in_app") {
    // Handled by existing push/notice paths; mark as queued for audit
    const row = { ...base, status: "queued" as const, provider: "app" };
    memoryLog.unshift(row);
    return row;
  }

  const provider = resolveProvider(input.channel);
  if (!provider.isConfigured()) {
    const row = {
      ...base,
      status: "skipped_disabled" as const,
      provider: provider.id,
      error: "Not connected yet",
    };
    memoryLog.unshift(row);
    return row;
  }

  const result = await provider.send({
    to: input.to,
    body,
    eventType: input.eventType,
    locale,
    appointmentId: input.appointmentId,
  });

  const row: OutboxRecord = {
    ...base,
    status: result.status,
    provider: provider.id,
    providerMessageId: result.providerMessageId,
    error: result.error,
  };
  memoryLog.unshift(row);
  return row;
}
