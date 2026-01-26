import React, { useState, useEffect } from 'react';
import { RocketIcon, Clock, ChevronRight, Star, LogOut, User, PlusCircle, BookOpen, Shield, Scale, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabaseService, getFavorites, removeFromFavorites, getCareerComparisons, deleteCareerComparison, SavedComparison } from '../services/supabaseService';
import { CareerPlan } from '../types';
import { UsageStatsPanel } from './UsageStatsPanel';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

interface SubscriberDashboardProps {
    user: any;
    onLogout: () => void;
    onLoadPlan: (plan: CareerPlan, title: string, description: string) => void;
    onNewTest: () => void;
    onOpenCatalog: () => void;
    onStartExploration: () => void;
    onBack?: () => void;
    isAdmin?: boolean;
    onOpenAdmin?: () => void;
    onOpenCVAnalyzer?: () => void;
}

export const SubscriberDashboard: React.FC<SubscriberDashboardProps> = ({
    user,
    onLogout,
    onLoadPlan,
    onNewTest,
    onOpenCatalog,
    onStartExploration,
    onBack,
    isAdmin,
    onOpenAdmin,
    onOpenCVAnalyzer
}) => {
    const navigate = useNavigate();
    const [hasFullAccess, setHasFullAccess] = useState(false);
    const [savedPlans, setSavedPlans] = useState<any[]>([]);
    const [favorites, setFavorites] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [removingCareerIds, setRemovingCareerIds] = useState<Set<string>>(new Set());
    const [comparisons, setComparisons] = useState<SavedComparison[]>([]);
    const [deletingComparisonId, setDeletingComparisonId] = useState<string | null>(null);
    const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

    const dedupeFavorites = (items: any[]) => {
        const byCareerId = new Map<string, any>();
        for (const item of items || []) {
            const careerId = item?.career_id;
            if (!careerId) continue;

            const existing = byCareerId.get(careerId);
            if (!existing) {
                byCareerId.set(careerId, item);
                continue;
            }

            const existingDate = new Date(existing.created_at || 0).getTime();
            const currentDate = new Date(item.created_at || 0).getTime();
            if (currentDate >= existingDate) byCareerId.set(careerId, item);
        }
        return Array.from(byCareerId.values());
    };

    useEffect(() => {
        const fetchData = async () => {
            if (user) {
                setIsLoading(true);
                try {
                    const [plans, favs, fullAccess, comps] = await Promise.all([
                        supabaseService.getCareerPlans(user.id),
                        getFavorites(),
                        import('../services/roleService').then(m => m.roleService.hasFullAccess()),
                        getCareerComparisons().catch(() => [])
                    ]);
                    setSavedPlans(plans || []);
                    setFavorites(dedupeFavorites(favs || []));
                    setHasFullAccess(fullAccess);
                    setComparisons(comps || []);
                } catch (error) {
                    console.error("Erro ao buscar dados do dashboard:", error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchData();
    }, [user]);

    const openFavoriteDetails = (fav: any) => {
        const query = fav?.career_id || fav?.metadata?.title || '';
        const category = fav?.metadata?.category || '';
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (category) params.set('category', category);
        params.set('autoOpen', '1');
        navigate(`/explore?${params.toString()}`, { state: { from: '/dashboard' } });
    };

    const handleRemoveFavorite = async (careerId: string) => {
        if (!careerId) return;
        setRemovingCareerIds(prev => new Set(prev).add(careerId));

        // Optimistic UI
        const previous = favorites;
        setFavorites(prev => prev.filter(f => f?.career_id !== careerId));

        try {
            await removeFromFavorites(careerId);
        } catch (error) {
            console.error('Erro ao remover favorito:', error);
            setFavorites(previous);
            alert('Não foi possível remover dos favoritos. Tente novamente.');
        } finally {
            setRemovingCareerIds(prev => {
                const next = new Set(prev);
                next.delete(careerId);
                return next;
            });
        }
    };

    const userName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Assinante';

    const handleDeletePlan = async (planId: string) => {
        if (!planId) return;
        if (deletingPlanId) return;
        if (!confirm('Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.')) return;

        setDeletingPlanId(planId);

        const previous = savedPlans;
        setSavedPlans(prev => prev.filter(p => p?.id !== planId));

        try {
            await supabaseService.deleteCareerPlan(planId);
        } catch (err) {
            console.error('Erro ao excluir plano:', err);
            setSavedPlans(previous);
            alert('Não foi possível excluir o plano. Tente novamente.');
        } finally {
            setDeletingPlanId(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
            <header className="bg-slate-800/50 border-b border-slate-700 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="mr-2 p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                                title="Voltar para Home"
                            >
                                <ArrowLeftIcon className="w-5 h-5" />
                            </button>
                        )}
                        <div className="p-2 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl shadow-lg shadow-teal-500/20">
                            <RocketIcon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 hidden sm:inline">
                            Área do Assinante
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        {isAdmin && onOpenAdmin && (
                            <button
                                onClick={onOpenAdmin}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all shadow-lg shadow-purple-500/20 text-sm font-bold hover:scale-105"
                            >
                                <Shield className="w-4 h-4" />
                                Painel Admin
                            </button>
                        )}
                        <div className="flex items-center gap-3 px-4 py-2 bg-slate-800 rounded-full border border-slate-700">
                            <User className="w-4 h-4 text-teal-400" />
                            <span className="text-sm font-medium text-slate-300">{userName}</span>
                        </div>
                        <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-800" title="Sair">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
                <section className="grid gap-6">
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 rounded-2xl border border-slate-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                        <h1 className="text-3xl font-bold text-white mb-4 relative z-10 font-outfit">Bem-vindo de volta, {userName}!</h1>
                        <p className="text-slate-400 max-w-xl relative z-10">Continue sua jornada de descoberta profissional. Seus planos e carreiras favoritas estão salvos aqui.</p>
                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10 w-full">
                            <button onClick={onNewTest} className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 hover:-translate-y-1">
                                <PlusCircle className="w-5 h-5" />
                                Novo Teste
                            </button>
                            <button onClick={onStartExploration} className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all border border-slate-600 flex items-center justify-center gap-2 hover:-translate-y-1">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Explorar Carreiras
                            </button>
                            <button onClick={onOpenCatalog} className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all border border-slate-600 flex items-center justify-center gap-2 hover:-translate-y-1">
                                <BookOpen className="w-5 h-5" />
                                Catálogo
                            </button>
                            {onOpenCVAnalyzer && (
                                <button
                                    onClick={onOpenCVAnalyzer}
                                    className="px-6 py-3 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 hover:-translate-y-1 shadow-lg shadow-sky-500/20"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Analisar CV
                                </button>
                            )}
                            <button
                                onClick={() => navigate('/comparar', { state: { from: '/dashboard' } })}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 hover:-translate-y-1 shadow-lg shadow-purple-500/20"
                            >
                                <Scale className="w-5 h-5" />
                                Comparar Carreiras
                            </button>
                        </div>
                    </div>
                </section>

                {/* Meus Planos de Carreira */}
                {savedPlans.length > 0 && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-medium text-white flex items-center gap-3 tracking-tight font-outfit">
                                <div className="p-2 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl shadow-lg shadow-teal-500/20">
                                    <RocketIcon className="w-6 h-6 text-white" />
                                </div>
                                Meus Planos de Carreira
                            </h2>
                        </div>
                        {isLoading ? (
                            <div className="grid md:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-48 bg-slate-800/50 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : savedPlans.length > 0 ? (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {savedPlans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 hover:border-teal-500/30 transition-all duration-500 group relative overflow-hidden shadow-2xl hover:-translate-y-2"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />

                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-xl font-medium text-white mb-2 line-clamp-1 group-hover:text-teal-300 transition-colors tracking-tight font-outfit">
                                                    {plan.career_title}
                                                </h3>
                                                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(plan.created_at).toLocaleDateString('pt-BR')}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleDeletePlan(plan.id)}
                                                    disabled={deletingPlanId === plan.id}
                                                    className="p-3 bg-slate-900/50 rounded-2xl border border-white/5 shadow-inner hover:bg-red-500/10 hover:border-red-500/30 transition-all group/delete disabled:opacity-50"
                                                    title="Excluir plano"
                                                >
                                                    <Trash2 className="w-5 h-5 text-slate-500 group-hover/delete:text-red-400 transition-colors" />
                                                </button>
                                                <div className="p-3 bg-slate-900/50 rounded-2xl border border-white/5 shadow-inner">
                                                    <RocketIcon className="w-5 h-5 text-teal-400 scale-x-[-1]" />
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-slate-400 text-sm mb-8 line-clamp-2 relative z-10 leading-relaxed min-h-[40px]">
                                            {plan.career_description || "Plano de carreira personalizado gerado por nossa IA para guiar seus próximos passos."}
                                        </p>

                                        <button
                                            onClick={() => navigate(`/acompanhamento/${plan.id}`, { state: { from: '/dashboard' } })}
                                            className="w-full py-4 bg-teal-500/10 hover:bg-teal-500 text-teal-400 hover:text-slate-900 rounded-2xl text-sm font-bold tracking-tight transition-all flex items-center justify-center gap-2 group/btn active:scale-95"
                                        >
                                            Ver Plano Completo
                                            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-800 border-dashed">
                                <p className="text-slate-400 mb-4">Você ainda não gerou nenhum plano de carreira.</p>
                                <button onClick={onNewTest} className="text-teal-400 hover:text-teal-300 font-medium hover:underline">Começar um teste agora</button>
                            </div>
                        )}
                    </section>
                )}

                {/* API Usage Monitoring Section (Admin only) */}
                {isAdmin && (
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                📊 Monitoramento de API
                            </h2>
                        </div>
                        <UsageStatsPanel />
                    </section>
                )}

                {/* Minhas Comparações */}
                {comparisons.length > 0 && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-medium text-white flex items-center gap-3 tracking-tight font-outfit">
                                <div className="p-2 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-xl shadow-lg shadow-purple-500/20">
                                    <Scale className="w-6 h-6 text-white" />
                                </div>
                                Minhas Comparações
                            </h2>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {comparisons.map((comp) => {
                                const careerNames = comp.careers.map((c: any) => c.name).join(' vs ');
                                return (
                                    <div
                                        key={comp.id}
                                        className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 hover:border-purple-500/30 transition-all duration-500 group relative overflow-hidden shadow-2xl hover:-translate-y-2"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />

                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-xl font-medium text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors tracking-tight font-outfit">
                                                    {careerNames}
                                                </h3>
                                                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(comp.created_at).toLocaleDateString('pt-BR')} - {comp.careers.length} carreiras
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (!confirm('Tem certeza que deseja excluir esta comparação?')) return;
                                                    setDeletingComparisonId(comp.id);
                                                    try {
                                                        await deleteCareerComparison(comp.id);
                                                        setComparisons(prev => prev.filter(c => c.id !== comp.id));
                                                    } catch (err) {
                                                        console.error('Error deleting comparison:', err);
                                                    } finally {
                                                        setDeletingComparisonId(null);
                                                    }
                                                }}
                                                disabled={deletingComparisonId === comp.id}
                                                className="p-3 bg-slate-900/50 rounded-2xl border border-white/5 shadow-inner hover:bg-red-500/10 hover:border-red-500/30 transition-all group/delete"
                                                title="Excluir comparação"
                                            >
                                                {deletingComparisonId === comp.id ? (
                                                    <div className="w-5 h-5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-5 h-5 text-slate-500 group-hover/delete:text-red-400 transition-colors" />
                                                )}
                                            </button>
                                        </div>

                                        <p className="text-slate-400 text-sm mb-8 line-clamp-2 relative z-10 leading-relaxed min-h-[40px]">
                                            {comp.recommendation}
                                        </p>

                                        <button
                                            onClick={() => navigate('/comparar', { state: { from: '/dashboard', savedComparison: comp } })}
                                            className="w-full py-4 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white rounded-2xl text-sm font-bold tracking-tight transition-all flex items-center justify-center gap-2 group/btn active:scale-95"
                                        >
                                            Ver Comparação Completa
                                            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Star className="w-6 h-6 text-yellow-400" />
                            Favoritos
                        </h2>
                    </div>
                    {isLoading ? (
                        <div className="grid md:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : favorites.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {favorites.map((fav) => (
                                <div key={fav.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-yellow-500/50 transition-all group">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-base font-bold text-white line-clamp-1">{fav.metadata?.title || fav.career_id}</h3>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFavorite(fav.career_id)}
                                            disabled={removingCareerIds.has(fav.career_id)}
                                            className="p-1 rounded hover:bg-slate-700/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Remover dos favoritos"
                                            aria-label="Remover dos favoritos"
                                        >
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-3">Salvo em {new Date(fav.created_at).toLocaleDateString('pt-BR')}</p>
                                    <div className="text-xs text-slate-400 italic mb-4">{fav.metadata?.category || "Carreira"}</div>
                                    <button
                                        type="button"
                                        onClick={() => openFavoriteDetails(fav)}
                                        className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 group-hover:bg-yellow-500/10 group-hover:text-yellow-400"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        Ver Detalhes
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-800 border-dashed">
                            <p className="text-slate-400">Você ainda não favoritou nenhuma carreira.</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};
