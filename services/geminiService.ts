import { UserAnswers, CareerPlan, CareerDetails, TopCareer, NextQuestionResponse } from '../types';
import { CVAnalysisResult } from '../types/cv';
import { CVAutofillResult } from '../types/cvAutofill';
import { RequestType } from '../types/usage';
import { usageMonitor } from './usageMonitorService';
import { supabaseService } from './supabaseService';

// NOTE:
// Gemini is now called server-side via Supabase Edge Functions.
// This avoids exposing API keys in the browser and enables real rate limiting.
const DEFAULT_MODEL = 'gpt-5-mini';

// --- Explore careers cache (query/category/offset) ---
// Persistent cache reduces perceived slowness and avoids repeated Gemini calls.
const CAREER_DETAILS_CACHE_PREFIX = 'cache:career_details:';
const CAREER_DETAILS_CACHE_VERSION = 'v2';
const CAREER_DETAILS_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
type CareerDetailsCacheEntry = { cachedAt: number; data: CareerDetails[] };
const careerDetailsMemoryCache = new Map<string, CareerDetailsCacheEntry>();

function normalizeCachePart(value: string): string {
  return (value || '').trim().toLowerCase();
}

function buildCareerDetailsCacheKey(query: string, category: string, offset: number, email: string = 'anonymous'): string {
  const q = encodeURIComponent(normalizeCachePart(query));
  const c = encodeURIComponent(normalizeCachePart(category));
  const e = encodeURIComponent(normalizeCachePart(email));
  return `${CAREER_DETAILS_CACHE_PREFIX}${CAREER_DETAILS_CACHE_VERSION}:${DEFAULT_MODEL}:${e}:${q}:${c}:${offset}`;
}

function readCareerDetailsCache(key: string): CareerDetailsCacheEntry | null {
  const now = Date.now();

  const mem = careerDetailsMemoryCache.get(key);
  if (mem) {
    if (now - mem.cachedAt < CAREER_DETAILS_CACHE_TTL_MS) return mem;
    careerDetailsMemoryCache.delete(key);
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CareerDetailsCacheEntry;
    if (!parsed || typeof parsed.cachedAt !== 'number' || !Array.isArray(parsed.data)) return null;
    if (now - parsed.cachedAt >= CAREER_DETAILS_CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    careerDetailsMemoryCache.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function writeCareerDetailsCache(key: string, data: CareerDetails[]): void {
  const entry: CareerDetailsCacheEntry = { cachedAt: Date.now(), data };
  careerDetailsMemoryCache.set(key, entry);

  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Ignore quota / private mode errors
  }
}

type GeminiJsonMode = 'json' | 'text';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientNetworkError(message: string): boolean {
  const msg = (message || '').toLowerCase();
  return (
    msg.includes('err_network_changed') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('failed to send a request to the edge function') ||
    msg.includes('fetch failed') ||
    msg.includes('network request failed')
  );
}

async function invokeGeminiEdge<T>(args: {
  prompt: string;
  requestType: RequestType;
  mode?: GeminiJsonMode;
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
}): Promise<T> {
  const client = supabaseService.getClient();
  if (!client) throw new Error('Supabase não inicializado');

  const maxAttempts = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data, error } = await client.functions.invoke('gemini-json', {
      body: {
        prompt: args.prompt,
        requestType: args.requestType,
        mode: args.mode ?? 'json',
        temperature: args.temperature,
        maxOutputTokens: args.maxOutputTokens,
        model: args.model ?? DEFAULT_MODEL,
      },
    });

    if (!error) {
      // Local UI-only stats (not enforcement)
      try {
        usageMonitor.trackRequest(args.requestType);
      } catch {
        // ignore
      }

      if ((args.mode ?? 'json') === 'text') {
        return (data?.text ?? '') as T;
      }

      return (data?.data ?? data) as T;
    }

    lastError = error;
    const anyError: any = error as any;
    const message = String(anyError?.message || '');

    // Retry transient browser/network issues (e.g., Chrome ERR_NETWORK_CHANGED)
    if (attempt < maxAttempts && isTransientNetworkError(message)) {
      await sleep(250 * attempt);
      continue;
    }

    // Try extracting server-provided error payload (when available)
    try {
      const ctx = anyError?.context;
      if (ctx) {
        const maybeJson = await ctx.json?.();
        const msg = maybeJson?.error || maybeJson?.message;
        if (msg) throw new Error(String(msg));

        const maybeText = await ctx.text?.();
        if (maybeText) throw new Error(String(maybeText));
      }
    } catch (e) {
      if (e instanceof Error) throw e;
    }

    if (isTransientNetworkError(message)) {
      throw new Error('Problema de conexão ao chamar a IA. Verifique sua internet/VPN e tente novamente.');
    }

    throw new Error(message || 'Falha ao chamar a IA (Edge Function).');
  }

  const finalMessage = String((lastError as any)?.message || '');
  if (isTransientNetworkError(finalMessage)) {
    throw new Error('Problema de conexão ao chamar a IA. Verifique sua internet/VPN e tente novamente.');
  }
  throw new Error(finalMessage || 'Falha ao chamar a IA (Edge Function).');
}

export async function invokeGeminiText(args: {
  prompt: string;
  requestType: RequestType;
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
}): Promise<string> {
  return invokeGeminiEdge<string>({
    prompt: args.prompt,
    requestType: args.requestType,
    mode: 'text',
    temperature: args.temperature,
    maxOutputTokens: args.maxOutputTokens,
    model: args.model,
  });
}

export async function invokeGeminiJson<T>(args: {
  prompt: string;
  requestType: RequestType;
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
}): Promise<T> {
  return invokeGeminiEdge<T>({
    prompt: args.prompt,
    requestType: args.requestType,
    mode: 'json',
    temperature: args.temperature,
    maxOutputTokens: args.maxOutputTokens,
    model: args.model,
  });
}

export const generateTop3Careers = async (answers: UserAnswers): Promise<TopCareer[]> => {
  const userProfile = Object.entries(answers)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');

  const prompt = `
    Você é um conselheiro de carreira especialista em IA, com profundo conhecimento do mercado de trabalho brasileiro e global. 
    Analise profundamente as respostas do usuário abaixo para identificar padrões de personalidade, habilidades, valores e interesses.
    
    Perfil do Usuário (Respostas ao questionário):
    ${userProfile}

    Com base nessa análise holística, gere as 3 sugestões de carreira MAIS compatíveis e promissoras.
    
    Para cada carreira, forneça:
    - profession: O nome da profissão (seja específico, ex: "Engenheiro de Dados" ao invés de "TI").
    - description: Uma descrição inspiradora da missão desse profissional.
    - specialization: Uma sugestão de nicho ou especialização que combine com os hobbies/interesses citados.
    - tools: Uma lista de 3 a 5 ferramentas, tecnologias ou metodologias essenciais.
    - salaryRange: Uma faixa salarial realista para nível JÚNIOR/INICIANTE no Brasil (em BRL).
    - marketDemand: A demanda de mercado atual (ex: 'Muito Alta', 'Estável', 'Crescente').
    
    Seja direto, mas inspirador. Evite clichês genéricos. Tente conectar pontos não óbvios do perfil.
    Retorne APENAS um array JSON válido com 3 itens e esta estrutura:
    [{
      "profession": string,
      "description": string,
      "specialization": string,
      "tools": string[],
      "salaryRange": string,
      "marketDemand": string
    }]
  `;

  return invokeGeminiEdge<TopCareer[]>({ prompt, requestType: 'careers', mode: 'json' });
};

export const generateStepByStepPlan = async (answers: UserAnswers, chosenCareer: TopCareer): Promise<CareerPlan> => {
  const userProfile = `
    - Estilo de Aprendizagem: ${answers.learning_mode || 'Prático'}
    - Hobbies/Paixões: ${answers.passion_hobby || 'Não informado'}
    - Motivação Principal: ${answers.main_motivator || 'Não informado'}
  `;

  const prompt = `
    O usuário escolheu a carreira de "${chosenCareer.profession}" com foco em "${chosenCareer.specialization}".
    
    Contexto do usuário:
    ${userProfile}

    Crie um plano de ação passo a passo, prático e ACIONÁVEL para os próximos 12 meses, focado em quem está começando do zero.
    Divida o plano em 3 ou 4 fases estratégicas com prazos claros.
    
    Importante:
    - As ações devem ser específicas (ex: "Faça o curso X", "Crie um projeto Y", "Contate Z").
    - Considere o estilo de aprendizagem do usuário nas sugestões.
    - Inclua como integrar os hobbies na construção de portfólio, se possível.
    
    Para cada fase, retorne:
    - timeframe: Duração (ex: 'Meses 1-3: Imersão').
    - actions: Lista de 3 a 4 tarefas cruciais.
    
    Retorne APENAS um JSON válido no formato:
    { "stepByStepPlan": [{ "timeframe": string, "actions": string[] }] }
  `;

  return invokeGeminiEdge<CareerPlan>({ prompt, requestType: 'plan', mode: 'json' });
};

export const fetchCareerDetails = async (query: string, category: string, offset: number = 0): Promise<CareerDetails[]> => {
  const user = await supabaseService.getUser();
  const email = user?.email || 'anonymous';
  const cacheKey = buildCareerDetailsCacheKey(query, category, offset, email);
  const cached = readCareerDetailsCache(cacheKey);
  if (cached) return cached.data;

  const prompt = `
    Forneça uma lista de 3 carreiras detalhadas e DIVERSIFICADAS com base nos critérios:
    - Termo de busca: "${query || 'geral'}"
    - Categoria: "${category || 'qualquer'}"
    - Offset de resultados: ${offset} (use isso para retornar carreiras diferentes das anteriores)

    IMPORTANTE:
    - Se offset for 0, retorne as 3 carreiras MAIS populares/relevantes.
    - Se offset for > 0, retorne carreiras DIFERENTES das anteriores, explorando nichos, especializações e variações.
    - NUNCA repita carreiras já sugeridas. Seja criativo e explore sub-áreas.
    - Se o termo de busca for vago, sugira carreiras populares na categoria.
    - Se a categoria não for informada, use o termo de busca em diversas áreas.

    Para cada carreira, retorne:
    - title: Nome da profissão (seja específico, ex: "Engenheiro de Dados" ao invés de "Engenheiro").
    - category: Categoria (Tecnologia, Saúde, Criativo, Negócios, etc.).
    - description: Breve descrição inspiradora.
    - dailyResponsibilities: Lista de 3-5 responsabilidades diárias.
    - requiredSkills: Lista de 3-5 habilidades essenciais.
    - salaryRange: Faixa salarial júnior no Brasil (BRL).
    - marketDemand: Demanda de mercado (Alta, Média, Crescente, etc.).

    Retorne APENAS um array JSON válido com esta estrutura:
    [{
      "title": string,
      "category": string,
      "description": string,
      "dailyResponsibilities": string[],
      "requiredSkills": string[],
      "salaryRange": string,
      "marketDemand": string
    }]
  `;

  const result = await invokeGeminiEdge<CareerDetails[]>({ prompt, requestType: 'explore', mode: 'json', temperature: 0.3 });
  writeCareerDetailsCache(cacheKey, result);
  return result;
};

/**
 * Fetch career details using streaming for better UX
 */
export const fetchCareerDetailsStreaming = async (
  query: string,
  category: string,
  offset: number = 0,
  onUpdate: (careers: CareerDetails[]) => void
): Promise<CareerDetails[]> => {
  const user = await supabaseService.getUser();
  const email = user?.email || 'anonymous';
  const cacheKey = buildCareerDetailsCacheKey(query, category, offset, email);
  const cached = readCareerDetailsCache(cacheKey);
  if (cached) {
    onUpdate(cached.data);
    return cached.data;
  }

  // NOTE: true streaming was removed after moving Gemini calls server-side.
  // Keep this API for compatibility; we just fetch once and update.
  const result = await fetchCareerDetails(query, category, offset);
  onUpdate(result);
  return result;
};

export const generateNextQuestion = async (answers: UserAnswers, questionHistory: any[]): Promise<NextQuestionResponse> => {
  // Build a rich history string that includes the Question Text and the User's Answer
  const userProfile = questionHistory.map((q, index) => {
    const answer = answers[q.id];
    return `Pergunta ${index + 1}: "${q.label}"\nResposta: "${answer}"`;
  }).join('\n\n');

  const prompt = `
    Você é um mentor de carreira e consultor educacional de elite. Sua missão é encontrar a vocação PERFEITA para o usuário, alinhada à sua realidade, sonhos e possibilidades locais.
    
    Histórico da Entrevista (Perguntas feitas e respostas do usuário):
    ${userProfile}

    Contagem de Perguntas Atuais: ${questionHistory.length}

    Objetivo Principal:
    Sua missão é guiar o usuário para o caminho certo, priorizando o que ele QUER e GOSTA. Mesmo que seja uma mudança de área radical, o desejo do usuário é sua bússola. Você deve usar os 6 pilares abaixo para estruturar sua investigação e direcionamento:

    1. **Objetivo (Clareza)**: Entenda logo cedo se o foco é novo emprego, transição de área, planejamento de estudos ou validação de currículo.
    2. **Status e Disponibilidade (Realidade)**: Verifique vínculo atual (CLT, Autônomo, Estudante), situação imediata e horas disponíveis por semana.
    3. **Preferências e Restrições (Viabilidade)**: Localização (remoto/híbrido/presencial), salário desejado, disponibilidade para mudança e restrições pessoais (filhos, vistos, etc.).
    4. **Coração (Interesses e Valores)**: O que a pessoa realmente gosta de fazer? Quais as prioridades (estabilidade vs flexibilidade vs impacto vs salário)?
    5. **Educação**: Nível de escolaridade e área de formação (pergunte após os interesses para evitar que a pessoa se limite ao que já estudou).
    6. **Bagagem**: Experiências passadas e habilidades atuais para mapear a ponte para a nova carreira.

    Diretrizes de Comportamento:
    - **Priorize a Vontade**: Se o usuário quer mudar para uma área distinta, foque em COMO fazer isso acontecer, não em convencê-lo do contrário.
    - **Afunilamento Estratégico**: Use os pilares acima para não sugerir caminhos impraticáveis (ex: sugerir algo presencial para quem só pode remoto).
    - **O "Nenhum"**: Se o usuário estiver perdido, ofereça opções baseadas em estilos de vida e rotinas (ex: "Trabalho silencioso com dados ou dinâmico com pessoas?").
    - **Conclusão**: Só encerre (isComplete: true) quando tiver coberto informações essenciais desses pilares e validado que o usuário se sente ouvido e direcionado.

    Sobre a Próxima Pergunta:
    - Mantenha a pergunta ('label') extremamente concisa e direta ao ponto. Máximo 15-20 palavras.
    - Evite introduções longas. Vá direto para a dúvida central.
    - Fale a língua do usuário. Sem "corporativês" excessivo.
    - Se for Radio: Dê opções claras e abrangentes.
    - Se for Textarea: Incentive o usuário a descrever seus gostos e realidades.

    Retorne APENAS um JSON válido no formato:
    {
      "isComplete": boolean,
      "nextQuestion"?: {
        "id": string,
        "label": string,
        "type": "radio" | "textarea",
        "options"?: string[] | null,
        "placeholder"?: string | null
      } | null
    }
  `;

  return invokeGeminiEdge<NextQuestionResponse>({ prompt, requestType: 'question', mode: 'json', temperature: 0.4 });
};

export const generateChatResponse = async (message: string, history: { text: string; isUser: boolean }[]): Promise<string> => {
  const conversationHistory = history
    .map(msg => `${msg.isUser ? 'Usuário' : 'Assistente'}: ${msg.text}`)
    .join('\n');

  const siteContext = `
    SOBRE O SITE "O CAMINHO PROFISSIONAL":
    - Objetivo: Plataforma de descoberta vocacional impulsionada por IA.
    - Funcionalidades Principais:
      1. Teste Vocacional com IA: Uma entrevista dinâmica onde a IA faz perguntas personalizadas para entender o perfil do usuário e sugerir as 3 melhores carreiras.
      2. Explorar Carreiras: Uma ferramenta de busca onde o usuário pode pesquisar profissões por nome, área ou habilidade e ver detalhes como salário, dia a dia e demanda.
      3. Plano de Ação: Após escolher uma carreira, o usuário recebe um guia passo a passo de 12 meses para entrar na área.
      4. Catálogo: Uma lista visual de carreiras (em breve).
    - Público-alvo: Estudantes, pessoas em transição de carreira e indecisos.
    - Tom de voz: Inspirador, tecnológico, prático e acolhedor.
  `;

  const prompt = `
    Você é o assistente virtual oficial da plataforma "O Caminho Profissional".
    
    ${siteContext}

    Seu objetivo é ajudar o usuário a navegar pelo site, tirar dúvidas sobre as funcionalidades e oferecer conselhos rápidos de carreira.
    Use o contexto do site para guiar suas respostas. Por exemplo, se o usuário não souber qual carreira seguir, sugira o "Teste Vocacional" do site. Se quiser saber salário de algo, sugira o "Explorar Carreiras".

    Histórico da conversa:
    ${conversationHistory}
    
    Usuário: ${message}
    
    Responda de forma concisa, útil e encorajadora.
    Assistente:
  `;

  try {
    return await invokeGeminiEdge<string>({ prompt, requestType: 'chat', mode: 'text', temperature: 0.5 });
  } catch (error) {
    console.error("Erro no chat:", error);
    return "Estou tendo dificuldades para conectar agora. Por favor, tente mais tarde.";
  }
};



/**
 * Helper to call analyze-cv edge function directly via fetch
 * This avoids some CORS/Cookies issues with the standard client.functions.invoke
 * and gives us explicit control over headers.
 */
async function invokeAnalyzeCV<T>(payload: any): Promise<T> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase URL ou Key não configurados no .env');
  }

  const client = supabaseService.getClient();
  if (!client) throw new Error('Cliente Supabase não inicializado');

  const { data: { session } } = await client.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': anonKey,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/analyze-cv`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorMsg = `Erro ${response.status}: Falha ao processar`;
      try {
        const errJson = await response.json();
        errorMsg = errJson.error || errJson.message || errorMsg;
        if (errJson.request_id) errorMsg += ` (ID: ${errJson.request_id})`;
        if (errJson.hint) errorMsg += `\nDica: ${errJson.hint}`;
      } catch {
        const text = await response.text();
        if (text) errorMsg = text;
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return data as T;
  } catch (err: any) {
    // Handle network errors specifically to help user
    const msg = err.message || '';
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      throw new Error('Falha de conexão. Verifique sua internet ou se a extensão de bloqueio de anúncios está interferindo.');
    }
    throw err;
  }
}

/**
 * Analyze CV/Resume with AI (Multimodal Support)
 */
export const analyzeCVWithAI = async (cvContent: string | string[], targetCareer?: string): Promise<CVAnalysisResult> => {
  // CV analysis is handled server-side (Edge Function analyze-cv).
  const text = Array.isArray(cvContent) ? undefined : cvContent;
  const images = Array.isArray(cvContent) ? cvContent : undefined;

  try {
    const data = await invokeAnalyzeCV<any>({
      text,
      images,
      filename: 'cv',
      targetCareer,
      mode: 'analysis',
      extractOnly: false,
    });

    // Edge function returns { analysis: ... }
    return (data?.analysis ?? data) as CVAnalysisResult;

  } catch (error: any) {
    const rawMessage = error.message || 'Falha ao analisar currículo.';

    if (Array.isArray(cvContent) && /missing required fields|required|text/i.test(rawMessage)) {
      throw new Error(
        'Este PDF parece ser baseado em imagem (escaneado). O analisador precisa de suporte multimodal na função Supabase `analyze-cv` para processar imagens. Atualize/deploy a função ou tente um PDF com texto selecionável.'
      );
    }
    throw error;
  }
};

/**
 * Autofill extraction for the CV editor (no scoring/pontuação).
 * Returns a strict schema used to fill form + preview.
 */
export const autofillCVWithAI = async (args: {
  text: string;
  filename?: string;
  targetCareer?: string;
  images?: string[];
}): Promise<CVAutofillResult> => {
  const data = await invokeAnalyzeCV<CVAutofillResult>({
    text: args.text,
    images: Array.isArray(args.images) && args.images.length > 0 ? args.images : undefined,
    filename: args.filename,
    targetCareer: args.targetCareer,
    mode: 'autofill',
  });

  return data;
};

/**
 * AI-assisted extraction to fill the CV editor (no scoring/pontuação).
 * Returns only `structured_cv` + `extracted_contacts`.
 */
export const extractCVStructureWithAI = async (cvContent: string | string[]): Promise<Pick<CVAnalysisResult, 'structured_cv' | 'extracted_contacts'>> => {
  const text = Array.isArray(cvContent) ? undefined : cvContent;
  const images = Array.isArray(cvContent) ? cvContent : undefined;


  const data = await invokeAnalyzeCV<any>({
    text,
    images,
    filename: 'cv',
    extractOnly: true,
  });

  const payload = (data?.analysis ?? data) as any;
  return {
    structured_cv: payload?.structured_cv,
    extracted_contacts: payload?.extracted_contacts,
  };
};

// --- Career Comparator ---
export interface CareerComparisonData {
  name: string;
  salaryRange: { min: number; max: number; currency: string };
  marketDemand: string;
  requiredSkills: string[];
  formationTime: string;
  pros: string[];
  cons: string[];
  growthPotential: number;
  compatibilityScore?: number; // 0-100% compatibility with user profile
  compatibilityReason?: string; // Why this score
}

export interface CareerComparisonResult {
  careers: CareerComparisonData[];
  recommendation: string;
  bestForSummary?: string;
}

export const compareCareers = async (careerNames: string[], userAnswers?: Record<string, string>): Promise<CareerComparisonResult> => {
  if (careerNames.length < 2 || careerNames.length > 3) {
    throw new Error("Selecione entre 2 e 3 carreiras para comparar.");
  }

  const careersListText = careerNames.map((name, i) => `${i + 1}. ${name}`).join('\n');

  // Build user profile section if answers are available
  let userProfileSection = '';
  if (userAnswers && Object.keys(userAnswers).length > 0) {
    const profileText = Object.entries(userAnswers)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join('\n');
    userProfileSection = `
    
    PERFIL DO USUÁRIO (baseado em suas respostas ao questionário):
    ${profileText}
    
    Com base neste perfil, para CADA carreira, calcule também:
    - compatibilityScore: Porcentagem de 0 a 100 indicando compatibilidade do perfil do usuário com esta carreira
    - compatibilityReason: Uma frase curta explicando por que essa compatibilidade (ex: "Seu interesse em tecnologia e perfil analítico combinam bem")
    `;
  }

  const prompt = `
    Você é um especialista em carreiras e mercado de trabalho brasileiro.
    
    O usuário quer comparar as seguintes carreiras:
    ${careersListText}
    ${userProfileSection}
    
    Para CADA carreira, forneça uma análise detalhada e comparativa contendo:
    - name: Nome exato da carreira
    - salaryRange: Faixa salarial no Brasil (min/max em BRL para profissional pleno)
    - marketDemand: Demanda atual de mercado ("Alta", "Média", "Baixa", "Muito Alta", "Em Crescimento")
    - requiredSkills: Lista de 4-6 habilidades técnicas e soft skills essenciais
    - formationTime: Tempo médio para se tornar profissional qualificado (ex: "2-4 anos", "6 meses a 1 ano")
    - pros: Lista de 3 principais vantagens/benefícios desta carreira
    - cons: Lista de 3 principais desafios/desvantagens desta carreira
    - growthPotential: Nota de 1 a 10 para potencial de crescimento nos próximos 5 anos
    ${userAnswers ? '- compatibilityScore: Porcentagem de compatibilidade (0-100)\n    - compatibilityReason: Razão da compatibilidade em uma frase' : ''}
    
    Também forneça:
    - recommendation: Uma recomendação final resumida (máx 2 frases) sobre qual carreira pode ser mais adequada e por quê
    
    Seja objetivo, realista e baseie-se no mercado brasileiro atual.

    Retorne APENAS um JSON válido no formato:
    {
      "careers": [
        {
          "name": string,
          "salaryRange": { "min": number, "max": number, "currency": string },
          "marketDemand": string,
          "requiredSkills": string[],
          "formationTime": string,
          "pros": string[],
          "cons": string[],
          "growthPotential": number,
          "compatibilityScore"?: number,
          "compatibilityReason"?: string
        }
      ],
      "recommendation": string,
      "bestForSummary"?: string
    }
  `;

  return invokeGeminiEdge<CareerComparisonResult>({ prompt, requestType: 'careers', mode: 'json', temperature: 0.3 });
};
