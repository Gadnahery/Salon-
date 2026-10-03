import type { MessageEventType } from "./types";

export type TemplateDef = {
  eventType: MessageEventType;
  en: string;
  /** needs native review before launch */
  sw: string;
  needsNativeReview: true;
};

const T: TemplateDef[] = [
  {
    eventType: "booking_confirmed",
    en: "Hi {{name}}, your {{service}} is confirmed for {{date}} at {{time}} with {{stylist}}. See you at Warembo Village, {{address}}.",
    sw: "Habari {{name}}, huduma yako ya {{service}} imethibitishwa tarehe {{date}} saa {{time}} na {{stylist}}. Tukutane Warembo Village, {{address}}.",
    needsNativeReview: true,
  },
  {
    eventType: "payment_received",
    en: "Payment of {{amount}} received. Your booking for {{service}} on {{date}} is secured. Ref {{ref}}.",
    sw: "Malipo ya {{amount}} yamepokelewa. Booking yako ya {{service}} tarehe {{date}} imehifadhiwa. Ref {{ref}}.",
    needsNativeReview: true,
  },
  {
    eventType: "payment_failed",
    en: "We could not complete payment for {{service}}. Open the app to try again or use a different number.",
    sw: "Malipo ya {{service}} hayajakamilika. Fungua app ujaribu tena au tumia namba nyingine.",
    needsNativeReview: true,
  },
  {
    eventType: "reminder_24h",
    en: "Reminder: {{service}} tomorrow at {{time}} at Warembo Village. Reply if you need to reschedule.",
    sw: "Kikumbusho: {{service}} kesho saa {{time}} Warembo Village. Jibu kama unahitaji kubadilisha muda.",
    needsNativeReview: true,
  },
  {
    eventType: "reminder_2h",
    en: "See you in about 2 hours for {{service}} ({{time}}). Address: {{address}}.",
    sw: "Tutakuona baada ya saa 2 kwa {{service}} ({{time}}). Anwani: {{address}}.",
    needsNativeReview: true,
  },
  {
    eventType: "appointment_cancelled",
    en: "Your {{service}} on {{date}} at {{time}} was cancelled. Book again anytime in the app.",
    sw: "Huduma yako ya {{service}} tarehe {{date}} saa {{time}} imefutwa. Unaweza book tena kwenye app.",
    needsNativeReview: true,
  },
  {
    eventType: "appointment_rescheduled",
    en: "Your {{service}} moved to {{date}} at {{time}}. See you then.",
    sw: "Huduma yako ya {{service}} imehamishiwa tarehe {{date}} saa {{time}}. Tutakuona.",
    needsNativeReview: true,
  },
  {
    eventType: "stylist_ready",
    en: "{{stylist}} is ready for you. Please come to the chair for {{service}}.",
    sw: "{{stylist}} yuko tayari. Tafadhali njoo kwa kiti kwa {{service}}.",
    needsNativeReview: true,
  },
  {
    eventType: "waitlist_slot_offer",
    en: "A slot opened for {{service}} on {{date}} at {{time}}. You have {{minutes}} minutes to accept in the app.",
    sw: "Nafasi imepatikana kwa {{service}} tarehe {{date}} saa {{time}}. Una dakika {{minutes}} kukubali kwenye app.",
    needsNativeReview: true,
  },
  {
    eventType: "review_request",
    en: "How was your {{service}} at Warembo Village? Leave a quick rating in the app.",
    sw: "Huduma yako ya {{service}} Warembo Village ilikuaje? Acha rating kwenye app.",
    needsNativeReview: true,
  },
  {
    eventType: "otp_code",
    en: "Your Warembo code is {{code}}. Valid for 10 minutes. Do not share it.",
    sw: "Namba yako ya Warembo ni {{code}}. Inatumika dakika 10. Usishiriki na mtu.",
    needsNativeReview: true,
  },
  {
    eventType: "booking_request",
    en: "New request: {{name}} wants {{service}} on {{date}} at {{time}}. Open staff app to accept.",
    sw: "Ombi jipya: {{name}} anataka {{service}} tarehe {{date}} saa {{time}}. Fungua app ya staff kukubali.",
    needsNativeReview: true,
  },
  {
    eventType: "test_message",
    en: "Warembo Village test message. Integrations are connected.",
    sw: "Ujumbe wa majaribio wa Warembo Village. Muunganisho umefanikiwa.",
    needsNativeReview: true,
  },
];

export function getTemplate(eventType: MessageEventType, locale: "en" | "sw" = "en"): string {
  const row = T.find((t) => t.eventType === eventType);
  if (!row) return "";
  return locale === "sw" ? row.sw : row.en;
}

export function renderTemplate(
  eventType: MessageEventType,
  vars: Record<string, string>,
  locale: "en" | "sw" = "en",
): string {
  let body = getTemplate(eventType, locale);
  for (const [k, v] of Object.entries(vars)) {
    body = body.replaceAll(`{{${k}}}`, v);
  }
  return body;
}

export const ALL_TEMPLATES = T;
