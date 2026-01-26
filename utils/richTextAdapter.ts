export type RichTextValue = string | { html?: unknown } | { content?: unknown } | null | undefined;

function safeJsonParse(value: string): any {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeEmptyHtml(value: string): string {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  if (trimmed === '<p></p>' || trimmed === '<p><br></p>') return '';
  return trimmed;
}

function looksLikeHtmlWrapperJsonString(raw: string): boolean {
  const s = (raw || '').trim();
  if (!s.startsWith('{') || !s.endsWith('}')) return false;
  return /"html"\s*:/.test(s);
}

export function extractHtmlFromWrapper(value: unknown): string | null {
  if (!value) return null;

  // Object wrapper: { html: "<p>..</p>" }
  if (typeof value === 'object') {
    const maybeHtml = (value as any)?.html;
    if (typeof maybeHtml === 'string') return normalizeEmptyHtml(maybeHtml);

    const maybeContent = (value as any)?.content;
    if (typeof maybeContent === 'string') return normalizeEmptyHtml(maybeContent);

    return null;
  }

  // JSON string wrapper: "{\"html\":\"<p>..</p>\"}"
  if (typeof value === 'string' && looksLikeHtmlWrapperJsonString(value)) {
    const parsed = safeJsonParse(value);
    const maybeHtml = parsed?.html;
    if (typeof maybeHtml === 'string') return normalizeEmptyHtml(maybeHtml);
  }

  return null;
}

/**
 * Normalizes any incoming rich-text value into an HTML string.
 *
 * Prevents leakage of wrapper objects like {"html":"..."} into TipTap.
 */
export function normalizeRichTextHtml(value: unknown): string {
  if (value == null) return '';

  const fromWrapper = extractHtmlFromWrapper(value);
  if (typeof fromWrapper === 'string') return fromWrapper;

  if (typeof value === 'string') return normalizeEmptyHtml(value);

  // Last resort: avoid rendering [object Object].
  try {
    return normalizeEmptyHtml(String(value));
  } catch {
    return '';
  }
}

export function isRichTextEmpty(html: string): boolean {
  const s = normalizeEmptyHtml(html);
  if (!s) return true;

  // Strip tags and non-breaking spaces.
  const text = s
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return text.length === 0;
}
