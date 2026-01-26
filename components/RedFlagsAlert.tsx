import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { CVRedFlag } from '../types/cv';

interface RedFlagsAlertProps {
    redFlags: CVRedFlag[];
}

export const RedFlagsAlert: React.FC<RedFlagsAlertProps> = ({ redFlags }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!redFlags || redFlags.length === 0) return null;

    const highSeverity = redFlags.filter(rf => rf.severity === 'high');
    const mediumSeverity = redFlags.filter(rf => rf.severity === 'medium');
    const lowSeverity = redFlags.filter(rf => rf.severity === 'low');

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high': return 'text-red-400 bg-red-500/10 border-red-500/30';
            case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
            case 'low': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'content': return '📝';
            case 'format': return '🎨';
            case 'gaps': return '⏱️';
            case 'language': return '🔤';
            default: return '⚠️';
        }
    };

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'content': return 'Conteúdo Vazio';
            case 'format': return 'Formatação';
            case 'gaps': return 'Lacunas';
            case 'language': return 'Linguagem';
            default: return 'Outro';
        }
    };

    return (
        <div className={`rounded-xl border ${getSeverityColor(highSeverity.length > 0 ? 'high' : mediumSeverity.length > 0 ? 'medium' : 'low')} p-6 mb-6 animate-fade-in`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                        <AlertTriangle className={`w-6 h-6 ${highSeverity.length > 0 ? 'text-red-400' : mediumSeverity.length > 0 ? 'text-amber-400' : 'text-yellow-400'}`} />
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${highSeverity.length > 0 ? 'text-red-300' : mediumSeverity.length > 0 ? 'text-amber-300' : 'text-yellow-300'}`}>
                            🚩 Red Flags Detectadas ({redFlags.length})
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">
                            Problemas críticos que podem causar rejeição automática
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-slate-400 hover:text-white transition-colors p-2"
                >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
            </div>

            {isExpanded && (
                <div className="mt-6 space-y-4">
                    {/* High Severity */}
                    {highSeverity.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs font-bold rounded uppercase">
                                    Alta Gravidade ({highSeverity.length})
                                </span>
                            </div>
                            <div className="space-y-3">
                                {highSeverity.map((flag, idx) => (
                                    <div key={idx} className="bg-slate-800/50 rounded-lg p-4 border border-red-500/20">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl mt-1">{getCategoryIcon(flag.category)}</span>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-slate-500 text-xs uppercase font-semibold">
                                                        {getCategoryLabel(flag.category)}
                                                    </span>
                                                    {flag.location && (
                                                        <span className="text-slate-600 text-xs">• {flag.location}</span>
                                                    )}
                                                </div>
                                                <p className="text-red-200 font-medium mb-2">{flag.issue}</p>
                                                <p className="text-slate-300 text-sm">
                                                    💡 <strong>Solução:</strong> {flag.suggestion}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Medium Severity */}
                    {mediumSeverity.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-2 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded uppercase">
                                    Média Gravidade ({mediumSeverity.length})
                                </span>
                            </div>
                            <div className="space-y-3">
                                {mediumSeverity.map((flag, idx) => (
                                    <div key={idx} className="bg-slate-800/50 rounded-lg p-4 border border-amber-500/20">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl mt-1">{getCategoryIcon(flag.category)}</span>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-slate-500 text-xs uppercase font-semibold">
                                                        {getCategoryLabel(flag.category)}
                                                    </span>
                                                    {flag.location && (
                                                        <span className="text-slate-600 text-xs">• {flag.location}</span>
                                                    )}
                                                </div>
                                                <p className="text-amber-200 font-medium mb-2">{flag.issue}</p>
                                                <p className="text-slate-300 text-sm">
                                                    💡 <strong>Solução:</strong> {flag.suggestion}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Low Severity */}
                    {lowSeverity.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs font-bold rounded uppercase">
                                    Baixa Gravidade ({lowSeverity.length})
                                </span>
                            </div>
                            <div className="space-y-3">
                                {lowSeverity.map((flag, idx) => (
                                    <div key={idx} className="bg-slate-800/50 rounded-lg p-4 border border-yellow-500/20">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl mt-1">{getCategoryIcon(flag.category)}</span>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-slate-500 text-xs uppercase font-semibold">
                                                        {getCategoryLabel(flag.category)}
                                                    </span>
                                                    {flag.location && (
                                                        <span className="text-slate-600 text-xs">• {flag.location}</span>
                                                    )}
                                                </div>
                                                <p className="text-yellow-200 font-medium mb-2">{flag.issue}</p>
                                                <p className="text-slate-300 text-sm">
                                                    💡 <strong>Solução:</strong> {flag.suggestion}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
