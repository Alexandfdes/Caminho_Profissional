import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: {
    env: {
        get(key: string): string | undefined;
    };
};

interface AffindaResponse {
    data: {
        name?: string;
        emails?: string[];
        phones?: string[];
        websites?: string[];
        summary?: string;
        skills?: Array<{ name: string }>;
        work_experience?: Array<{
            organization?: string;
            position?: string;
            dates?: {
                start_date?: string;
                end_date?: string;
                is_current?: boolean;
            };
            summary?: string;
        }>;
        education?: Array<{
            organization?: string;
            accreditation?: {
                education?: string;
                degree?: string;
            };
            dates?: {
                start_date?: string;
                end_date?: string;
            };
        }>;
    };
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    // Lidar com requisições de preflight CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    // Garantir que apenas requisições POST sejam processadas
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Método não permitido. Use POST.' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('resume');

        if (!file || !(file instanceof File)) {
            return new Response(JSON.stringify({ error: 'Arquivo ausente ou inválido.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (file.size > 5 * 1024 * 1024) {
            return new Response(JSON.stringify({ error: 'Arquivo muito grande (limite 5MB).' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const endpoint = Deno.env.get('AFFINDA_ENDPOINT');
        const apiKey = Deno.env.get('AFFINDA_API_KEY');

        if (!endpoint || !apiKey) {
            console.error("Configuração da API Affinda ausente.");
            return new Response(JSON.stringify({ error: 'Erro de configuração no servidor.' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const arrayBuffer = await file.arrayBuffer();

        const resp = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/octet-stream"
            },
            body: arrayBuffer
        });

        if (!resp.ok) {
            const text = await resp.text();
            console.error(`Erro na API Affinda: ${resp.status} - ${text}`);
            return new Response(JSON.stringify({ error: "Falha ao processar o currículo com a IA." }), {
                status: 502,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const parsed: AffindaResponse = await resp.json();

        if (!parsed || !parsed.data) {
            throw new Error("Resposta inválida ou vazia da API Affinda.");
        }

        // Mapeamento do JSON Affinda -> schema local
        const out = {
            nome: parsed.data.name ?? "",
            email: parsed.data.emails?.[0] ?? "",
            telefone: parsed.data.phones?.[0] ?? "",
            linkedin: (parsed.data.websites || []).find((w) => w?.toLowerCase()?.includes("linkedin")) ?? "",
            resumo: parsed.data.summary ?? "",
            habilidades: (parsed.data.skills || []).map((s) => s?.name).filter(Boolean),
            experiencias: (parsed.data.work_experience || []).map((w) => ({
                empresa: w?.organization ?? "",
                cargo: w?.position ?? "",
                inicio: w?.dates?.start_date ?? "",
                fim: w?.dates?.end_date ?? (w?.dates?.is_current ? "Atual" : ""),
                descricao: w?.summary ?? ""
            })),
            formacao: (parsed.data.education || []).map((e) => ({
                instituicao: e?.organization ?? "",
                curso: e?.accreditation?.education ?? e?.accreditation?.degree ?? "",
                inicio: e?.dates?.start_date ?? "",
                fim: e?.dates?.end_date ?? ""
            }))
        };

        return new Response(JSON.stringify(out), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (e: unknown) {
        console.error("Erro inesperado:", e);
        const errorMessage = e instanceof Error ? e.message : "Erro desconhecido";
        return new Response(JSON.stringify({ error: "Erro interno no servidor: " + errorMessage }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
