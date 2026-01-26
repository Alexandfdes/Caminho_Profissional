import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Clock, ChevronLeft, Trash2 } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { catalogService } from '../services/catalogService';
import { CareerPlan } from '../types';
import { CatalogItem, CatalogType } from '../types/catalog';
import LoadingStep from '../components/LoadingStep';

type CareerPlanRow = {
  id: string;
  career_title?: string | null;
  career_description?: string | null;
  created_at: string;
  plan_data: CareerPlan;
};

const FINAL_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80';

const getFallbackImage = (item: CatalogItem) => {
  const byCategory: Record<string, string> = {
    'Programação': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    'Dados': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    'Design': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1200&q=80',
    'Marketing': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    'Carreira': 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
  };

  const byType: Record<CatalogType, string> = {
    course: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    book: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    tool: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80',
    mentorship: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
    event: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
  };

  return byCategory[item.category] || byType[item.type] || FINAL_FALLBACK_IMAGE;
};

const getImageSrc = (item: CatalogItem) => item.image_url || getFallbackImage(item);

const getTypeLabel = (type: CatalogType) => {
  switch (type) {
    case 'course':
      return 'Curso';
    case 'book':
      return 'Livro';
    case 'tool':
      return 'Ferramenta';
    case 'mentorship':
      return 'Mentoria';
    case 'event':
      return 'Evento';
    default:
      return type;
  }
};

const getTypeColor = (type: CatalogType) => {
  switch (type) {
    case 'course':
      return 'text-teal-400 bg-teal-400/10';
    case 'book':
      return 'text-amber-400 bg-amber-400/10';
    case 'tool':
      return 'text-sky-400 bg-sky-400/10';
    case 'mentorship':
      return 'text-purple-400 bg-purple-400/10';
    case 'event':
      return 'text-rose-400 bg-rose-400/10';
    default:
      return 'text-slate-400 bg-slate-400/10';
  }
};

const normalizeText = (value: string) =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const buildActionKey = (phaseIndex: number, actionIndex: number, action: string) =>
  `${phaseIndex}:${actionIndex}:${action}`;

export const PlanTrackerPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { planId } = useParams<{ planId: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planRow, setPlanRow] = useState<CareerPlanRow | null>(null);
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!planId) {
        setError('Plano inválido.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [plan, progress, items] = await Promise.all([
          supabaseService.getCareerPlanById(planId),
          supabaseService.getPlanProgress(planId).catch(() => null),
          catalogService.getItems().catch(() => []),
        ]);

        setPlanRow(plan as CareerPlanRow);
        setCompletedActions(progress?.completed_actions || []);
        setCatalogItems(items);
      } catch (err: any) {
        console.error('[PlanTrackerPage] load error:', err);
        setError(err?.message || 'Não foi possível carregar o plano.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [planId]);

  const backPath = (location.state as any)?.from || '/dashboard';

  const handleDeletePlan = async () => {
    if (!planId) return;
    if (isDeletingPlan) return;
    const ok = window.confirm('Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.');
    if (!ok) return;

    setIsDeletingPlan(true);
    try {
      await supabaseService.deleteCareerPlan(planId);
      navigate('/dashboard');
    } catch (err) {
      console.error('[PlanTrackerPage] delete plan error:', err);
      alert('Não foi possível excluir o plano. Tente novamente.');
    } finally {
      setIsDeletingPlan(false);
    }
  };

  const allActionKeys = useMemo(() => {
    const plan = planRow?.plan_data;
    if (!plan?.stepByStepPlan) return [];

    const keys: string[] = [];
    plan.stepByStepPlan.forEach((phase, phaseIndex) => {
      (phase.actions || []).forEach((action, actionIndex) => {
        keys.push(buildActionKey(phaseIndex, actionIndex, action));
      });
    });

    return keys;
  }, [planRow]);

  const completedSet = useMemo(() => new Set(completedActions), [completedActions]);

  const progressText = useMemo(() => {
    const total = allActionKeys.length;
    const done = completedSet.size;
    if (!total) return '0/0 ações concluídas';
    return `${done}/${total} ações concluídas`;
  }, [allActionKeys.length, completedSet.size]);

  const featuredFallback = useMemo(() => {
    const featured = catalogItems.filter(i => i.featured);
    return featured.slice(0, 4);
  }, [catalogItems]);

  const getRecommendationsForPhase = (phaseText: string): CatalogItem[] => {
    const haystack = normalizeText(phaseText);

    const scored: Array<{ item: CatalogItem; score: number }> = [];

    for (const item of catalogItems) {
      const tags = item.tags || [];
      let score = 0;

      for (const tag of tags) {
        const needle = normalizeText(tag);
        if (!needle) continue;
        if (haystack.includes(needle)) score += 2;
      }

      const categoryNeedle = normalizeText(item.category || '');
      if (categoryNeedle && haystack.includes(categoryNeedle)) score += 1;

      if (score > 0) scored.push({ item, score });
    }

    const uniqueById = new Map<string, CatalogItem>();
    scored
      .sort((a, b) => b.score - a.score)
      .forEach(({ item }) => {
        if (!uniqueById.has(item.id)) uniqueById.set(item.id, item);
      });

    const picked = Array.from(uniqueById.values()).slice(0, 4);
    return picked.length > 0 ? picked : featuredFallback;
  };

  const toggleAction = async (actionKey: string, checked: boolean) => {
    if (!planId) return;

    const next = checked
      ? Array.from(new Set([...completedActions, actionKey]))
      : completedActions.filter(k => k !== actionKey);

    setCompletedActions(next);

    setIsSavingProgress(true);
    try {
      await supabaseService.upsertPlanProgress(planId, next);
    } catch (err) {
      console.error('[PlanTrackerPage] upsert progress error:', err);
      alert('Não foi possível salvar seu progresso. Tente novamente.');
      setCompletedActions(completedActions);
    } finally {
      setIsSavingProgress(false);
    }
  };

  if (isLoading) return <LoadingStep text="Carregando acompanhamento do plano..." />;

  if (error || !planRow) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate(backPath)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors rounded-lg p-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Voltar
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="text-slate-400 hover:text-white transition-colors rounded-lg p-2"
            >
              Área do assinante
            </button>
          </div>

          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
            <h1 className="text-xl font-bold text-white mb-2">Não foi possível abrir o acompanhamento</h1>
            <p className="text-slate-400">{error || 'Plano não encontrado.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const plan = planRow.plan_data;
  const title = planRow.career_title || 'Plano de Carreira';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(backPath)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors rounded-lg p-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Voltar
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="text-slate-400 hover:text-white transition-colors rounded-lg p-2"
            >
              Área do assinante
            </button>

            <button
              onClick={handleDeletePlan}
              disabled={isDeletingPlan}
              className="p-2 bg-slate-900/50 rounded-lg border border-white/5 shadow-inner hover:bg-red-500/10 hover:border-red-500/30 transition-all disabled:opacity-50"
              title="Excluir plano"
            >
              <Trash2 className="w-5 h-5 text-slate-500 hover:text-red-400 transition-colors" />
            </button>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500">{isSavingProgress ? 'Salvando...' : 'Progresso'}</div>
            <div className="text-sm font-medium text-teal-300">{progressText}</div>
          </div>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 mb-8 shadow-2xl">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight font-outfit mb-2">{title}</h1>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Clock className="w-4 h-4" />
            Criado em {new Date(planRow.created_at).toLocaleDateString('pt-BR')}
          </div>
          {planRow.career_description && (
            <p className="text-slate-300 mt-4 leading-relaxed">{planRow.career_description}</p>
          )}
        </div>

        <div className="space-y-8">
          {plan.stepByStepPlan.map((phase, phaseIndex) => {
            const phaseText = `${phase.timeframe}\n${(phase.actions || []).join('\n')}`;
            const recommendations = getRecommendationsForPhase(phaseText);

            return (
              <div
                key={phaseIndex}
                className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl"
              >
                <div className="flex items-start justify-between gap-6 mb-6">
                  <div className="min-w-0">
                    <h2 className="text-lg md:text-xl font-bold text-teal-300 mb-1 tracking-tight">{phase.timeframe}</h2>
                    <p className="text-slate-500 text-sm">Marque as ações conforme você for concluindo.</p>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    {(phase.actions || []).map((action, actionIndex) => {
                      const key = buildActionKey(phaseIndex, actionIndex, action);
                      const checked = completedSet.has(key);

                      return (
                        <label
                          key={key}
                          className="flex items-start gap-3 bg-slate-900/40 border border-white/5 rounded-2xl p-4 hover:border-teal-500/20 transition-colors"
                        >
                          <input
                            type="checkbox"
                            className="mt-1.5 accent-teal-500"
                            checked={checked}
                            onChange={(e) => toggleAction(key, e.target.checked)}
                          />
                          <span className={`text-sm leading-relaxed ${checked ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                            {action}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white mb-4 tracking-wide">Recomendações do Catálogo</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {recommendations.map((item) => (
                        <a
                          key={item.id}
                          href={item.link_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-teal-500/50 transition-all hover:-translate-y-1 group flex flex-col h-full"
                        >
                          <div className="h-32 overflow-hidden relative">
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
                          <div className="p-4 flex flex-col flex-grow">
                            <div className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">{item.category}</div>
                            <h4 className="font-bold text-white mb-2 line-clamp-2">{item.title}</h4>
                            <p className="text-slate-400 text-xs line-clamp-2 mb-3 flex-grow">{item.description}</p>

                            <div className="pt-3 border-t border-slate-700 flex items-center justify-between">
                              <span className="text-teal-400 text-xs font-medium group-hover:underline">
                                Acessar
                              </span>
                              <svg
                                className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-colors"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                                />
                              </svg>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
