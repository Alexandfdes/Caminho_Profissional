import React, { useState } from 'react';
import { Section } from '../../types/cv';
import { useResumeStore } from '../../stores/resumeStore';
import { RichTextEditor } from './RichTextEditor';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { sortSectionItemsByDateDesc } from '../../utils/cvDateSort';
import { ImproveFieldType } from '../../services/richTextImproveService';
import { PersonalDataForm } from './PersonalDataForm';
import { SortableList } from './SortableList';
import { ModernInput } from './ModernInput';

interface SectionEditorProps {
    section: Section;
}

const SuggestionBlock: React.FC<{ suggestion: string; onApply: () => void; label?: string }> = ({ suggestion, onApply, label = "Sugestão da IA" }) => (
    <div className="mb-4 p-3 bg-[var(--cv-surface-a85)] border border-[color:var(--cv-border-weak)] border-l-2 border-l-[color:var(--cv-accent)] rounded-lg flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2 shadow-[var(--cv-shadow-1)]">
        <div className="text-sm text-[color:var(--cv-text)]">
            <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3 h-3 text-[color:var(--cv-accent)]" />
                <span className="font-semibold text-[color:var(--cv-muted)] text-xs">{label}</span>
            </div>
            <p className="leading-[1.6] opacity-90">{suggestion}</p>
        </div>
        <button
            onClick={onApply}
            className="shrink-0 text-xs font-semibold text-[color:var(--cv-accent)] hover:text-[color:var(--cv-accent-hover)] bg-transparent hover:bg-[var(--cv-accent-a18)] px-3 py-1.5 rounded transition-colors border border-[color:var(--cv-border-weak)]"
        >
            Aplicar
        </button>
    </div>
);

// Componente separado para gerenciar o estado do acordeão
interface RepeatableGroupEditorProps {
    section: Section;
    groupSuggestions: string[] | null;
    isAutoSort: boolean;
    itemsSorted: any[];
    renderItem: (item: any, index: number, openItemId: string | null, setOpenItemId: (id: string | null) => void) => React.ReactNode;
    addSectionItem: (sectionId: string, item: any) => void;
    updateSection: (sectionId: string, updates: Partial<Section>) => void;
    reorderSectionItems: (sectionId: string, items: any[]) => void;
}

const RepeatableGroupEditor: React.FC<RepeatableGroupEditorProps> = ({
    section,
    groupSuggestions,
    isAutoSort,
    itemsSorted,
    renderItem,
    addSectionItem,
    updateSection,
    reorderSectionItems,
}) => {
    const [openItemId, setOpenItemId] = useState<string | null>(null);

    return (
        <div className="space-y-3">
            {groupSuggestions && groupSuggestions.length > 0 && (
                <div className="mb-4 p-3 bg-[var(--cv-surface-a85)] border border-[color:var(--cv-border-weak)] border-l-2 border-l-[color:var(--cv-accent)] rounded-lg shadow-[var(--cv-shadow-1)]">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-3 h-3 text-[color:var(--cv-accent)]" />
                        <span className="font-semibold text-[color:var(--cv-muted)] text-xs">Sugestões de melhoria</span>
                    </div>
                    <ul className="list-disc list-inside text-sm text-[color:var(--cv-text)] space-y-1">
                        {groupSuggestions.map((sugg, i) => (
                            <li key={i}>{sugg}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex items-center justify-between gap-3">
                <button
                    onClick={() => {
                        addSectionItem(section.id, { title: '', subtitle: '', date: '', description: '' });
                    }}
                    className="flex items-center gap-1.5 text-[color:var(--cv-accent)] hover:text-[color:var(--cv-accent-hover)] text-xs font-semibold px-3 py-1.5 bg-[var(--cv-accent-a18)] hover:bg-[var(--cv-accent-a28)] rounded-lg transition-colors w-fit border border-[color:var(--cv-border-weak)]"
                >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Item
                </button>

                <label className="flex items-center gap-2 text-[11px] font-semibold text-[color:var(--muted-text)] select-none">
                    <input
                        type="checkbox"
                        checked={!isAutoSort}
                        onChange={(e) => updateSection(section.id, { sortMode: e.target.checked ? 'manual' : 'auto' })}
                        className="h-4 w-4 rounded border border-[color:var(--input-border)] bg-[color:var(--input-bg)] accent-[color:var(--cv-accent)]"
                    />
                    Ordenar manualmente
                </label>
            </div>

            {isAutoSort ? (
                <div className="space-y-3">
                    {itemsSorted.map((item, index) => renderItem(item, index, openItemId, setOpenItemId))}
                </div>
            ) : (
                <SortableList
                    items={section.items || []}
                    keyExtractor={(item) => item.id}
                    onReorder={(newItems) => reorderSectionItems(section.id, newItems as any)}
                >
                    {(item, index) => renderItem(item, index, openItemId, setOpenItemId)}
                </SortableList>
            )}
        </div>
    );
};

export const SectionEditor: React.FC<SectionEditorProps> = ({ section }) => {
    const { cvData, updateSection, addSectionItem, removeSectionItem, updateSectionItem, reorderSectionItems, suggestions } = useResumeStore();

    // Derived values
    const personal = cvData.sections.find((s) => s.id === 'personal');
    const skillsSection = cvData.sections.find((s) => s.id === 'skills');
    const role = String((personal as any)?.fields?.role || '').trim();
    const skills = Array.isArray((skillsSection as any)?.list) ? (skillsSection as any).list : [];

    switch (section.type) {
        case 'personal': {
            const contactSuggestions = suggestions?.extracted_contacts;
            return (
                <div className="space-y-4">
                    {contactSuggestions?.email && contactSuggestions.email !== section.fields?.email && (
                        <SuggestionBlock
                            label="Email Detectado"
                            suggestion={contactSuggestions.email}
                            onApply={() => updateSection(section.id, { fields: { ...section.fields, email: contactSuggestions.email } })}
                        />
                    )}
                    <PersonalDataForm section={section} />
                </div>
            );
        }

        case 'richtext': {
            const summarySuggestion = suggestions?.rewritten_sections?.['Resumo Profissional'] ||
                suggestions?.suggestions_by_section?.['Resumo']?.[0];

            const fieldType: ImproveFieldType = /resumo/i.test(section.title) ? 'summary' : 'generic_richtext';
            return (
                <div>
                    {summarySuggestion && (
                        <SuggestionBlock
                            label="Resumo Otimizado"
                            suggestion={summarySuggestion}
                            onApply={() => updateSection(section.id, { content: summarySuggestion })}
                        />
                    )}
                    <RichTextEditor
                        label={section.title}
                        content={section.content || ''}
                        onChange={(content) => updateSection(section.id, { content })}
                        improveContext={{ fieldType, sectionId: section.id, role, skills }}
                        placeholder="Escreva aqui..."
                    />
                </div>
            );
        }

        case 'repeatable_group': {
            const sectionName = section.title.includes('Experiência') ? 'Experiência' :
                section.title.includes('Educação') ? 'Educação' : null;
            const groupSuggestions = sectionName ? suggestions?.suggestions_by_section?.[sectionName] : null;

            const isAutoSort = (section.sortMode || 'auto') === 'auto';
            const itemsSorted = section.items ? sortSectionItemsByDateDesc(section.items) : [];

            const inferItemFieldType = (): ImproveFieldType => {
                const title = String(section.title || '');
                if (/experi/i.test(title)) return 'experience_item_description';
                if (/educa|forma/i.test(title)) return 'education_item_description';
                if (/curso|certif/i.test(title)) return 'course_item_description';
                if (/projeto/i.test(title)) return 'project_item_description';
                return 'generic_richtext';
            };

            const itemFieldType = inferItemFieldType();

            const renderItem = (item: any, index: number, openItemId: string | null, setOpenItemId: (id: string | null) => void) => {
                const isOpen = openItemId === item.id;
                const itemSummary = [item.title, item.subtitle, item.date].filter(Boolean).join(' • ') || 'Novo Item';

                return (
                    <div key={item.id} className="bg-[var(--cv-surface-a85)] rounded-xl border border-[color:var(--cv-border-weak)] overflow-hidden hover:border-[color:var(--cv-border-mid)] transition-all shadow-[var(--cv-shadow-1)]">
                        {/* Header do Card (Sempre visível) */}
                        <div
                            className="flex items-center justify-between p-3 cursor-pointer select-none hover:bg-white/5 transition-colors"
                            onClick={() => setOpenItemId(isOpen ? null : item.id)}
                        >
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="font-semibold text-[color:var(--cv-text)] text-sm truncate">
                                    {item.title || 'Novo Item'}
                                </span>
                                {(item.subtitle || item.date) && (
                                    <span className="text-xs text-[color:var(--cv-muted)] truncate">
                                        {[item.subtitle, item.date].filter(Boolean).join(' • ')}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeSectionItem(section.id, item.id);
                                    }}
                                    className="text-[color:var(--cv-muted)] hover:text-rose-300 p-1.5 transition-colors rounded hover:bg-rose-500/10"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className={`text-[color:var(--cv-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Corpo do Formulário (Só aparece se aberto) */}
                        {isOpen && (
                            <div className="p-4 border-t border-[color:var(--cv-border-weak)] animate-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <ModernInput
                                        label="Título / Cargo"
                                        value={item.title || ''}
                                        onChange={(e) => updateSectionItem(section.id, item.id, { title: e.target.value })}
                                        placeholder="Ex: Desenvolvedor Sênior"
                                    />
                                    <ModernInput
                                        label="Empresa / Instituição"
                                        value={item.subtitle || ''}
                                        onChange={(e) => updateSectionItem(section.id, item.id, { subtitle: e.target.value })}
                                        placeholder="Ex: Google, USP"
                                    />
                                    <ModernInput
                                        label="Período"
                                        value={item.date || ''}
                                        onChange={(e) => updateSectionItem(section.id, item.id, { date: e.target.value })}
                                        placeholder="Ex: Jan 2020 - Atual"
                                    />
                                </div>
                                <RichTextEditor
                                    content={item.description || ''}
                                    onChange={(content) => updateSectionItem(section.id, item.id, { description: content })}
                                    improveContext={{ fieldType: itemFieldType, sectionId: section.id, itemId: item.id, role, skills }}
                                    placeholder="Descrição..."
                                    className="mt-3"
                                />
                            </div>
                        )}
                    </div>
                );
            };

            return (
                <RepeatableGroupEditor
                    section={section}
                    groupSuggestions={groupSuggestions}
                    isAutoSort={isAutoSort}
                    itemsSorted={itemsSorted}
                    renderItem={renderItem}
                    addSectionItem={addSectionItem}
                    updateSection={updateSection}
                    reorderSectionItems={reorderSectionItems}
                />
            );
        }

        case 'list': {
            const skillsSuggestion = suggestions?.suggestions_by_section?.['Habilidades'];
            return (
                <div className="space-y-4">
                    {skillsSuggestion && skillsSuggestion.length > 0 && (
                        <SuggestionBlock
                            label="Habilidades Sugeridas"
                            suggestion={skillsSuggestion.join(', ')}
                            onApply={() => updateSection(section.id, { list: skillsSuggestion })}
                        />
                    )}
                    <textarea
                        value={section.list?.join(', ') || ''}
                        onChange={(e) => updateSection(section.id, { list: e.target.value.split(',').map(s => s.trim()) })}
                        className="w-full h-24 bg-[color:var(--input-bg)] border border-[color:var(--input-border)] hover:border-[color:var(--input-border-hover)] hover:bg-[color:var(--input-bg-hover)] rounded-xl p-4 text-[color:var(--input-text)] placeholder:text-[color:var(--input-placeholder)] focus:border-[color:var(--input-border-focus)] focus:bg-[color:var(--input-bg-focus)] focus:shadow-[var(--focus-ring)] outline-none resize-none transition-colors"
                        placeholder="Separe os itens por vírgula..."
                    />
                </div>
            );
        }

        default:
            return <div className="text-[color:var(--cv-muted)] text-sm">Tipo de seção desconhecido.</div>;
    }
};
