export type DateSortKey = number;

const MONTHS: Record<string, number> = {
    jan: 1,
    janeiro: 1,
    fev: 2,
    fevereiro: 2,
    mar: 3,
    março: 3,
    marco: 3,
    abr: 4,
    abril: 4,
    mai: 5,
    maio: 5,
    jun: 6,
    junho: 6,
    jul: 7,
    julho: 7,
    ago: 8,
    agosto: 8,
    set: 9,
    setembro: 9,
    out: 10,
    outubro: 10,
    nov: 11,
    novembro: 11,
    dez: 12,
    dezembro: 12,
};

function isCurrentToken(value: string): boolean {
    return /(atual|presente|current|present|cursando|em\s+andamento|andamento)/i.test(value);
}

function clampMonth(month: number): number {
    if (!Number.isFinite(month)) return 12;
    return Math.min(12, Math.max(1, month));
}

function toUtcMs(year: number, month: number): number {
    const y = Number(year);
    const m = clampMonth(Number(month));
    if (!Number.isFinite(y) || y < 1900 || y > 2100) return Number.NEGATIVE_INFINITY;
    // Use end-of-month-ish ordering by picking the first day of the month in UTC.
    return Date.UTC(y, m - 1, 1);
}

function parseMonthYearToken(token: string): number {
    const s = token.trim().toLowerCase();
    if (!s) return Number.NEGATIVE_INFINITY;
    if (isCurrentToken(s)) return Number.POSITIVE_INFINITY;

    // mm/yyyy or m/yyyy
    const mmYyyy = s.match(/\b(0?[1-9]|1[0-2])\s*[\/.\-]\s*((19|20)\d{2})\b/);
    if (mmYyyy) {
        const month = Number(mmYyyy[1]);
        const year = Number(mmYyyy[2]);
        return toUtcMs(year, month);
    }

    // yyyy
    const yyyy = s.match(/\b((19|20)\d{2})\b/);
    if (yyyy) {
        const year = Number(yyyy[1]);
        return toUtcMs(year, 12);
    }

    // "MMM yyyy" (pt/short)
    const mmmYyyy = s.match(/\b([a-zçãáéíóú]+)\.?\s+((19|20)\d{2})\b/);
    if (mmmYyyy) {
        const monthName = mmmYyyy[1];
        const year = Number(mmmYyyy[2]);
        const month = MONTHS[monthName] ?? MONTHS[monthName.slice(0, 3)] ?? 12;
        return toUtcMs(year, month);
    }

    return Number.NEGATIVE_INFINITY;
}

/**
 * Produces a numeric sort key from a CV date string.
 *
 * Rules:
 * - Ranges use the END date (e.g. "01/2022 a 03/2024" -> 03/2024)
 * - "Atual"/"Presente"/"Cursando" are treated as most recent
 * - Unparseable values sort last
 */
export function getCvDateSortKey(raw: string | undefined | null): DateSortKey {
    const s = String(raw || '').trim();
    if (!s) return Number.NEGATIVE_INFINITY;
    if (isCurrentToken(s)) return Number.POSITIVE_INFINITY;

    // Common separators for ranges
    const parts = s.split(/\s*(?:-|—|–|a|até|to)\s*/i).map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
        const last = parts[parts.length - 1];
        const key = parseMonthYearToken(last);
        if (key !== Number.NEGATIVE_INFINITY) return key;
    }

    // Fallback: try whole string
    return parseMonthYearToken(s);
}

export function sortSectionItemsByDateDesc<T extends Record<string, any>>(items: T[]): T[] {
    return [...items].sort((a, b) => {
        const ka = getCvDateSortKey((a as any)?.date);
        const kb = getCvDateSortKey((b as any)?.date);
        if (ka === kb) return 0;
        return kb - ka;
    });
}
