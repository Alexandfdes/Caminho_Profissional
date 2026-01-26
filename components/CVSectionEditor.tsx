import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface CVSectionEditorProps {
    title: string;
    content: string;
    onChange: (newContent: string) => void;
    onAIEnhance: () => Promise<string>;
    placeholder?: string;
    multiline?: boolean;
}

export const CVSectionEditor: React.FC<CVSectionEditorProps> = ({
    title,
    content,
    onChange,
    onAIEnhance,
    placeholder = 'Digite aqui...',
    multiline = false
}) => {
    const [isEnhancing, setIsEnhancing] = useState(false);

    const handleEnhance = async () => {
        setIsEnhancing(true);
        try {
            const enhanced = await onAIEnhance();
            onChange(enhanced);
        } catch (error) {
            console.error('Erro ao aprimorar:', error);
        } finally {
            setIsEnhancing(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-teal-400">
                    {title}
                </label>
                <button
                    onClick={handleEnhance}
                    disabled={isEnhancing || !content.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isEnhancing ? (
                        <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Melhorando...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-3.5 h-3.5" />
                            Melhorar com IA
                        </>
                    )}
                </button>
            </div>

            {multiline ? (
                <textarea
                    value={content}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={6}
                    className="w-full p-4 bg-slate-900/80 border border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors text-slate-200 placeholder-slate-500 resize-none"
                />
            ) : (
                <input
                    type="text"
                    value={content}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full p-3 bg-slate-900/80 border border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors text-slate-200 placeholder-slate-500"
                />
            )}
        </div>
    );
};
