import React, { useState, useEffect } from 'react';
import { Users, BarChart, Settings, LogOut, Home, FileText, Database } from 'lucide-react';
import { paymentService } from '../services/paymentService';
import { AdminStats } from './admin/AdminStats';
import { UserManagement } from './admin/UserManagement';
import { CVReviewsManagement } from './admin/CVReviewsManagement';
import { CVCacheManagement } from './admin/CVCacheManagement';

interface AdminDashboardProps {
    user: any;
    onLogout: () => void;
    onGoHome: () => void;
    onViewLanding: () => void;
}

type AdminTab = 'overview' | 'users' | 'cv_reviews' | 'cache' | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout, onGoHome, onViewLanding }) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('overview');
    const [planLoading, setPlanLoading] = useState<string | null>(null);

    const handlePlanClick = async (planId: string, title: string, price: number) => {
        setPlanLoading(planId);
        try {
            const checkoutUrl = await paymentService.createPreference(planId, title, price);
            window.location.href = checkoutUrl;
        } catch (e: any) {
            console.error('Erro ao criar preferência:', e);
            setPlanLoading(null);
            alert(e?.message || 'Erro ao iniciar pagamento');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col fixed h-full z-10">
                <div className="p-6 border-b border-slate-700">
                    <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                        Admin Panel
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Gerenciamento Geral</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'overview' ? 'bg-teal-500/10 text-teal-400' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                    >
                        <BarChart className="w-5 h-5" />
                        <span className="font-medium">Visão Geral</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'users' ? 'bg-teal-500/10 text-teal-400' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                    >
                        <Users className="w-5 h-5" />
                        <span className="font-medium">Usuários</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('cv_reviews')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'cv_reviews' ? 'bg-teal-500/10 text-teal-400' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                    >
                        <FileText className="w-5 h-5" />
                        <span className="font-medium">Análises de CV</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('cache')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'cache' ? 'bg-teal-500/10 text-teal-400' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                    >
                        <Database className="w-5 h-5" />
                        <span className="font-medium">Cache</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-teal-500/10 text-teal-400' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                    >
                        <Settings className="w-5 h-5" />
                        <span className="font-medium">Configurações</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-700 space-y-2">
                    <button
                        onClick={onGoHome}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                        <Home className="w-5 h-5" />
                        <span className="font-medium">Voltar ao Site</span>
                    </button>
                    <button
                        onClick={onViewLanding}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                        <Home className="w-5 h-5" />
                        <span className="font-medium">Ver Landing Page</span>
                    </button>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Sair</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {activeTab === 'overview' && 'Visão Geral'}
                            {activeTab === 'users' && 'Gerenciamento de Usuários'}
                            {activeTab === 'cv_reviews' && 'Análises de Currículo'}
                            {activeTab === 'cache' && 'Cache de Análises'}
                            {activeTab === 'settings' && 'Configurações do Sistema'}
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            Bem-vindo, {user?.email}
                        </p>
                    </div>
                </header>

                <div className="animate-fade-in">
                    {activeTab === 'overview' && (
                        <>
                            <AdminStats />
                            <div className="mt-8 flex flex-col items-center gap-6">
                                <h3 className="text-lg font-semibold text-white mb-2">Escolha seu Plano de Pagamento</h3>
                                <div className="flex gap-8 flex-wrap justify-center">
                                    {/* Plano Resultado Completo */}
                                    <div
                                        className={`relative cursor-pointer bg-slate-800 border-2 border-teal-400 rounded-2xl p-8 w-80 shadow-lg transition-transform ${planLoading ? 'opacity-60 pointer-events-none' : 'hover:scale-105'}`}
                                        onClick={() => handlePlanClick('plano_completo', 'Resultado Completo', 19)}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-teal-500/20 p-2 rounded-full"><svg width="24" height="24" fill="none" stroke="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 0v10l6 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                                            <span className="font-bold text-lg">Resultado Completo</span>
                                        </div>
                                        <div className="text-2xl font-bold text-teal-400 mb-2">R$19</div>
                                        <ul className="text-left text-sm space-y-1 mb-2">
                                            <li>✔️ Top 3 Carreiras Recomendadas</li>
                                            <li>✔️ Plano de Ação Passo a Passo</li>
                                            <li>✔️ Exportar em PDF</li>
                                            <li>❌ Acesso à Área do Assinante</li>
                                            <li>❌ Análise de Currículo</li>
                                            <li>❌ Novos Testes</li>
                                        </ul>
                                        {planLoading === 'plano_completo' && (
                                            <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center text-white font-medium">Redirecionando...</div>
                                        )}
                                    </div>
                                    {/* Plano Premium */}
                                    <div
                                        className={`relative cursor-pointer bg-slate-800 border-2 border-fuchsia-400 rounded-2xl p-8 w-80 shadow-lg transition-transform ${planLoading ? 'opacity-60 pointer-events-none' : 'hover:scale-105'}`}
                                        onClick={() => handlePlanClick('assinatura_premium', 'Assinatura Premium', 39)}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-fuchsia-500/20 p-2 rounded-full"><svg width="24" height="24" fill="none" stroke="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 0v10l6 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                                            <span className="font-bold text-lg">Assinatura Premium</span>
                                        </div>
                                        <div className="text-2xl font-bold text-fuchsia-400 mb-2">R$39</div>
                                        <ul className="text-left text-sm space-y-1 mb-2">
                                            <li>✔️ Tudo do Resultado Completo</li>
                                            <li>✔️ Testes ILIMITADOS</li>
                                            <li>✔️ Análise de Currículo com IA</li>
                                            <li>✔️ Explorar Carreiras (scroll infinito)</li>
                                            <li>✔️ Favoritar carreiras ilimitadas</li>
                                            <li>✔️ Chat com IA para dúvidas</li>
                                            <li>✔️ Novas funcionalidades mensais</li>
                                        </ul>
                                        {planLoading === 'assinatura_premium' && (
                                            <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center text-white font-medium">Redirecionando...</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                    {activeTab === 'users' && <UserManagement />}
                    {activeTab === 'cv_reviews' && <CVReviewsManagement />}
                    {activeTab === 'cache' && <CVCacheManagement />}
                    {activeTab === 'settings' && (
                        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
                            <Settings className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">Em Desenvolvimento</h3>
                            <p className="text-slate-400">As configurações globais do sistema estarão disponíveis em breve.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
