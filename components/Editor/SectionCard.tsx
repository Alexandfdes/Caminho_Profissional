import React, { useState } from 'react';
import { Section } from '../../types/cv';
import { useResumeStore } from '../../stores/resumeStore';
import { ChevronDown, ChevronUp, GripVertical, Trash2, Edit2, Eye, EyeOff, MoreVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import { SectionEditor } from './SectionEditor';

interface SectionCardProps {
    section: Section;
}

export const SectionCard: React.FC<SectionCardProps> = ({ section }) => {
    const { updateSection, removeSection } = useResumeStore();
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState(section.title);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as const,
    };

    const handleTitleSave = () => {
        if (titleInput.trim()) {
            updateSection(section.id, { title: titleInput });
        } else {
            setTitleInput(section.title);
        }
        setIsEditingTitle(false);
    };

    const toggleCollapse = () => {
        updateSection(section.id, { collapsed: !section.collapsed });
    };

    const toggleVisibility = (e: React.MouseEvent) => {
        e.stopPropagation();
        updateSection(section.id, { visible: !section.visible });
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={clsx(
                "group relative transition-all duration-200",
                isDragging ? "opacity-50 scale-[0.98]" : "opacity-100",
                !section.visible && "opacity-60"
            )}
        >
            {/* Card Container */}
            <div className={clsx(
                "bg-[color:var(--editor-card-bg)] rounded-2xl border border-[color:var(--editor-card-border)] shadow-[var(--cv-shadow-1)] transition-colors overflow-hidden",
                section.collapsed ? "hover:border-[color:var(--cv-border-mid)]" : "border-[color:var(--cv-border-mid)]"
            )}>

                {/* Header */}
                <div
                    className={clsx(
                        "flex items-center justify-between px-4 py-3 cursor-pointer select-none transition-colors",
                        section.collapsed
                            ? "bg-transparent"
                            : "bg-[var(--cv-surface-a85)] border-b border-[color:var(--cv-border-weak)]"
                    )}
                    onClick={toggleCollapse}
                >
                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                        {/* Drag Handle */}
                        <div
                            {...attributes}
                            {...listeners}
                            className="p-1.5 text-[color:var(--cv-muted)] hover:text-[color:var(--cv-text)] cursor-grab active:cursor-grabbing rounded hover:bg-white/5 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <GripVertical className="w-4 h-4" />
                        </div>

                        {/* Title */}
                        {isEditingTitle ? (
                            <input
                                type="text"
                                value={titleInput}
                                onChange={(e) => setTitleInput(e.target.value)}
                                onBlur={handleTitleSave}
                                onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                className="bg-[color:var(--input-bg)] border border-[color:var(--input-border)] rounded px-2 py-1 text-sm font-semibold text-[color:var(--input-text)] placeholder:text-[color:var(--input-placeholder)] outline-none w-full max-w-[220px] hover:border-[color:var(--input-border-hover)] hover:bg-[color:var(--input-bg-hover)] focus:border-[color:var(--input-border-focus)] focus:bg-[color:var(--input-bg-focus)] focus:shadow-[var(--focus-ring)]"
                            />
                        ) : (
                            <div className="flex items-center gap-2 group/title min-w-0">
                                <h3 className="text-sm font-semibold text-[color:var(--cv-text)] truncate">
                                    {section.title}
                                </h3>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditingTitle(true);
                                    }}
                                    className="opacity-0 group-hover/title:opacity-100 text-[color:var(--cv-muted)] hover:text-[color:var(--cv-accent)] transition-opacity p-1"
                                >
                                    <Edit2 className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={toggleVisibility}
                            className={clsx(
                                "p-1.5 rounded-lg transition-colors",
                                section.visible
                                    ? "text-[color:var(--cv-muted)] hover:text-[color:var(--cv-accent)] hover:bg-[var(--cv-accent-a18)]"
                                    : "text-[color:var(--cv-muted)] hover:text-[color:var(--cv-text)]"
                            )}
                            title={section.visible ? "Ocultar seção" : "Mostrar seção"}
                        >
                            {section.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>

                        {section.isCustom && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Tem certeza que deseja excluir esta seção?')) {
                                        removeSection(section.id);
                                    }
                                }}
                                className="p-1.5 text-[color:var(--cv-muted)] hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                                title="Excluir seção"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}

                        <div
                            className={clsx(
                                "p-1.5 text-[color:var(--cv-muted)] transition-transform duration-200",
                                !section.collapsed && "rotate-180"
                            )}
                        >
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div
                    className={clsx(
                        "transition-all duration-300 ease-in-out overflow-hidden",
                        section.collapsed ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"
                    )}
                >
                    <div className="p-5 bg-[color:var(--editor-card-bg)]">
                        <SectionEditor section={section} />
                    </div>
                </div>
            </div>
        </div>
    );
};
