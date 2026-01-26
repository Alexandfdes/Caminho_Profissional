import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { clsx } from 'clsx';

interface SortableItemProps {
    id: string;
    children: React.ReactNode;
    className?: string;
}

export const SortableItem: React.FC<SortableItemProps> = ({ id, children, className }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as const,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={clsx(
                "group relative transition-all",
                isDragging && "opacity-50 scale-[1.02] shadow-[var(--cv-shadow-1)] border border-[color:var(--cv-border-mid)] rounded-xl",
                className
            )}
        >
            {/* Drag Handle - Visible on hover or always on mobile */}
            <div
                {...attributes}
                {...listeners}
                className={clsx(
                    "absolute left-2 top-4 p-1.5 rounded cursor-grab active:cursor-grabbing text-[color:var(--cv-muted)] hover:text-[color:var(--cv-text)] hover:bg-white/5 transition-colors z-10",
                    "opacity-0 group-hover:opacity-100 focus:opacity-100 touch-manipulation"
                )}
            >
                <GripVertical className="w-4 h-4" />
            </div>

            {/* Content Wrapper - Add padding-left to accommodate handle */}
            <div className="pl-8">
                {children}
            </div>
        </div>
    );
};
