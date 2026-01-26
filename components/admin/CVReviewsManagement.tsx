import React, { useState, useEffect } from 'react';
import { Trash2, FileText, Search, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { cvAnalyzerService } from '../../services/cvAnalyzerService';

interface CVAnalysisRecord {
    id: string;
    user_id: string;
    filename: string;
    score: number;
    status: 'completed' | 'processing' | 'failed';
    created_at: string;
    file_type: string;
}

export const CVReviewsManagement: React.FC = () => {
    const [analyses, setAnalyses] = useState<CVAnalysisRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        loadAnalyses();
    }, []);

    const loadAnalyses = async () => {
        try {
            setIsLoading(true);
            const data = await cvAnalyzerService.getAllAnalyses();
            setAnalyses(data);
        } catch (err) {
            console.error('Erro ao carregar análises:', err);
            setError('Não foi possível carregar o histórico de análises.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta análise? Esta ação não pode ser desfeita.')) {
            return;
        }

        setDeletingId(id);
        try {
            await cvAnalyzerService.deleteAnalysis(id);
            setAnalyses(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.error('Erro ao excluir análise:', err);
            alert('Erro ao excluir análise. Tente novamente.');
        } finally {
            setDeletingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <span className="flex items-center gap-1 text-emerald-400 text-xs bg-emerald-400/10 px-2 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> Concluído</span>;
            case 'failed':
                return <span className="flex items-center gap-1 text-red-400 text-xs bg-red-400/10 px-2 py-1 rounded-full"><AlertCircle className="w-3 h-3" /> Falhou</span>;
            default:
                return <span className="flex items-center gap-1 text-amber-400 text-xs bg-amber-400/10 px-2 py-1 rounded-full"><Clock className="w-3 h-3" /> Processando</span>;
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 8) return 'text-emerald-400';
        if (score >= 5) return 'text-amber-400';
        return 'text-red-400';
    };

    const filteredAnalyses = analyses.filter(analysis =>
        analysis.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.user_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-teal-400" />
                        Análises de Currículo
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Gerencie todas as análises realizadas na plataforma
                    </p>
                </div>
                <div className="text-slate-400 text-sm">
                    Total: <span className="text-white font-bold">{analyses.length}</span>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Buscar por nome do arquivo ou ID do usuário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                />
            </div>

            {/* Table */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-slate-400">
                        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        Carregando análises...
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-400 bg-red-500/10 m-4 rounded-lg">
                        {error}
                    </div>
                ) : filteredAnalyses.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma análise encontrada.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Data</th>
                                    <th className="px-6 py-4">Arquivo</th>
                                    <th className="px-6 py-4">Usuário</th>
                                    <th className="px-6 py-4">Nota</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {filteredAnalyses.map((analysis) => (
                                    <tr key={analysis.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 text-slate-300 text-sm">
                                            {new Date(analysis.created_at).toLocaleDateString('pt-BR')}
                                            <span className="block text-xs text-slate-500">
                                                {new Date(analysis.created_at).toLocaleTimeString('pt-BR')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-slate-700 rounded-lg">
                                                    <FileText className="w-4 h-4 text-teal-400" />
                                                </div>
                                                <div>
                                                    <p className="text-slate-200 font-medium text-sm truncate max-w-[200px]" title={analysis.filename}>
                                                        {analysis.filename}
                                                    </p>
                                                    <p className="text-xs text-slate-500 uppercase">{analysis.file_type}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                                            {analysis.user_id.slice(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4">
                                            {analysis.score !== null ? (
                                                <span className={`font-bold ${getScoreColor(analysis.score)}`}>
                                                    {analysis.score.toFixed(1)}
                                                </span>
                                            ) : (
                                                <span className="text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(analysis.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(analysis.id)}
                                                disabled={deletingId === analysis.id}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                                title="Excluir análise"
                                            >
                                                {deletingId === analysis.id ? (
                                                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
