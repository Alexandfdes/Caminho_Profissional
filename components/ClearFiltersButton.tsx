import React from 'react';

interface ClearFiltersButtonProps {
    onClearFilters: () => void;
    disabled?: boolean;
    className?: string;
}

/**
 * Clear Filters Button Component
 * Provides accessible button to reset all applied filters
 */
export const ClearFiltersButton: React.FC<ClearFiltersButtonProps> = ({
    onClearFilters,
    disabled = false,
    className = ''
}) => {
    return (
        <button
            onClick={onClearFilters}
            disabled={disabled}
            aria-label="Limpar filtros"
            className={`
        flex items-center gap-2 px-4 py-2 
        bg-slate-700 hover:bg-slate-600 
        text-slate-300 hover:text-white
        rounded-lg font-medium text-sm
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900
        ${className}
      `}
        >
            <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                />
            </svg>
            <span>Limpar filtros</span>
        </button>
    );
};
