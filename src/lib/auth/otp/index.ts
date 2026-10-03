/**
 * OTP login — structure only. Feature flag otp_login must stay OFF until
 * SMS or WhatsApp provider is configured. Staff/admin never use OTP.
 */

export type OtpPurpose = "customer_login" | "customer_verify";

export function otpFeatureAllowed(): boolean {
  return (
    process.env.OTP_ENABLED === "true" &&
    Boolean(process.env.SMS_API_KEY || process.env.WHATSAPP_ACCESS_TOKEN)
  );
}

export async function requestOtp(_phone: string, _purpose: OtpPurpose): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!otpFeatureAllowed()) {
    return { ok: false, error: "OTP is not connected yet" };
  }
  // TODO(keys): generate code, hash with OTP_SECRET, enqueue otp_code message
  return { ok: false, error: "OTP provider not wired" };
}

export async function verifyOtp(_phone: string, _code: string): Promise<{ ok: boolean; error?: string }> {
  if (!otpFeatureAllowed()) {
    return { ok: false, error: "OTP is not connected yet" };
  }
  return { ok: false, error: "OTP provider not wired" };
}
