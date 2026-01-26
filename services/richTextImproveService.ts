import { invokeGeminiJson } from './geminiService';
import { sanitizeRichTextHtml, stripHtmlToText } from '../utils/richTextSanitize';

export type ImproveFieldType =
  | 'summary'
  | 'experience_item_description'
  | 'education_item_description'
  | 'course_item_description'
  | 'project_item_description'
  | 'generic_richtext';

export type ImproveRichTextContext = {
  fieldType: ImproveFieldType;
  sectionId?: string;
  itemId?: string;
  role?: string;
  skills?: string[];
};

function clamp(value: string, maxChars: number): string {
  const v = String(value || '');
  if (v.length <= maxChars) return v;
  return v.slice(0, maxChars) + '…';
}

function dedupeSkills(skills: string[] | undefined): string[] {
  if (!Array.isArray(skills)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of skills) {
    const v = String(s || '').trim();
    if (!v) continue;
    const k = v.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
    if (out.length >= 18) break;
  }
  return out;
}

function buildGuidance(fieldType: ImproveFieldType): string {
  switch (fieldType) {
    case 'summary':
      return `Resumo Profissional:
- 60 a 90 palavras, 2 a 4 frases curtas.
- Comece com a área/cargo alvo (se houver) + especialidade.
- Destaque impacto sem inventar números.
- Evite 1ª pessoa e clichês ("proativo", "dedicado").`;
    case 'experience_item_description':
      return `Experiência:
- Descreva responsabilidades e impacto do que já está no texto.
- Preserve nomes, tecnologias, datas e links citados.
- Se não houver métricas, NÃO invente números.`;
    case 'education_item_description':
      return `Formação:
- Seja objetivo; preserve curso, instituição, status e datas.
- Não invente atividades, projetos ou prêmios.`;
    case 'course_item_description':
      return `Cursos/Certificações:
- Preserve nome do curso, instituição, carga horária, datas.
- Não invente certificações, notas ou credenciais.`;
    case 'project_item_description':
      return `Projetos:
- Foque em problema, solução, tecnologias já mencionadas e resultado.
- Não invente stack, clientes ou números.`;
    default:
      return `Texto:
- Reescreva com clareza e profissionalismo sem inventar fatos.`;
  }
}

export async function improveRichTextHTML(args: {
  html: string;
  context: ImproveRichTextContext;
}): Promise<{ html: string }> {
  const inputHtml = sanitizeRichTextHtml(args.html || '');

  // Hard limits to control cost.
  if (inputHtml.length > 9000) {
    throw new Error('Texto muito grande para melhorar. Reduza para até ~9.000 caracteres (HTML).');
  }

  const inputText = stripHtmlToText(inputHtml);
  if (inputText.length > 4500) {
    throw new Error('Texto muito grande para melhorar. Reduza para até ~4.500 caracteres (texto).');
  }

  const role = String(args.context.role || '').trim();
  const skills = dedupeSkills(args.context.skills);

  const prompt = `Você é um especialista em currículos e redação profissional (PT-BR).

Tarefa:
- Reescreva o TEXTO ATUAL melhorando clareza, gramática, concisão e voz ativa.
- NÃO invente fatos: não adicione empresas, datas, tecnologias, cursos, resultados numéricos, prêmios ou certificações que não estejam no texto.
- Preserve exatamente: nomes próprios, datas/períodos, nomes de empresas/instituições, tecnologias citadas, links.
- Evite repetição de "eu" e evite adjetivos vazios sem evidência.

${buildGuidance(args.context.fieldType)}

FORMATO DE SAÍDA (JSON):
Retorne APENAS um JSON válido:
{ "html": string }

Regras do HTML:
- Use apenas: <p>, <ul>, <ol>, <li>, <strong>, <em>, <a>, <br>
- Sem markdown.
- Sem <script>, sem <style>, sem iframes.

CONTEXTO MÍNIMO:
- Cargo alvo: ${role || '(não informado)'}
- Habilidades (amostra): ${skills.length ? skills.join(', ') : '(não informado)'}

TEXTO ATUAL (HTML sanitizado):
${clamp(inputHtml || '<p>(vazio)</p>', 9000)}
`;

  const result = await invokeGeminiJson<{ html?: unknown }>({
    prompt,
    requestType: 'cv_enhance',
    temperature: 0.2,
    maxOutputTokens: 700,
  });

  const raw = (result as any)?.html;
  const html = sanitizeRichTextHtml(typeof raw === 'string' ? raw : String(raw ?? ''));

  if (!html) {
    throw new Error('A IA não retornou um HTML válido. Tente novamente.');
  }

  // If the model returned plain text, wrap it.
  if (!html.includes('<')) {
    return { html: `<p>${html.replace(/\n+/g, '<br>')}</p>` };
  }

  return { html };
}
