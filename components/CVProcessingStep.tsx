import React, { useEffect, useState } from 'react';
import { cvAnalyzerService } from '../services/cvAnalyzerService';
import { extractTextFromCV, validateExtractedText } from '../utils/cvParser';
import { analyzeCVWithAI } from '../services/geminiService';

interface CVProcessingStepProps {
    analysisId: string;
    file: File;
    targetCareer?: string;
    optInSave: boolean;
    onComplete: (analysisId: string) => void;
    onError: (error: string) => void;
}

type ProcessingStage = 'extracting' | 'analyzing' | 'saving' | 'complete' | 'error';

export const CVProcessingStep: React.FC<CVProcessingStepProps> = ({
    analysisId,
    file,
    targetCareer,
    optInSave,
    onComplete,
    onError,
}) => {
    const [stage, setStage] = useState<ProcessingStage>('extracting');
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('Iniciando análise...');

    useEffect(() => {
        processCV();
    }, []);

    const processCV = async () => {
        try {
            // Stage 1: Extract text from file
            setStage('extracting');
            setStatusMessage('Extraindo texto do currículo...');
            setProgress(10);

            const extractedText = await extractTextFromCV(file);
            setProgress(30);

            // Validate extracted text
            const validation = validateExtractedText(extractedText);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            // Stage 2: Analyze with AI
            setStage('analyzing');
            setStatusMessage('Analisando com Inteligência Artificial...');
            setProgress(40);

            const analysisResult = await analyzeCVWithAI(extractedText, targetCareer);
            setProgress(80);

            // Stage 3: Save results
            setStage('saving');
            setStatusMessage('Salvando resultados...');
            setProgress(90);

            await cvAnalyzerService.updateAnalysis(
                analysisId,
                analysisResult,
                optInSave ? extractedText : undefined
            );

            setProgress(100);
            setStage('complete');
            setStatusMessage('Análise concluída!');

            // Wait a bit before transitioning
            setTimeout(() => {
                onComplete(analysisId);
            }, 1000);

        } catch (error: any) {
            console.error('Erro no processamento:', error);
            setStage('error');
            const errorMessage = error?.message || 'Erro ao processar currículo';
            setStatusMessage(errorMessage);

            // Mark analysis as failed in database
            await cvAnalyzerService.markAnalysisFailed(analysisId);

            onError(errorMessage);
        }
    };

    const getStageIcon = () => {
        switch (stage) {
            case 'extracting':
                return (
                    <svg className="w-16 h-16 text-teal-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
            case 'analyzing':
                return (
                    <svg className="w-16 h-16 text-sky-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                );
            case 'saving':
                return (
                    <svg className="w-16 h-16 text-emerald-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                );
            case 'complete':
                return (
                    <svg className="w-16 h-16 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'error':
                return (
                    <svg className="w-16 h-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
            <div className="max-w-2xl w-full">
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-12">
                    {/* Icon */}
                    <div className="flex justify-center mb-8">
                        {getStageIcon()}
                    </div>

                    {/* Status Message */}
                    <h2 className="text-2xl font-bold text-center text-white mb-4">
                        {statusMessage}
                    </h2>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-700 rounded-full h-3 mb-8 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${stage === 'error' ? 'bg-red-500' : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                                }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Progress Percentage */}
                    <p className="text-center text-slate-400 text-sm mb-8">
                        {progress}% concluído
                    </p>

                    {/* Stage Details */}
                    <div className="space-y-3">
                        <div className={`flex items-center gap-3 ${stage === 'extracting' || stage === 'analyzing' || stage === 'saving' || stage === 'complete' ? 'text-teal-400' : 'text-slate-600'}`}>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">Extração de texto</span>
                        </div>

                        <div className={`flex items-center gap-3 ${stage === 'analyzing' || stage === 'saving' || stage === 'complete' ? 'text-sky-400' : 'text-slate-600'}`}>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">Análise com IA</span>
                        </div>

                        <div className={`flex items-center gap-3 ${stage === 'saving' || stage === 'complete' ? 'text-emerald-400' : 'text-slate-600'}`}>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">Salvando resultados</span>
                        </div>
                    </div>

                    {/* File Info */}
                    <div className="mt-8 pt-8 border-t border-slate-700">
                        <p className="text-sm text-slate-400 text-center">
                            Analisando: <span className="text-white font-medium">{file.name}</span>
                        </p>
                        {targetCareer && (
                            <p className="text-xs text-slate-500 text-center mt-1">
                                Área alvo: {targetCareer}
                            </p>
                        )}
                    </div>
                </div>

                {/* Tips */}
                {stage !== 'error' && stage !== 'complete' && (
                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-500">
                            💡 Dica: Isso pode levar de 30 segundos a 2 minutos dependendo do tamanho do arquivo
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
