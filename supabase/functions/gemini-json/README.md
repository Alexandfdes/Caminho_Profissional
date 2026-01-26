# gemini-json

Edge Function that proxies Gemini calls server-side.

## What it does
- Requires authenticated Supabase user (reads `Authorization: Bearer <jwt>`).
- Enforces a server-side daily limit via `check_and_increment_gemini_usage()`.
- Calls Gemini via REST with `GEMINI_API_KEY` (never exposed to the browser).

## Required secrets
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

## Deploy
- `supabase functions deploy gemini-json`

## Request body
```json
{
  "prompt": "...",
  "requestType": "question|careers|plan|explore|chat|cv|...",
  "mode": "json" ,
  "model": "gemini-2.5-flash",
  "temperature": 0.3,
  "maxOutputTokens": 2048
}
```

## Response
- JSON mode: `{ "data": <parsed-json> }`
- Text mode: `{ "text": "..." }`
