export type MessageChannel = "whatsapp" | "sms" | "push" | "in_app";

export type MessageEventType =
  | "booking_confirmed"
  | "payment_received"
  | "payment_failed"
  | "reminder_24h"
  | "reminder_2h"
  | "appointment_cancelled"
  | "appointment_rescheduled"
  | "stylist_ready"
  | "waitlist_slot_offer"
  | "review_request"
  | "otp_code"
  | "booking_request"
  | "test_message";

export type OutboxStatus =
  | "pending"
  | "queued"
  | "sent"
  | "delivered"
  | "failed"
  | "skipped_disabled"
  | "skipped_consent";

export type ProviderId = "disabled" | "mock" | "cloud_api" | "beem" | "africastalking";

export type SendResult = {
  ok: boolean;
  status: OutboxStatus;
  providerMessageId?: string;
  error?: string;
};

export type MessagePayload = {
  to: string;
  body: string;
  eventType: MessageEventType;
  locale?: string;
  appointmentId?: string;
  meta?: Record<string, string>;
};

export interface MessagingProvider {
  id: ProviderId;
  channel: MessageChannel;
  isConfigured(): boolean;
  send(payload: MessagePayload): Promise<SendResult>;
}

export type FeatureFlagKey =
  | "whatsapp_messaging"
  | "sms_messaging"
  | "otp_login"
  | "waitlist_backfill"
  | "i18n_swahili";
