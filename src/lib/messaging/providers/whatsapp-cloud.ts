import type { MessagingProvider, MessagePayload, SendResult } from "../types";

/** Meta WhatsApp Cloud API. TODO(keys): WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID */
export function makeWhatsAppCloud(): MessagingProvider {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();

  return {
    id: "cloud_api",
    channel: "whatsapp",
    isConfigured: () => Boolean(token && phoneId),
    async send(payload: MessagePayload): Promise<SendResult> {
      if (!token || !phoneId) {
        return { ok: false, status: "skipped_disabled", error: "WhatsApp not configured" };
      }
      try {
        const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: payload.to.replace(/\D/g, ""),
            type: "text",
            text: { body: payload.body },
          }),
        });
        if (!res.ok) {
          const text = await res.text();
          return { ok: false, status: "failed", error: text.slice(0, 200) };
        }
        const data = (await res.json()) as { messages?: Array<{ id?: string }> };
        return { ok: true, status: "sent", providerMessageId: data.messages?.[0]?.id };
      } catch (e) {
        return {
          ok: false,
          status: "failed",
          error: e instanceof Error ? e.message : "WhatsApp send failed",
        };
      }
    },
  };
}
