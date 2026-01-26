import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchCareerDetails, fetchCareerDetailsStreaming } from '../services/geminiService';
import { CareerDetails } from '../types';
import { SearchIcon } from './icons/SearchIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { SalaryIcon } from './icons/SalaryIcon';
import { MarketIcon } from './icons/MarketIcon';
import { SkillsIcon } from './icons/SkillsIcon';
import { FavoriteButton } from './FavoriteButton';

const CATEGORIES = [
  "Tecnologia", "Saúde", "Criativo", "Negócios",
  "Educação", "Engenharia", "Ciências", "Humanas",
  "Vendas", "Marketing", "Jurídico", "Financeiro"
];

interface ExploreCareersStepProps {
  onBack: () => void;
}

const ExploreCareersStep: React.FC<ExploreCareersStepProps> = ({ onBack }) => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [results, setResults] = useState<CareerDetails[]>([]);
  const [selectedCareer, setSelectedCareer] = useState<CareerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [lastQuery, setLastQuery] = useState({ query: '', category: '' });
  const observerTarget = useRef<HTMLDivElement>(null);
  const lastAppliedSearchRef = useRef<string>('');
  const autoOpenFirstRef = useRef(false);
  const searchRequestIdRef = useRef(0);

  // Allow ESC to close details
  useEffect(() => {
    if (!selectedCareer) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedCareer(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedCareer]);

  const handleSearch = useCallback(async (query: string, category: string, offset: number = 0, append: boolean = false) => {
    if (!query && !category) return;

    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setResults([]);
      setCurrentOffset(0);
      setHasMore(true);
    }

    const requestId = ++searchRequestIdRef.current;

    setError(null);
    try {
      console.log(`Searching (Streaming) for: "${query}" in category: "${category}" with offset: ${offset} [ID: ${requestId}]`);

      const careerDetails = await fetchCareerDetailsStreaming(
        query,
        category,
        offset,
        (partialCareers) => {
          // Ignore results if a newer request has started
          if (requestId !== searchRequestIdRef.current) return;

          if (append) {
            setResults(prev => {
              // Replace only the "newly loading" chunk
              const base = prev.slice(0, offset);
              return [...base, ...partialCareers];
            });
          } else {
            setResults(partialCareers);

            if (offset === 0 && autoOpenFirstRef.current && partialCareers.length > 0) {
              setSelectedCareer(partialCareers[0]);
            }
          }
        }
      );

      // Final check before marking as done
      if (requestId !== searchRequestIdRef.current) return;

      console.log("Final search results:", careerDetails);

      if (offset === 0 && autoOpenFirstRef.current && careerDetails.length > 0) {
        autoOpenFirstRef.current = false;
      }

      // Se retornou menos de 3 resultados, não há mais para carregar
      if (careerDetails.length < 3) {
        setHasMore(false);
      }

      setLastQuery({ query, category });
    } catch (err) {
      console.error("Search error:", err);
      setError('Não foi possível buscar as carreiras. Tente novamente.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Support deep links like /explore?q=Desenvolvedor&category=Tecnologia&autoOpen=1
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    const category = params.get('category') || '';
    const autoOpen = params.get('autoOpen') === '1';

    const signature = `${q}__${category}__${autoOpen}`;
    if (!q && !category) return;
    if (lastAppliedSearchRef.current === signature) return;
    lastAppliedSearchRef.current = signature;

    setSearchTerm(q);
    setActiveCategory(category);
    autoOpenFirstRef.current = autoOpen;
    handleSearch(q, category);
  }, [location.search, handleSearch]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading && !selectedCareer) {
      const newOffset = currentOffset + 3;
      setCurrentOffset(newOffset);
      handleSearch(lastQuery.query, lastQuery.category, newOffset, true);
    }
  }, [isLoadingMore, hasMore, isLoading, currentOffset, lastQuery, handleSearch, selectedCareer]);

  // Intersection Observer para detectar quando chegar ao final
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && results.length > 0 && !selectedCareer) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoadingMore, results.length, loadMore]);

  const handleCategoryClick = (category: string) => {
    const newCategory = activeCategory === category ? '' : category;
    setActiveCategory(newCategory);
    handleSearch(searchTerm, newCategory);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchTerm, activeCategory);
  }

  const memoizedResults = useMemo(() => (
    results.map(career => (
      <div key={career.title} className="relative bg-slate-800/40 p-6 rounded-xl border border-slate-800/50 hover:border-teal-500 transition-all duration-300 cursor-pointer backdrop-blur-sm transform hover:-translate-y-1">
        <div className="absolute top-4 right-4 z-10">
          <FavoriteButton careerId={career.title} careerTitle={career.title} size="md" />
        </div>
        <div onClick={() => setSelectedCareer(career)}>
          <span className="text-xs bg-teal-500/20 text-teal-300 py-1 px-2 rounded-full">{career.category}</span>
          <h3 className="text-xl font-bold text-slate-100 mt-3 mb-2 pr-10">{career.title}</h3>
          <p className="text-slate-400 text-sm line-clamp-3">{career.description}</p>
        </div>
      </div>
    ))
  ), [results]);

  return (
    <div className="min-h-screen bg-slate-900 p-8 w-full animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-400">
          Explore Carreiras
        </h2>
        <button onClick={onBack} className="text-sm text-slate-400 hover:text-teal-400 transition-colors">Voltar</button>
      </div>

      <form onSubmit={handleSubmit} className="relative mb-6 flex gap-2">
        <div className="relative flex-grow">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por cargo, habilidade ou área..."
            className="w-full p-3 pl-10 bg-slate-900/60 border-2 border-slate-800 focus:border-teal-500 rounded-lg outline-none transition-all text-slate-200"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '...' : <SearchIcon className="w-5 h-5" />}
          <span className="hidden sm:inline">Buscar</span>
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`py-1.5 px-4 rounded-full text-sm font-semibold transition-all ${activeCategory === cat ? 'bg-teal-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading && <div className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500 mx-auto"></div><p className="mt-4 text-slate-400">Buscando carreiras...</p></div>}
      {error && <p className="text-center text-red-400 py-10">{error}</p>}

      {!isLoading && !error && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[300px]">
            {results.length > 0 ? memoizedResults : <p className="text-center text-slate-400 md:col-span-2 lg:col-span-3 pt-10">Pesquise ou selecione uma categoria para começar.</p>}
          </div>

          {/* Elemento observador para scroll infinito */}
          {results.length > 0 && (
            <div ref={observerTarget} className="w-full py-4">
              {isLoadingMore && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
                  <p className="mt-2 text-slate-400 text-sm">Carregando mais carreiras...</p>
                </div>
              )}
              {!hasMore && !isLoadingMore && (
                <p className="text-center text-slate-500 text-sm">Você viu todas as carreiras disponíveis para esta busca.</p>
              )}
            </div>
          )}
        </>
      )}

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
                  <button onClick={() => setSelectedCareer(null)} className="text-slate-500 hover:text-white">&times;</button>
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

export default ExploreCareersStep;