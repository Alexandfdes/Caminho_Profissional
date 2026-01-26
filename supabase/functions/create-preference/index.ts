import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') ?? Deno.env.get('MERCADOPAGOACCESSTOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('SUPABASEURL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASEANONKEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        // 204 responses must not include a body.
        return new Response(null, { headers: corsHeaders, status: 204 })
    }

    try {
        const { planId, price, title, baseUrl } = await req.json()

        if (!MERCADO_PAGO_ACCESS_TOKEN) {
            throw new Error('MERCADO_PAGO_ACCESS_TOKEN not configured')
        }

        const accessTokenToUse = MERCADO_PAGO_ACCESS_TOKEN

        if (!SUPABASE_URL) {
            throw new Error('SUPABASE_URL not configured')
        }

        if (!SUPABASE_ANON_KEY) {
            throw new Error('SUPABASE_ANON_KEY not configured')
        }

        const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('not authenticated')
        }

        const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: authHeader } },
            auth: { persistSession: false }
        })

        const { data: authData, error: authErr } = await supabaseAuth.auth.getUser()
        if (authErr || !authData?.user) {
            throw new Error('not authenticated')
        }

        const userId = authData.user.id
        const userEmail = authData.user.email
        if (!userEmail) {
            throw new Error('Usuário sem email no Supabase Auth')
        }

        const origin = baseUrl || req.headers.get('origin') || ''
        if (!origin) {
            throw new Error('Could not determine base URL (origin). Send baseUrl from client.')
        }

        let originNormalized = String(origin).trim()
        try {
            // If a full URL was provided (with path), keep only the origin
            originNormalized = new URL(originNormalized).origin
        } catch {
            // keep as-is
        }

        if (originNormalized === 'null') {
            throw new Error('Base URL inválida (origin="null"). Abra o app via http/https (não file://).')
        }

        // Remove trailing slash to avoid double slashes when concatenating
        originNormalized = originNormalized.replace(/\/$/, '')

        const isHttp = originNormalized.startsWith('http://')
        const isHttps = originNormalized.startsWith('https://')
        if (!isHttp && !isHttps) {
            throw new Error(`Base URL inválida: ${originNormalized}`)
        }

        const successUrl = `${originNormalized}/planos?payment=success`
        const failureUrl = `${originNormalized}/planos?payment=failure`
        const pendingUrl = `${originNormalized}/planos?payment=pending`

        const externalReference = JSON.stringify({ userId, planId })

        const preferenceData = {
            items: [
                {
                    id: planId,
                    title: title,
                    quantity: 1,
                    currency_id: 'BRL',
                    unit_price: Number(price)
                }
            ],
            payer: {
                email: userEmail
            },
            back_urls: {
                success: successUrl,
                failure: failureUrl,
                pending: pendingUrl
            },
            ...(isHttps ? { auto_return: 'approved' as const } : {}),
            external_reference: externalReference,
            metadata: { userId, planId },
            notification_url: `${SUPABASE_URL}/functions/v1/webhook-mercadopago`
        }

        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessTokenToUse}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preferenceData)
        })

        const data = await response.json()

        const initPoint = typeof data?.init_point === 'string' ? data.init_point : undefined
        const sandboxInitPoint = typeof data?.sandbox_init_point === 'string' ? data.sandbox_init_point : undefined

        if (!response.ok) {
            console.error('Mercado Pago Error:', data)
            throw new Error(data.message || 'Error creating preference')
        }

        return new Response(
            JSON.stringify({
                init_point: initPoint,
                sandbox_init_point: sandboxInitPoint,
                id: data.id
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Error:', error)
        const message = error instanceof Error ? error.message : String(error)
        return new Response(
            JSON.stringify({ error: message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
