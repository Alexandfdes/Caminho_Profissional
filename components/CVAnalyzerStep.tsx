import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { cvAnalyzerService } from '../services/cvAnalyzerService';
import { CVUsageQuota } from '../types/cv';

interface CVAnalyzerStepProps {
    onBack: () => void;
    onAnalysisComplete: (analysisId: string) => void;
}

export const CVAnalyzerStep: React.FC<CVAnalyzerStepProps> = ({ onBack, onAnalysisComplete }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [optInSave, setOptInSave] = useState(false);
    const [targetCareer, setTargetCareer] = useState('');
    const [quota, setQuota] = useState<CVUsageQuota | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    // Check quota on mount
    React.useEffect(() => {
        checkUserQuota();
    }, []);

    const checkUserQuota = async () => {
        try {
            const quotaData = await cvAnalyzerService.checkQuota();
            setQuota(quotaData);
        } catch (err: any) {
            console.error('Erro ao verificar quota:', err);
        }
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Arquivo muito grande. Tamanho máximo: 5MB');
                return;
            }

            setUploadedFile(file);
            setError(null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
        maxFiles: 1,
        disabled: isLoading || (quota !== null && !quota.can_analyze),
    });

    const handleAnalyze = async () => {
        if (!uploadedFile) {
            setError('Por favor, selecione um arquivo');
            return;
        }

        if (quota && !quota.can_analyze) {
            setError('Você atingiu o limite de análises gratuitas deste mês. Faça upgrade para continuar!');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 1. Upload file to storage
            const filePath = await cvAnalyzerService.uploadCV(uploadedFile);

            // 2. Create analysis record
            const fileType = uploadedFile.name.endsWith('.pdf') ? 'pdf' : 'docx';
            const analysisId = await cvAnalyzerService.createAnalysis(
                uploadedFile.name,
                filePath,
                uploadedFile.size,
                fileType,
                optInSave
            );

            // 3. Navigate to processing/result page
            onAnalysisComplete(analysisId);

        } catch (err: any) {
            console.error('Erro ao analisar CV:', err);
            setError(err.message || 'Erro ao processar seu currículo. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const quotaExceeded = quota !== null && !quota.can_analyze;

    return (
        <div className="min-h-screen bg-slate-900 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-400">
                            Análise de Currículo com IA
                        </h1>
                        <p className="text-slate-400 mt-2">
                            Receba feedback profissional e melhore seu CV em minutos
                        </p>
                    </div>
                    <button
                        onClick={onBack}
                        className="text-sm text-slate-400 hover:text-teal-400 transition-colors"
                    >
                        Voltar
                    </button>
                </div>

                {/* Quota Info */}
                {quota && (
                    <div className={`mb-6 p-4 rounded-xl border ${quotaExceeded ? 'bg-red-500/10 border-red-500/30' : 'bg-teal-500/10 border-teal-500/30'}`}>
                        <p className={`text-sm ${quotaExceeded ? 'text-red-300' : 'text-teal-300'}`}>
                            {quotaExceeded ? (
                                <>
                                    ❌ Você já usou suas {quota.max_analyses} análise(s) gratuita(s) este mês.
                                    <a href="#" className="ml-2 underline font-bold">Faça upgrade para continuar</a>
                                </>
                            ) : (
                                <>
                                    ✅ Você tem {quota.max_analyses - quota.analyses_count} análise(s) disponível(is) este mês
                                </>
                            )}
                        </p>
                    </div>
                )}

                {/* Upload Area */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 mb-6">
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
              ${isDragActive ? 'border-teal-400 bg-teal-500/10' : 'border-slate-600 hover:border-teal-500/50'}
              ${(isLoading || quotaExceeded) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
                    >
                        <input {...getInputProps()} />

                        <div className="flex flex-col items-center gap-4">
                            <svg className="w-16 h-16 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>

                            {uploadedFile ? (
                                <div className="text-center">
                                    <p className="text-teal-400 font-bold text-lg">{uploadedFile.name}</p>
                                    <p className="text-slate-500 text-sm mt-1">
                                        {(uploadedFile.size / 1024).toFixed(2)} KB
                                    </p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setUploadedFile(null);
                                        }}
                                        className="mt-2 text-red-400 text-sm hover:text-red-300"
                                    >
                                        Remover arquivo
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-slate-300 text-lg font-medium">
                                        {isDragActive ? 'Solte o arquivo aqui' : 'Arraste seu currículo aqui'}
                                    </p>
                                    <p className="text-slate-500 text-sm mt-2">
                                        ou clique para selecionar
                                    </p>
                                    <p className="text-slate-600 text-xs mt-4">
                                        Formatos aceitos: PDF, DOCX (máx. 5MB)
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Target Career (Optional) */}
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Área/Cargo Alvo (opcional)
                        </label>
                        <input
                            type="text"
                            value={targetCareer}
                            onChange={(e) => setTargetCareer(e.target.value)}
                            placeholder="Ex: Desenvolvedor Full Stack, Analista de Dados..."
                            className="w-full p-3 bg-slate-900/80 border border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors text-slate-200 placeholder-slate-500"
                            disabled={isLoading}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Informe para receber sugestões mais específicas
                        </p>
                    </div>

                    {/* Privacy Checkbox */}
                    <div className="mt-6 flex items-start gap-3">
                        <input
                            type="checkbox"
                            id="optInSave"
                            checked={optInSave}
                            onChange={(e) => setOptInSave(e.target.checked)}
                            className="mt-1 w-4 h-4 text-teal-500 bg-slate-900 border-slate-600 rounded focus:ring-teal-500"
                            disabled={isLoading}
                        />
                        <label htmlFor="optInSave" className="text-sm text-slate-400">
                            Concordo em salvar meu currículo e análise para melhorar as recomendações futuras.
                            Seus dados são privados e seguros.
                        </label>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Analyze Button */}
                    <button
                        onClick={handleAnalyze}
                        disabled={!uploadedFile || isLoading || quotaExceeded}
                        className="w-full mt-6 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white text-lg font-bold rounded-xl transition-all shadow-xl shadow-teal-500/20 hover:shadow-teal-500/40 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Analisando...
                            </>
                        ) : (
                            <>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Analisar com IA
                            </>
                        )}
                    </button>
                </div>

                {/* Features */}
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4">
                        <div className="text-teal-400 mb-2">✓</div>
                        <h3 className="text-white font-bold mb-1">Análise Completa</h3>
                        <p className="text-slate-400 text-sm">Score detalhado e feedback por seção</p>
                    </div>
                    <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4">
                        <div className="text-teal-400 mb-2">✓</div>
                        <h3 className="text-white font-bold mb-1">Reescrita Inteligente</h3>
                        <p className="text-slate-400 text-sm">IA reescreve seções fracas automaticamente</p>
                    </div>
                    <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4">
                        <div className="text-teal-400 mb-2">✓</div>
                        <h3 className="text-white font-bold mb-1">Comparação</h3>
                        <p className="text-slate-400 text-sm">Veja como seu CV se compara aos melhores</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
