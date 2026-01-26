import React, { useState, useEffect } from 'react';
import { catalogService } from '../services/catalogService';
import { CatalogItem, CatalogType } from '../types/catalog';

interface CatalogStepProps {
    onBack: () => void;
}

export const CatalogStep: React.FC<CatalogStepProps> = ({ onBack }) => {
    const [items, setItems] = useState<CatalogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeType, setActiveType] = useState<CatalogType | 'all'>('all');
    const [activeCategory, setActiveCategory] = useState<string>('Todos');
    const [searchQuery, setSearchQuery] = useState('');

    const FINAL_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80';

    const getFallbackImage = (item: CatalogItem) => {
        const byCategory: Record<string, string> = {
            'Programação': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
            'Dados': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
            'Design': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1200&q=80',
            'Marketing': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
            'Carreira': 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80'
        };

        const byType: Record<CatalogType, string> = {
            course: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
            book: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
            tool: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80',
            mentorship: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
            event: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
        };

        return byCategory[item.category] || byType[item.type] || FINAL_FALLBACK_IMAGE;
    };

    const getImageSrc = (item: CatalogItem) => item.image_url || getFallbackImage(item);

    useEffect(() => {
        fetchItems();
    }, [activeType, activeCategory, searchQuery]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const filters: any = {};
            if (activeType !== 'all') filters.type = activeType;
            if (activeCategory !== 'Todos') filters.category = activeCategory;
            if (searchQuery.trim()) filters.search = searchQuery.trim();

            const data = await catalogService.getItems(filters);
            setItems(data);
        } catch (error) {
            console.error('Failed to fetch catalog:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTypeLabel = (type: CatalogType) => {
        switch (type) {
            case 'course': return 'Curso';
            case 'book': return 'Livro';
            case 'tool': return 'Ferramenta';
            case 'mentorship': return 'Mentoria';
            case 'event': return 'Evento';
            default: return type;
        }
    };

    const getTypeColor = (type: CatalogType) => {
        switch (type) {
            case 'course': return 'text-teal-400 bg-teal-400/10';
            case 'book': return 'text-amber-400 bg-amber-400/10';
            case 'tool': return 'text-sky-400 bg-sky-400/10';
            case 'mentorship': return 'text-purple-400 bg-purple-400/10';
            case 'event': return 'text-rose-400 bg-rose-400/10';
            default: return 'text-slate-400 bg-slate-400/10';
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Voltar
                    </button>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Marketplace de Carreira</h1>
                    <div className="w-20"></div>
                </div>

                {/* Type Filters */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    <button
                        onClick={() => setActiveType('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeType === 'all'
                            ? 'bg-white text-slate-900 shadow-lg shadow-white/10'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        Todos
                    </button>
                    {(['course', 'book', 'tool', 'mentorship'] as CatalogType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => setActiveType(type)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeType === type
                                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            {getTypeLabel(type)}s
                        </button>
                    ))}
                </div>

                {/* Category Filters */}
                <div className="flex gap-4 mb-8 overflow-x-auto pb-4 border-b border-slate-800">
                    {['Todos', 'Programação', 'Dados', 'Design', 'Marketing', 'Carreira'].map((cat, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveCategory(cat)}
                            className={`text-sm font-medium whitespace-nowrap pb-2 border-b-2 transition-colors ${activeCategory === cat
                                ? 'border-teal-400 text-teal-400'
                                : 'border-transparent text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="mb-8">
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Pesquisar no catálogo..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50"
                        aria-label="Pesquisar no catálogo"
                    />
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-20 text-slate-500">
                        <p>Nenhum item encontrado para os filtros selecionados.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {items.map((item) => (
                            <a
                                key={item.id}
                                href={item.link_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-teal-500/50 transition-all hover:-translate-y-1 group flex flex-col h-full"
                            >
                                <div className="h-40 overflow-hidden relative">
                                    <img
                                        src={getImageSrc(item)}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        onError={(e) => {
                                            const img = e.currentTarget;
                                            if (img.src !== FINAL_FALLBACK_IMAGE) {
                                                img.src = FINAL_FALLBACK_IMAGE;
                                            }
                                        }}
                                    />
                                    <div className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-bold backdrop-blur-md ${getTypeColor(item.type)}`}>
                                        {getTypeLabel(item.type)}
                                    </div>
                                    {item.price && (
                                        <div className="absolute bottom-3 left-3 bg-slate-900/90 px-2 py-1 rounded text-xs font-bold text-white">
                                            {item.price}
                                        </div>
                                    )}
                                </div>
                                <div className="p-5 flex flex-col flex-grow">
                                    <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">{item.category}</div>
                                    <h3 className="font-bold text-white mb-2 line-clamp-2">{item.title}</h3>
                                    <p className="text-slate-400 text-sm line-clamp-2 mb-4 flex-grow">{item.description}</p>

                                    <div className="pt-4 border-t border-slate-700 flex items-center justify-between">
                                        <span className="text-teal-400 text-sm font-medium group-hover:underline">
                                            Acessar
                                        </span>
                                        <svg className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
