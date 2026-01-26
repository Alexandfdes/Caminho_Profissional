# Deploy helper for webhook-mercadopago (PowerShell)
# Edit the variables below with your values before running.

param(
  [string]$MP_WEBHOOK_SECRET = "",
  [string]$MERCADO_PAGO_ACCESS_TOKEN = "",
  [string]$MERCADO_PAGO_ACCESS_TOKEN_TEST = "",
  [string]$SUPABASE_URL = "",
  [string]$SUPABASE_SERVICE_ROLE_KEY = ""
)

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
  Write-Error "supabase CLI not found in PATH. Install it first: https://supabase.com/docs/guides/cli"
  exit 1
}

Write-Host "Setting secrets (no values are shown)..."
if ($MP_WEBHOOK_SECRET) { supabase secrets set MP_WEBHOOK_SECRET="$MP_WEBHOOK_SECRET" }
if ($MERCADO_PAGO_ACCESS_TOKEN) { supabase secrets set MERCADO_PAGO_ACCESS_TOKEN="$MERCADO_PAGO_ACCESS_TOKEN" }
if ($MERCADO_PAGO_ACCESS_TOKEN_TEST) { supabase secrets set MERCADO_PAGO_ACCESS_TOKEN_TEST="$MERCADO_PAGO_ACCESS_TOKEN_TEST" }
if ($SUPABASE_URL) { supabase secrets set SUPABASE_URL="$SUPABASE_URL" }
if ($SUPABASE_SERVICE_ROLE_KEY) { supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" }

Write-Host "Deploying function webhook-mercadopago..."
supabase functions deploy webhook-mercadopago

Write-Host "Done. Check function URL and logs via Supabase dashboard or 'supabase functions list'."
