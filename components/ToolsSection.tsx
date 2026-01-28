import React from 'react';
import { FileText, Target, BarChart3, ClipboardList } from 'lucide-react';

const tools = [
    {
        icon: FileText,
        title: 'Análise de CV',
        description: 'Receba feedback instantâneo da IA sobre seu currículo, com sugestões de melhoria e adequação ao mercado.',
        color: 'teal'
    },
    {
        icon: Target,
        title: 'Descoberta de Carreira',
        description: 'Questionário inteligente que mapeia suas aptidões, interesses e valores para encontrar sua vocação.',
        color: 'sky'
    },
    {
        icon: BarChart3,
        title: 'Comparador de Carreiras',
        description: 'Compare salários, mercado de trabalho e perspectivas de crescimento entre diferentes profissões.',
        color: 'emerald'
    },
    {
        icon: ClipboardList,
        title: 'Plano de Ação',
        description: 'Receba um roteiro personalizado com passos práticos para alcançar seus objetivos profissionais.',
        color: 'violet'
    }
];

const colorClasses: Record<string, { bg: string; border: string; icon: string; glow: string }> = {
    teal: {
        bg: 'bg-teal-500/10',
        border: 'border-teal-500/30 hover:border-teal-400/50',
        icon: 'text-teal-400',
        glow: 'group-hover:shadow-teal-500/10'
    },
    sky: {
        bg: 'bg-sky-500/10',
        border: 'border-sky-500/30 hover:border-sky-400/50',
        icon: 'text-sky-400',
        glow: 'group-hover:shadow-sky-500/10'
    },
    emerald: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30 hover:border-emerald-400/50',
        icon: 'text-emerald-400',
        glow: 'group-hover:shadow-emerald-500/10'
    },
    violet: {
        bg: 'bg-violet-500/10',
        border: 'border-violet-500/30 hover:border-violet-400/50',
        icon: 'text-violet-400',
        glow: 'group-hover:shadow-violet-500/10'
    }
};

export const ToolsSection: React.FC = () => {
    return (
        <section id="tools" className="py-24 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950" />
            <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-1/3 right-0 w-[300px] h-[300px] bg-sky-500/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 mb-6">
                        <span className="text-sm text-slate-400 font-medium">Tudo em um só lugar</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight font-outfit">
                        Nossas <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-sky-400">Ferramentas</span>
                    </h2>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Um conjunto completo de ferramentas de IA para impulsionar sua carreira, desde a análise do seu currículo até o planejamento do seu futuro profissional.
                    </p>
                </div>

                {/* Tools Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {tools.map((tool, index) => {
                        const colors = colorClasses[tool.color];
                        const Icon = tool.icon;
                        return (
                            <div
                                key={index}
                                className={`group p-6 rounded-2xl bg-slate-800/40 backdrop-blur-sm border ${colors.border} transition-all duration-300 hover:transform hover:-translate-y-1 shadow-lg ${colors.glow}`}
                            >
                                <div className={`w-14 h-14 rounded-xl ${colors.bg} flex items-center justify-center mb-5`}>
                                    <Icon className={`w-7 h-7 ${colors.icon}`} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-3">{tool.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{tool.description}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Bottom CTA Text */}
                <div className="text-center mt-12">
                    <p className="text-slate-500 text-sm">
                        Todas as ferramentas são alimentadas por <span className="text-teal-400 font-medium">Inteligência Artificial Gemini</span>
                    </p>
                </div>
            </div>
        </section>
    );
};
