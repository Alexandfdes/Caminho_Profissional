// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("GEMINIAPIKEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("SUPABASEURL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASEANONKEY");

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigins = new Set<string>([
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
  ]);

  const allowOrigin = allowedOrigins.has(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": [
      "authorization",
      "apikey",
      "content-type",
      "x-client-info",
      "accept",
      "accept-language",
      "cache-control",
      "pragma",
    ].join(", "),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
};

function json(data: any, corsHeaders: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractJson(text: string): any {
  // Try to extract the first JSON object/array from the text.
  const trimmed = String(text ?? "").trim();
  if (!trimmed) throw new Error("Resposta vazia da IA");

  // Strip common markdown fences.
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Prefer full parse first.
  try {
    return JSON.parse(unfenced);
  } catch {
    // continue
  }

  // Attempt a very small "repair" pass for common model mistakes.
  // This is intentionally conservative: it helps with cases like `{ html: "..." }`.
  try {
    let repaired = unfenced;
    // Quote unquoted keys: { html: "x" } -> { "html": "x" }
    repaired = repaired.replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":');
    // Convert single-quoted strings to double-quoted strings (best-effort)
    repaired = repaired.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_m, g1) => {
      const inner = String(g1).replace(/"/g, '\\"');
      return `"${inner}"`;
    });
    // Remove trailing commas
    repaired = repaired.replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(repaired);
  } catch {
    // continue
  }

  // Try to find a JSON object {...} or array [...]
  const objMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch {
      // continue
    }
  }

  const arrMatch = trimmed.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try {
      return JSON.parse(arrMatch[0]);
    } catch {
      // continue
    }
  }

  throw new Error("A IA não retornou JSON válido");
}

async function getAuthedUser(req: Request) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE_URL/SUPABASE_ANON_KEY not configured");
  }

  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!authHeader) return null;

  const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data, error } = await supabaseAuth.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

// ... (existing helper functions: getCorsHeaders, json, extractJson, getAuthedUser) ...
// (Keeping existing helpers as they were in the original file, just ensuring they are available)

async function callOpenAI(
  apiKey: string,
  model: string,
  prompt: string,
  temperature: number = 0.5,
  maxTokens: number = 2000,
  mode: "json" | "text" = "json"
): Promise<string> {
  const messages = [
    {
      role: "system",
      content:
        mode === "json"
          ? "You are a helpful assistant. Return ONLY valid JSON."
          : "You are a helpful assistant.",
    },
    { role: "user", content: prompt },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      // temperature is NOT supported/recommended for gpt-5-mini reasoning models when effort != none.
      // We'll omit it for simplicity if using gpt-5-mini, or generally omit if not strictly needed.
      // temperature: temperature, 
      max_completion_tokens: maxTokens,
      response_format: mode === "json" ? { type: "json_object" } : undefined,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("OpenAI API error:", response.status, errText);
    throw new Error(`OpenAI error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content ?? "";
  return text;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const user = await getAuthedUser(req);
    // Allow anonymous usage if no key is configured? No, enforce auth unless explicit override.
    // The original code enforced auth.
    if (!user) return json({ error: "not authenticated" }, corsHeaders, 401);

    const body = await req.json().catch(() => ({}));
    const prompt = String(body?.prompt ?? "");
    const requestType = String(body?.requestType ?? "unknown");

    const modelRaw = String(body?.model ?? "gemini-2.5-flash").toLowerCase();
    // Map "gpt 5 mini" user request to a real model if needed, but better to rely on frontend sending the right string.
    // If frontend sends "gpt-4o-mini", we use it. 
    const model = modelRaw;

    const temperature = typeof body?.temperature === "number" ? body.temperature : undefined;
    const maxOutputTokens = typeof body?.maxOutputTokens === "number" ? body.maxOutputTokens : undefined;

    const mode = String(body?.mode ?? "json");

    if (!prompt || prompt.trim().length === 0) {
      return json({ error: "Missing prompt" }, corsHeaders, 400);
    }

    // Enforce daily limit (keep usage check)
    const supabaseRpc = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: req.headers.get("authorization") ?? "" } },
      auth: { persistSession: false },
    });

    const { data: usage, error: usageErr } = await supabaseRpc.rpc(
      "check_and_increment_gemini_usage",
      { p_request_type: requestType },
    );

    if (usageErr) {
      // Log but maybe don't block if RPC fails? Original code blocked.
      console.error("Usage RPC error:", usageErr);
      return json({ error: "Falha ao validar limite de uso" }, corsHeaders, 500);
    }
    const usageRow = Array.isArray(usage) ? usage[0] : usage;
    if (!usageRow?.allowed) {
      return json(
        {
          error: "Limite diário de requisições atingido. Tente amanhã.",
          dailyLimit: usageRow?.daily_limit ?? 1500,
        },
        corsHeaders,
        429,
      );
    }

    let responseText = "";

    // === ROUTING LOGIC ===
    if (model.startsWith("gpt")) {
      if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");
      responseText = await callOpenAI(
        OPENAI_API_KEY,
        model,
        prompt,
        temperature,
        maxOutputTokens, // OpenAI uses max_tokens, mapped in helper
        mode as "json" | "text"
      );
    } else {
      // Default to Gemini
      if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

      const finalPrompt =
        mode === "json"
          ? `${prompt}\n\nIMPORTANTE: Retorne APENAS JSON válido.`
          : prompt;

      const geminiResp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
            generationConfig: {
              ...(typeof temperature === "number" ? { temperature } : {}),
              ...(typeof maxOutputTokens === "number" ? { maxOutputTokens } : {}),
              ...(mode === "json" ? { responseMimeType: "application/json" } : {}),
            },
          }),
        },
      );

      if (!geminiResp.ok) {
        const errText = await geminiResp.text();
        console.error("Gemini API error:", geminiResp.status, errText);
        throw new Error("Erro ao comunicar com a IA (Gemini)");
      }

      const geminiData = await geminiResp.json();
      responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    if (!responseText) {
      return json({ error: "Resposta vazia da IA" }, corsHeaders, 502);
    }

    if (mode === "text") {
      return json({ text: responseText }, corsHeaders, 200);
    }

    try {
      const parsed = extractJson(responseText);
      return json({ data: parsed }, corsHeaders, 200);
    } catch (e) {
      if (requestType === 'cv_enhance') {
        return json({ data: { html: String(responseText || '').trim() } }, corsHeaders, 200);
      }
      throw e;
    }

  } catch (err) {
    console.error("gemini-json error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: msg }, corsHeaders, 400);
  }
});
