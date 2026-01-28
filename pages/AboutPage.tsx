import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Target, Sparkles, Shield, Users, Brain, FileText, TrendingUp } from 'lucide-react';

export const AboutPage: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = "Sobre Nós - CaminhoProfissionaIA";
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute("content", "Conheça a CaminhoProfissionaIA. Nossa missão é democratizar o acesso a ferramentas de carreira impulsionadas por Inteligência Artificial.");
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
            <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span>Voltar para Home</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 mb-6">
                        <Sparkles className="w-4 h-4 text-teal-400" />
                        <span className="text-sm text-teal-400 font-medium">Tecnologia para sua Carreira</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-white">
                        Sobre a <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">CaminhoProfissionaIA</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Democratizando o acesso a ferramentas de carreira impulsionadas por Inteligência Artificial.
                    </p>
                </div>

                {/* Mission Section */}
                <section className="mb-16">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 bg-teal-500/10 rounded-xl">
                            <Target className="w-6 h-6 text-teal-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-3">Nossa Missão</h2>
                            <p className="text-slate-300 leading-relaxed">
                                Acreditamos que toda pessoa merece ter acesso a orientação profissional de qualidade,
                                independentemente de sua condição financeira ou localização. A <strong className="text-teal-400">CaminhoProfissionaIA</strong> nasceu
                                com o propósito de democratizar o acesso a ferramentas de desenvolvimento de carreira,
                                utilizando o poder da Inteligência Artificial para oferecer análises personalizadas e
                                recomendações práticas para o seu crescimento profissional.
                            </p>
                        </div>
                    </div>
                </section>

                {/* What We Do Section */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                        <Brain className="w-6 h-6 text-teal-400" />
                        O Que Fazemos
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-teal-500/30 transition-colors">
                            <FileText className="w-8 h-8 text-teal-400 mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">Análise de Currículo</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Nossa IA analisa seu currículo em segundos, identificando pontos fortes,
                                áreas de melhoria e sugestões personalizadas para aumentar suas chances de sucesso.
                            </p>
                        </div>
                        <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-teal-500/30 transition-colors">
                            <TrendingUp className="w-8 h-8 text-teal-400 mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">Simulador de Carreira</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Descubra quais carreiras combinam com seu perfil através de um questionário
                                inteligente que analisa suas habilidades, interesses e valores.
                            </p>
                        </div>
                        <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-teal-500/30 transition-colors">
                            <Sparkles className="w-8 h-8 text-teal-400 mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">Otimização de Perfil</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Receba orientações sobre como melhorar sua presença profissional online
                                e se destacar em processos seletivos.
                            </p>
                        </div>
                        <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-teal-500/30 transition-colors">
                            <Users className="w-8 h-8 text-teal-400 mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">Plano de Ação Personalizado</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Receba um roteiro detalhado com passos práticos para alcançar seus
                                objetivos profissionais de curto, médio e longo prazo.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Commitment Section */}
                <section className="mb-16">
                    <div className="p-8 bg-gradient-to-br from-slate-800/50 to-slate-800/30 rounded-2xl border border-slate-700">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-emerald-500/10 rounded-xl">
                                <Shield className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-4">Nosso Compromisso</h2>
                                <div className="space-y-4 text-slate-300 leading-relaxed">
                                    <p>
                                        <strong className="text-white">Privacidade em Primeiro Lugar:</strong> Seus dados são protegidos
                                        com criptografia de ponta e nunca são vendidos a terceiros. Seguimos rigorosamente
                                        a Lei Geral de Proteção de Dados (LGPD) e as melhores práticas internacionais de privacidade.
                                    </p>
                                    <p>
                                        <strong className="text-white">Uso Ético da IA:</strong> Nossa Inteligência Artificial é desenvolvida
                                        com responsabilidade, evitando vieses e garantindo recomendações justas e imparciais
                                        para todos os usuários, independentemente de gênero, etnia ou origem.
                                    </p>
                                    <p>
                                        <strong className="text-white">Transparência:</strong> Explicamos de forma clara como nossas
                                        ferramentas funcionam e como seus dados são utilizados. Você tem total controle
                                        sobre suas informações.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact Section */}
                <section className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Entre em Contato</h2>
                    <p className="text-slate-400 mb-6">
                        Tem dúvidas, sugestões ou quer saber mais sobre nossos serviços?
                    </p>
                    <a
                        href="mailto:alexandrehenriquefdes@gmail.com"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40"
                    >
                        <span>alexandrehenriquefdes@gmail.com</span>
                    </a>
                </section>
            </main>
        </div>
    );
};
