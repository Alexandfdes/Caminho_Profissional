import React from 'react';
import { clsx } from 'clsx';

interface ModernInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export const ModernInput: React.FC<ModernInputProps> = ({ label, error, className, ...props }) => (
    <div className="group relative">
        <label className="text-[10px] uppercase font-bold text-[color:var(--cv-muted)] absolute top-2 left-3 transition-colors group-focus-within:text-[color:var(--cv-accent)]">
            {label}
        </label>
        <input
            className={clsx(
                "w-full bg-[color:var(--input-bg)] border border-[color:var(--input-border)] rounded-lg pt-6 pb-2 px-3 text-sm font-medium text-[color:var(--input-text)] placeholder:text-[color:var(--input-placeholder)] outline-none transition-all",
                "hover:border-[color:var(--input-border-hover)] hover:bg-[color:var(--input-bg-hover)]",
                "focus:border-[color:var(--input-border-focus)] focus:bg-[color:var(--input-bg-focus)] focus:shadow-[var(--focus-ring)]",
                error && "border-rose-500",
                className
            )}
            {...props}
        />
        {error && (
            <span className="text-[10px] text-rose-400 mt-1 block">{error}</span>
        )}
    </div>
);

interface ModernTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
}

export const ModernTextArea: React.FC<ModernTextAreaProps> = ({ label, className, ...props }) => (
    <div className="group relative">
        <label className="text-[10px] uppercase font-bold text-[color:var(--cv-muted)] absolute top-2 left-3 transition-colors group-focus-within:text-[color:var(--cv-accent)] z-10">
            {label}
        </label>
        <textarea
            className={clsx(
                "w-full bg-[color:var(--input-bg)] border border-[color:var(--input-border)] rounded-lg pt-6 pb-2 px-3 text-sm font-medium text-[color:var(--input-text)] placeholder:text-[color:var(--input-placeholder)] outline-none transition-all resize-none",
                "hover:border-[color:var(--input-border-hover)] hover:bg-[color:var(--input-bg-hover)]",
                "focus:border-[color:var(--input-border-focus)] focus:bg-[color:var(--input-bg-focus)] focus:shadow-[var(--focus-ring)]",
                className
            )}
            {...props}
        />
    </div>
);
