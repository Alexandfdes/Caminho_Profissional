import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { compareCareers, CareerComparisonResult, generateStepByStepPlan } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { supabaseService, saveCareerComparison } from '../services/supabaseService';
import { roleService } from '../services/roleService';
import { Scale, TrendingUp, Clock, Briefcase, ThumbsUp, ThumbsDown, Sparkles, ArrowLeft, Plus, X, Search, User, Heart, Save, Rocket, CheckCircle } from 'lucide-react';

interface CareerComparatorProps {
    onBack: () => void;
}

// Popular careers for quick selection
const POPULAR_CAREERS = [
    "Desenvolvedor de Software",
    "Engenheiro de Dados",
    "Product Manager",
    "Designer UX/UI",
    "Marketing Digital",
    "Analista Financeiro",
    "Cientista de Dados",
    "Gestor de Projetos",
    "Analista de BI",
    "Consultor de Negócios",
    "DevOps Engineer",
    "Copywriter",
    "Social Media Manager",
    "Analista de RH",
    "Contador"
];

export const CareerComparator: React.FC<CareerComparatorProps> = ({ onBack }) => {
    const [selectedCareers, setSelectedCareers] = useState<string[]>([]);
    const [customCareer, setCustomCareer] = useState('');
    const [isComparing, setIsComparing] = useState(false);
    const [result, setResult] = useState<CareerComparisonResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [favoriteCareers, setFavoriteCareers] = useState<string[]>([]);
    const [userAnswers, setUserAnswers] = useState<Record<string, string> | null>(null);
    const [hasProfile, setHasProfile] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [generatingPlanFor, setGeneratingPlanFor] = useState<string | null>(null);
    const [savedPlans, setSavedPlans] = useState<any[]>([]);
    const [isLoadingPlans, setIsLoadingPlans] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Check if we are loading a saved comparison
        const state = location.state as { savedComparison?: any } | null;
        if (state?.savedComparison) {
            setResult({
                careers: state.savedComparison.careers,
                recommendation: state.savedComparison.recommendation
            });
            setIsSaved(true);
            setSelectedCareers(state.savedComparison.careers.map((c: any) => c.name));
        }
    }, [location.state]);

    useEffect(() => {
        // Load favorite careers and user answers from storage
        const savedState = storageService.loadState();
        if (savedState.top3 && Array.isArray(savedState.top3)) {
            setFavoriteCareers(savedState.top3.map((c: any) => c.profession || c.name || c));
        }
        if (savedState.answers && Object.keys(savedState.answers).length > 0) {
            setUserAnswers(savedState.answers);
            setHasProfile(true);
        }

        const fetchSavedPlans = async () => {
            const user = await storageService.getUser();
            // User from storageService might be simplified UserProfile
            // We need the ID, which might be in metadata or just use an alternative check
            if (user) {
                setIsLoadingPlans(true);
                try {
                    // getCareerPlans handles fetching the current user if no ID is passed or if we use the right service method
                    // Actually supabaseService methods usually prefer getting user internally or we pass the id
                    // Let's use the one that works
                    const currentUser = await supabaseService.getUser();
                    if (currentUser) {
                        const plans = await supabaseService.getCareerPlans(currentUser.id);
                        setSavedPlans(plans || []);
                    }
                } catch (err) {
                    console.error("Error loading plans in comparator:", err);
                } finally {
                    setIsLoadingPlans(false);
                }
            }
        };
        fetchSavedPlans();
    }, []);

    const handleAddCareer = (career: string) => {
        if (selectedCareers.length >= 3) return;
        if (selectedCareers.includes(career)) return;
        setSelectedCareers([...selectedCareers, career]);
    };

    const handleRemoveCareer = (career: string) => {
        setSelectedCareers(selectedCareers.filter(c => c !== career));
    };

    const handleAddCustomCareer = () => {
        if (!customCareer.trim()) return;
        if (selectedCareers.length >= 3) return;
        if (selectedCareers.includes(customCareer.trim())) return;
        setSelectedCareers([...selectedCareers, customCareer.trim()]);
        setCustomCareer('');
    };

    const handleCompare = async () => {
        if (selectedCareers.length < 2) {
            setError("Selecione pelo menos 2 carreiras para comparar.");
            return;
        }

        setIsComparing(true);
        setError(null);

        try {
            // Pass user answers if available for compatibility calculation
            const comparison = await compareCareers(selectedCareers, userAnswers || undefined);
            setResult(comparison);
        } catch (err: any) {
            console.error('Comparison error:', err);
            setError(err.message || 'Erro ao comparar carreiras. Tente novamente.');
        } finally {
            setIsComparing(false);
        }
    };

    const handleNewComparison = () => {
        setResult(null);
        setSelectedCareers([]);
        setError(null);
        setIsSaved(false);
    };

    const handleSaveComparison = async () => {
        if (!result) return;
        setIsSaving(true);
        try {
            await saveCareerComparison(result.careers, result.recommendation);
            setIsSaved(true);
        } catch (err: any) {
            console.error('Error saving comparison:', err);
            setError('Erro ao salvar comparação. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleGeneratePlan = async (careerName: string) => {
        setGeneratingPlanFor(careerName);
        try {
            // Create a minimal career object for the plan generator
            const careerData = result?.careers.find(c => c.name === careerName);
            if (!careerData) throw new Error('Carreira não encontrada');

            const selectedCareer = {
                profession: careerName,
                description: `Profissional de ${careerName}`,
                specialization: '',
                tools: careerData.requiredSkills || [],
                salaryRange: `${careerData.salaryRange.min} - ${careerData.salaryRange.max}`,
                marketDemand: careerData.marketDemand
            };

            // Generate the plan - function expects (answers, career)
            const plan = await generateStepByStepPlan(userAnswers || {}, selectedCareer as any);

            const currentUser = await supabaseService.getUserCached();
            const isSubscriber = currentUser ? await roleService.isSubscriber() : false;

            if (currentUser) {
                const saved = await supabaseService.saveCareerPlan(
                    currentUser.id,
                    plan,
                    careerName,
                    selectedCareer.description
                );

                if (isSubscriber && saved?.id) {
                    navigate(`/acompanhamento/${saved.id}`, { state: { from: '/comparar' } });
                    setGeneratingPlanFor(null);
                    return;
                }
            }

            // Fallback: keep the old local plan view
            localStorage.setItem('app_selected_career', JSON.stringify(selectedCareer));
            localStorage.setItem('app_final_plan', JSON.stringify(plan));
            navigate('/plano');
        } catch (err: any) {
            console.error('Error generating plan:', err);
            setError(`Erro ao gerar plano para ${careerName}. Tente novamente.`);
            setGeneratingPlanFor(null);
        }
    };

    // Format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0
        }).format(value);
    };

    // Get demand color
    const getDemandColor = (demand: string) => {
        const d = demand.toLowerCase();
        if (d.includes('muito alta') || d.includes('alta')) return 'text-emerald-400';
        if (d.includes('crescimento')) return 'text-teal-400';
        if (d.includes('média') || d.includes('estável')) return 'text-yellow-400';
        return 'text-red-400';
    };

    // Get growth color
    const getGrowthColor = (value: number) => {
        if (value >= 8) return 'bg-emerald-500';
        if (value >= 6) return 'bg-teal-500';
        if (value >= 4) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    // Get compatibility color
    const getCompatibilityColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 60) return 'text-teal-400';
        if (score >= 40) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getCompatibilityBgColor = (score: number) => {
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 60) return 'bg-teal-500';
        if (score >= 40) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    if (result) {
        return (
            <div className="min-h-screen bg-slate-900 py-12 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                        <button
                            onClick={handleNewComparison}
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 py-2 px-5 rounded-full border border-white/5 order-2 md:order-1"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Nova Comparação
                        </button>
                        <div className="flex flex-col items-center gap-1 order-1 md:order-2">
                            <div className="flex items-center gap-3">
                                <Scale className="w-10 h-10 text-teal-400 animate-pulse" />
                                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight font-outfit">Veredito Final</h1>
                            </div>
                            <p className="text-slate-500 font-medium">Análise detalhada lado a lado</p>
                        </div>
                        <div className="hidden md:block w-40 order-3" /> {/* Spacer */}
                    </div>

                    {/* Comparison Cards */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {result.careers.map((career, index) => {
                            return (
                            <div
                                key={career.name}
                                className="bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl hover:shadow-teal-500/5 transition-all duration-500 group flex flex-col items-stretch self-stretch h-full animate-in zoom-in-95 fade-in duration-700"
                                style={{ animationDelay: `${index * 150}ms` }}
                            >
                                {/* Career Header */}
                                <div className="bg-gradient-to-br from-teal-500/10 via-sky-500/5 to-transparent p-8 border-b border-white/5 relative">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                                        <Briefcase className="w-12 h-12 text-teal-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-2 group-hover:text-teal-300 transition-colors font-outfit">{career.name}</h2>
                                    {career.compatibilityScore !== undefined && (
                                        <div className="inline-flex items-center gap-2 bg-slate-900/50 py-1.5 px-3 rounded-full border border-white/5 ring-4 ring-slate-900/40">
                                            <Heart className={`w-4 h-4 ${getCompatibilityColor(career.compatibilityScore)}`} />
                                            <span className={`text-xs font-bold uppercase tracking-wider ${getCompatibilityColor(career.compatibilityScore)}`}>
                                                {career.compatibilityScore}% compatível
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 flex-grow flex flex-col justify-between overflow-hidden">
                                    <div className="space-y-6">
                                        {/* Compatibility Score - Only show if available */}
                                        {career.compatibilityScore !== undefined && (
                                            <div className="bg-slate-700/50 rounded-xl p-4">
                                                <div className="flex items-center justify-between text-sm mb-2">
                                                    <span className="flex items-center gap-2 text-slate-400">
                                                        <User className="w-4 h-4" />
                                                        Compatibilidade com Seu Perfil
                                                    </span>
                                                    <span className={`font-bold ${getCompatibilityColor(career.compatibilityScore)}`}>
                                                        {career.compatibilityScore}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-600 rounded-full h-3 mb-2">
                                                    <div
                                                        className={`h-3 rounded-full transition-all ${getCompatibilityBgColor(career.compatibilityScore)}`}
                                                        style={{ width: `${career.compatibilityScore}%` }}
                                                    />
                                                </div>
                                                {career.compatibilityReason && (
                                                    <p className="text-xs text-slate-400 italic">
                                                        {career.compatibilityReason}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        {/* Salary */}
                                        <div>
                                            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                                                <Briefcase className="w-4 h-4" />
                                                Faixa Salarial (Pleno)
                                            </div>
                                            <p className="text-xl font-bold text-emerald-400">
                                                {formatCurrency(career.salaryRange.min)} - {formatCurrency(career.salaryRange.max)}
                                            </p>
                                        </div>

                                        {/* Market Demand */}
                                        <div>
                                            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                                                <TrendingUp className="w-4 h-4" />
                                                Demanda de Mercado
                                            </div>
                                            <p className={`text-base font-semibold ${getDemandColor(career.marketDemand)}`}>
                                                {career.marketDemand}
                                            </p>
                                        </div>

                                        {/* Formation Time */}
                                        <div>
                                            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                                                <Clock className="w-4 h-4" />
                                                Tempo de Formação
                                            </div>
                                            <p className="text-base font-medium text-white">
                                                {career.formationTime}
                                            </p>
                                        </div>

                                        {/* Growth Potential */}
                                        <div>
                                            <div className="flex items-center justify-between text-slate-400 text-sm mb-2">
                                                <span className="flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4" />
                                                    Potencial de Crescimento
                                                </span>
                                                <span className="text-white font-bold">{career.growthPotential}/10</span>
                                            </div>
                                            <div className="w-full bg-slate-700 rounded-full h-3">
                                                <div
                                                    className={`h-3 rounded-full transition-all ${getGrowthColor(career.growthPotential)}`}
                                                    style={{ width: `${career.growthPotential * 10}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Skills */}
                                        <div>
                                            <p className="text-slate-400 text-sm mb-2">Skills Necessárias</p>
                                            <div className="flex flex-wrap gap-2">
                                                {career.requiredSkills.slice(0, 5).map((skill) => (
                                                    <span
                                                        key={skill}
                                                        className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-lg"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Pros */}
                                        <div>
                                            <div className="flex items-center gap-2 text-emerald-400 text-sm mb-2">
                                                <ThumbsUp className="w-4 h-4" />
                                                Vantagens
                                            </div>
                                            <ul className="space-y-1">
                                                {career.pros.map((pro, i) => (
                                                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                                        <span className="text-emerald-400 mt-1">•</span>
                                                        {pro}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Cons */}
                                        <div>
                                            <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
                                                <ThumbsDown className="w-4 h-4" />
                                                Desafios
                                            </div>
                                            <ul className="space-y-1">
                                                {career.cons.map((con, i) => (
                                                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                                        <span className="text-red-400 mt-1">•</span>
                                                        {con}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Generate Plan Button */}
                                        <div className="mt-auto pt-6">
                                            <button
                                                onClick={() => handleGeneratePlan(career.name)}
                                                disabled={generatingPlanFor !== null}
                                                className={`w-full mt-4 px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${generatingPlanFor === career.name
                                                    ? 'bg-purple-600 text-white'
                                                    : generatingPlanFor !== null
                                                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                                        : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/20 hover:-translate-y-0.5'
                                                    }`}
                                            >
                                                {generatingPlanFor === career.name ? (
                                                    <>
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Gerando Plano...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Rocket className="w-5 h-5" />
                                                        E se eu escolher essa?
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            );
                        })}
                    </div>

                    {/* Recommendation */}
                    <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/5 p-6 text-center relative overflow-hidden mb-12 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-sky-500 to-purple-500" />
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-[80px]" />
                        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-sky-500/10 rounded-full blur-[80px]" />

                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 ring-1 ring-teal-500/20 shadow-xl shadow-teal-500/10">
                                <Sparkles className="w-6 h-6 text-teal-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-3 tracking-tight font-outfit">Veredito da IA</h3>
                            <p className="text-base text-slate-300 max-w-4xl mx-auto leading-relaxed font-medium">
                                "{result.recommendation}"
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <button
                            onClick={handleSaveComparison}
                            disabled={isSaving || isSaved}
                            className={`group w-full md:w-auto px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 text-base shadow-2xl ${isSaved
                                ? 'bg-emerald-500 text-slate-900'
                                : isSaving
                                    ? 'bg-slate-700 text-slate-400'
                                    : 'bg-gradient-to-br from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-900 shadow-sky-500/20 active:scale-95'
                                }`}
                        >
                            {isSaved ? (
                                <>
                                    <CheckCircle className="w-6 h-6" />
                                    COMPARAÇÃO SALVA
                                </>
                            ) : isSaving ? (
                                <>
                                    <div className="w-6 h-6 border-[3px] border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                                    SALVANDO...
                                </>
                            ) : (
                                <>
                                    <Save className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                    SALVAR AGORA
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleNewComparison}
                            className="w-full md:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-3 text-base active:scale-95"
                        >
                            <Scale className="w-6 h-6" />
                            NOVA PESQUISA
                        </button>

                        <button
                            onClick={onBack}
                            className="w-full md:w-auto px-6 py-4 text-slate-400 hover:text-white font-bold transition-all flex items-center justify-center gap-2 text-sm active:scale-95"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            DASHBOARD
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16 animate-in fade-in zoom-in duration-700">
                    <div className="inline-flex items-center justify-center p-3 bg-teal-500/10 rounded-3xl mb-6 ring-1 ring-teal-500/20 shadow-2xl shadow-teal-500/10 scale-110">
                        <Scale className="w-12 h-12 text-teal-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-teal-200 to-sky-400 mb-6 tracking-tight font-outfit">
                        Comparador de Carreiras
                    </h1>
                    <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">
                        A escolha certa começa com uma comparação inteligente.
                        Analise até 3 carreiras detalhadamente.
                        {hasProfile && (
                            <span className="flex items-center justify-center gap-2 mt-4 text-base text-teal-300 font-bold bg-teal-500/10 py-2 px-4 rounded-full w-fit mx-auto ring-1 ring-teal-500/20">
                                <Sparkles className="w-4 h-4 animate-pulse" />
                                Compatibilidade com seu perfil ativada!
                            </span>
                        )}
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column: Career Options */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Recommendations & Saved Plans */}
                        {(favoriteCareers.length > 0 || savedPlans.length > 0) && (
                            <div className="bg-slate-800/80 backdrop-blur-md rounded-[2.5rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden ring-1 ring-white/10 animate-in fade-in slide-in-from-left-4 duration-500">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                                <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3 relative z-10 tracking-tight font-outfit">
                                    <div className="p-2 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl shadow-lg shadow-teal-500/20">
                                        <Rocket className="w-6 h-6 text-white" />
                                    </div>
                                    Seus Planos & Sugestões
                                </h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                                    {/* Saved Plans */}
                                    {savedPlans.map((plan) => (
                                        <button
                                            key={plan.id}
                                            onClick={() => handleAddCareer(plan.career_title)}
                                            disabled={selectedCareers.includes(plan.career_title) || selectedCareers.length >= 3}
                                            className={`p-5 rounded-2xl text-sm font-bold transition-all text-left border-2 flex flex-col gap-2 relative group shadow-lg ${selectedCareers.includes(plan.career_title)
                                                ? 'bg-teal-500/10 text-teal-400 border-teal-500/30 ring-2 ring-teal-500/10'
                                                : selectedCareers.length >= 3
                                                    ? 'bg-slate-900/30 text-slate-700 border-transparent cursor-not-allowed opacity-50'
                                                    : 'bg-slate-900/50 text-slate-300 border-slate-700/50 hover:border-teal-500/30 hover:bg-slate-800 hover:-translate-y-1'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center w-full">
                                                <span className="line-clamp-1">{plan.career_title}</span>
                                                <div className="p-1.5 bg-teal-500/10 rounded-lg">
                                                    <Clock className="w-3 h-3 text-teal-400" />
                                                </div>
                                            </div>
                                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Meu Plano Ativo</span>
                                        </button>
                                    ))}

                                    {/* Quiz Recommendations (top3) */}
                                    {favoriteCareers.filter(fc => !savedPlans.some(p => p.career_title === fc)).map((career) => (
                                        <button
                                            key={career}
                                            onClick={() => handleAddCareer(career)}
                                            disabled={selectedCareers.includes(career) || selectedCareers.length >= 3}
                                            className={`p-5 rounded-2xl text-sm font-bold transition-all text-left border-2 flex flex-col gap-2 relative group shadow-lg ${selectedCareers.includes(career)
                                                ? 'bg-pink-500/10 text-pink-400 border-pink-500/30 ring-2 ring-pink-500/10'
                                                : selectedCareers.length >= 3
                                                    ? 'bg-slate-900/30 text-slate-700 border-transparent cursor-not-allowed opacity-50'
                                                    : 'bg-slate-900/50 text-slate-300 border-slate-700/50 hover:border-pink-500/30 hover:bg-slate-800 hover:-translate-y-1'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center w-full">
                                                <span className="line-clamp-1">{career}</span>
                                                <div className="p-1.5 bg-pink-500/10 rounded-lg">
                                                    <Heart className="w-3 h-3 text-pink-400" />
                                                </div>
                                            </div>
                                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Sugerido pelo Quiz</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Add Custom Career */}
                        <div className="bg-slate-800/40 backdrop-blur-sm rounded-3xl border border-white/5 p-8 shadow-xl">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <div className="p-2 bg-teal-500/10 rounded-lg">
                                    <Search className="w-6 h-6 text-teal-400" />
                                </div>
                                Adicionar Carreira
                            </h2>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 relative group">
                                    <input
                                        type="text"
                                        value={customCareer}
                                        onChange={(e) => setCustomCareer(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCareer()}
                                        placeholder="Ex: Desenvolvedor Mobile, Gestor Ambiental..."
                                        className="w-full px-5 py-4 bg-slate-900/50 border-2 border-slate-700/50 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-inner"
                                        disabled={selectedCareers.length >= 3}
                                    />
                                    <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none group-focus-within:border-teal-500/20 transition-colors" />
                                </div>
                                <button
                                    onClick={handleAddCustomCareer}
                                    disabled={!customCareer.trim() || selectedCareers.length >= 3}
                                    className="px-6 py-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-teal-500/20 text-sm"
                                >
                                    <Plus className="w-5 h-5" />
                                    Adicionar
                                </button>
                            </div>
                        </div>


                        {/* Popular Careers */}
                        <div className="bg-slate-800/40 backdrop-blur-sm rounded-3xl border border-white/5 p-8 shadow-xl">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <div className="p-2 bg-yellow-500/10 rounded-lg">
                                    <Sparkles className="w-6 h-6 text-yellow-400" />
                                </div>
                                Carreiras Populares
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {POPULAR_CAREERS.map((career) => (
                                    <button
                                        key={career}
                                        onClick={() => handleAddCareer(career)}
                                        disabled={selectedCareers.includes(career) || selectedCareers.length >= 3}
                                        className={`p-5 rounded-2xl text-sm font-bold transition-all text-left flex justify-between items-center border-2 ${selectedCareers.includes(career)
                                            ? 'bg-teal-500/10 text-teal-400 border-teal-500/30 ring-2 ring-teal-500/10'
                                            : selectedCareers.length >= 3
                                                ? 'bg-slate-900/30 text-slate-700 border-transparent cursor-not-allowed'
                                                : 'bg-slate-900/50 text-slate-400 border-slate-700/50 hover:border-teal-500/30 hover:bg-slate-800 hover:text-white group'
                                            }`}
                                    >
                                        <span className="line-clamp-1">{career}</span>
                                        {!selectedCareers.includes(career) && selectedCareers.length < 3 && (
                                            <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Selected & Compare */}
                    <div className="lg:col-span-1 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="sticky top-8 space-y-6">
                            {/* Selected Careers */}
                            <div className="bg-slate-800/80 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden ring-1 ring-white/10">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-sky-500/5 rounded-full blur-[40px] translate-y-1/2 -translate-x-1/2" />

                                <h2 className="text-2xl font-bold text-white mb-8 flex items-center justify-between relative z-10 tracking-tight font-outfit">
                                    Sua Escolha
                                    <div className="flex items-center gap-1.5">
                                        {[1, 2, 3].map((i) => (
                                            <div
                                                key={i}
                                                className={`w-3 h-3 rounded-full transition-all duration-500 ${i <= selectedCareers.length ? 'bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)] scale-110' : 'bg-slate-700'}`}
                                            />
                                        ))}
                                    </div>
                                </h2>

                                {selectedCareers.length === 0 ? (
                                    <div className="text-center py-20 border-2 border-dashed border-slate-700/50 rounded-3xl bg-slate-900/40 relative z-10 group hover:border-teal-500/30 transition-all duration-500">
                                        <div className="w-20 h-20 bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
                                            <Scale className="w-10 h-10 text-slate-600 group-hover:text-teal-400 transition-colors" />
                                        </div>
                                        <p className="text-slate-500 font-bold px-8 leading-relaxed">
                                            Selecione carreiras ao lado para começar.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 relative z-10">
                                        {selectedCareers.map((career) => (
                                            <div
                                                key={career}
                                                className="flex items-center justify-between p-5 bg-teal-500/10 border border-teal-500/20 rounded-2xl group hover:border-teal-500/40 hover:bg-teal-500/[0.08] transition-all animate-in slide-in-from-right-4 duration-500"
                                            >
                                                <span className="text-teal-300 font-bold line-clamp-1">{career}</span>
                                                <button
                                                    onClick={() => handleRemoveCareer(career)}
                                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all active:scale-90"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}

                                        {selectedCareers.length < 2 && (
                                            <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl text-yellow-400/80 text-sm flex items-center gap-3 animate-pulse">
                                                <Sparkles className="w-4 h-4 flex-shrink-0" />
                                                Selecione mais uma carreira para comparar.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Compare Button */}
                                <div className="mt-10 relative z-10">
                                    <button
                                        onClick={handleCompare}
                                        disabled={selectedCareers.length < 2 || isComparing}
                                        className={`w-full py-5 rounded-xl font-bold transition-all flex items-center justify-center gap-3 text-base group shadow-2xl ${selectedCareers.length >= 2 && !isComparing
                                            ? 'bg-gradient-to-br from-teal-400 via-emerald-400 to-sky-400 hover:from-teal-300 hover:via-emerald-300 hover:to-sky-300 text-slate-900 shadow-teal-500/30 active:scale-[0.97]'
                                            : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                                            }`}
                                    >
                                        {isComparing ? (
                                            <>
                                                <div className="w-8 h-8 border-[5px] border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                                                ANALISANDO...
                                            </>
                                        ) : (
                                            <>
                                                <Scale className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                                                COMPARAR AGORA
                                            </>
                                        )}
                                    </button>
                                </div>

                                {error && (
                                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center text-red-100 font-bold text-sm animate-shake">
                                        {error}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Back Button */}
                <div className="mt-8 text-center">
                    <button
                        onClick={onBack}
                        className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 mx-auto"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Voltar ao Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};
