#!/usr/bin/env bash
# Deploy helper for webhook-mercadopago (bash)
# Usage: ./scripts/deploy-webhook.sh

set -euo pipefail

# Edit or export the following env vars before running, or uncomment to set here.
# export MP_WEBHOOK_SECRET=""
# export MERCADO_PAGO_ACCESS_TOKEN=""
# export MERCADO_PAGO_ACCESS_TOKEN_TEST=""
# export SUPABASE_URL=""
# export SUPABASE_SERVICE_ROLE_KEY=""

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI not found. Install: https://supabase.com/docs/guides/cli"
  exit 1
fi

echo "Setting secrets (values not echoed)..."
[ -n "${MP_WEBHOOK_SECRET:-}" ] && supabase secrets set MP_WEBHOOK_SECRET="$MP_WEBHOOK_SECRET"
[ -n "${MERCADO_PAGO_ACCESS_TOKEN:-}" ] && supabase secrets set MERCADO_PAGO_ACCESS_TOKEN="$MERCADO_PAGO_ACCESS_TOKEN"
[ -n "${MERCADO_PAGO_ACCESS_TOKEN_TEST:-}" ] && supabase secrets set MERCADO_PAGO_ACCESS_TOKEN_TEST="$MERCADO_PAGO_ACCESS_TOKEN_TEST"
[ -n "${SUPABASE_URL:-}" ] && supabase secrets set SUPABASE_URL="$SUPABASE_URL"
[ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ] && supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"

echo "Deploying function webhook-mercadopago..."
supabase functions deploy webhook-mercadopago

echo "Done. Check the function URL in Supabase dashboard or run 'supabase functions list'"
