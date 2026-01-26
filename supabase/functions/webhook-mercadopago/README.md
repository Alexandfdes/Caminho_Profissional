# webhook-mercadopago

This function receives Mercado Pago webhooks, validates the HMAC signature, fetches payment details from Mercado Pago and grants the `subscriber` role in Supabase for subscription purchases.

## Required environment variables (set via `supabase secrets set`)
- `MP_WEBHOOK_SECRET` — webhook HMAC secret from Mercado Pago (required for production).
- `MERCADO_PAGO_ACCESS_TOKEN` — Mercado Pago production Access Token (Bearer).
- `MERCADO_PAGO_ACCESS_TOKEN_TEST` — Mercado Pago test Access Token (optional, fallback).
- `SUPABASE_URL` — your Supabase project URL (e.g. `https://<project-ref>.supabase.co`).
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase Service Role Key (server-side only).

## SQL (run in Supabase SQL editor)
Apply the migration in `supabase/migrations/001_create_webhook_events.sql` or run:

```sql
create table if not exists webhook_events (
  id text primary key,
  topic text,
  received_at timestamptz default now()
);

alter table if exists user_roles
  add constraint if not exists user_roles_unique unique (user_id, role);
```

## Deploy
1. Set secrets (replace placeholders):

```powershell
supabase secrets set MP_WEBHOOK_SECRET="YOUR_MP_WEBHOOK_SECRET"
supabase secrets set MERCADO_PAGO_ACCESS_TOKEN="YOUR_MP_PROD_TOKEN"
supabase secrets set MERCADO_PAGO_ACCESS_TOKEN_TEST="YOUR_MP_TEST_TOKEN"  # optional
supabase secrets set SUPABASE_URL="https://<project-ref>.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
```

2. Deploy function:

```bash
supabase functions deploy webhook-mercadopago
```

## Health check
- GET https://<project-ref>.functions.supabase.co/webhook-mercadopago/health
- or: https://<project-ref>.functions.supabase.co/webhook-mercadopago?health=1

## Testing
- Use Mercado Pago dashboard → Webhooks → Simulate notification (Payments) against the deployed URL.
- For quick debug without signature, you can POST a minimal payload (only for dev):

```powershell
Invoke-RestMethod -Uri "https://<project-ref>.functions.supabase.co/webhook-mercadopago" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"type":"payment","data":{"id":"123456"}}' `
  -SkipCertificateCheck
```

> In production test with the simulator (it sends `X-Signature` and `X-Request-Id`).

## Notes
- The function supports idempotency by storing received event ids in `webhook_events`.
- Signature validation expects `X-Signature` in the form `ts=<ts>,v1=<hex>` and `X-Request-Id`. The manifest is built as: `id:<data.id>;request-id:<X-Request-Id>;ts:<ts>;`.
- Logs are intentionally concise and do not print secret values.
