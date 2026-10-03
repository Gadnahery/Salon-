import type { MessagingProvider, MessagePayload, SendResult } from "../types";

export function makeBeemSms(): MessagingProvider {
  const key = process.env.SMS_API_KEY?.trim();
  const secret = process.env.SMS_API_SECRET?.trim();
  const sender = process.env.SMS_SENDER_ID?.trim();
  return {
    id: "beem",
    channel: "sms",
    isConfigured: () => Boolean(key && secret && sender),
    async send(): Promise<SendResult> {
      if (!key || !secret || !sender) {
        return { ok: false, status: "skipped_disabled", error: "SMS (Beem) not configured" };
      }
      return {
        ok: false,
        status: "skipped_disabled",
        error: "Beem adapter skeleton — wire request when keys are live",
      };
    },
  };
}

export function makeAfricasTalkingSms(): MessagingProvider {
  const key = process.env.SMS_API_KEY?.trim();
  const sender = process.env.SMS_SENDER_ID?.trim();
  return {
    id: "africastalking",
    channel: "sms",
    isConfigured: () => Boolean(key && sender),
    async send(): Promise<SendResult> {
      if (!key || !sender) {
        return { ok: false, status: "skipped_disabled", error: "SMS (AT) not configured" };
      }
      return {
        ok: false,
        status: "skipped_disabled",
        error: "Africa's Talking adapter skeleton — wire when keys are live",
      };
    },
  };
}
