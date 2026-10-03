import type { MessagingProvider, MessagePayload, SendResult } from "../types";

export const disabledProvider: MessagingProvider = {
  id: "disabled",
  channel: "sms",
  isConfigured: () => false,
  async send(_payload: MessagePayload): Promise<SendResult> {
    return { ok: false, status: "skipped_disabled", error: "Provider not connected" };
  },
};

export function makeDisabled(channel: "whatsapp" | "sms"): MessagingProvider {
  return { ...disabledProvider, channel };
}
