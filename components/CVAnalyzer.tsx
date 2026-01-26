import React, { useState } from 'react';
import { CVUploadZone } from './CVUploadZone';
import { CVAnalysisResult } from './CVAnalysisResult';
import { CVEditorStep } from './CVEditorStep';
import { cvAnalyzerService, CachedCVAnalysis } from '../services/cvAnalyzerService';
import { supabaseService } from '../services/supabaseService';

interface CVAnalyzerProps {
    userId: string;
    onClose?: () => void;
}

export const CVAnalyzer: React.FC<CVAnalyzerProps> = ({ userId, onClose }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<CachedCVAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastFile, setLastFile] = useState<File | null>(null);
    const [showEditor, setShowEditor] = useState(false);
    const cacheAvailable = Boolean(supabaseService.getClient());

    const runAnalysis = async (file: File, options?: { forceRefresh?: boolean }) => {
        setIsAnalyzing(true);
        setError(null);

        try {
            const result = await cvAnalyzerService.uploadAndAnalyze(file, userId, options);
            setAnalysis(result);
        } catch (err: any) {
            console.error('Analysis error:', err);
            setError(err.message || 'Erro ao analisar currículo. Tente novamente.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFileSelect = async (file: File) => {
        setLastFile(file);
        await runAnalysis(file);
    };

    const handleNewAnalysis = () => {
        setAnalysis(null);
        setError(null);
        setIsAnalyzing(false);
        setLastFile(null);
    };

    const handleForceRefresh = async () => {
        if (!lastFile) return;
        await runAnalysis(lastFile, { forceRefresh: true });
    };

    const handleEnhanceCV = () => {
        setShowEditor(true);
    };

    const handleBackFromEditor = () => {
        setShowEditor(false);
    };

    if (showEditor && analysis) {
        return (
            <CVEditorStep
                analysis={analysis.analysis}
                onBack={handleBackFromEditor}
                originalFileName={lastFile?.name}
                cvContent={analysis.cvText}
            />
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 py-12 px-4">
            <div className="w-full max-w-[98%] mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <svg className="w-10 h-10 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-400">
                            Análise de Currículo
                        </h1>
                    </div>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Receba feedback detalhado sobre seu currículo e descubra como melhorá-lo para se destacar no mercado
                    </p>
                </div>

                {/* Main Content */}
                <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 backdrop-blur-sm">
                    {analysis ? (
                        <CVAnalysisResult
                            analysis={analysis.analysis}
                            onNewAnalysis={handleNewAnalysis}
                            onEnhanceCV={handleEnhanceCV}
                        />
                    ) : (
                        <>
                            <CVUploadZone onFileSelect={handleFileSelect} isLoading={isAnalyzing} />

                            {error && (
                                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg animate-fade-in">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-red-200">{error}</p>
                                    </div>
                                </div>
                            )}

                            {!isAnalyzing && !error && (
                                <div className="mt-8 space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-200 mb-4">O que você receberá:</h3>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="flex items-start gap-3">
                                            <svg className="w-5 h-5 text-teal-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div>
                                                <p className="text-slate-200 font-medium">Pontuação Geral</p>
                                                <p className="text-slate-400 text-sm">Score de 0-100 baseado em padrões do mercado</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <svg className="w-5 h-5 text-teal-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                            </svg>
                                            <div>
                                                <p className="text-slate-200 font-medium">Análise por Seção</p>
                                                <p className="text-slate-400 text-sm">Feedback detalhado de cada parte</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <svg className="w-5 h-5 text-teal-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                            <div>
                                                <p className="text-slate-200 font-medium">Sugestões de Melhoria</p>
                                                <p className="text-slate-400 text-sm">Dicas práticas para otimizar</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </>
                    )}
                </div>

                {/* Back Button */}
                {onClose && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 mx-auto"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Voltar ao Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
