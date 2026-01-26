import { EditableCV, Section } from '../types/cv';
import { invokeGeminiJson } from './geminiService';

function getSectionById(cv: EditableCV, id: string): Section | undefined {
  return cv.sections.find((s) => s.id === id);
}

function sanitizeInline(value: string): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function stripHtmlToText(html: string): string {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?p[^>]*>/gi, '\n')
    .replace(/<\/?li[^>]*>/gi, '\n- ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\t\r]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function clamp(value: string, maxChars: number): string {
  const v = String(value || '');
  if (v.length <= maxChars) return v;
  return v.slice(0, maxChars) + '…';
}

function buildCvContext(cvData: EditableCV): string {
  const personal = getSectionById(cvData, 'personal');
  const skills = getSectionById(cvData, 'skills');
  const experience = getSectionById(cvData, 'experience');
  const education = getSectionById(cvData, 'education');

  const name = sanitizeInline(String(personal?.fields?.fullName || ''));
  const role = sanitizeInline(String(personal?.fields?.role || ''));
  const location = sanitizeInline(String(personal?.fields?.location || ''));

  const skillsList = Array.isArray(skills?.list) ? skills!.list.filter(Boolean).slice(0, 18) : [];

  const expItems = Array.isArray(experience?.items) ? experience!.items.slice(0, 3) : [];
  const expText = expItems
    .map((it, idx) => {
      const company = sanitizeInline(String(it.subtitle || it.company || ''));
      const title = sanitizeInline(String(it.title || it.role || ''));
      const date = sanitizeInline(String(it.date || it.period || ''));
      const desc = sanitizeInline(String(it.description || ''));
      return `- (${idx + 1}) ${title}${company ? ` @ ${company}` : ''}${date ? ` (${date})` : ''}${desc ? `: ${desc}` : ''}`;
    })
    .join('\n');

  const eduItems = Array.isArray(education?.items) ? education!.items.slice(0, 2) : [];
  const eduText = eduItems
    .map((it, idx) => {
      const inst = sanitizeInline(String(it.title || it.institution || ''));
      const degree = sanitizeInline(String(it.subtitle || it.degree || ''));
      const date = sanitizeInline(String(it.date || it.period || ''));
      return `- (${idx + 1}) ${inst}${degree ? ` — ${degree}` : ''}${date ? ` (${date})` : ''}`;
    })
    .join('\n');

  return [
    name || role || location
      ? `DADOS PESSOAIS:\n- Nome: ${name || 'Não informado'}\n- Cargo/Área: ${role || 'Não informado'}\n- Local: ${location || 'Não informado'}`
      : null,
    skillsList.length ? `HABILIDADES (amostra):\n- ${skillsList.join(', ')}` : null,
    expText ? `EXPERIÊNCIA (amostra):\n${expText}` : null,
    eduText ? `FORMAÇÃO (amostra):\n${eduText}` : null,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export async function enhanceRichTextSection(args: {
  cvData: EditableCV;
  section: Section;
}): Promise<string> {
  const sectionTitle = sanitizeInline(args.section.title || 'Seção');
  const currentHtml = (args.section.content || '').trim();
  const currentText = stripHtmlToText(currentHtml);
  const context = buildCvContext(args.cvData);

  const isSummary = /resumo/i.test(sectionTitle);
  const guidance = isSummary
    ? `Objetivo do Resumo Profissional:
- 60 a 90 palavras, 2 a 4 frases curtas.
- Comece com o cargo/área (se houver) + especialidade.
- Cite tecnologias do contexto (ex: Java, JavaScript, Python, MySQL), sem listar tudo.
- Destaque impacto (qualidade, performance, automação, APIs, colaboração) sem inventar números.
- Evite clichês e evite 1ª pessoa.
`
    : `Regras de estilo:
- Texto objetivo e profissional.
- Evite clichês e evite 1ª pessoa.
`;

  const prompt = `Você é um especialista em currículos (PT-BR) e redação profissional.

Tarefa:
- Melhore o conteúdo da seção "${sectionTitle}".
- Se houver texto atual, reescreva para ficar mais objetivo, claro e forte.
- Se estiver vazio, escreva do zero usando SOMENTE o contexto fornecido.

Regras importantes:
- Não invente experiências, empresas, certificações, números, salários, prêmios ou datas.
- Se não houver métricas, NÃO crie números. Em vez disso, use linguagem de impacto sem quantificar.

${guidance}

Compatível com ATS:
- Termos claros, sem excesso de floreio.

Formato de saída (JSON):
Retorne APENAS um JSON válido com esta estrutura:
{ "html": string }

O campo "html" deve conter HTML simples compatível com TipTap usando apenas: <p>, <strong>, <ul>, <li>, <br>.
Não inclua markdown.

CONTEXTO DO CV:
${context || '(sem contexto adicional)'}

TEXTO ATUAL (texto simples) — pode estar vazio:
${clamp(currentText || '(vazio)', 1600)}
`;

  const result = await invokeGeminiJson<{ html?: string }>({
    prompt,
    requestType: 'cv_enhance',
    temperature: 0.3,
    maxOutputTokens: 520,
  });

  const html = String(result?.html || '').trim();
  if (!html) return '';

  // Basic normalization if model returns plain text unexpectedly.
  if (!html.includes('<')) {
    return `<p>${html.replace(/\n+/g, '<br>')}</p>`;
  }

  return html;
}
