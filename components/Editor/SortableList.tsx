import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

// Item individual com animação e handle
export const SortableItem = ({ id, children }: { id: string; children: React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as const,
    };

    return (
        <div ref={setNodeRef} style={style} className="group relative mb-4">
            {/* Handle de arrastar (lado esquerdo fora do card) */}
            <div
                {...attributes}
                {...listeners}
                className="absolute -left-8 top-4 cursor-grab text-[color:var(--cv-muted)] hover:text-[color:var(--cv-accent)] p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="Arrastar para reordenar"
            >
                <GripVertical size={20} />
            </div>
            {children}
        </div>
    );
};

interface SortableListProps<T> {
    items: T[];
    onReorder: (newItems: T[]) => void;
    children: (item: T, index: number) => React.ReactNode;
    keyExtractor: (item: T) => string;
}

export function SortableList<T>({ items, onReorder, children, keyExtractor }: SortableListProps<T>) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = items.findIndex((item) => keyExtractor(item) === active.id);
            const newIndex = items.findIndex((item) => keyExtractor(item) === over?.id);
            onReorder(arrayMove(items, oldIndex, newIndex));
        }
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
                items={items.map(keyExtractor)}
                strategy={verticalListSortingStrategy}
            >
                <div className="pl-6 md:pl-2">
                    {items.map((item, index) => (
                        <SortableItem key={keyExtractor(item)} id={keyExtractor(item)}>
                            {children(item, index)}
                        </SortableItem>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
