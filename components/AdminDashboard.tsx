import React, { useState, useEffect } from 'react';
import { Users, BarChart, Settings, LogOut, Home, FileText, Database } from 'lucide-react';
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
                    {activeTab === 'overview' && <AdminStats />}
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
