
import React from 'react';
import { RedFlagsAlert } from './RedFlagsAlert';
import { CVRedFlag, CVAnalysis } from '../types/cv';
import { CVQualityBadge, getQualityFromScore } from './CVQualityBadge';
import { Edit3 } from 'lucide-react';

interface CVAnalysisResultProps {
    analysis: CVAnalysis;
    onNewAnalysis: () => void;
    onEnhanceCV?: () => void;
}

export const CVAnalysisResult: React.FC<CVAnalysisResultProps> = ({ analysis, onNewAnalysis, onEnhanceCV }) => {
    const safeSections = Array.isArray((analysis as any)?.sections) ? (analysis as any).sections : [];
    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-emerald-400';
        if (score >= 80) return 'text-teal-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-rose-400';
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 90) return 'bg-emerald-500/20 border-emerald-500/30';
        if (score >= 80) return 'bg-teal-500/20 border-teal-500/30';
        if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30';
        return 'bg-rose-500/20 border-rose-500/30';
    };

    const getProgressColor = (score: number) => {
        if (score >= 90) return 'stroke-emerald-500';
        if (score >= 80) return 'stroke-teal-500';
        if (score >= 60) return 'stroke-yellow-500';
        return 'stroke-rose-500';
    };

    // Circular Progress Component
    const CircularProgress = ({ score, size = 180, strokeWidth = 12 }: { score: number, size?: number, strokeWidth?: number }) => {
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (score / 100) * circumference;

        return (
            <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                <svg className="transform -rotate-90 w-full h-full">
                    <circle
                        className="text-slate-700"
                        strokeWidth={strokeWidth}
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                    <circle
                        className={`${getProgressColor(score)} transition-all duration-1000 ease-out`}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className={`text-5xl font-bold ${getScoreColor(score)}`}>{score}</span>
                    <span className="text-slate-400 text-xs uppercase tracking-wider mt-2">
                        <CVQualityBadge score={score} showLabel={true} size="sm" />
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full mx-auto space-y-8 animate-fade-in pb-12">
            {/* Header / Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center gap-12">
                    {/* Score Circle */}
                    <div className="flex-shrink-0">
                        <CircularProgress score={analysis.overall_score} />
                    </div>

                    {/* Summary Text */}
                    <div className="flex-1 text-center md:text-left space-y-6">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-2">Análise do seu Currículo</h2>
                            <p className="text-slate-400 text-lg">
                                Baseado em padrões de mercado e boas práticas de recrutamento.
                            </p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                            <p className="text-slate-200 leading-relaxed text-lg">
                                {analysis.summary}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Red Flags Alert */}
            {analysis.red_flags && analysis.red_flags.length > 0 && (
                <RedFlagsAlert redFlags={analysis.red_flags} />
            )}

            {/* Section Grid */}
            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8">
                {safeSections.map((section: any, index: number) => (
                    <div
                        key={index}
                        className="group bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/50 hover:border-teal-500/30 hover:bg-slate-800/60 transition-all duration-300 flex flex-col"
                    >
                        {/* Card Header */}
                        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white group-hover:text-teal-400 transition-colors">
                                {section.name}
                            </h3>
                            <CVQualityBadge score={section.score} size="sm" />
                        </div>

                        {/* Card Content */}
                        <div className="p-6 space-y-6 flex-1">
                            {/* Strengths */}
                            {Array.isArray(section.strengths) && section.strengths.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2 uppercase tracking-wide">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Pontos Fortes
                                    </h4>
                                    <ul className="space-y-2">
                                        {section.strengths.map((strength: string, i: number) => (
                                            <li key={i} className="text-slate-300 text-sm pl-4 border-l-2 border-emerald-500/30">
                                                {strength}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Weaknesses */}
                            {Array.isArray(section.weaknesses) && section.weaknesses.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-rose-400 mb-3 flex items-center gap-2 uppercase tracking-wide">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Atenção
                                    </h4>
                                    <ul className="space-y-2">
                                        {section.weaknesses.map((weakness: string, i: number) => (
                                            <li key={i} className="text-slate-300 text-sm pl-4 border-l-2 border-rose-500/30">
                                                {weakness}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Suggestions */}
                            {Array.isArray(section.suggestions) && section.suggestions.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-teal-400 mb-3 flex items-center gap-2 uppercase tracking-wide">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Sugestões
                                    </h4>
                                    <ul className="space-y-2">
                                        {section.suggestions.map((suggestion: string, i: number) => (
                                            <li key={i} className="text-slate-300 text-sm pl-4 border-l-2 border-teal-500/30">
                                                {suggestion}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4 pt-8">
                {onEnhanceCV && (
                    <button
                        onClick={onEnhanceCV}
                        className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-gradient-to-r from-purple-600 to-pink-600 font-pj rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 hover:from-purple-500 hover:to-pink-500 active:scale-95"
                    >
                        <div className="absolute -inset-3 rounded-xl bg-purple-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 blur-lg"></div>
                        <span className="relative flex items-center gap-3 text-lg">
                            <Edit3 className="w-6 h-6" />
                            ✨ Aprimorar Meu CV
                        </span>
                    </button>
                )}
                <button
                    onClick={onNewAnalysis}
                    className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-teal-600 font-pj rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-600 hover:bg-teal-500 active:scale-95"
                >
                    <div className="absolute -inset-3 rounded-xl bg-teal-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 blur-lg"></div>
                    <span className="relative flex items-center gap-3 text-lg">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Analisar Novo Currículo
                    </span>
                </button>
            </div>
        </div>
    );
};
