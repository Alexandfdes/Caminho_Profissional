import React, { useMemo } from 'react';
import { EditableCV, Section, ReferenceItem, ResumeItem } from '../../types/cv';
import { Mail, Phone, MapPin, Linkedin, Globe, Github } from 'lucide-react';
import { sortSectionItemsByDateDesc } from '../../utils/cvDateSort';

interface TemplateProps {
    data: EditableCV;
}

// ============== CONSTANTS & HEURISTICS ==============
// A4 Height approx 1123px (96dpi) or 297mm. 
// We use a safe content height to trigger breaks.
// Assumes ~3.7px per mm. 297mm * 3.7 = ~1100px.
// Safety margin for padding: ~50px top/bottom.
const PAGE_HEIGHT_PX = 960; // Reduced to ensure safe bottom margin (was 1050)

// Heuristic height estimates in pixels
const H_BASE_MARGIN = 24; // Standard margin-bottom for sections
const H_SECTION_TITLE = 45; // Title + Divider + margin
const H_ITEM_TITLE = 24;
const H_ITEM_SUBTITLE = 22;
const H_LINE_TEXT = 20; // Increased line height estimate for safety

const estimateTextHeight = (htmlContent: string | undefined): number => {
    if (!htmlContent) return 0;
    // Strip tags to count text length approx
    const text = htmlContent.replace(/<[^>]+>/g, '');
    const lines = Math.ceil(text.length / 85); // Conservatively assume 85 chars per line
    return lines * H_LINE_TEXT;
};

const estimateItemHeight = (item: ResumeItem | ReferenceItem): number => {
    let h = 0;
    if ('title' in item && item.title) h += H_ITEM_TITLE;
    if ('subtitle' in item && item.subtitle) h += H_ITEM_SUBTITLE;
    if ('description' in item) h += estimateTextHeight(item.description);
    return h + 12; // + spacing
};

const estimateListHeight = (list: string[]): number => {
    // Grid of 2 cols usually, so count/2 * line height
    const rows = Math.ceil(list.length / 2);
    return rows * 20; // 20px per row
};

// ============== PAGINATION LOGIC ==============
interface PageData {
    id: number;
    sidebarSections: Section[];
    mainSections: Section[];
    isFirstPage: boolean;
}

const paginateCV = (data: EditableCV): PageData[] => {
    const pages: PageData[] = [];

    // Initial Page
    let currentPageIdx = 0;
    let currentMainH = 0;
    let currentSideH = 0;

    // Helper to get or create page
    const getPage = (idx: number): PageData => {
        if (!pages[idx]) {
            pages[idx] = {
                id: idx,
                sidebarSections: [],
                mainSections: [],
                isFirstPage: idx === 0
            };
        }
        return pages[idx];
    };

    // --- SIDEBAR --- 
    // Usually Sidebar content (Personal, Skills) is short enough for Page 1.
    // However, if Skills are huge, we might need to split. 
    // For this implementation, we put Header in Page 1, and flow Skills.

    // Header Height (Name + Contacts) estimated
    const headerH = 250;
    currentSideH += headerH;

    const skills = data.sections.find(s => s.id === 'skills');
    if (skills && skills.visible) {
        // Simple heuristic: if skills fit, put in page 1.
        // If not, put overflow in page 2 sidebar? 
        // Sidebar usually doesn't flow well visually in this design.
        // We'll force Skills to Page 1 for now, assuming they aren't massive.
        getPage(0).sidebarSections.push(skills);
    }

    // --- MAIN CONTENT ---
    const mainSections = data.sections.filter(s => s.id !== 'personal' && s.id !== 'skills');

    mainSections.forEach(section => {
        if (!section.visible) return;

        // Estimate Section Header Cost
        const headerCost = H_SECTION_TITLE + H_BASE_MARGIN;

        if (section.type === 'repeatable_group' && section.items && section.items.length > 0) {
            const sortedItems = (section.sortMode || 'auto') === 'auto'
                ? sortSectionItemsByDateDesc(section.items)
                : section.items;

            let remainingItems = [...sortedItems];

            // Check if we need to start a section on current page
            // If we are near bottom, maybe start fresh?
            if (currentMainH + headerCost > PAGE_HEIGHT_PX) {
                currentPageIdx++;
                currentMainH = 0;
            }

            // Create new "Partial Section" for this page
            let currentSectionChunk: Section = { ...section, items: [] };
            let isSectionAdded = false;

            while (remainingItems.length > 0) {
                const item = remainingItems[0];
                const itemH = estimateItemHeight(item as ResumeItem);

                // Check fit
                const cost = (!isSectionAdded ? headerCost : 0) + itemH;

                if (currentMainH + cost <= PAGE_HEIGHT_PX) {
                    // Fits
                    currentSectionChunk.items!.push(item);
                    currentMainH += itemH + (!isSectionAdded ? headerCost : 0);
                    isSectionAdded = true;
                    remainingItems.shift(); // Remove processed
                } else {
                    // Won't fit. 
                    // If current section chunk has items, push it to current page.
                    if (currentSectionChunk.items!.length > 0) {
                        getPage(currentPageIdx).mainSections.push(currentSectionChunk);
                    }

                    // Move to Next Page
                    currentPageIdx++;
                    currentMainH = 0;

                    // Reset chunk for new page
                    currentSectionChunk = { ...section, items: [] };
                    isSectionAdded = false;
                    // Loop continues with same item to try fitting in new page
                }
            }

            // Push any remainder
            if (currentSectionChunk.items!.length > 0) {
                getPage(currentPageIdx).mainSections.push(currentSectionChunk);
            }

        } else if (section.type === 'richtext' && section.content) {
            // For rich text, splitting is hard. treat as monolithic block.
            const h = estimateTextHeight(section.content) + headerCost;
            if (currentMainH + h > PAGE_HEIGHT_PX && currentMainH > 100) { // If > 100px used, break
                currentPageIdx++;
                currentMainH = 0;
            }
            getPage(currentPageIdx).mainSections.push(section);
            currentMainH += h;
        } else if (section.type === 'list' && section.list) {
            // Treat list as monolithic for simplicity for now
            const h = estimateListHeight(section.list) + headerCost;
            if (currentMainH + h > PAGE_HEIGHT_PX && currentMainH > 100) {
                currentPageIdx++;
                currentMainH = 0;
            }
            getPage(currentPageIdx).mainSections.push(section);
            currentMainH += h;
        }
    });

    return pages;
};

export const TemplateDefault: React.FC<TemplateProps> = ({ data }) => {
    const pages = useMemo(() => paginateCV(data), [data]);
    const personal = data.sections.find(s => s.id === 'personal');

    // --- HELPERS (reused) ---
    const normalizeHref = (raw: string) => {
        const s = String(raw || '').trim();
        if (!s) return '';
        if (/^https?:\/\//i.test(s)) return s;
        return `https://${s}`;
    };

    const formatUrlDisplay = (raw: string) => {
        const s = String(raw || '').trim();
        if (!s) return '';
        const withScheme = normalizeHref(s);
        try {
            const u = new URL(withScheme);
            const host = u.host.replace(/^www\./i, '');
            const path = (u.pathname || '/').replace(/\/$/, '');
            const display = `${host}${path && path !== '/' ? path : ''}`;
            return display.length > 34 ? `${display.slice(0, 26)}…${display.slice(-7)}` : display;
        } catch {
            const cleaned = s.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '');
            return cleaned.length > 34 ? `${cleaned.slice(0, 26)}…${cleaned.slice(-7)}` : cleaned;
        }
    };

    const normalizePhoneRaw = (raw: string) => {
        const digits = String(raw || '').replace(/\D/g, '');
        if (!digits) return '';
        if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
            return digits.slice(2);
        }
        return digits;
    };

    const isValidPhoneBR = (raw: string) => {
        const digits = normalizePhoneRaw(raw);
        return digits.length === 10 || digits.length === 11;
    };

    const formatPhoneBR = (raw: string) => {
        const digits = normalizePhoneRaw(raw);
        if (!digits) return '';
        if (!isValidPhoneBR(digits)) return '';
        const ddd = digits.slice(0, 2);
        const rest = digits.slice(2);
        if (rest.length === 8) {
            return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
        }
        return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
    };

    const renderEmailWithSoftBreaks = (raw: string) => {
        const email = String(raw || '').trim();
        if (!email) return null;
        const at = email.indexOf('@');
        if (at === -1) return email;
        const ZWSP = '\u200B';
        const user = email.slice(0, at);
        const domain = email.slice(at + 1);
        const userSafe = user.replaceAll('.', `.${ZWSP}`).replaceAll('_', `_${ZWSP}`).replaceAll('-', `-${ZWSP}`);
        const domainSafe = domain.replaceAll('.', `${ZWSP}.`);
        return <>{userSafe}{'@'}{ZWSP}{domainSafe}</>;
    };

    const toTitleCaseIfAllCaps = (value: string) => {
        const s = String(value || '').trim();
        if (!s) return s;
        const hasLower = /[a-zà-ÿ]/.test(s);
        const hasUpper = /[A-ZÀ-ß]/.test(s);
        if (hasLower || !hasUpper) return s;
        const lowerWords = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
        return s.toLowerCase().split(/\s+/).map((w, idx) => {
            if (idx > 0 && lowerWords.has(w)) return w;
            return w.charAt(0).toUpperCase() + w.slice(1);
        }).join(' ');
    };

    const hasTitle = (t?: string) => Boolean(String(t || '').trim());
    const isCoursesSection = (title: string) => /cursos|certifica/i.test(title);
    const isCompactRepeatable = (section: Section) => section.type === 'repeatable_group' && isCoursesSection(section.title);

    const cleanDate = (dateStr?: string) => {
        if (!dateStr) return '';
        let s = String(dateStr).trim();
        // Remove invisible chars
        s = s.replace(/[\u200B-\u200D\uFEFF]/g, '');
        // Remove extra spaces everywhere
        s = s.replace(/\s+/g, ' ');
        // Fix "0 9" -> "09" (digits with space between)
        s = s.replace(/(\d)\s+(\d)/g, '$1$2');
        // Fix " / " or "/ " or " /" -> "/"
        s = s.replace(/\s*\/\s*/g, '/');
        // Fix "20 25" -> "2025" (year split)
        s = s.replace(/\b(19|20)\s*(\d{2})\b/g, '$1$2');
        // Fix " - " -> " - " (normalize dash spacing)
        s = s.replace(/\s*[-–—]\s*/g, ' - ');
        // Trim again
        return s.trim();
    };

    // --- RENDERERS ---
    const renderSidebarContent = (sections: Section[], isFirstPage: boolean) => {
        return (
            <>
                {isFirstPage && (
                    <>
                        {/* Teal header badge */}
                        <div className="cv-resume-badge">
                            <h1 className="cv-resume-name break-words">
                                {toTitleCaseIfAllCaps(personal?.fields?.fullName || 'Seu Nome')}
                            </h1>
                            <p className="cv-resume-role mt-2 break-words">
                                {personal?.fields?.role || 'Profissional'}
                            </p>
                        </div>
                        {/* Sep */}
                        <div className="cv-resume-badge-sep" />

                        <div className="mt-6">
                            {/* Dados pessoais */}
                            <div className="resume-sidebar-block mb-5">
                                <h3 className="cv-resume-sidebar-title">Dados pessoais</h3>
                                <div className="cv-resume-section-divider" />
                                <div className="cv-resume-section-accent" />

                                <div className="cv-resume-contacts mt-4 space-y-3 text-[color:var(--resume-text)]">
                                    {personal?.fields?.email && (
                                        <div className="resume-contact-item flex items-start gap-2 min-w-0">
                                            <Mail className="w-3.5 h-3.5 text-[color:var(--resume-muted)] mt-0.5 shrink-0" />
                                            <a className="cv-doc-link cv-resume-link cv-doc-contact" href={`mailto:${personal.fields.email}`} title={personal.fields.email}>
                                                {renderEmailWithSoftBreaks(personal.fields.email)}
                                            </a>
                                        </div>
                                    )}
                                    {personal?.fields?.phone && isValidPhoneBR(personal.fields.phone) && (
                                        <div className="resume-contact-item flex items-start gap-2 min-w-0">
                                            <Phone className="w-3.5 h-3.5 text-[color:var(--resume-muted)] mt-0.5 shrink-0" />
                                            <span className="cv-doc-link cv-doc-contact" title={personal.fields.phone}>{formatPhoneBR(personal.fields.phone)}</span>
                                        </div>
                                    )}
                                    {personal?.fields?.location && (
                                        <div className="resume-contact-item flex items-start gap-2 min-w-0">
                                            <MapPin className="w-3.5 h-3.5 text-[color:var(--resume-muted)] mt-0.5 shrink-0" />
                                            <span className="break-words">{personal.fields.location}</span>
                                        </div>
                                    )}
                                    {personal?.fields?.linkedin && (
                                        <div className="resume-contact-item flex items-start gap-2 min-w-0">
                                            <Linkedin className="w-3.5 h-3.5 text-[color:var(--resume-muted)] mt-0.5 shrink-0" />
                                            <a className="cv-doc-link cv-resume-link cv-doc-contact" href={normalizeHref(personal.fields.linkedin)} target="_blank" rel="noreferrer" title={personal.fields.linkedin}>
                                                {formatUrlDisplay(personal.fields.linkedin)}
                                            </a>
                                        </div>
                                    )}
                                    {(personal as any)?.fields?.github && (
                                        <div className="resume-contact-item flex items-start gap-2 min-w-0">
                                            <Github className="w-3.5 h-3.5 text-[color:var(--resume-muted)] mt-0.5 shrink-0" />
                                            <a className="cv-doc-link cv-resume-link cv-doc-contact" href={normalizeHref((personal as any).fields.github)} target="_blank" rel="noreferrer" title={(personal as any).fields.github}>
                                                {formatUrlDisplay((personal as any).fields.github)}
                                            </a>
                                        </div>
                                    )}
                                    {(personal as any)?.fields?.website && (
                                        <div className="resume-contact-item flex items-start gap-2 min-w-0">
                                            <Globe className="w-3.5 h-3.5 text-[color:var(--resume-muted)] mt-0.5 shrink-0" />
                                            <a className="cv-doc-link cv-resume-link cv-doc-contact" href={normalizeHref((personal as any).fields.website)} target="_blank" rel="noreferrer" title={(personal as any).fields.website}>
                                                {formatUrlDisplay((personal as any).fields.website)}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Render assigned sidebar sections (like Skills) */}
                {sections.map(section => {
                    if (section.id === 'skills' && section.visible && section.list && section.list.length > 0) {
                        return (
                            <div key={section.id} className="mt-2 mb-5">
                                <h3 className="cv-resume-sidebar-title">Competências</h3>
                                <div className="cv-resume-section-divider" />
                                <div className="cv-resume-section-accent" />
                                <ul className="cv-resume-skills-list mt-4 text-[13px] text-[color:var(--resume-text)] space-y-2">
                                    {section.list.map((skill, index) => (
                                        <li key={index} className="cv-resume-skills-item leading-snug break-words">{skill}</li>
                                    ))}
                                </ul>
                            </div>
                        );
                    }
                    return null;
                })}
            </>
        );
    };

    const renderSection = (section: Section) => {
        const SectionHeader = ({ title }: { title: string }) => (
            <div className="mb-2">
                <h2 className="cv-resume-section-title">{title}</h2>
                <div className="cv-resume-section-divider" />
                <div className="cv-resume-section-accent" />
            </div>
        );

        switch (section.type) {
            case 'richtext':
                if (!section.content) return null;
                return (
                    <section key={section.id} className="resume-section mb-6">
                        <SectionHeader title={section.title} />
                        <div className="max-w-none prose prose-sm prose-p:my-2 prose-ul:my-2 prose-li:my-1 prose-p:text-[color:var(--resume-text)] prose-li:text-[color:var(--resume-text)] prose-strong:text-[color:var(--resume-text)] prose-a:text-[color:var(--resume-text)]" dangerouslySetInnerHTML={{ __html: section.content }} />
                    </section>
                );

            case 'repeatable_group':
                if (!section.items || section.items.length === 0) return null;

                // Sorting handled in pagination, but check here just in case
                const items = section.items;

                if (isCompactRepeatable(section)) {
                    return (
                        <section key={section.id} className="resume-section mb-6">
                            <SectionHeader title={section.title} />
                            <div className="space-y-3">
                                {items.map((item) => (
                                    <div key={item.id} className="resume-course-item flex items-baseline justify-between gap-3">
                                        <div className="min-w-0 text-[13px] font-semibold text-[color:var(--resume-text)] leading-snug break-words">
                                            {item.title}
                                        </div>
                                        {hasTitle(item.date) && (
                                            <div className="text-[12px] text-[color:var(--resume-muted)] font-medium shrink-0">
                                                {cleanDate(item.date)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    );
                }

                return (
                    <section key={section.id} className="resume-section mb-7">
                        <SectionHeader title={section.title} />
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className={section.id === 'experience' ? 'resume-experience-item' : section.id === 'education' ? 'resume-education-item' : 'resume-section-item'}>
                                    <div className="flex items-baseline justify-between gap-3 mb-1">
                                        <h3 className="min-w-0 font-semibold text-[14px] text-[color:var(--resume-text)] leading-snug break-words">
                                            {item.title}
                                        </h3>
                                        {hasTitle(item.date) && <span className="text-[12px] text-[color:var(--resume-muted)] font-medium shrink-0">{cleanDate(item.date)}</span>}
                                    </div>
                                    {hasTitle(item.subtitle) && <div className="text-[color:var(--resume-muted)] font-medium text-[13px] mb-2 break-words">{item.subtitle}</div>}
                                    {item.description && (
                                        <div className="max-w-none prose prose-sm prose-p:my-2 prose-ul:my-2 prose-li:my-1 prose-p:text-[color:var(--resume-text)] prose-li:text-[color:var(--resume-text)] prose-strong:text-[color:var(--resume-text)] prose-a:text-[color:var(--resume-text)]" dangerouslySetInnerHTML={{ __html: item.description }} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                );

            case 'list':
                if (!section.list || section.list.length === 0) return null;
                return (
                    <section key={section.id} className="resume-section mb-7">
                        <SectionHeader title={section.title} />
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[13px] text-[color:var(--resume-text)]">
                            {section.list.map((item, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-[color:var(--resume-brand)] opacity-55 shrink-0" />
                                    <span className="leading-[1.6] break-words">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                );
            default: return null;
        }
    };

    return (
        <div className="flex flex-col gap-[3rem]">
            {pages.map((page) => (
                <div
                    key={page.id}
                    className="cv-resume-root resume-page w-full min-h-[297mm] flex flex-row shadow-sm bg-white pb-16"
                    style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact', height: '297mm', overflow: 'hidden' }}
                >
                    {/* Sidebar */}
                    <aside className="cv-resume-sidebar w-[32%] shrink-0">
                        {renderSidebarContent(page.sidebarSections, page.isFirstPage)}
                    </aside>

                    {/* Main Content */}
                    <main className="cv-resume-main flex-1">
                        {page.mainSections.map(renderSection)}
                    </main>
                </div>
            ))}
        </div>
    );
};
