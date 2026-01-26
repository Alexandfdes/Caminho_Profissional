import { CVAutofillResult } from '../types/cvAutofill';

export type CVAutofillValidationResult = {
  ok: boolean;
  issues: string[];
  personalOk: boolean;
  confidenceOk: boolean;
};

const ALLOWED_TAGS = new Set(['p', 'ul', 'li', 'strong', 'em', 'br', 'a']);

function asString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function clamp01to100(n: unknown): number {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, x));
}

function stripHtml(html: string): string {
  return String(html || '')
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\s*\/\s*p\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function hasForbiddenInSummary(html: string): boolean {
  const t = stripHtml(html).toLowerCase();
  return (
    t.includes('http') ||
    t.includes('@') ||
    t.includes('linkedin') ||
    t.includes('github') ||
    t.includes('telefone') ||
    t.includes('cidade')
  );
}

function htmlHasOnlyAllowedTags(html: string): boolean {
  const s = String(html || '');
  const tags = s.match(/<\s*\/?\s*([a-zA-Z0-9]+)(\s+[^>]*)?>/g) || [];
  for (const raw of tags) {
    const m = raw.match(/<\s*\/?\s*([a-zA-Z0-9]+)/);
    if (!m) continue;
    const tag = m[1].toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return false;
  }
  return true;
}

function isSkillClean(skill: string): boolean {
  const s = String(skill || '').trim();
  if (!s) return false;
  if (s.length > 35) return false;
  if (/[0-9]/.test(s)) return false;
  if (/[\/:]/.test(s)) return false;
  if (/https?:\/\//i.test(s)) return false;
  if (/@/.test(s)) return false;
  if (/[-–—]/.test(s)) return false;
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 4) return false;
  return true;
}

function normalizeHref(raw: string): string {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

function isEmailValid(raw: string): boolean {
  const s = String(raw || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isPhoneDigitsOnly(raw: string): boolean {
  const s = String(raw || '').trim();
  return s === '' || /^\d+$/.test(s);
}

export function validateCVAutofillResult(raw: unknown): CVAutofillValidationResult {
  const issues: string[] = [];
  const r = raw as Partial<CVAutofillResult>;

  if ((r as any)?.applyMode !== 'replace') {
    issues.push('applyMode ausente ou diferente de "replace" (obrigatório).');
  }

  const patch = (r && typeof r === 'object' ? (r as any).patch : null) as any;
  if (!patch || typeof patch !== 'object') {
    issues.push('Campo patch ausente ou inválido.');
  }

  const personal = (patch && typeof patch === 'object' ? (patch as any).personal : null) as any;
  const personalOk = Boolean(
    personal &&
      typeof personal === 'object' &&
      asString(personal.fullName) !== '' &&
      (asString(personal.email) === '' || isEmailValid(personal.email)) &&
      isPhoneDigitsOnly(personal.phone)
  );

  if (!personal || typeof personal !== 'object') issues.push('Campo personal ausente ou inválido.');

  // Required keys inside patch.personal, even if empty.
  if (personal && typeof personal === 'object') {
    for (const k of ['fullName', 'role', 'email', 'phone', 'location', 'linkedin', 'github', 'website'] as const) {
      if (!(k in personal)) issues.push(`patch.personal.${k} ausente (obrigatório).`);
    }
  }

  const summaryHtml = asString(patch?.summaryHtml);
  if (summaryHtml && hasForbiddenInSummary(summaryHtml)) {
    issues.push('summaryHtml contém contatos/links (proibido).');
  }
  if (summaryHtml && !htmlHasOnlyAllowedTags(summaryHtml)) {
    issues.push('summaryHtml contém tags HTML não permitidas.');
  }

  const skills = asArray<string>(patch?.skills);
  const badSkills = skills.filter((s) => !isSkillClean(String(s || '')));
  if (badSkills.length > 0) {
    issues.push(`skills contém itens inválidos (${Math.min(5, badSkills.length)}+).`);
  }

  const checkItems = (arr: any[], label: string) => {
    for (const it of arr) {
      const title = asString(it?.title);
      const date = asString(it?.date);
      const html = asString(it?.descriptionHtml);
      if (!title) issues.push(`${label} tem item sem title.`);
      if (!date && label === 'experience') issues.push('experience tem item sem date.');
      if (html && !htmlHasOnlyAllowedTags(html)) issues.push(`${label} contém tags HTML não permitidas.`);
    }
  };

  checkItems(asArray<any>(patch?.experience), 'experience');
  checkItems(asArray<any>(patch?.education), 'education');
  checkItems(asArray<any>(patch?.projects), 'projects');

  // Link normalization check (not hard-fail, but warn)
  if (personal && typeof personal === 'object') {
    for (const k of ['linkedin', 'github', 'website'] as const) {
      const v = asString(personal[k]);
      if (v && !/^https?:\/\//i.test(v)) {
        issues.push(`personal.${k} não está normalizado com https://`);
      }
    }
  }

  // Confidence gating
  const confidence = (r as any)?.confidence || {};
  const conf = {
    personal: clamp01to100(confidence.personal),
    summary: clamp01to100(confidence.summary),
    skills: clamp01to100(confidence.skills),
    experience: clamp01to100(confidence.experience),
    education: clamp01to100(confidence.education),
    courses: clamp01to100(confidence.courses),
    projects: clamp01to100(confidence.projects),
  };

  // Ensure confidence in schema is 0..100 (warn only).
  for (const [k, v] of Object.entries(conf)) {
    if (v < 0 || v > 100) issues.push(`confidence.${k} fora do intervalo 0..100.`);
  }

  const confidenceOk =
    conf.personal >= 50 &&
    (conf.experience >= 35 || conf.education >= 35 || conf.projects >= 35) &&
    (conf.summary >= 30 || summaryHtml === '');

  if (!confidenceOk) {
    issues.push('Baixa confiança para aplicar preenchimento automático.');
  }

  // Extra: ensure hyperlinks are safe-ish
  if (personal && typeof personal === 'object') {
    const safeNormalize = (v: string) => {
      const href = normalizeHref(v);
      if (/^javascript:/i.test(href)) return '';
      return href;
    };
    if (asString(personal.linkedin)) personal.linkedin = safeNormalize(personal.linkedin);
    if (asString(personal.github)) personal.github = safeNormalize(personal.github);
    if (asString(personal.website)) personal.website = safeNormalize(personal.website);
  }

  const ok = issues.length === 0;
  return { ok, issues, personalOk, confidenceOk };
}
