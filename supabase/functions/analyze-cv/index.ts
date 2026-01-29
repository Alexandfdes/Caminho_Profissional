
// ⚠️ Não use "serve" do std nas Edge Functions do Supabase.
// Removido: import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// AI Providers (Strategy Pattern)
import { callGemini } from './providers/gemini.ts'
import { callOpenAI } from './providers/openai.ts'
import type { AIProvider } from './providers/types.ts'

// ========= ENV VARS (mantidas do seu código) =========
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? Deno.env.get('GEMINIAPIKEY')
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('SUPABASEURL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASESERVICEROLEKEY')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASEANONKEY')

// ========= CORS HELPERS (corrigidos) =========
function buildCors(req: Request) {
    const origin = req.headers.get('origin') ?? ''
    const allowedOrigins = new Set<string>([
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:5173',
        'http://localhost:4173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3002',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:4173',
        // Produção
        'https://www.caminhoprofissional.com.br',
        'https://caminhoprofissional.com.br',
        // Vercel preview deployments
        'https://o-caminho-profissional.vercel.app',
    ])
    const isAllowed = allowedOrigins.has(origin)

    // Nunca use '*' quando houver Authorization/cookies
    const headers: HeadersInit = {
        'Access-Control-Allow-Origin': isAllowed ? origin : '',
        'Access-Control-Allow-Credentials': 'true',
        'Vary': 'Origin',
        'Access-Control-Allow-Headers': [
            'authorization',
            'apikey',
            'content-type',
            'x-client-info',
            'accept',
            'accept-language',
            'cache-control',
            'pragma',
        ].join(', '),
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    }

    return { isAllowed, headers }
}

// ========= ENTRYPOINT =========
Deno.serve(async (req) => {
    const { isAllowed, headers: corsHeaders } = buildCors(req)
    const requestId = crypto.randomUUID()

    // Preflight sempre primeiro
    if (req.method === 'OPTIONS') {
        if (!isAllowed) {
            // Origem não permitida — bloqueia cedo
            return new Response('CORS origin not allowed', {
                status: 403,
                headers: { 'Vary': 'Origin' },
            })
        }
        // 204 sem corpo
        return new Response(null, { status: 204, headers: corsHeaders })
    }

    // Bloqueio explícito para origem não permitida
    if (!isAllowed) {
        return new Response(JSON.stringify({ error: 'CORS origin not allowed', request_id: requestId }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    console.log('=== Request received ===', { method: req.method, url: req.url, requestId, origin: req.headers.get('origin') })

    // Helper para respostas JSON sempre com CORS
    const json = (status: number, payload: unknown) =>
        new Response(JSON.stringify(payload), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status,
        })

    // ====== LÓGICA ORIGINAL (mantida, com cabeçalhos CORS) ======
    try {
        // Método
        if (req.method !== 'POST') {
            return json(405, { error: 'Method Not Allowed', allowed: ['POST', 'OPTIONS'], request_id: requestId })
        }

        try {
            console.log('>>> Entering inner try block');
            const body = await req.json()
            console.log('>>> Body parsed, mode:', body?.mode, 'hasText:', !!body?.text, 'hasImages:', Array.isArray(body?.images));
            const { text, images, filename, targetCareer, extractOnly, mode } = body ?? {}

            // Mode handling:
            // - legacy clients send extractOnly: true (expects legacy structured_cv shape)
            // - new clients send mode: 'autofill' | 'analysis'
            const normalizedMode = String(mode || '').toLowerCase()
            const isAutofillMode = normalizedMode === 'autofill'
            const isLegacyExtractOnly = Boolean(extractOnly) && !isAutofillMode
            const effectiveMode: 'autofill' | 'extract' | 'analysis' = isAutofillMode
                ? 'autofill'
                : (isLegacyExtractOnly ? 'extract' : 'analysis')

            const hasText = typeof text === 'string' && text.trim().length > 0
            const hasImages = Array.isArray(images) && images.length > 0
            console.log('>>> effectiveMode:', effectiveMode, 'hasText:', hasText, 'hasImages:', hasImages);

            // Keep the prompt bounded to reduce truncation / malformed JSON outputs.
            const clampCvText = (value: string, maxChars = 12_000) => {
                const s = String(value || '').trim();
                if (s.length <= maxChars) return s;
                const head = s.slice(0, Math.floor(maxChars * 0.6));
                const tail = s.slice(-Math.floor(maxChars * 0.4));
                return `${head}\n\n[...]\n\n${tail}`;
            };

            const cvTextForPrompt = hasText ? clampCvText(text) : '';

            // In autofill mode we always return a CVAutofillResult (ok true/false),
            // so don't fail early with 400 when fields are missing.
            if (!hasText && !hasImages && effectiveMode !== 'autofill') {
                return json(400, { error: 'Missing required fields', error_code: 'BAD_REQUEST', request_id: requestId })
            }

            if (!GEMINI_API_KEY && !OPENAI_API_KEY) {
                throw new Error('GEMINI_API_KEY ou OPENAI_API_KEY não configurada')
            }

            if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
                throw new Error('SUPABASE_URL/SUPABASE_ANON_KEY not configured')
            }

            const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
            if (!authHeader) {
                return json(401, { error: 'not authenticated', error_code: 'UNAUTHORIZED', request_id: requestId })
            }

            const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                global: { headers: { Authorization: authHeader } },
                auth: { persistSession: false }
            })

            const { data: authData, error: authErr } = await supabaseAuth.auth.getUser()
            if (authErr || !authData?.user) {
                return json(401, { error: 'not authenticated', error_code: 'UNAUTHORIZED', request_id: requestId })
            }

            const userId = authData.user.id

            const emptyAutofillResult = (warnings: string[]) => ({
                ok: false,
                applyMode: 'replace',
                patch: {
                    personal: {
                        fullName: '',
                        role: '',
                        email: '',
                        phone: '',
                        location: '',
                        linkedin: '',
                        birthDate: '',
                        website: '',
                    },
                    summaryHtml: '<p></p>',
                    skills: [],
                    experience: [],
                    education: [],
                    courses: [],
                    projects: [],
                },
                confidence: {
                    personal: 0,
                    summary: 0,
                    skills: 0,
                    experience: 0,
                    education: 0,
                    courses: 0,
                    projects: 0,
                },
                warnings: Array.isArray(warnings) ? warnings : [],
            });

            // Autofill contract: if the extracted text is missing/too short, return the strict shape (ok=false).
            if (effectiveMode === 'autofill') {
                const textLen = typeof text === 'string' ? String(text).trim().length : 0;
                // Allow multimodal extraction (scanned PDFs) when images are provided.
                if (textLen < 200 && !hasImages) {
                    return json(200, emptyAutofillResult(['CV_TEXT ausente ou muito curto']));
                }
            }

            // Enforce daily usage (same 1500/day cap).
            const { data: usage, error: usageErr } = await supabaseAuth.rpc('check_and_increment_gemini_usage', { p_request_type: 'cv' })
            if (usageErr) {
                console.error('Usage RPC error:', usageErr)
                throw new Error('Falha ao validar limite de uso')
            }
            const usageRow = Array.isArray(usage) ? usage[0] : usage
            if (!usageRow?.allowed) {
                return json(429, {
                    error: 'Limite diário de requisições atingido (1.500/dia). Por favor, aguarde até amanhã.',
                    error_code: 'DAILY_LIMIT_REACHED',
                    request_id: requestId,
                })
            }

            // ========= AI PROVIDER SELECTION (Strategy Pattern) =========
            // Priority: 1) body.provider, 2) DEFAULT_AI_PROVIDER env, 3) 'gemini' default
            const providerName = String(body?.provider ?? Deno.env.get('DEFAULT_AI_PROVIDER') ?? 'gemini').toLowerCase();
            const callAI: AIProvider = providerName === 'openai' ? callOpenAI : callGemini;
            console.log(`>>> Using AI provider: ${providerName}`);


            const buildAutofillPrompt = (cvText: string) => `
Você é um importador de currículos que:
1) Lê o currículo (texto e, quando necessário, contexto das imagens das páginas).
2) Interpreta entidades de currículo (nome, contatos, links, cargos, empresas, datas, formações, competências, etc.).
3) Normaliza datas, cargos, empresas e níveis de escolaridade.
4) Retorna os dados **exatamente** no JSON especificado adiante.
5) Gera um **preview textual** seguindo o **layout e estilo** abaixo (sem HTML, apenas texto com quebras de linha), com as mesmas seções e ordem.

ANÁLISE MULTIMODAL:
- SE imagens do PDF forem fornecidas, USE-AS como fonte PRIMÁRIA para entender o layout e estrutura visual do currículo.
- O texto bruto pode ter problemas de extração (texto junto, ordem errada). As imagens mostram a formatação real.
- Compare texto e imagem: confie mais na imagem para entender ONDE cada informação está posicionada.
- Identifique seções visuais (cabeçalhos, colunas, divisões) pela imagem para separar corretamente os dados.

REGRAS CRÍTICAS DE SEPARAÇÃO:
- **EXPERIÊNCIA**: CADA emprego/cargo diferente DEVE ser um objeto SEPARADO no array "experiencia". 
  Se a pessoa trabalhou em 2 empresas, devem existir 2 objetos. Se trabalhou 3 vezes, 3 objetos.
  Identifique mudanças de empresa/cargo analisando: nomes de empresas, cargos diferentes, ou datas que não se sobrepõem.
- **FORMAÇÃO**: CADA curso/formação diferente DEVE ser um objeto SEPARADO no array "formacao".
  Se a pessoa tem ensino médio + graduação, devem existir 2 objetos. Mestrado = +1 objeto.
  Identifique formações diferentes por: tipo (ensino médio, graduação, pós), instituições diferentes, ou cursos diferentes.
- NÃO junte múltiplas experiências ou formações em um único objeto. Mesmo que o texto original esteja "colado", separe cada item.

REGRAS CRÍTICAS DE REDIRECIONAMENTO DE LINKS:
- **GITHUB**: O campo específico de GitHub foi removido. Se você encontrar um link de GitHub (ex: github.com/usuario), COLOQUE-O no campo \`portfolio\` ou \`site\`.
- **OUTROS LINKS**: Quaisquer outros links relevantes (Behance, Dribbble, Medium, etc.) devem ser colocados no campo \`portfolio\`.

IMPORTANTE:
- NÃO invente dados. Se faltar algo, deixe vazio ou omita o campo, conforme o schema.
- Conserte pequenos problemas comuns: emails com espaços, telefones com símbolos, datas abreviadas ou “present/atual”.
- Padronize **idioma PT-BR** (ex.: mai, jun, set; “Cursando, previsão de conclusão em AAAA”).
- Use **capitalização consistente** para nomes próprios e cargos (Título de Seção com Primeira Letra Maiúscula; conteúdo normal).
- Remova duplicatas entre Experiência e Projetos/Atividades, mantendo a versão mais completa.
- Links: sempre normalize (\`https://...\`) sem espaços.
- Telefone: se possível, normalize para \`(84) 9 - NNNNNNN\` (com espaços ao redor do hífen, como no preview).
- Nunca retorne texto fora dos campos especificados.

[CONTEXT]
PDF_TEXT_BRUTO:
${cvText}

[TAREFA]
1) Extraia e normalize os dados do currículo e retorne no JSON no campo \`data\`.
2) Gere o **preview** de exibição no campo \`preview_text\`, com a formatação a seguir.

[ESQUEMA JSON DE SAÍDA]
Retorne **apenas** um JSON com esta estrutura:

{
  "data": {
      "nome": "string (Primeiro nome)",
      "sobrenome": "string (Resto do nome completo)",
      "email": "string",
      "telefone": "string",
      "cidade": "string",
      "estado": "string (UF)",
      "endereco": "string (Rua, nº, bairro)",
      "cep": "string",
      "links": {
        "site": "string",
        "linkedin": "string",
        "portfolio": "string"
      },
      "data_nascimento": "DD/MM/AAAA",
      "nacionalidade": "string",
      "genero": "string",
      "estado_civil": "string",
      "habilitacao": "string (Ex: AB, B, D)"
    },
    "resumo": "string", 
    "competencias": [ "string" ],
    "idiomas": [ { "idioma": "string", "nivel": "string" } ],
    "formacao": [
      {
        "curso": "string",
        "instituicao": "string",
        "nivel": "string", 
        "inicio": "AAAA-MM | string",
        "fim": "AAAA-MM | string",
        "situacao": "concluído | cursando | trancado | incompleto | string",
        "observacao": "ex.: \"Cursando, previsão de conclusão em AAAA\""
      }
    ],
    "experiencia": [
      {
        "cargo": "string",
        "empresa": "string",
        "inicio": "AAAA-MM",
        "fim": "AAAA-MM | \"atual\"",
        "local": "string",
        "descricao": [
          "bullet 1"
        ],
        "tipo": "tempo integral | estágio | freelancer | string"
      }
    ],
    "cursos": [
      {
        "titulo": "string",
        "instituicao": "string",
        "ano": "AAAA | string",
        "carga_horaria": "string"
      }
    ],
    "projetos": [
      {
        "titulo": "string",
        "link": "string",
        "descricao": "string",
        "stack": [ "string" ]
      }
    ],
    "certificados": [
      { "titulo": "string", "instituicao": "string", "ano": "AAAA | string" }
    ],
    "interesses": [ "string" ],
    "qualidades": [ "string" ],
    "referencias": [
      { "nome": "string", "contato": "string", "observacao": "string" }
    ]
  },

  "preview_text": "string grande com quebras de linha seguindo o layout abaixo"
}

[REGRAS DE NORMALIZAÇÃO]
- Datas:
  - Converter meses para abreviações PT-BR: jan, fev, mar, abr, mai, jun, jul, ago, set, out, nov, dez.
  - Períodos: "mai 2024 - set 2025" (espaços ao redor do hífen).
  - Se atual, usar: "mai 2024 - atual".
- Telefone: se possível, formato “(DD) 9 - NNNNNNN”.
- URLs: remover espaços, forçar https:// quando aplicável.
- Texto: remover lixo de OCR e espaços extras; preservar acentuação.

[LAYOUT DO PREVIEW — EXATAMENTE NESTA ORDEM E ESTILO]
- Primeira linha: Nome completo (todas as partes, com espaços simples).
- Seção "Dados pessoais"
  - Nome completo (repetir)
  - email com espaços “protetores” (ex.: \`nome @ dominio . com\`)
  - telefone como “( 84 )  9  -  96658951” (espaços ao redor do hífen; espaços simples entre tokens)
  - “Cidade :  Mossoró  -  RN  Mossoró” quando houver cidade/estado; se houver endereço/CEP, não exibir no preview, apenas cidade/estado.
  - links em linhas separadas (ex.: \`github . com/usuario\`, \`linkedin . com/in/slug\`)
- Seção "Competências"
  - Listar em linhas, uma por linha, mantendo capitalização simples (Java, Spring Boot, MySQL…)
- Seção "Formação"
  - Um item por bloco: 
    - linha 1: nível/descrição (ex.: “Ensino médio completo  2024  DIOCESANO SANTA LUZIA”)
    - linha 2 (se estiver cursando): “Ciência da Computação  2028  Universidade Potiguar (UNP)  Cursando, previsão de conclusão em 2028”
- Seção "Experiência"
  - Cabeçalho do cargo (uma linha): “Desenvolvedor  mai 2024  -  set 2025  F. souto”
  - Descrição em parágrafos curtos ou bullets concatenados em linhas (sem marcadores de “-” ou “•”, apenas frases por linha).
- Seção "Cursos"
  - Uma linha por curso, com “Baixe seu currículo em www.cvwizard.com” se for aplicável (apenas se constar no currículo; não inventar).

[VALIDAÇÃO]
- Retorne **apenas** o JSON final (sem comentários e sem markdown block quotes).
`;

            const effectiveCvTextForPrompt = cvTextForPrompt;

            const prompt =
                effectiveMode === 'autofill'
                    ? buildAutofillPrompt(effectiveCvTextForPrompt)

                    : effectiveMode === 'extract'
                        ? `Você é um extrator estruturado de currículo.

RETORNE APENAS JSON VÁLIDO (RFC 8259). NÃO use markdown. NÃO inclua comentários. NÃO inclua texto fora do JSON.

Use EXATAMENTE esta estrutura:
{
    "structured_cv": {
        "personal_info": { "name": "", "role": "", "location": "", "linkedin": "" },
        "summary": "",
        "experience": [ { "company": "", "role": "", "period": "", "description": "" } ],
        "education": [ { "institution": "", "degree": "", "period": "" } ],
        "skills": [""]
    },
    "extracted_contacts": { "email": "", "phone": "" }
}

REGRAS:
- Não invente informações. Se não estiver no texto, use "" ou [].
- Não inclua texto fora do JSON.

CURRÍCULO:
<<<
${hasText ? cvTextForPrompt : '(O currículo foi enviado como imagens. Extraia as informações visualmente.)'}
>>>`
                        : `Você é um Especialista Sênior em Recrutamento (Headhunter) e Engenheiro de Dados de ATS (Applicant Tracking Systems). Sua missão é processar o currículo realizando duas tarefas críticas simultaneamente: Extração Estruturada e Análise Técnica Profunda.

${targetCareer ? `CARGO/ÁREA ALVO: ${targetCareer}` : ''}

### TAREFA 1: EXTRAÇÃO E LIMPEZA DE DADOS
Analise o layout visual do documento. Extraia os dados respeitando a hierarquia visual.
- **Nome e Cargo:** Se não houver cargo explícito, deduza o mais provável baseado na experiência recente.
- **Resumo:** Se não existir, gere um resumo profissional de 3 linhas focado nas competências principais.
- **Experiência:** Separe claramente: "Empresa", "Cargo", "Período" e "Descrição".
    - Remova quebras de linha manuais dentro de frases. Unifique parágrafos quebrados.
    - Normalize datas para "Mês Ano - Mês Ano" ou "Mês Ano - Atual".
- **Habilidades:** Extraia uma lista plana de competências técnicas e comportamentais.

### TAREFA 2: ANÁLISE DE QUALIDADE E FEEDBACK
Avalie o candidato como um recrutador exigente avaliaria para uma vaga de alto nível.
- **Score (0-100):** Seja criterioso. 100 é um currículo perfeito, 50 é medíocre.
- **Red Flags:** Identifique erros de português, datas incoerentes, gaps não explicados, formatação amadora ou falta de contatos.
- **Pontos Fracos:** Para cada seção, sugira melhorias acionáveis (ex: "Faltam métricas de resultado na experiência X").

### FORMATO DE SAÍDA (JSON OBRIGATÓRIO)
Retorne APENAS um JSON válido. Não use Markdown. Siga estritamente esta estrutura:

{
  "score": number,
  "summary": "Resumo geral da análise do recrutador (2 frases)",
  "strengths": ["Ponto forte 1", "Ponto forte 2", "Ponto forte 3"],
  "weaknesses": [
    {
      "section": "Nome da Seção",
      "issue": "Descrição do problema",
      "priority": 1,
      "suggestion": "Sugestão prática de como corrigir"
    }
  ],
  "red_flags": [
    {
      "category": "content",
      "severity": "high",
      "issue": "Descrição do erro",
      "suggestion": "Como resolver"
    }
  ],
  "extracted_contacts": {
    "email": "",
    "phone": "",
    "linkedin": "",
    "location": ""
  },
  "structured_cv": {
    "personal_info": {
      "name": "",
      "role": "",
      "location": "",
      "linkedin": "",
      "phone": "",
      "email": "",
      "website": ""
    },
    "summary": "",
    "experience": [
      {
        "company": "",
        "role": "",
        "period": "",
        "description": ""
      }
    ],
    "education": [
      {
        "institution": "",
        "degree": "",
        "period": ""
      }
    ],
    "skills": [],
    "courses": [
      {
        "title": "",
        "provider": "",
        "date": ""
      }
    ]
  },
  "suggestions_by_section": {
    "Resumo": [],
    "Experiência": [],
    "Formação": [],
    "Habilidades": []
  }
}

REGRAS:
- Retorne APENAS JSON válido (RFC 8259), sem comentários, sem markdown
- Não invente informações. Se não estiver no texto, use "" ou []
- Seja específico e construtivo nas sugestões
- Considere padrões do mercado brasileiro
- priority: 1=Crítico, 2=Médio, 3=Leve
- severity: "high", "medium" ou "low"
- category: "content", "format", "gaps" ou "language"

CURRÍCULO A ANALISAR:
${hasText ? cvTextForPrompt : '(O currículo foi enviado como imagens. Extraia as informações visualmente.)'}
`;

            const normalizeJsonText = (raw: string) => {
                // Remove code fences and normalize common quote issues
                return String(raw || '')
                    .replace(/```json/gi, '```')
                    .replace(/```/g, '')
                    .replace(/[\u201C\u201D]/g, '"')
                    .replace(/[\u2018\u2019]/g, "'")
                    .trim();
            };

            const heuristicExtractFromText = (value: string) => {
                const s = String(value || '').replace(/\r/g, '').trim();
                const lines = s.split('\n').map((l) => l.trim()).filter(Boolean);
                const firstLine = lines[0] || '';

                const matchOne = (re: RegExp) => {
                    const m = s.match(re);
                    return m ? String(m[0] || '').trim() : '';
                };

                const email = matchOne(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
                const phone = matchOne(/(\+?55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}/);
                const linkedin = matchOne(/https?:\/\/(www\.)?linkedin\.com\/[\w\-_%/?=&.#]+/i);

                const name = (() => {
                    // Prefer an explicit label
                    const m = s.match(/(?:^|\n)\s*Nome\s*[:\-]\s*([^\n]{2,80})/i);
                    if (m?.[1]) return String(m[1]).trim();
                    // Heuristic: first line if it looks like a name
                    if (firstLine && firstLine.length < 80 && !/@/.test(firstLine)) return firstLine;
                    return '';
                })();

                const summary = (() => {
                    // Attempt to find a Resumo/Perfil section
                    const m = s.match(/(?:Resumo|Perfil|Sobre)\s*[:\-]?\s*([\s\S]{0,1200})/i);
                    const raw = m?.[1] ? String(m[1]) : '';
                    const clipped = raw.split(/\n\s*\n/)[0]?.trim();
                    if (clipped && clipped.length > 40) return clipped.slice(0, 800);
                    // Fallback: first ~600 chars
                    return s.slice(0, 600);
                })();

                const skills = (() => {
                    const m = s.match(/(?:Habilidades|Competências)\s*[:\-]?\s*([\s\S]{0,1200})/i);
                    const raw = m?.[1] ? String(m[1]) : '';
                    const clipped = raw.split(/\n\s*\n/)[0] || '';
                    const items = clipped
                        .split(/[\n,;•·●○◦▪■□\-–—]+/)
                        .map((x) => String(x || '').trim())
                        .filter(Boolean)
                        .slice(0, 30);
                    return items;
                })();

                return {
                    structured_cv: {
                        personal_info: {
                            name,
                            role: '',
                            location: '',
                            linkedin,
                        },
                        summary,
                        experience: [],
                        education: [],
                        skills,
                    },
                    extracted_contacts: { email, phone },
                    _fallback: { method: 'heuristic' },
                };
            };

            const cleanupLooseJson = (candidate: string) => {
                // Best-effort cleanup for common model mistakes (trailing commas / comments)
                return String(candidate || '')
                    .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
                    .replace(/(^|\s)\/\/.*$/gm, '$1') // line comments
                    .replace(/,\s*([}\]])/g, '$1') // trailing commas
                    .trim();
            };

            const repairJsonLike = (candidate: string) => {
                let repaired = String(candidate || '');
                // Quote unquoted keys: { html: "x" } -> { "html": "x" }
                repaired = repaired.replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":');
                // Convert single-quoted strings to double-quoted strings (best-effort)
                repaired = repaired.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_m, g1) => {
                    const inner = String(g1).replace(/"/g, '\\"');
                    return `"${inner}"`;
                });
                // Remove trailing commas again after repairs
                repaired = repaired.replace(/,\s*([}\]])/g, '$1');
                return repaired;
            };

            const tryParseJson = (candidate: string) => {
                if (!candidate) return null;
                try {
                    return JSON.parse(candidate);
                } catch {
                    // keep trying
                }
                try {
                    return JSON.parse(cleanupLooseJson(candidate));
                } catch {
                    // keep trying
                }
                try {
                    return JSON.parse(repairJsonLike(cleanupLooseJson(candidate)));
                } catch {
                    return null;
                }
            };

            const extractJsonObject = (raw: string) => {
                const cleaned = normalizeJsonText(raw);

                const candidates: string[] = [];
                if (cleaned) candidates.push(cleaned);

                const match = cleaned.match(/\{[\s\S]*\}/);
                if (match?.[0]) candidates.push(match[0]);

                const start = cleaned.indexOf('{');
                const end = cleaned.lastIndexOf('}');
                if (start >= 0 && end > start) candidates.push(cleaned.slice(start, end + 1));

                for (const c of candidates) {
                    const parsed = tryParseJson(c);
                    if (parsed) return {
                        ...parsed,
                        _meta: {
                            title: { source: 'parsed:file' as const, timestamp: Date.now() },
                            description: { source: 'parsed:file' as const, timestamp: Date.now() },
                        },
                    };
                }

                return null;
            };

            const normalizeAnalysisShape = (raw: any) => {
                if (!raw) return null;
                const root = typeof raw === 'object' ? raw : null;
                if (!root) return null;

                const candidate = (root as any)?.analysis && typeof (root as any).analysis === 'object'
                    ? (root as any).analysis
                    : root;

                const toScore = (value: any) => {
                    if (typeof value === 'number') return value;
                    if (typeof value === 'string') {
                        // Accept "85", "85%", "85.0" etc
                        const cleaned = value.replace('%', '').trim();
                        const n = Number(cleaned);
                        if (Number.isFinite(n)) return n;
                        const f = parseFloat(cleaned);
                        if (Number.isFinite(f)) return f;
                    }
                    return NaN;
                };

                const normalizeSections = (sectionsValue: any, overallScoreFallback: number) => {
                    if (Array.isArray(sectionsValue)) return sectionsValue;
                    if (sectionsValue && typeof sectionsValue === 'object') {
                        // Sometimes models return an object keyed by section name
                        return Object.entries(sectionsValue).map(([name, v]) => {
                            const obj: any = v && typeof v === 'object' ? v : {};
                            return {
                                name: obj.name ?? name,
                                score: Number.isFinite(toScore(obj.score)) ? toScore(obj.score) : overallScoreFallback,
                                strengths: Array.isArray(obj.strengths) ? obj.strengths : [],
                                weaknesses: Array.isArray(obj.weaknesses) ? obj.weaknesses : [],
                                suggestions: Array.isArray(obj.suggestions) ? obj.suggestions : [],
                            };
                        });
                    }
                    return null;
                };

                // Preferred shape
                if ((candidate as any).overall_score != null && (candidate as any).sections != null) {
                    const overallScore = toScore((candidate as any).overall_score);
                    if (!Number.isFinite(overallScore)) return null;
                    const sections = normalizeSections((candidate as any).sections, overallScore);
                    if (!sections) return null;
                    return {
                        overall_score: Math.max(0, Math.min(100, overallScore)),
                        summary: typeof (candidate as any).summary === 'string' ? (candidate as any).summary : '',
                        sections,
                    };
                }

                // Legacy-ish shape: { score, strengths, weaknesses, suggestions_by_section }
                if ((candidate as any).score != null) {
                    const scoreNum = toScore((candidate as any).score);
                    if (!Number.isFinite(scoreNum)) return null;
                    const overallScore = scoreNum <= 10 ? scoreNum * 10 : scoreNum;

                    const suggestionsBySection = (candidate as any).suggestions_by_section;
                    const sections: any[] = [];
                    if (suggestionsBySection && typeof suggestionsBySection === 'object') {
                        for (const [name, suggestions] of Object.entries(suggestionsBySection)) {
                            sections.push({
                                name,
                                score: Math.max(0, Math.min(100, overallScore)),
                                strengths: Array.isArray((candidate as any).strengths) ? (candidate as any).strengths.slice(0, 2) : [],
                                weaknesses: Array.isArray((candidate as any).weaknesses) ? (candidate as any).weaknesses.slice(0, 2) : [],
                                suggestions: Array.isArray(suggestions) ? (suggestions as any[]).slice(0, 3) : [],
                            });
                        }
                    }

                    return {
                        overall_score: Math.max(0, Math.min(100, overallScore)),
                        summary: typeof (candidate as any).summary === 'string' ? (candidate as any).summary : '',
                        sections,
                    };
                }

                return null;
            };

            const normalizeExtractShape = (raw: any) => {
                if (!raw || typeof raw !== 'object') return null;
                const root: any = raw;
                const candidate = root?.analysis && typeof root.analysis === 'object' ? root.analysis : root;

                const asString = (v: any) => (typeof v === 'string' ? v.trim() : '');
                const asArray = (v: any) => (Array.isArray(v) ? v : []);

                // V3 ADAPTER ROBUST (New User Prompt)
                const getV3Data = (r: any) => {
                    if (r?.data && typeof r.data === 'object' && r.data.pessoais) return r.data;
                    if (r?.pessoais && typeof r.pessoais === 'object') return r;
                    return null;
                };

                const v3Data = getV3Data(raw);

                if (v3Data) {
                    const d = v3Data;
                    const p = d.pessoais || {};
                    const join = (arr: any[], sep = ' ') => arr.map(asString).filter(Boolean).join(sep);

                    const pPhone = asString(p.telefone);
                    // Fix specific issue seen: sanitize
                    const safePhone = pPhone.length < 8 ? '' : pPhone;

                    return {
                        ok: true,
                        applyMode: 'replace',
                        patch: {
                            personal: {
                                fullName: join([p.nome, p.sobrenome]),
                                role: '',
                                email: asString(p.email),
                                phone: safePhone,
                                location: join([p.cidade, p.estado], ' - '),
                                linkedin: asString(p.links?.linkedin),
                                github: asString(p.links?.github),
                                website: asString(p.links?.site || p.links?.portfolio),
                            },
                            summaryHtml: d.resumo ? `<p>${asString(d.resumo)}</p>` : '',
                            skills: asArray(d.competencias).map(asString).filter(Boolean),
                            experience: asArray(d.experiencia).map((e: any) => ({
                                title: asString(e.cargo),
                                subtitle: asString(e.empresa),
                                date: join([e.inicio, (String(e.fim).toLowerCase().includes('atual') ? 'Atual' : e.fim)], ' - '),
                                descriptionHtml: Array.isArray(e.descricao) ? `<ul>${e.descricao.map((b: any) => `<li>${asString(b)}</li>`).join('')}</ul>` : ''
                            })),
                            education: asArray(d.formacao).map((e: any) => ({
                                title: asString(e.curso),
                                subtitle: asString(e.instituicao),
                                date: join([e.inicio, (String(e.fim).toLowerCase().includes('atual') ? 'Atual' : e.fim)], ' - '),
                                descriptionHtml: `<p>${join([e.nivel, e.situacao, e.observacao], ' - ')}</p>`
                            })),
                            courses: asArray(d.cursos).map((c: any) => ({
                                title: asString(c.titulo),
                                subtitle: asString(c.instituicao),
                                date: asString(c.ano),
                                descriptionHtml: ''
                            })),
                            projects: asArray(d.projetos).map((prj: any) => ({
                                title: asString(prj.titulo),
                                subtitle: '',
                                descriptionHtml: `<p>${asString(prj.descricao)}</p>${prj.link ? `<p>${prj.link}${prj.link}</a></p>` : ''}`
                            }))
                        },
                        confidence: { personal: 100, summary: 100, experience: 100, education: 100, skills: 100, courses: 100, projects: 100 },
                        warnings: []
                    };
                }

                const stripHtml = (html: string) => {
                    const s = String(html || '');
                    return s
                        .replace(/<\s*br\s*\/?>/gi, '\n')
                        .replace(/<\s*\/\s*p\s*>/gi, '\n')
                        .replace(/<\s*p\s*>/gi, '')
                        .replace(/<\s*li\s*>/gi, '- ')
                        .replace(/<\s*\/\s*li\s*>/gi, '\n')
                        .replace(/<\s*\/\s*ul\s*>/gi, '\n')
                        .replace(/<[^>]+>/g, '')
                        .replace(/\n{3,}/g, '\n\n')
                        .trim();
                };

                const keepSafePhone = (phone: string) => {
                    const p = asString(phone);
                    if (!p) return '';
                    const digits = p.replace(/\D/g, '');
                    if (digits.length >= 8 && digits.length <= 13) return digits;
                    return '';
                };

                const cleanSkills = (skills: any[]) => {
                    const out: string[] = [];
                    const seen = new Set<string>();
                    for (const s of skills) {
                        const v = asString(s);
                        if (!v) continue;
                        if (v.length > 40) continue;
                        if (/[0-9]/.test(v)) continue;
                        if (/[\/:]/.test(v)) continue;
                        // keep short 1-3 words
                        const words = v.split(/\s+/).filter(Boolean);
                        if (words.length < 1 || words.length > 3) continue;
                        const cleaned = v.replace(/[.,;:!?]$/g, '').trim();
                        const key = cleaned.toLowerCase();
                        if (!cleaned || seen.has(key)) continue;
                        seen.add(key);
                        out.push(cleaned);
                        if (out.length >= 30) break;
                    }
                    return out;
                };

                // Strict autofill schema (wrapper)
                const ensurePersonalKeys = (src: any) => {
                    const o = src && typeof src === 'object' ? src : {};
                    return {
                        fullName: asString(o.fullName),
                        role: asString(o.role),
                        email: asString(o.email),
                        phone: keepSafePhone(asString(o.phone)),
                        location: asString(o.location),
                        linkedin: asString(o.linkedin),
                        github: asString(o.github),
                        website: asString(o.website),
                    };
                };

                const toConf = (v: any) => {
                    const n = Number(v);
                    if (!Number.isFinite(n)) return 0;
                    return Math.max(0, Math.min(100, n));
                };

                const computeOk = (conf: any, patch: any, warnings: string[]) => {
                    const c = conf && typeof conf === 'object' ? conf : {};
                    const confPersonal = toConf(c.personal);
                    const confAny = Math.max(
                        toConf(c.summary),
                        toConf(c.skills),
                        toConf(c.experience),
                        toConf(c.education),
                        toConf(c.courses),
                        toConf(c.projects),
                    );
                    const hasAnyContent =
                        Boolean(asString(patch?.summaryHtml)) ||
                        (Array.isArray(patch?.skills) && patch.skills.length > 0) ||
                        (Array.isArray(patch?.experience) && patch.experience.length > 0) ||
                        (Array.isArray(patch?.education) && patch.education.length > 0) ||
                        (Array.isArray(patch?.courses) && patch.courses.length > 0) ||
                        (Array.isArray(patch?.projects) && patch.projects.length > 0);
                    const warnedLow = warnings.some((w) => /falha ao estruturar com confiança/i.test(String(w || '')));
                    if (warnedLow) return false;
                    if (confPersonal < 35) return false;
                    if (!hasAnyContent && confAny < 30) return false;
                    return confPersonal >= 50 && (confAny >= 30 || hasAnyContent);
                };

                const patchSource = (candidate?.patch && typeof candidate.patch === 'object')
                    ? candidate.patch
                    : candidate;

                if (patchSource?.personal && typeof patchSource.personal === 'object') {
                    const personal = patchSource.personal;

                    const sanitizeHtmlAllowlist = (html: string) => {
                        let s = String(html || '');
                        s = s.replace(/<\s*(script|style|iframe)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
                        s = s.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '');
                        s = s.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '');
                        s = s.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '');
                        // Remove all tags not in allowlist; keep href for <a>
                        s = s.replace(/<\s*([^\s/>]+)([^>]*)>/g, (m, tagName, attrs) => {
                            const tag = String(tagName || '').toLowerCase();
                            if (tag === 'br') return '<br>';
                            if (tag === 'p' || tag === 'ul' || tag === 'li' || tag === 'strong' || tag === 'em') return `<${tag}>`;
                            if (tag === 'a') {
                                const hrefMatch = String(attrs || '').match(/href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                                const rawHref = hrefMatch ? (hrefMatch[2] || hrefMatch[3] || hrefMatch[4] || '') : '';
                                let href = String(rawHref || '').trim();
                                if (href && !/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) href = `https://${href}`;
                                if (/^javascript:/i.test(href)) href = '';
                                const safeHref = href ? ` href="${href.replace(/"/g, '')}"` : '';
                                return `<a${safeHref} target="_blank" rel="noopener noreferrer">`;
                            }
                            return '';
                        });
                        s = s.replace(/<\s*\/\s*([^\s>]+)\s*>/g, (m, tagName) => {
                            const tag = String(tagName || '').toLowerCase();
                            if (tag === 'p' || tag === 'ul' || tag === 'li' || tag === 'strong' || tag === 'em' || tag === 'a') return `</${tag}>`;
                            return '';
                        });
                        return s.trim();
                    };

                    const normalizeLink = (v: any) => {
                        const s = asString(v);
                        if (!s) return '';
                        if (/^https?:\/\//i.test(s)) return s;
                        return `https://${s}`;
                    };

                    const warnings = asArray(candidate?.warnings).map((w: any) => asString(w)).filter(Boolean).slice(0, 30);

                    const summaryHtmlRaw = asString(patchSource?.summaryHtml);
                    const summaryText = stripHtml(summaryHtmlRaw);
                    const cleanedSummary = summaryText
                        .replace(/\s+/g, ' ')
                        .trim();
                    const forbiddenInSummary = /@|https?:\/\/|linkedin|github|telefone|e-?mail|cidade/i.test(cleanedSummary);
                    if (forbiddenInSummary) warnings.push('Resumo continha contatos/links; removido.');
                    const summaryFinalText = forbiddenInSummary ? '' : cleanedSummary.slice(0, 600);
                    const summaryHtml = summaryFinalText ? `<p>${summaryFinalText}</p>` : '<p></p>';

                    const email = asString(personal?.email);
                    const phone = keepSafePhone(asString(personal?.phone));

                    const roleRaw = asString(personal?.role);
                    const role = roleRaw || (hasText && /desenvolvedor/i.test(String(text || '')) ? 'Desenvolvedor' : '');

                    const confidenceObj = candidate?.confidence && typeof candidate?.confidence === 'object' ? candidate.confidence : {};

                    const experience = asArray(patchSource?.experience)
                        .map((x: any) => ({
                            title: asString(x?.title),
                            subtitle: asString(x?.subtitle),
                            date: asString(x?.date),
                            descriptionHtml: sanitizeHtmlAllowlist(asString(x?.descriptionHtml) || '<ul><li></li></ul>'),
                        }))
                        .filter((x: any) => x.title);

                    const education = asArray(patchSource?.education)
                        .map((x: any) => ({
                            title: asString(x?.title),
                            subtitle: asString(x?.subtitle),
                            date: asString(x?.date),
                            descriptionHtml: sanitizeHtmlAllowlist(asString(x?.descriptionHtml) || '<p></p>'),
                        }))
                        .filter((x: any) => x.title);

                    const courses = asArray(patchSource?.courses)
                        .map((x: any) => ({
                            title: asString(x?.title),
                            provider: asString(x?.provider),
                            date: asString(x?.date),
                        }))
                        .filter((x: any) => x.title);

                    const projects = asArray(patchSource?.projects)
                        .map((x: any) => ({
                            title: asString(x?.title),
                            url: normalizeLink(x?.url),
                            date: asString(x?.date),
                            descriptionHtml: sanitizeHtmlAllowlist(asString(x?.descriptionHtml) || '<p></p>'),
                            tech: asArray(x?.tech).map((t: any) => asString(t)).filter(Boolean).slice(0, 12),
                        }))
                        .filter((x: any) => x.title);

                    const rawApplyMode = asString((candidate as any)?.applyMode);
                    if (rawApplyMode && rawApplyMode !== 'replace') warnings.push(`applyMode inesperado: ${rawApplyMode}; forçado para replace.`);

                    const patch = {
                        personal: {
                            ...ensurePersonalKeys({
                                fullName: asString(personal?.fullName),
                                role,
                                email,
                                phone,
                                location: asString(personal?.location),
                                linkedin: normalizeLink(personal?.linkedin),
                                github: normalizeLink(personal?.github),
                                website: normalizeLink(personal?.website),
                            }),
                            linkedin: normalizeLink(personal?.linkedin),
                            github: normalizeLink(personal?.github),
                            website: normalizeLink(personal?.website),
                        },
                        summaryHtml,
                        skills: cleanSkills(asArray(patchSource?.skills)),
                        experience: experience.slice(0, 12),
                        education: education.slice(0, 12),
                        courses: courses.slice(0, 20),
                        projects: projects.slice(0, 12),
                    };

                    const confidence = {
                        personal: toConf(confidenceObj?.personal),
                        summary: toConf(confidenceObj?.summary),
                        skills: toConf(confidenceObj?.skills),
                        experience: toConf(confidenceObj?.experience),
                        education: toConf(confidenceObj?.education),
                        courses: toConf(confidenceObj?.courses),
                        projects: toConf(confidenceObj?.projects),
                    };

                    const okFromCandidate = typeof (candidate as any)?.ok === 'boolean' ? Boolean((candidate as any).ok) : null;
                    const computedOk = computeOk(confidence, patch, warnings);
                    const ok = okFromCandidate === false ? false : computedOk;

                    if (!ok) {
                        if (!warnings.some((w) => /falha ao estruturar com confiança/i.test(String(w || '')))) {
                            warnings.unshift('Falha ao estruturar com confiança');
                        }
                        return {
                            ok: false,
                            applyMode: 'replace',
                            patch: {
                                personal: ensurePersonalKeys(patch.personal),
                                summaryHtml: '<p></p>',
                                skills: [],
                                experience: [],
                                education: [],
                                courses: [],
                                projects: [],
                            },
                            confidence: {
                                personal: toConf(confidence.personal),
                                summary: 0,
                                skills: 0,
                                experience: 0,
                                education: 0,
                                courses: 0,
                                projects: 0,
                            },
                            warnings,
                        };
                    }

                    return { ok: true, applyMode: 'replace', patch, confidence, warnings };
                }

                const structured = candidate?.structured_cv && typeof candidate.structured_cv === 'object'
                    ? candidate.structured_cv
                    : null;
                if (!structured || typeof structured !== 'object') return null;

                const personal = structured.personal_info && typeof structured.personal_info === 'object'
                    ? structured.personal_info
                    : {};

                const experience = asArray(structured.experience)
                    .slice(0, 10)
                    .map((x: any) => ({
                        company: asString(x?.company),
                        role: asString(x?.role),
                        period: asString(x?.period),
                        description: asString(x?.description),
                    }));

                const education = asArray(structured.education)
                    .slice(0, 10)
                    .map((x: any) => ({
                        institution: asString(x?.institution),
                        degree: asString(x?.degree),
                        period: asString(x?.period),
                    }));

                const skills = asArray(structured.skills)
                    .map((s: any) => asString(s))
                    .filter(Boolean)
                    .slice(0, 30);

                const extractedContacts = candidate?.extracted_contacts && typeof candidate.extracted_contacts === 'object'
                    ? candidate.extracted_contacts
                    : {};

                const summaryRaw = asString(structured?.summary);
                const summary = summaryRaw.length > 900
                    ? summaryRaw
                        .split(/\n\s*\n/)[0]
                        .split(/\n/)
                        .filter((l) => l && !/@/.test(l) && !/telefone|e-?mail|linkedin/i.test(l))
                        .slice(0, 4)
                        .join(' ')
                        .trim()
                        .slice(0, 900)
                    : summaryRaw;

                const email = asString((extractedContacts as any)?.email);
                const phone = asString((extractedContacts as any)?.phone);

                return {
                    structured_cv: {
                        personal_info: {
                            name: asString(personal?.name),
                            role: asString(personal?.role),
                            location: asString(personal?.location),
                            linkedin: asString(personal?.linkedin),
                            // Convenience fields for clients (non-breaking extra keys)
                            email,
                            phone,
                        },
                        summary,
                        experience,
                        education,
                        skills,
                    },
                    extracted_contacts: {
                        email,
                        phone,
                    },
                };
            };

            console.log('>>> About to call OpenAI, prompt length:', prompt.length);
            let responseText = await callAI(prompt, {
                temperature: 0.4,
                maxTokens: 3072,
                images: hasImages ? images : undefined,
            });
            console.log('>>> OpenAI response received, length:', responseText?.length);
            let analysisJson = extractJsonObject(responseText);
            console.log('>>> JSON extracted:', !!analysisJson);
            const stripHtmlToText = (html: string) => {
                const s = String(html || '');
                return s
                    .replace(/<\s*br\s*\/?>/gi, '\n')
                    .replace(/<\s*\/\s*p\s*>/gi, '\n')
                    .replace(/<\s*p\s*>/gi, '')
                    .replace(/<\s*li\s*>/gi, '- ')
                    .replace(/<\s*\/\s*li\s*>/gi, '\n')
                    .replace(/<\s*\/\s*ul\s*>/gi, '\n')
                    .replace(/<[^>]+>/g, '')
                    .replace(/\n{3,}/g, '\n\n')
                    .trim();
            };

            const legacyToAutofill = (legacy: any) => {
                const structured = legacy?.structured_cv;
                if (!structured || typeof structured !== 'object') return null;
                const personalInfo = structured?.personal_info && typeof structured.personal_info === 'object' ? structured.personal_info : {};
                const contacts = legacy?.extracted_contacts && typeof legacy.extracted_contacts === 'object' ? legacy.extracted_contacts : {};

                const email = String(contacts.email || personalInfo.email || '').trim();
                const phone = String(contacts.phone || personalInfo.phone || '').replace(/\D/g, '').trim();

                const summaryText = String(structured.summary || '').trim();
                const cleanedSummary = summaryText
                    .split(/\n+/)
                    .map((l: string) => l.trim())
                    .filter(Boolean)
                    .filter((l: string) => !/@/.test(l) && !/https?:\/\//i.test(l) && !/(telefone|e-?mail|linkedin|github|site|website)/i.test(l))
                    .join(' ')
                    .trim()
                    .slice(0, 600);

                return {
                    ok: false,
                    applyMode: 'replace',
                    patch: {
                        personal: {
                            fullName: String(personalInfo.name || '').trim(),
                            role: String(personalInfo.role || '').trim(),
                            email,
                            phone,
                            location: String(personalInfo.location || '').trim(),
                            linkedin: String(personalInfo.linkedin || '').trim(),
                            github: String(personalInfo.github || '').trim(),
                            website: String(personalInfo.website || '').trim(),
                        },
                        summaryHtml: cleanedSummary ? `<p>${cleanedSummary}</p>` : '<p></p>',
                        skills: Array.isArray(structured.skills) ? structured.skills.map((s: any) => String(s || '').trim()).filter(Boolean) : [],
                        experience: Array.isArray(structured.experience)
                            ? structured.experience.slice(0, 12).map((x: any) => ({
                                title: String(x?.role || '').trim(),
                                subtitle: String(x?.company || '').trim(),
                                date: String(x?.period || '').trim(),
                                descriptionHtml: (() => {
                                    const d = String(x?.description || '').trim();
                                    return d ? `<ul><li>${d}</li></ul>` : '<ul><li></li></ul>';
                                })(),
                            })).filter((x: any) => x.title)
                            : [],
                        education: Array.isArray(structured.education)
                            ? structured.education.slice(0, 12).map((x: any) => ({
                                title: String(x?.institution || '').trim(),
                                subtitle: String(x?.degree || '').trim(),
                                date: String(x?.period || '').trim(),
                                descriptionHtml: '<p></p>',
                            })).filter((x: any) => x.title)
                            : [],
                        courses: [],
                        projects: [],
                    },
                    warnings: ['Resposta da IA veio no formato legado; extração parcial.'],
                    confidence: { personal: 40, summary: 30, skills: 30, experience: 20, education: 20, courses: 0, projects: 0 },
                };
            };

            const autofillToLegacy = (auto: any) => {
                const p = auto?.patch?.personal;
                if (!p || typeof p !== 'object') return null;
                const email = String(p.email || '').trim();
                const phone = String(p.phone || '').replace(/\D/g, '').trim();
                const summary = stripHtmlToText(String(auto?.patch?.summaryHtml || '')).slice(0, 900);
                return {
                    structured_cv: {
                        personal_info: {
                            name: String(p.fullName || '').trim(),
                            role: String(p.role || '').trim(),
                            location: String(p.location || '').trim(),
                            linkedin: String(p.linkedin || '').trim(),
                            github: String(p.github || '').trim(),
                            website: String(p.website || '').trim(),
                            email,
                            phone,
                        },
                        summary,
                        experience: Array.isArray(auto?.patch?.experience)
                            ? auto.patch.experience.slice(0, 10).map((x: any) => ({
                                company: String(x?.subtitle || '').trim(),
                                role: String(x?.title || '').trim(),
                                period: String(x?.date || '').trim(),
                                description: stripHtmlToText(String(x?.descriptionHtml || '')),
                            }))
                            : [],
                        education: Array.isArray(auto?.patch?.education)
                            ? auto.patch.education.slice(0, 10).map((x: any) => ({
                                institution: String(x?.title || '').trim(),
                                degree: String(x?.subtitle || '').trim(),
                                period: String(x?.date || '').trim(),
                            }))
                            : [],
                        skills: Array.isArray(auto?.patch?.skills) ? auto.patch.skills : [],
                    },
                    extracted_contacts: { email, phone },
                };
            };

            const heuristicAutofillFromText = (value: string) => {
                const legacy = heuristicExtractFromText(value);
                return legacyToAutofill(legacy) ?? {
                    ok: false,
                    applyMode: 'replace',
                    patch: {
                        personal: { fullName: '', role: '', email: '', phone: '', location: '', linkedin: '', github: '', website: '' },
                        summaryHtml: '<p></p>',
                        skills: [],
                        experience: [],
                        education: [],
                        courses: [],
                        projects: [],
                    },
                    warnings: ['Fallback heurístico vazio.'],
                    confidence: { personal: 0, summary: 0, skills: 0, experience: 0, education: 0, courses: 0, projects: 0 },
                };
            };

            let normalized = effectiveMode === 'analysis'
                ? normalizeAnalysisShape(analysisJson)
                : normalizeExtractShape(analysisJson);

            // Ensure the response shape matches the requested mode.
            if (effectiveMode === 'autofill' && normalized && (normalized as any).structured_cv) {
                normalized = legacyToAutofill(normalized);
            }
            if (effectiveMode === 'extract' && normalized && (normalized as any).patch) {
                normalized = autofillToLegacy(normalized);
            }

            // For legacy extract-only mode, fill missing fields with heuristics when we have text.
            if (effectiveMode === 'extract' && normalized && hasText && (normalized as any).structured_cv) {
                const fallback = heuristicExtractFromText(String(text || ''));
                const n: any = normalized;
                const fb: any = fallback;

                const nPersonal = n?.structured_cv?.personal_info ?? {};
                const fbPersonal = fb?.structured_cv?.personal_info ?? {};

                const nContacts = n?.extracted_contacts ?? {};
                const fbContacts = fb?.extracted_contacts ?? {};

                const mergedEmail = String(nContacts.email || nPersonal.email || fbContacts.email || fbPersonal.email || '').trim();
                const mergedPhone = String(nContacts.phone || nPersonal.phone || fbContacts.phone || fbPersonal.phone || '').trim();

                normalized = {
                    structured_cv: {
                        ...n.structured_cv,
                        personal_info: {
                            ...nPersonal,
                            name: String(nPersonal.name || fbPersonal.name || '').trim(),
                            linkedin: String(nPersonal.linkedin || fbPersonal.linkedin || '').trim(),
                            email: mergedEmail,
                            phone: mergedPhone,
                        },
                        summary: (() => {
                            const s = String(n.structured_cv?.summary || '').trim();
                            if (!s || s.length < 40) return String(fb.structured_cv?.summary || '').trim();
                            // Avoid dumping the whole resume into summary
                            if (s.length > 1200 || /experi(ê|e)ncia|forma(ç|c)ão|habilidades|compet(ê|e)ncias/i.test(s)) {
                                return String(fb.structured_cv?.summary || '').trim().slice(0, 900);
                            }
                            return s.slice(0, 900);
                        })(),
                        skills: Array.isArray(n.structured_cv?.skills) && n.structured_cv.skills.length > 0
                            ? n.structured_cv.skills
                            : (fb.structured_cv?.skills ?? []),
                    },
                    extracted_contacts: {
                        email: mergedEmail,
                        phone: mergedPhone,
                    },
                    _fallback: n?._fallback,
                };
            }

            // For autofill mode, fill missing contacts/summary/skills heuristically when we have text.
            if (effectiveMode === 'autofill' && normalized && hasText && (normalized as any).patch) {
                const n: any = normalized;
                if (n.ok !== false) {
                    return json(200, n);
                }

                const fb = heuristicAutofillFromText(String(text || ''));
                const merged = {
                    ...n,
                    ok: false,
                    applyMode: 'replace',
                    patch: {
                        ...n.patch,
                        personal: {
                            ...n.patch.personal,
                            fullName: n.patch.personal.fullName || fb.patch.personal.fullName,
                            role: n.patch.personal.role || fb.patch.personal.role,
                            email: n.patch.personal.email || fb.patch.personal.email,
                            phone: n.patch.personal.phone || fb.patch.personal.phone,
                            location: n.patch.personal.location || fb.patch.personal.location,
                            linkedin: n.patch.personal.linkedin || fb.patch.personal.linkedin,
                            github: n.patch.personal.github || fb.patch.personal.github,
                            website: n.patch.personal.website || fb.patch.personal.website,
                        },
                        summaryHtml: (String(n.patch.summaryHtml || '').trim() && stripHtmlToText(String(n.patch.summaryHtml || '')).length >= 20)
                            ? n.patch.summaryHtml
                            : fb.patch.summaryHtml,
                        skills: Array.isArray(n.patch.skills) && n.patch.skills.length > 0 ? n.patch.skills : fb.patch.skills,
                    },
                };
                normalized = merged;
            }

            // One retry with a stricter prompt if AI drifts or returns non-JSON
            if (!normalized) {
                console.warn('First pass parsing/shape failed; retrying once with stricter constraints.');
                const retryPrompt = effectiveMode === 'autofill'
                    ? buildAutofillPrompt(effectiveCvTextForPrompt)

                    : effectiveMode === 'extract'
                        ? `Retorne APENAS UM JSON válido (RFC 8259), SEM markdown e SEM texto fora do JSON.

Use EXATAMENTE esta estrutura:
{
    "structured_cv": {
        "personal_info": { "name": "", "role": "", "location": "", "linkedin": "" },
        "summary": "",
        "experience": [ { "company": "", "role": "", "period": "", "description": "" } ],
        "education": [ { "institution": "", "degree": "", "period": "" } ],
        "skills": [""]
    },
    "extracted_contacts": { "email": "", "phone": "" }
}

REGRAS:
- Não calcule pontuação e não avalie
- Preencha apenas com o que estiver no currículo

CURRÍCULO:
${hasText ? cvTextForPrompt : ''}`
                        : `Retorne APENAS UM JSON válido (RFC 8259), SEM markdown e SEM texto fora do JSON.

Use EXATAMENTE esta estrutura:
{
  "overall_score": 0,
  "summary": "",
  "sections": [
    {
      "name": "",
      "score": 0,
      "strengths": [""],
      "weaknesses": [""],
      "suggestions": ["", "", ""]
    }
  ]
}

REGRAS:
- overall_score e score: números de 0 a 100
- no máximo 6 seções
- strengths/weaknesses: até 2 itens cada
- suggestions: exatamente 3 itens

CURRÍCULO:
${hasText ? cvTextForPrompt : ''}`;

                responseText = await callAI(retryPrompt, {
                    temperature: 0.2,
                    maxTokens: 3072,
                    images: hasImages ? images : undefined,
                });
                analysisJson = extractJsonObject(responseText);
                normalized = effectiveMode === 'analysis'
                    ? normalizeAnalysisShape(analysisJson)
                    : normalizeExtractShape(analysisJson);

                if (effectiveMode === 'autofill' && normalized && (normalized as any).structured_cv) {
                    normalized = legacyToAutofill(normalized);
                }
                if (effectiveMode === 'extract' && normalized && (normalized as any).personal) {
                    normalized = autofillToLegacy(normalized);
                }
            }

            if (!normalized) {
                console.error('Failed to parse/normalize analysis JSON (first 1200 chars):', String(responseText).slice(0, 1200));

                // If we have text, return a safe fallback so the UI can proceed.
                if (hasText) {
                    if (effectiveMode === 'autofill') {
                        const analysis = heuristicAutofillFromText(String(text || ''));
                        return json(200, analysis);
                    }

                    const fallback = heuristicExtractFromText(String(text || ''));

                    const analysis = effectiveMode === 'extract'
                        ? fallback
                        : {
                            overall_score: 0,
                            summary: 'A IA retornou uma resposta em formato inesperado. Preenchimento parcial aplicado.',
                            sections: [],
                            structured_cv: fallback.structured_cv,
                            extracted_contacts: fallback.extracted_contacts,
                            _fallback: { reason: 'ai_json_invalid', mode: 'analysis' },
                        };

                    return json(200, {
                        analysis,
                        warning: 'IA retornou JSON inválido; usando extração heurística.',
                        request_id: requestId,
                    });
                }

                const payload = {
                    error: 'Erro ao processar resposta da IA',
                    error_code: 'AI_JSON_INVALID',
                    request_id: requestId,
                    hint: 'Tente novamente. Se persistir, reduza o tamanho do currículo (1-2 páginas) ou remova conteúdo não essencial.',
                };
                return json(502, payload);
            }

            const analysisJsonNormalized = normalized;

            // Save to database (best-effort) only for full analysis.
            if (effectiveMode === 'analysis') {
                if (SUPABASE_SERVICE_ROLE_KEY) {
                    try {
                        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY);
                        const { error: dbError } = await supabase
                            .from('resume_analyses')
                            .insert({
                                user_id: userId,
                                filename: filename,
                                file_type: 'pdf',
                                analysis_result: analysisJsonNormalized,
                                score: (analysisJsonNormalized as any).overall_score / 10, // Convert to 0-10 scale
                                status: 'completed'
                            });

                        if (dbError) {
                            console.error('Database error:', dbError);
                        }
                    } catch (e) {
                        console.error('Database save error:', e);
                    }
                } else {
                    console.warn('SUPABASE_SERVICE_ROLE_KEY not configured; skipping DB save.');
                }
            }

            if (effectiveMode === 'autofill') {
                return json(200, analysisJsonNormalized);
            }

            return json(200, { analysis: analysisJsonNormalized, request_id: requestId })

        } catch (error) {
            console.error('Error:', error)
            const message = error instanceof Error ? error.message : String(error)

            // Use 502 for upstream/AI formatting issues to avoid misleading "client error".
            const isUpstream =
                message.includes('processar resposta') ||
                message.includes('Resposta vazia') ||
                message.includes('comunicar com a IA') ||
                message.includes('comunicar com OpenAI') ||
                message.includes('Resposta inválida') ||
                message.includes('IA bloqueou a resposta') ||
                message.includes('OpenAI')

            const status = isUpstream ? 502 : 400

            const error_code = isUpstream ? 'AI_UPSTREAM_ERROR' : 'BAD_REQUEST'
            return json(status, { error: message, error_code, request_id: requestId })
        }
    } catch (globalError) {
        // Global catch - ensures we ALWAYS return a Response
        console.error('Global error:', globalError)
        const message = globalError instanceof Error ? globalError.message : String(globalError)
        return new Response(JSON.stringify({
            error: message,
            error_code: 'INTERNAL_ERROR',
            request_id: requestId
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
