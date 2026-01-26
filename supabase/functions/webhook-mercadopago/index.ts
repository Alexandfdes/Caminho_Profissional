// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
const MERCADO_PAGO_ACCESS_TOKEN_TEST =
    Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN_TEST") ?? Deno.env.get("MERCADOPAGO_ACCESS_TOKEN_TEST");

const MP_WEBHOOK_SECRET = Deno.env.get("MP_WEBHOOK_SECRET");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id, x-signature",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: any, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

function parseSignature(sigHeader: string | null) {
    if (!sigHeader) return null;
    const out: Record<string, string> = {};
    // Accept comma or semicolon separated pairs
    for (const part of sigHeader.split(/[;,]/)) {
        const [k, v] = part.trim().split("=");
        if (k && v) out[k] = v;
    }
    return { ts: out["ts"], v1: out["v1"] };
}

async function hmacSha256Hex(secret: string, payload: string) {
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );
    const signatureBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    return Array.from(new Uint8Array(signatureBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Valida a assinatura do webhook (X-Signature + X-Request-Id) */
async function verifyMpSignature(req: Request, dataId: string | null) {
    if (!MP_WEBHOOK_SECRET) {
        console.error("MP_WEBHOOK_SECRET not set on server environment");
        return false;
    }

    const sigHeader = req.headers.get("x-signature") || req.headers.get("X-Signature");
    const reqId = req.headers.get("x-request-id") || req.headers.get("X-Request-Id");

    if (!sigHeader || !reqId || !dataId) {
        console.warn("Missing signature headers or dataId for verification");
        return false;
    }

    const parsed = parseSignature(sigHeader);
    if (!parsed || !parsed.ts || !parsed.v1) return false;

    const manifest = `id:${dataId};request-id:${reqId};ts:${parsed.ts};`;
    const computed = await hmacSha256Hex(MP_WEBHOOK_SECRET, manifest);

    const isValid = computed === parsed.v1;

    if (!isValid) {
        console.error("Signature mismatch!");
        return false;
    }
    return isValid;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        // 204 responses must not include a body.
        return new Response(null, { headers: corsHeaders, status: 204 });
    }

    try {
        const rawBody = await req.text();
        let body: any = null;
        if (rawBody) {
            try {
                body = JSON.parse(rawBody);
            } catch {
                // ignore parse errors
            }
        }

        const url = new URL(req.url);

        // Healthcheck: allow quick GET /health or ?health=1 for uptime probes
        if ((req.method === "GET" || req.method === "HEAD") && (url.pathname.endsWith("/health") || url.searchParams.get("health") === "1" || url.searchParams.get("health") === "true" || url.pathname.includes("webhook-mercadopago"))) {
            console.log(`Health check received: method=${req.method}`);
            return json({ ok: true, message: "Webhook is reachable" }, 200);
        }
        let topic = url.searchParams.get("topic") || url.searchParams.get("type") || body?.type || body?.topic;
        let id = url.searchParams.get("id") || url.searchParams.get("data.id") || body?.data?.id || body?.id;

        console.log(`Webhook received: topic=${topic}, id=${id}`);

        // Validate signature
        // 1. MUST BE ENABLED FOR PRODUCTION SECURITY
        const isValid = await verifyMpSignature(req, id || null);
        if (!isValid) {
            console.warn("Invalid webhook signature (blocked)");
            return json({ error: "invalid signature" }, 401);
        }

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error("Supabase service role not configured");
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Idempotency: record event first (Optional - don't crash if table missing)
        if (id) {
            try {
                const { data: existing } = await supabase.from("webhook_events").select("id").eq("id", id).maybeSingle();
                if (existing) {
                    console.log(`Duplicate event ${id} ignored`);
                    return json({ received: true, dedup: true });
                }
                await supabase.from("webhook_events").insert({ id, topic: topic ?? null, received_at: new Date().toISOString() });
            } catch (logErr) {
                console.warn("Could not log webhook event to database (webhook_events table might be missing):", logErr);
            }
        }

        // Process payment events
        if (topic === "payment") {
            if (!id) throw new Error("No payment id provided by webhook");
            if (!MERCADO_PAGO_ACCESS_TOKEN) throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");

            const fetchPayment = async (token: string) =>
                fetch(`https://api.mercadopago.com/v1/payments/${id}`, { headers: { Authorization: `Bearer ${token}` } });

            let paymentResponse = await fetchPayment(MERCADO_PAGO_ACCESS_TOKEN);
            if (
                !paymentResponse.ok &&
                (paymentResponse.status === 401 || paymentResponse.status === 403 || paymentResponse.status === 404) &&
                MERCADO_PAGO_ACCESS_TOKEN_TEST
            ) {
                paymentResponse = await fetchPayment(MERCADO_PAGO_ACCESS_TOKEN_TEST);
            }

            if (!paymentResponse.ok) {
                if (paymentResponse.status === 404) {
                    console.warn(`Payment ${id} not found in Mercado Pago. Might be a test notification from the portal.`);
                    return json({ received: true, message: "Payment ID not found (skipped enrichment)" }, 200);
                }
                throw new Error(`Failed to fetch payment details (status ${paymentResponse.status})`);
            }

            const paymentData = await paymentResponse.json();
            console.log("Payment status:", paymentData.status);

            if (paymentData.status === "approved") {
                const externalReferenceRaw = paymentData.external_reference;
                if (!externalReferenceRaw) return json({ error: "No external_reference found" }, 400);

                let userId: string | null = null;
                let planId: string | null = null;

                try {
                    try {
                        const parsed = JSON.parse(String(externalReferenceRaw));
                        userId = parsed?.userId || null;
                        planId = parsed?.planId || null;
                    } catch {
                        // Fallback: userId:planId format
                        const parts = String(externalReferenceRaw).split(":");
                        userId = parts[0] || null;
                        planId = parts[1] || null;
                    }
                } catch (e) {
                    console.error("Error parsing external_reference:", e);
                    // Do not crash, let it fail gracefully if userId missing
                }

                if (!userId && paymentData?.metadata?.userId) userId = paymentData.metadata.userId;
                if (!planId && paymentData?.metadata?.planId) planId = paymentData.metadata.planId;

                if (!userId) return json({ error: "No userId found" }, 400);

                console.log(`Approved payment for userId=${userId}, planId=${planId}`);

                // TIERED ACCESS LOGIC
                // 'plano_completo' (R$19) -> subscriber_basic (No CV Analyzer)
                // 'assinatura_premium' (R$39) or 'subscription' -> subscriber (Full Access)

                let assignedRole = 'subscriber'; // default full access
                if (planId === 'plano_completo') {
                    assignedRole = 'subscriber_basic';
                }

                if (planId === "subscription" || planId === "assinatura_premium" || planId === "plano_completo") {
                    const { error: roleError } = await supabase.from("user_roles").upsert(
                        {
                            user_id: userId,
                            role: assignedRole,
                            updated_at: new Date().toISOString(),
                        },
                        { onConflict: "user_id" },
                    );

                    if (roleError) console.error("Error updating role:", roleError);
                    else console.log(`User ${userId} promoted to ${assignedRole}`);
                }
            }
        }

        return json({ received: true }, 200);
    } catch (err) {
        console.error("Webhook Error:", err);
        const msg = err instanceof Error ? err.message : String(err);
        return json({ error: msg }, 400);
    }
});
