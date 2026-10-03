import type { MessagingProvider, MessagePayload, SendResult } from "../types";

export function makeMock(channel: "whatsapp" | "sms"): MessagingProvider {
  return {
    id: "mock",
    channel,
    isConfigured: () => true,
    async send(payload: MessagePayload): Promise<SendResult> {
      if (typeof process !== "undefined" && process.env.ALLOW_MOCK_PROVIDERS !== "true") {
        return {
          ok: false,
          status: "skipped_disabled",
          error: "Mock providers blocked (set ALLOW_MOCK_PROVIDERS=true for local only)",
        };
      }
      console.info(`[mock:${channel}]`, payload.to, payload.body.slice(0, 80));
      return { ok: true, status: "sent", providerMessageId: `mock-${Date.now()}` };
    },
  };
}
