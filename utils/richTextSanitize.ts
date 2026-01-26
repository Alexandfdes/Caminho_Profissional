import DOMPurify from 'dompurify';

const ALLOWED_TAGS = ['p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'a'];
const ALLOWED_ATTR = ['href', 'target', 'rel'];

function ensureSafeLinks(): void {
  // Hook is global to the DOMPurify instance; register once.
  // In Vite/React this module is cached, so this runs once.
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if ((node as Element).tagName?.toLowerCase?.() !== 'a') return;

    const el = node as HTMLAnchorElement;
    const href = el.getAttribute('href') || '';

    // Drop unsafe protocols.
    if (/^\s*(javascript:|data:)/i.test(href)) {
      el.removeAttribute('href');
    }

    // Force safe rel when target is _blank.
    const target = el.getAttribute('target');
    if (target === '_blank') {
      const rel = (el.getAttribute('rel') || '').toLowerCase();
      const parts = new Set(rel.split(/\s+/).filter(Boolean));
      parts.add('noopener');
      parts.add('noreferrer');
      el.setAttribute('rel', Array.from(parts).join(' '));
    }
  });
}

let hooksReady = false;
function initHooksOnce(): void {
  if (hooksReady) return;
  ensureSafeLinks();
  hooksReady = true;
}

export function sanitizeRichTextHtml(html: string): string {
  initHooksOnce();

  const cleaned = DOMPurify.sanitize(String(html || ''), {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Be conservative.
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['style', 'onerror', 'onclick', 'onload'],
    KEEP_CONTENT: false,
  });

  return String(cleaned || '').trim();
}

export function stripHtmlToText(html: string): string {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?p[^>]*>/gi, '\n')
    .replace(/<\/?li[^>]*>/gi, '\n- ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/[\t\r]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
