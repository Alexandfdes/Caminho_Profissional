import React from 'react';
import { useResumeStore } from '../../stores/resumeStore';
import { SectionCard } from './SectionCard';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';

export const SectionList: React.FC = () => {
    const { cvData, reorderSections, addSection } = useResumeStore();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = cvData.sections.findIndex(s => s.id === active.id);
            const newIndex = cvData.sections.findIndex(s => s.id === over?.id);
            const newSections = arrayMove(cvData.sections, oldIndex, newIndex);
            reorderSections(newSections);
        }
    };

    return (
        <div className="space-y-6 pb-32">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={cvData.sections.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-6">
                        {cvData.sections.map((section) => (
                            <SectionCard key={section.id} section={section} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {/* Add Section Button (Simple version for MVP) */}
            <div className="pt-4 border-t border-[color:var(--cv-border-weak)]">
                <h3 className="text-sm font-semibold text-[color:var(--cv-muted)] mb-4">Adicionar seção</h3>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => addSection('richtext', 'Nova Seção de Texto')}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[var(--cv-surface-a85)] hover:bg-[color:var(--cv-surface)] text-[color:var(--cv-text)] border border-[color:var(--cv-border-weak)] shadow-[var(--cv-shadow-1)] rounded-lg text-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Texto Livre
                    </button>
                    <button
                        onClick={() => addSection('repeatable_group', 'Nova Lista de Itens')}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[var(--cv-surface-a85)] hover:bg-[color:var(--cv-surface)] text-[color:var(--cv-text)] border border-[color:var(--cv-border-weak)] shadow-[var(--cv-shadow-1)] rounded-lg text-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Lista de Itens
                    </button>
                    <button
                        onClick={() => addSection('list', 'Nova Lista Simples')}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[var(--cv-surface-a85)] hover:bg-[color:var(--cv-surface)] text-[color:var(--cv-text)] border border-[color:var(--cv-border-weak)] shadow-[var(--cv-shadow-1)] rounded-lg text-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Lista Simples
                    </button>
                </div>
            </div>
        </div>
    );
};
