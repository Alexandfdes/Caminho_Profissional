import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, Download, Sparkles, Layout, Eye, MonitorPlay, Upload } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useResumeStore } from '../stores/resumeStore';
import { CVForm } from './Editor/CVForm';
import { CVPreview } from './Preview/CVPreview';
import { CVAnalysis } from '../types/cv';
import { normalizeParsedResume } from '../utils/resumeUtils';
import { parseCVFromAnalysis } from '../services/cvEnhancementService';
import { clsx } from 'clsx';
import { parserService } from '../services/parserService';
import { EditableCV } from '../types/cv';
import { pdfParserService } from '../services/pdfParserService';
import { parseResumeText } from '../utils/cvParser';
import { buildEditableCVFromCVData } from '../utils/editableCvImport';
import { autofillCVWithAI } from '../services/geminiService';
import { validateCVAutofillResult } from '../utils/cvAutofillValidation';
import { mapAutofillToEditableCV } from '../utils/cvAutofillToEditableCV';
import { CVAutofillResult } from '../types/cvAutofill';
import { CVChatAssistantDrawer } from './CVChatAssistantDrawer';
import { MessageCircle } from 'lucide-react';

interface CVEditorStepProps {
    analysis?: CVAnalysis;
    onBack: () => void;
    userId?: string;
    originalFileName?: string;
    cvContent?: string | string[];
}

export const CVEditorStep: React.FC<CVEditorStepProps> = ({ analysis, onBack, userId }) => {
    const { cvData, setCVData, setSuggestions, isPristine, updateSection, updateSectionItem, addSectionItem } = useResumeStore();
    const componentRef = useRef<HTMLDivElement>(null);
    const [scrolled, setScrolled] = useState(false);
    const [fatalError, setFatalError] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');
    const previewStageRef = useRef<HTMLDivElement | null>(null);

    const [autofillDecisionOpen, setAutofillDecisionOpen] = useState(false);
    const [autofillDecisionIssues, setAutofillDecisionIssues] = useState<string[]>([]);
    const [pendingAutofill, setPendingAutofill] = useState<CVAutofillResult | null>(null);

    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

    // 1. Initialize & Fetch Data
    useEffect(() => {
        console.log("CVEditorStep MOUNTED - AutoSync Version Active");
        const init = async () => {
            try {
                // A. Set Suggestions (always safe)
                if (analysis) {
                    setSuggestions(analysis);
                }

                // B. Check for Draft
                // In a real app, we'd get the ID from params. Using 'current' for demo.
                const resumeId = 'current';
                const draft = await parserService.getDraft(resumeId);

                // C. Fetch Parsed Data (from upload)
                // Use structured_cv from analysis if available, or fetch from service
                let parsedData = analysis?.structured_cv ? normalizeParsedResume(analysis.structured_cv) : null;

                if (!parsedData) {
                    const fetched = await parserService.getParsedResume(resumeId);
                    if (fetched) parsedData = normalizeParsedResume(fetched);
                }

                // D. Synchronization Logic (Auto-Sync)
                if (parsedData) {
                    // New upload available? Always prioritize it!
                    console.log("Auto-syncing new parsed data...");
                    setCVData(parsedData, true); // Set as pristine (source of truth)
                } else if (draft) {
                    // No new upload, but we have a draft.
                    console.log("Loading draft...");
                    setCVData(draft.data, false); // Not pristine because it's a draft
                }

            } catch (err) {
                console.error('Error initializing:', err);
                setFatalError('Erro ao carregar dados.');
            }
        };

        init();
    }, [analysis, setCVData, setSuggestions]); // Removed isPristine dependency to avoid loops

    // 2. Auto-Save Draft + single status indicator
    const saveDraftNow = async () => {
        if (!cvData) return;
        try {
            setSaveStatus('saving');
            await parserService.saveDraft('current', cvData);
            setSaveStatus('saved');
            setLastSavedAt(Date.now());
        } catch (e) {
            console.error('Error saving draft:', e);
            setSaveStatus('error');
        }
    };

    useEffect(() => {
        if (!cvData) return;
        if (isPristine) {
            setSaveStatus('saved');
            return;
        }

        setSaveStatus('saving');
        const saveTimer = setTimeout(() => {
            void saveDraftNow();
        }, 900);

        return () => clearTimeout(saveTimer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cvData, isPristine]);

    // Handle scroll effect for header
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toTitleCaseIfAllCaps = (value: string) => {
        const s = String(value || '').trim();
        if (!s) return s;

        const hasLower = /[a-zà-ÿ]/.test(s);
        const hasUpper = /[A-ZÀ-ß]/.test(s);
        if (hasLower || !hasUpper) return s;

        const lowerWords = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
        return s
            .toLowerCase()
            .split(/\s+/)
            .map((w, idx) => {
                if (idx > 0 && lowerWords.has(w)) return w;
                return w.charAt(0).toUpperCase() + w.slice(1);
            })
            .join(' ');
    };

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Curriculo_Profissional`,
    });

    if (fatalError) {
        return (
            <div className="min-h-screen cv-editor-theme flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-2 text-[color:var(--cv-text)]">Ops! Algo deu errado.</h2>
                    <p className="mb-4 text-[color:var(--cv-muted)]">{fatalError}</p>
                    <button onClick={onBack} className="text-[color:var(--cv-accent)] hover:underline">Voltar</button>
                </div>
            </div>
        );
    }

    const openUploadPicker = () => {
        setUploadError(null);
        fileInputRef.current?.click();
    };

    const makeBlankCVForImport = (current: EditableCV): EditableCV => {
        const blankSections = (current?.sections || []).map((s) => {
            if (s.type === 'personal') {
                return {
                    ...s,
                    fields: {
                        ...(s.fields || {}),
                        fullName: '',
                        role: '',
                        email: '',
                        phone: '',
                        location: '',
                        linkedin: '',
                        github: '',
                        website: '',
                    },
                    _meta: {},
                };
            }

            if (s.type === 'richtext') {
                return { ...s, content: '', _meta: {} };
            }

            if (s.type === 'list') {
                return { ...s, list: [], _meta: {} };
            }

            if (s.type === 'repeatable_group') {
                return { ...s, items: [], _meta: {} };
            }

            return { ...s, _meta: {} };
        });

        return {
            ...current,
            sections: blankSections,
            _parseWarnings: [],
            metadata: {
                template: current.metadata?.template || 'default',
                lastUpdated: new Date().toISOString(),
            },
        };
    };

    const handleUploadFile = async (file: File | null) => {
        if (!file) return;
        setIsUploading(true);
        setUploadError(null);
        try {
            // Import-only flow: extract text locally and fill the form. No analysis.
            const extractedText = await pdfParserService.extractTextFromPDF(file);

            if (import.meta.env.DEV) {
                const preview = String(extractedText || '').slice(0, 200).replace(/\s+/g, ' ').trim();
                console.log('[cv-upload] extractedText.length=', extractedText?.length ?? 0, 'preview=', preview);
            }

            const textLen = String(extractedText || '').trim().length;
            // Backend autofill contract uses <200 chars as "too short" for text-only extraction.
            const hasEnoughTextForAI = textLen >= 200;
            // Local parsing can still be attempted with less text.
            const hasEnoughTextForLocal = textLen >= 50;

            // Local parse fallback (only when we have usable text)
            const localEditable = hasEnoughTextForLocal
                ? buildEditableCVFromCVData(parseResumeText(extractedText))
                : null;

            // When applying import results, always replace existing content.
            const blankBase = makeBlankCVForImport(cvData);

            // Prevent old parsed data from overriding this import on next mount.
            localStorage.removeItem('analysis_current');

            // 1) Try AI autofill extraction (strict schema)
            // Try text first (faster), then with images if that fails
            let aiAutofill: CVAutofillResult | null = null;
            let lastAiError: string | null = null;
            try {
                // First try with text only (faster and more reliable)
                if (hasEnoughTextForAI) {
                    console.log('[cv-upload] Tentando extração com texto...');
                    try {
                        aiAutofill = await autofillCVWithAI({ text: extractedText, filename: file.name });
                    } catch (textErr: any) {
                        console.warn('[cv-upload] Text-only failed:', textErr?.message);
                    }
                }

                // If text-only failed or not enough text, try with images
                if (!aiAutofill) {
                    console.log('[cv-upload] Tentando extração com imagens...');
                    const images = await pdfParserService.convertPDFToImages(file, 2);
                    if (import.meta.env.DEV) {
                        console.log('[cv-upload] Imagens geradas:', images?.length ?? 0);
                    }
                    if (images && images.length > 0) {
                        try {
                            aiAutofill = await autofillCVWithAI({
                                text: extractedText || '',
                                images,
                                filename: file.name
                            });
                        } catch (imgErr: any) {
                            console.error('[cv-upload] Image extraction failed:', imgErr?.message);
                            lastAiError = imgErr?.message || 'Erro na extração por imagem';
                        }
                    }
                }
            } catch (aiErr: any) {
                // If AI is unavailable or user isn't authenticated, fall back to local parsing.
                console.warn('AI extract failed; falling back to local parse.', aiErr);
                lastAiError = aiErr?.message || 'Erro ao conectar com IA';
            }

            // 2) Apply AI result if it's valid; otherwise fall back to local parsing.
            let applied = false;
            if (aiAutofill) {
                console.log('[cv-upload] AI result:', JSON.stringify(aiAutofill, null, 2));
                const validation = validateCVAutofillResult(aiAutofill);
                // Import flow should not be blocked by the "decision modal".
                // If AI result is low-confidence/invalid, prefer local parsing (PDF text) instead.
                if (aiAutofill.ok && validation.ok) {
                    const next = mapAutofillToEditableCV(blankBase, aiAutofill);
                    console.log('[cv-upload] Mapped CV data:', JSON.stringify(next.sections, null, 2));
                    setSuggestions(null);
                    setCVData(next, true);
                    await parserService.saveDraft('current', next);
                    setSaveStatus('saved');
                    setLastSavedAt(Date.now());
                    applied = true;
                }
            }

            if (!applied) {
                if (!localEditable) {
                    const errorMsg = lastAiError
                        ? `Falha ao processar o currículo: ${lastAiError}`
                        : 'Não consegui extrair texto deste PDF. Tente um PDF com texto selecionável.';
                    throw new Error(errorMsg);
                }

                setSuggestions(null);
                const merged = {
                    ...blankBase,
                    ...localEditable,
                    metadata: {
                        template: 'default',
                        ...((blankBase.metadata as any) || {}),
                        ...((localEditable.metadata as any) || {})
                    }
                };
                // Prefer replacing current content even for local parsing.
                setCVData(merged, true);
                // Persist as draft (since we don't have structured_cv)
                await parserService.saveDraft('current', merged);
                setSaveStatus('saved');
                setLastSavedAt(Date.now());
            }
        } catch (err: any) {
            console.error('Upload/analyze error:', err);
            setUploadError(err?.message || 'Erro ao importar currículo. Tente novamente.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const applyPersonalOnlyFromPending = () => {
        if (!pendingAutofill) return;
        const personal = pendingAutofill.patch?.personal as any;
        if (!personal || typeof personal !== 'object') {
            setAutofillDecisionOpen(false);
            setPendingAutofill(null);
            return;
        }

        // Even for "contacts-only", keep the import semantics: clear everything first.
        const blankBase = makeBlankCVForImport(cvData);
        const next: EditableCV = {
            ...blankBase,
            sections: blankBase.sections.map((s) => {
                if (s.id !== 'personal') return s;
                return {
                    ...s,
                    fields: {
                        ...(s.fields || {}),
                        fullName: String(personal.fullName || ''),
                        role: String(personal.role || (s.fields?.role ?? '')),
                        email: String(personal.email || ''),
                        phone: String(personal.phone || ''),
                        location: String(personal.location || ''),
                        linkedin: String(personal.linkedin || ''),
                        github: String(personal.github || ''),
                        website: String(personal.website || ''),
                    },
                };
            }),
            _parseWarnings: Array.isArray(pendingAutofill.warnings) ? pendingAutofill.warnings : [],
        };
        setCVData(next, false);
        setAutofillDecisionOpen(false);
        setPendingAutofill(null);
    };

    const applyAssistantPatches = (patches: any[]) => {
        let applied = 0;
        let skipped = 0;

        const findSectionId = (type: string, titleHint?: string) => {
            if (type === 'list') {
                const skills = cvData.sections.find((s) => s.type === 'list' && /habil/i.test(s.title));
                return skills?.id;
            }
            if (type === 'repeatable_group') {
                if (titleHint === 'Educação') {
                    return cvData.sections.find((s) => s.type === 'repeatable_group' && /(forma|educa)/i.test(s.title))?.id;
                }
                if (titleHint === 'Experiência') {
                    return cvData.sections.find((s) => s.type === 'repeatable_group' && /experi/i.test(s.title))?.id;
                }
                return cvData.sections.find((s) => s.type === 'repeatable_group')?.id;
            }
            return cvData.sections.find((s) => s.type === type)?.id;
        };

        for (const p of patches || []) {
            try {
                if (p?.target === 'section' && p?.op === 'set_content') {
                    const sectionId = findSectionId(p.sectionType);
                    if (!sectionId || typeof p.content !== 'string') {
                        skipped++;
                        continue;
                    }
                    updateSection(sectionId, { content: p.content });
                    applied++;
                    continue;
                }

                if (p?.target === 'section' && p?.op === 'set_fields') {
                    const sectionId = findSectionId('personal');
                    if (!sectionId || !p.fields || typeof p.fields !== 'object') {
                        skipped++;
                        continue;
                    }
                    const current = cvData.sections.find((s) => s.id === sectionId)?.fields || {};
                    updateSection(sectionId, { fields: { ...current, ...p.fields } });
                    applied++;
                    continue;
                }

                if (p?.target === 'section' && p?.op === 'set_list') {
                    const sectionId = findSectionId('list');
                    const list = Array.isArray(p.list)
                        ? p.list.map((x: any) => String(x || '').trim()).filter(Boolean)
                        : null;
                    if (!sectionId || !list) {
                        skipped++;
                        continue;
                    }
                    updateSection(sectionId, { list });
                    applied++;
                    continue;
                }

                if (p?.target === 'item' && p?.sectionType === 'repeatable_group' && p?.op === 'set_item') {
                    const sectionId = findSectionId('repeatable_group', p.sectionTitleHint);
                    const idx = typeof p.index === 'number' ? p.index : -1;
                    if (!sectionId || idx < 0) {
                        skipped++;
                        continue;
                    }
                    const section = cvData.sections.find((s) => s.id === sectionId);
                    const itemId = section?.items?.[idx]?.id;
                    if (!itemId) {
                        skipped++;
                        continue;
                    }
                    updateSectionItem(sectionId, itemId, p.item || {});
                    applied++;
                    continue;
                }

                if (p?.target === 'item' && p?.sectionType === 'repeatable_group' && p?.op === 'add_item') {
                    const sectionId = findSectionId('repeatable_group', p.sectionTitleHint);
                    if (!sectionId) {
                        skipped++;
                        continue;
                    }
                    addSectionItem(sectionId, p.item || {});
                    applied++;
                    continue;
                }

                skipped++;
            } catch {
                skipped++;
            }
        }

        return { applied, skipped };
    };

    return (
        <div className="fixed inset-0 z-50 cv-editor-theme font-sans flex flex-col overflow-hidden">
            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            {autofillDecisionOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl rounded-2xl border border-[color:var(--cv-border-weak)] bg-[color:var(--cv-bg)] shadow-[var(--cv-shadow-1)]">
                        <div className="p-5 border-b border-[color:var(--cv-border-weak)]">
                            <h3 className="text-base font-bold text-[color:var(--cv-text)]">Não vou preencher automaticamente</h3>
                            <p className="text-xs text-[color:var(--cv-muted)] mt-1">
                                A IA retornou um resultado inválido/ambíguo (ou com baixa confiança). Você pode aplicar apenas os contatos, ou cancelar.
                            </p>
                        </div>

                        <div className="p-5">
                            <div className="text-sm font-semibold text-[color:var(--cv-text)] mb-2">Problemas detectados</div>
                            <ul className="text-sm text-[color:var(--cv-muted)] list-disc pl-5 space-y-1 max-h-56 overflow-auto">
                                {(autofillDecisionIssues || []).slice(0, 12).map((it, idx) => (
                                    <li key={idx}>{it}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="p-5 pt-0 flex flex-col sm:flex-row gap-3 justify-end">
                            <button
                                type="button"
                                className="px-4 py-2 rounded-xl border border-[color:var(--cv-border-weak)] bg-[var(--cv-surface-a85)] hover:bg-[color:var(--cv-surface)] text-[color:var(--cv-text)] font-semibold"
                                onClick={() => {
                                    setAutofillDecisionOpen(false);
                                    setPendingAutofill(null);
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 rounded-xl bg-[color:var(--cv-accent)] hover:bg-[color:var(--cv-accent-hover)] text-[#0B1220] font-bold"
                                onClick={applyPersonalOnlyFromPending}
                                disabled={!pendingAutofill}
                            >
                                Aplicar só contatos
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Sticky Header */}
            <header
                className={clsx(
                    "shrink-0 z-50 transition-all duration-300 border-b border-[color:var(--cv-border-weak)]",
                    scrolled
                        ? "bg-[var(--cv-bg-a90)] backdrop-blur-xl py-3 shadow-[var(--cv-shadow-1)]"
                        : "bg-[color:var(--cv-bg)] py-4"
                )}
            >
                <div className="w-full px-6 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={onBack}
                            className="group flex items-center gap-2 text-[color:var(--cv-muted)] hover:text-[color:var(--cv-text)] transition-colors"
                        >
                            <div className="p-2 rounded-full group-hover:bg-white/5 transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium hidden sm:block">Voltar</span>
                        </button>

                        <div className="h-6 w-px bg-[color:var(--cv-border-weak)] hidden sm:block" />

                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[var(--cv-accent-a18)] border border-[color:var(--cv-border-weak)]">
                                <Sparkles className="w-5 h-5 text-[color:var(--cv-accent)]" />
                            </div>
                            <div>
                                <h1 className="font-bold text-lg leading-tight text-[color:var(--cv-text)]">Editor Profissional</h1>
                                <p className="text-xs font-medium text-[color:var(--cv-muted)]">Alta performance</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--cv-surface-a85)] border border-[color:var(--cv-border-weak)] shadow-[var(--cv-shadow-1)]">
                            <Layout className="w-4 h-4 text-[color:var(--cv-muted)]" />
                            <span className="text-xs font-medium text-[color:var(--cv-muted)]">Template: <span className="text-[color:var(--cv-text)]">Moderno</span></span>
                        </div>

                        <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--cv-surface-a85)] border border-[color:var(--cv-border-weak)] shadow-[var(--cv-shadow-1)]">
                            <MonitorPlay className="w-4 h-4 text-[color:var(--cv-muted)]" />
                            {saveStatus === 'saving' && (
                                <span className="text-[11px] font-semibold text-[color:var(--cv-muted)]">Salvando…</span>
                            )}
                            {saveStatus === 'saved' && (
                                <span
                                    className="text-[11px] font-semibold text-[color:var(--cv-muted)]"
                                    title={lastSavedAt ? `Salvo às ${new Date(lastSavedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Salvo'}
                                >
                                    Salvo
                                </span>
                            )}
                            {saveStatus === 'error' && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-semibold text-rose-200">Erro ao salvar</span>
                                    <button
                                        type="button"
                                        onClick={() => void saveDraftNow()}
                                        className="text-xs font-bold text-[color:var(--cv-accent)] hover:text-[color:var(--cv-accent-hover)]"
                                    >
                                        Tentar novamente
                                    </button>
                                </div>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf,.pdf"
                            className="hidden"
                            onChange={(e) => handleUploadFile(e.target.files?.[0] ?? null)}
                        />

                        <button
                            onClick={openUploadPicker}
                            disabled={isUploading}
                            className={clsx(
                                "group relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold border border-[color:var(--cv-border-weak)] shadow-[var(--cv-shadow-1)] transition-colors active:scale-95",
                                isUploading
                                    ? "bg-[var(--cv-surface-a85)] opacity-70 cursor-not-allowed text-[color:var(--cv-muted)]"
                                    : "bg-[var(--cv-surface-a85)] hover:bg-[color:var(--cv-surface)] text-[color:var(--cv-text)]"
                            )}
                        >
                            <Upload className="w-4 h-4 text-[color:var(--cv-accent)]" />
                            <span>{isUploading ? 'Enviando...' : 'Upload/Importar'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsAssistantOpen(true)}
                            className="group relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold border border-[color:var(--cv-border-weak)] bg-[var(--cv-surface-a85)] hover:bg-[color:var(--cv-surface)] text-[color:var(--cv-text)] shadow-[var(--cv-shadow-1)] transition-colors active:scale-95"
                        >
                            <MessageCircle className="w-4 h-4 text-[color:var(--cv-accent)]" />
                            <span>Assistente IA</span>
                        </button>

                        <button
                            onClick={() => handlePrint()}
                            className="group relative flex items-center gap-2 px-5 py-2.5 bg-[color:var(--cv-accent)] hover:bg-[color:var(--cv-accent-hover)] text-[#0B1220] rounded-xl font-semibold shadow-[var(--cv-shadow-1)] transition-colors active:scale-95"
                        >
                            <Download className="w-4 h-4" />
                            <span>Baixar PDF</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Grid - Split Screen */}
            {/* Main Content - Split Screen (Flexbox) */}
            <main className="flex-1 min-h-0 w-full flex flex-col lg:flex-row overflow-hidden">

                {/* Left Column: Editor */}
                <div className="w-full lg:w-1/2 flex flex-col h-full bg-[color:var(--editor-surface)]">
                    {/* Fixed Header */}
                    <div className="shrink-0 py-4 z-10 bg-[var(--cv-bg-a90)] backdrop-blur-sm border-b border-[color:var(--cv-border-weak)]">
                        <div className="max-w-5xl mx-auto px-4 lg:px-8 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-[color:var(--cv-text)] flex items-center gap-2">
                                <Edit2Icon className="w-5 h-5 text-[color:var(--cv-accent)]" />
                                Conteúdo
                            </h2>
                            <span className="text-xs font-medium text-[color:var(--cv-muted)]" />
                        </div>
                    </div>

                    {uploadError && (
                        <div className="shrink-0 px-4 lg:px-8 py-3 border-b border-[color:var(--cv-border-weak)] bg-rose-500/10">
                            <div className="max-w-5xl mx-auto text-sm text-rose-100 flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="font-semibold">Erro ao importar</div>
                                    <div className="text-xs text-rose-100/90 break-words">{uploadError}</div>
                                </div>
                                <button
                                    type="button"
                                    className="shrink-0 text-xs font-bold text-rose-100/90 hover:text-rose-100"
                                    onClick={() => setUploadError(null)}
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Scrollable Content */}
                    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative z-0">
                        <div className="max-w-5xl mx-auto px-4 lg:px-8 pt-6 pb-32">
                            <CVForm />
                        </div>
                    </div>
                </div>

                {/* Right Column: Preview */}
                <div className="hidden lg:flex w-full lg:w-1/2 flex flex-col h-full bg-[color:var(--cv-bg)] lg:border-l border-[color:var(--cv-border-weak)]">
                    {/* Fixed Header */}
                    <div className="shrink-0 py-4 z-10 bg-[var(--cv-bg-a90)] backdrop-blur-sm border-b border-[color:var(--cv-border-weak)]">
                        <div className="max-w-[210mm] mx-auto px-6 lg:px-10 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-[color:var(--cv-text)] flex items-center gap-2">
                                <Eye className="w-5 h-5 text-[color:var(--cv-accent)]" />
                                Visualização
                            </h2>
                            <div className="flex items-center gap-3">
                                <div className="inline-flex items-center gap-1 rounded-xl bg-[var(--cv-surface-a85)] border border-[color:var(--cv-border-weak)] shadow-[var(--cv-shadow-1)] p-1">
                                    <button
                                        type="button"
                                        onClick={() => setPreviewMode('light')}
                                        className={clsx(
                                            'px-2 py-1 text-xs font-semibold rounded-lg transition-colors',
                                            previewMode === 'light'
                                                ? 'bg-[color:var(--cv-accent)] text-[#0B1220]'
                                                : 'text-[color:var(--cv-muted)] hover:text-[color:var(--cv-text)] hover:bg-white/5'
                                        )}
                                    >
                                        Claro
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewMode('dark')}
                                        className={clsx(
                                            'px-2 py-1 text-xs font-semibold rounded-lg transition-colors',
                                            previewMode === 'dark'
                                                ? 'bg-[color:var(--cv-accent)] text-[#0B1220]'
                                                : 'text-[color:var(--cv-muted)] hover:text-[color:var(--cv-text)] hover:bg-white/5'
                                        )}
                                    >
                                        Escuro
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div
                        ref={previewStageRef}
                        className={clsx(
                            'cv-preview-stage relative flex-1 min-h-0 overflow-hidden bg-[color:var(--cv-bg)]'
                        )}
                    >
                        <CVPreview
                            ref={componentRef}
                            scaleOverride={1}
                            previewMode={previewMode}
                            paperRounded
                            paperShadow
                        />
                    </div>
                </div>

            </main>

            <CVChatAssistantDrawer
                open={isAssistantOpen}
                onClose={() => setIsAssistantOpen(false)}
                cvData={cvData}
                onApplyPatches={applyAssistantPatches}
            />
        </div>
    );
};

// Helper Icon
const Edit2Icon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);
