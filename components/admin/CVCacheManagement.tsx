import React, { useState, useEffect } from 'react';
import { Trash2, Database, Search, RefreshCw } from 'lucide-react';
import { cvAnalyzerService } from '../../services/cvAnalyzerService';

interface CacheEntry {
    cache_key: string;
    user_id: string;
    text_hash: string;
    metadata_hash: string;
    metadata: {
        fileName: string;
        fileSize: number;
        lastModified: number;
    };
    analysis_result: {
        score: number;
    };
    created_at: string;
    updated_at: string;
}

export const CVCacheManagement: React.FC = () => {
    const [caches, setCaches] = useState<CacheEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingKey, setDeletingKey] = useState<string | null>(null);

    useEffect(() => {
        loadCaches();
    }, []);

    const loadCaches = async () => {
        try {
            setIsLoading(true);
            const data = await cvAnalyzerService.getAllCaches();
            setCaches(data);
        } catch (err) {
            console.error('Erro ao carregar caches:', err);
            setError('Não foi possível carregar os caches.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (cacheKey: string, fileName: string) => {
        if (!confirm(`Tem certeza que deseja limpar o cache de "${fileName}"?\n\nNa próxima análise deste arquivo, a IA irá processar do zero.`)) {
            return;
        }

        setDeletingKey(cacheKey);
        try {
            await cvAnalyzerService.deleteCache(cacheKey);
            setCaches(prev => prev.filter(c => c.cache_key !== cacheKey));
        } catch (err) {
            console.error('Erro ao excluir cache:', err);
            alert('Erro ao excluir cache. Tente novamente.');
        } finally {
            setDeletingKey(null);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 50) return 'text-amber-400';
        return 'text-red-400';
    };

    const filteredCaches = caches.filter(cache =>
        cache.metadata?.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cache.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cache.cache_key.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Database className="w-6 h-6 text-teal-400" />
                        Cache de Análises
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Gerencie os caches de análises. Ao excluir, a próxima análise do mesmo arquivo será reprocessada do zero.
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-slate-400 text-sm">
                        Total: <span className="text-white font-bold">{caches.length}</span> cache(s)
                    </div>
                    <button
                        onClick={loadCaches}
                        disabled={isLoading}
                        className="mt-2 text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
                    >
                        <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Buscar por nome do arquivo, hash ou ID do usuário..."
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
                        Carregando caches...
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-400 bg-red-500/10 m-4 rounded-lg">
                        {error}
                    </div>
                ) : filteredCaches.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum cache encontrado.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Data de Criação</th>
                                    <th className="px-6 py-4">Arquivo</th>
                                    <th className="px-6 py-4">Usuário</th>
                                    <th className="px-6 py-4">Hash do Texto</th>
                                    <th className="px-6 py-4">Nota</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {filteredCaches.map((cache) => (
                                    <tr key={cache.cache_key} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 text-slate-300 text-sm">
                                            {new Date(cache.created_at).toLocaleDateString('pt-BR')}
                                            <span className="block text-xs text-slate-500">
                                                {new Date(cache.created_at).toLocaleTimeString('pt-BR')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-slate-700 rounded-lg">
                                                    <Database className="w-4 h-4 text-teal-400" />
                                                </div>
                                                <div>
                                                    <p className="text-slate-200 font-medium text-sm truncate max-w-[200px]" title={cache.metadata?.fileName || 'N/A'}>
                                                        {cache.metadata?.fileName || 'N/A'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {cache.metadata?.fileSize ? `${(cache.metadata.fileSize / 1024).toFixed(1)} KB` : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                                            {cache.user_id.slice(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                                            {cache.text_hash.slice(0, 12)}...
                                        </td>
                                        <td className="px-6 py-4">
                                            {cache.analysis_result?.score !== null && cache.analysis_result?.score !== undefined ? (
                                                <span className={`font-bold ${getScoreColor(cache.analysis_result.score)}`}>
                                                    {cache.analysis_result.score.toFixed(0)}
                                                </span>
                                            ) : (
                                                <span className="text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(cache.cache_key, cache.metadata?.fileName || 'este arquivo')}
                                                disabled={deletingKey === cache.cache_key}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                                title="Limpar cache (forçar reprocessamento)"
                                            >
                                                {deletingKey === cache.cache_key ? (
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
