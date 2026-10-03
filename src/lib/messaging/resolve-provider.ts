import { makeDisabled } from "./providers/disabled";
import { makeMock } from "./providers/mock";
import { makeWhatsAppCloud } from "./providers/whatsapp-cloud";
import { makeBeemSms, makeAfricasTalkingSms } from "./providers/sms";
import type { MessagingProvider, MessageChannel } from "./types";

function allowMock(): boolean {
  return process.env.ALLOW_MOCK_PROVIDERS === "true" && process.env.VERCEL_ENV !== "production";
}

export function resolveWhatsAppProvider(): MessagingProvider {
  const name = (process.env.WHATSAPP_PROVIDER || "disabled").toLowerCase();
  if (name === "mock" && allowMock()) return makeMock("whatsapp");
  if (name === "cloud_api") {
    const p = makeWhatsAppCloud();
    return p.isConfigured() ? p : makeDisabled("whatsapp");
  }
  return makeDisabled("whatsapp");
}

export function resolveSmsProvider(): MessagingProvider {
  const name = (process.env.SMS_PROVIDER || "disabled").toLowerCase();
  if (name === "mock" && allowMock()) return makeMock("sms");
  if (name === "beem") {
    const p = makeBeemSms();
    return p.isConfigured() ? p : makeDisabled("sms");
  }
  if (name === "africastalking") {
    const p = makeAfricasTalkingSms();
    return p.isConfigured() ? p : makeDisabled("sms");
  }
  return makeDisabled("sms");
}

export function resolveProvider(channel: MessageChannel): MessagingProvider {
  if (channel === "whatsapp") return resolveWhatsAppProvider();
  if (channel === "sms") return resolveSmsProvider();
  return makeDisabled("sms");
}

export function providerStatus() {
  const wa = resolveWhatsAppProvider();
  const sms = resolveSmsProvider();
  return {
    whatsapp: {
      provider: wa.id,
      configured: wa.isConfigured(),
      envHint: ["WHATSAPP_PROVIDER", "WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"],
    },
    sms: {
      provider: sms.id,
      configured: sms.isConfigured(),
      envHint: ["SMS_PROVIDER", "SMS_API_KEY", "SMS_API_SECRET", "SMS_SENDER_ID"],
    },
    mockAllowed: allowMock(),
  };
}
