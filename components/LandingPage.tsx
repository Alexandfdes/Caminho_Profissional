import React, { useState } from 'react';
import { CareerPlan } from '../types';
import { useNavigate } from 'react-router-dom';
import { RocketIcon, Shield } from 'lucide-react';
import { FeatureCard } from './FeatureCard';
import { Testimonials } from './Testimonials';
import { FAQ } from './FAQ';
import { ChatMock } from './ChatMock';
import { features } from '../data/content';
import { Footer } from './Footer';

interface LandingPageProps {
    onStart: () => void;
    onLogin: () => void;
    onLogout?: () => void;
    user: any;
    onStartDiscovery: () => void;
    onStartExploration: () => void;
    onOpenCatalog: () => void;
    onViewMyCareers?: () => void;
    isAdmin?: boolean;
    onOpenAdmin?: () => void;
    isSubscriber?: boolean;
    onLoadPlan?: (plan: CareerPlan, careerTitle: string, careerDescription: string) => void;
    onOpenCVAnalyzer?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({
    onStart,
    onLogin,
    onLogout,
    user,
    onStartDiscovery,
    onStartExploration,
    onOpenCatalog,
    onViewMyCareers,
    isAdmin,
    onOpenAdmin,
    isSubscriber,
    onLoadPlan,
    onOpenCVAnalyzer
}) => {
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-teal-500 selection:text-white overflow-x-hidden">
            {/* Header / Navigation */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { navigate('/'); window.scrollTo(0, 0); }}>
                            <div className="p-2 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl shadow-lg shadow-teal-500/20">
                                <RocketIcon className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 font-outfit">
                                O Caminho Profissional
                            </span>
                        </div>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-sm font-medium text-slate-400 hover:text-teal-400 transition-colors">Como Funciona</a>
                            <a href="#testimonials" className="text-sm font-medium text-slate-400 hover:text-teal-400 transition-colors">Depoimentos</a>
                            <a href="#faq" className="text-sm font-medium text-slate-400 hover:text-teal-400 transition-colors">Perguntas Frequentes</a>

                        </nav>

                        {/* CTA / Profile */}
                        <div className="flex items-center gap-4">
                            {user ? (
                                <div className="relative flex items-center gap-3 pl-4 border-l border-slate-800">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-sm font-medium text-white">
                                            {(() => {
                                                const userName = user.user_metadata?.username;
                                                if (userName) return userName;
                                                const name = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário';
                                                return name.charAt(0).toUpperCase() + name.slice(1);
                                            })()}
                                        </p>
                                        <p className="text-xs text-slate-500">{user.email}</p>
                                    </div>
                                    <button
                                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                                        className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-sky-500 p-[2px] hover:scale-105 transition-transform cursor-pointer"
                                    >
                                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-sm font-bold text-teal-400">
                                            {(() => {
                                                const name = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'U';
                                                return name.charAt(0).toUpperCase();
                                            })()}
                                        </div>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showProfileMenu && (
                                        <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                                            <div className="p-3 border-b border-slate-700">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {user.user_metadata?.username ? user.user_metadata.username : (user.user_metadata?.name || user.user_metadata?.full_name || 'Usuário')}
                                                </p>
                                                <p className="text-xs text-slate-400 truncate">{user.email}</p>
                                            </div>

                                            {isAdmin && onOpenAdmin && (
                                                <button
                                                    onClick={() => {
                                                        setShowProfileMenu(false);
                                                        onOpenAdmin();
                                                    }}
                                                    className="w-full px-4 py-3 text-left text-sm text-purple-400 hover:bg-slate-700 transition-colors flex items-center gap-2 border-b border-slate-700"
                                                >
                                                    <Shield className="w-4 h-4" />
                                                    Painel Admin
                                                </button>
                                            )}

                                            {onViewMyCareers && isSubscriber && (
                                                <button
                                                    onClick={() => {
                                                        setShowProfileMenu(false);
                                                        onViewMyCareers();
                                                    }}
                                                    className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-2"
                                                >
                                                    <RocketIcon className="w-4 h-4" />
                                                    Área do Assinante
                                                </button>
                                            )}

                                            {onLogout && (
                                                <button
                                                    onClick={() => {
                                                        setShowProfileMenu(false);
                                                        onLogout();
                                                    }}
                                                    className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-slate-700 transition-colors flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                    Sair
                                                </button>
                                            )}

                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={onLogin}
                                        className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                                    >
                                        Entrar
                                    </button>
                                    <button
                                        onClick={onStart}
                                        className="hidden sm:block px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-lg transition-all shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transform hover:-translate-y-0.5"
                                    >
                                        Começar Agora
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Background Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                    <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[100px] animate-pulse-slow" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 mb-8 animate-fade-in-up">
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                        <span className="text-xs font-medium text-teal-400 uppercase tracking-wider">IA Avançada 2.0</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight animate-fade-in-up delay-100 font-outfit">
                        Descubra sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-sky-400">Verdadeira Vocação</span><br />
                        com Inteligência Artificial
                    </h1>

                    <p className="max-w-2xl mx-auto text-xl text-slate-400 mb-12 leading-relaxed animate-fade-in-up delay-200">
                        Pare de perder tempo com testes genéricos. Nossa IA analisa profundamente seu perfil, interesses e realidade local para traçar o caminho profissional perfeito para você.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in-up delay-300">
                        {user ? (
                            <>
                                <button
                                    onClick={onStartDiscovery}
                                    className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white text-lg font-bold rounded-xl transition-all shadow-xl shadow-teal-500/20 hover:shadow-teal-500/40 transform hover:-translate-y-1"
                                >
                                    Descobrir Meu Caminho
                                </button>
                                {onViewMyCareers && (
                                    <button
                                        onClick={onViewMyCareers}
                                        className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white text-lg font-bold rounded-xl transition-all shadow-xl shadow-rose-500/20 hover:shadow-rose-500/40 transform hover:-translate-y-1 flex items-center gap-2 justify-center group"
                                    >
                                        <svg className="w-6 h-6 text-white animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                        </svg>
                                        <span>Área do Assinante</span>
                                    </button>
                                )}
                            </>
                        ) : (
                            <button
                                onClick={onStart}
                                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white text-lg font-bold rounded-xl transition-all shadow-xl shadow-teal-500/20 hover:shadow-teal-500/40 transform hover:-translate-y-1"
                            >
                                Descobrir Minha Carreira
                            </button>
                        )}
                    </div>
                </div>
            </section >

            {/* Features Section */}
            < section id="features" className="py-32 relative overflow-hidden" >
                {/* Decorative Background */}
                < div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-900 to-slate-950" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-24">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">
                            Por que escolher nossa plataforma?
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Muito mais que um teste. Nossa IA conversa com você, entende quem você é e evolui a cada resposta para descobrir sua verdadeira vocação.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
                        {features.map((feature) => (
                            <FeatureCard key={feature.id} feature={feature} />
                        ))}
                    </div>
                </div>
            </section >

            {/* Testimonials Section */}
            < Testimonials />

            {/* Chat Mock */}
            < ChatMock />

            {/* FAQ Section */}
            < FAQ />

            {/* Footer */}
            <Footer />

        </div >
    );
};

export default LandingPage;
