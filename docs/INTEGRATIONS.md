# Warembo Village — Integrations

Connect messaging without code changes.

## Defaults
All providers are **disabled**. The app runs without any of these variables.

## WhatsApp (Meta Cloud API)
1. Create a Meta Business app + WhatsApp product.
2. Set in Vercel:
   - `WHATSAPP_PROVIDER=cloud_api`
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_BUSINESS_ACCOUNT_ID`
   - `WHATSAPP_VERIFY_TOKEN` (random string you invent)
   - `WHATSAPP_APP_SECRET`
3. Webhook URL: `https://YOUR_DOMAIN/api/webhooks/whatsapp`
4. Admin → Integrations → Run test message.

## SMS
- `SMS_PROVIDER=beem` or `africastalking`
- `SMS_API_KEY`, `SMS_API_SECRET` (Beem), `SMS_SENDER_ID`

## OTP
- Requires a working SMS or WhatsApp provider.
- `OTP_CHANNEL=sms` or `whatsapp`
- `OTP_SECRET` (long random)
- Staff and admin **never** use OTP.

## Cron reminders
- `CRON_SECRET`
- Schedule GET `/api/cron/reminders?secret=CRON_SECRET` (e.g. Vercel Cron hourly)

## Safety
- `ALLOW_MOCK_PROVIDERS=true` **only** on your machine. Never in production.
- Unconfigured sends are logged as `skipped_disabled`, never as “sent”.
