import React, { useState, useEffect } from 'react';
import { getFavorites, removeFromFavorites } from '../services/supabaseService';
import { fetchCareerDetails } from '../services/geminiService';
import { CareerDetails } from '../types';
import { HeartIcon } from './icons/HeartIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { SalaryIcon } from './icons/SalaryIcon';
import { MarketIcon } from './icons/MarketIcon';
import { SkillsIcon } from './icons/SkillsIcon';

interface Favorite {
    id: string;
    career_id: string;
    metadata: {
        title?: string;
        category?: string;
        description?: string;
    };
    created_at: string;
}

interface MyCareersStepProps {
    onBack: () => void;
}

export const MyCareersStep: React.FC<MyCareersStepProps> = ({ onBack }) => {
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCareer, setSelectedCareer] = useState<CareerDetails | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    // Allow ESC to close details
    useEffect(() => {
        if (!selectedCareer) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedCareer(null);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [selectedCareer]);

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getFavorites();
            setFavorites(data);
        } catch (err) {
            console.error('Erro ao carregar favoritos:', err);
            setError('Não foi possível carregar seus favoritos. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = async (careerId: string) => {
        try {
            await removeFromFavorites(careerId);
            setFavorites(prev => prev.filter(f => f.career_id !== careerId));
        } catch (err) {
            console.error('Erro ao remover favorito:', err);
            alert('Erro ao remover favorito. Tente novamente.');
        }
    };

    const handleViewDetails = async (favorite: Favorite) => {
        setIsLoadingDetails(true);
        try {
            const details = await fetchCareerDetails(favorite.career_id, favorite.metadata?.category || '');
            if (details && details.length > 0) {
                setSelectedCareer(details[0]);
            }
        } catch (err) {
            console.error('Erro ao carregar detalhes:', err);
            alert('Não foi possível carregar os detalhes. Tente novamente.');
        } finally {
            setIsLoadingDetails(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-400">
                            Minhas Carreiras
                        </h1>
                        <p className="text-slate-400 mt-2">
                            Carreiras que você salvou para explorar depois
                        </p>
                    </div>
                    <button
                        onClick={onBack}
                        className="text-sm text-slate-400 hover:text-teal-400 transition-colors"
                    >
                        Voltar
                    </button>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
                        <p className="mt-4 text-slate-400">Carregando suas carreiras...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 text-center">
                        <p className="text-red-400">{error}</p>
                        <button
                            onClick={loadFavorites}
                            className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg transition-colors"
                        >
                            Tentar Novamente
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && favorites.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 mx-auto mb-6 bg-slate-800 rounded-full flex items-center justify-center">
                            <HeartIcon className="w-12 h-12 text-slate-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-300 mb-2">
                            Nenhuma carreira salva ainda
                        </h2>
                        <p className="text-slate-500 mb-6">
                            Explore carreiras e clique no coração para salvá-las aqui!
                        </p>
                        <button
                            onClick={onBack}
                            className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-lg transition-colors"
                        >
                            Explorar Carreiras
                        </button>
                    </div>
                )}

                {/* Careers Grid */}
                {!isLoading && !error && favorites.length > 0 && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favorites.map((favorite) => (
                            <div
                                key={favorite.id}
                                className="bg-slate-800/70 border border-slate-700 rounded-xl p-6 hover:border-teal-500 transition-all duration-300 backdrop-blur-sm cursor-pointer"
                                onClick={() => handleViewDetails(favorite)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-xs bg-teal-500/20 text-teal-300 py-1 px-3 rounded-full">
                                        {favorite.metadata?.category || 'Carreira'}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemove(favorite.career_id);
                                        }}
                                        className="text-red-400 hover:text-red-300 transition-colors"
                                        title="Remover dos favoritos"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                </div>

                                <h3 className="text-xl font-bold text-slate-100 mb-2">
                                    {favorite.metadata?.title || favorite.career_id}
                                </h3>

                                {favorite.metadata?.description && (
                                    <p className="text-slate-400 text-sm line-clamp-3 mb-4">
                                        {favorite.metadata.description}
                                    </p>
                                )}

                                <div className="flex items-center text-xs text-slate-500">
                                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Salvo em {new Date(favorite.created_at).toLocaleDateString('pt-BR')}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Stats */}
                {!isLoading && !error && favorites.length > 0 && (
                    <div className="mt-8 text-center">
                        <p className="text-slate-400">
                            Você tem <span className="text-teal-400 font-bold">{favorites.length}</span> carreira{favorites.length !== 1 ? 's' : ''} salva{favorites.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                )}

                {/* Career Details Modal */}
                {selectedCareer && (
                    <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-slate-950/75 to-slate-900/80 z-50" onClick={() => setSelectedCareer(null)}>
                        <div className="absolute inset-0 overflow-y-auto">
                            <div className="min-h-full flex items-start justify-center p-4 sm:p-8">
                                <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[calc(100vh-4rem)] overflow-y-auto p-6 sm:p-8 shadow-2xl my-6" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs bg-teal-500/20 text-teal-300 py-1 px-2 rounded-full">{selectedCareer.category}</span>
                                    <h3 className="text-3xl font-bold text-slate-100 mt-3 mb-2">{selectedCareer.title}</h3>
                                </div>
                                <button onClick={() => setSelectedCareer(null)} className="text-slate-500 hover:text-white text-2xl">&times;</button>
                            </div>
                            <p className="text-slate-300 mb-6">{selectedCareer.description}</p>

                            <div className="space-y-4">
                                <DetailSection icon={<BriefcaseIcon />} title="Responsabilidades Diárias" items={selectedCareer.dailyResponsibilities} />
                                <DetailSection icon={<SkillsIcon />} title="Habilidades Necessárias" items={selectedCareer.requiredSkills} />
                                <InfoSection icon={<SalaryIcon />} title="Faixa Salarial" content={selectedCareer.salaryRange} />
                                <InfoSection icon={<MarketIcon />} title="Demanda de Mercado" content={selectedCareer.marketDemand} />
                            </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading Details Overlay */}
                {isLoadingDetails && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
                            <p className="mt-4 text-slate-400">Carregando detalhes...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const DetailSection: React.FC<{ icon: React.ReactElement<{ className?: string }>, title: string, items: string[] }> = ({ icon, title, items }) => (
    <div>
        <h4 className="flex items-center text-lg font-semibold text-slate-200 mb-2">
            <span className="text-teal-400 mr-2">{React.cloneElement(icon, { className: "w-5 h-5" })}</span>
            {title}
        </h4>
        <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
            {items.map(item => <li key={item}>{item}</li>)}
        </ul>
    </div>
);

const InfoSection: React.FC<{ icon: React.ReactElement<{ className?: string }>, title: string, content: string }> = ({ icon, title, content }) => (
    <div>
        <h4 className="flex items-center text-lg font-semibold text-slate-200 mb-2">
            <span className="text-teal-400 mr-2">{React.cloneElement(icon, { className: "w-5 h-5" })}</span>
            {title}
        </h4>
        <p className="text-slate-300 pl-7">{content}</p>
    </div>
);
