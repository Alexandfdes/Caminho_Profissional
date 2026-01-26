import React, { useEffect, useState } from 'react';
import { Users, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';

const StatCard: React.FC<{
    title: string;
    value: string;
    change?: string;
    icon: React.ReactNode;
    color: string;
}> = ({ title, value, change, icon, color }) => (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-lg bg-${color}-500/10 text-${color}-400`}>
                {icon}
            </div>
            {change && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${change.startsWith('+') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {change}
                </span>
            )}
        </div>
        <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
        <p className="text-2xl font-bold text-white">{value}</p>
    </div>
);

export const AdminStats: React.FC = () => {
    const [stats, setStats] = useState({
        totalUsers: "0",
        activeUsers: "0",
        revenue: "R$ 0,00",
        subscribers: "0"
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await supabaseService.getAdminStats();
                if (data) {
                    setStats({
                        totalUsers: data.totalUsers.toString(),
                        activeUsers: data.activeUsers.toString(),
                        revenue: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.revenue),
                        subscribers: data.subscribers.toString()
                    });
                }
            } catch (error) {
                console.error("Erro ao buscar estatísticas:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (isLoading) {
        return <div className="text-center py-8 text-slate-500">Carregando estatísticas...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total de Usuários"
                    value={stats.totalUsers}
                    change=""
                    icon={<Users className="w-6 h-6" />}
                    color="blue"
                />
                <StatCard
                    title="Usuários Ativos (24h)"
                    value={stats.activeUsers}
                    change=""
                    icon={<Activity className="w-6 h-6" />}
                    color="emerald"
                />
                <StatCard
                    title="Receita Estimada"
                    value={stats.revenue}
                    change=""
                    icon={<DollarSign className="w-6 h-6" />}
                    color="yellow"
                />
                <StatCard
                    title="Assinantes"
                    value={stats.subscribers}
                    change=""
                    icon={<TrendingUp className="w-6 h-6" />}
                    color="purple"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Crescimento de Usuários</h3>
                    <div className="h-64 flex items-center justify-center text-slate-500 bg-slate-900/50 rounded-lg border border-slate-700 border-dashed">
                        Gráfico de Crescimento (Em Breve)
                    </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Distribuição de Planos</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-300">Gratuito</span>
                            <div className="flex-1 mx-4 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-500 w-[70%]" />
                            </div>
                            <span className="text-white font-bold">70%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-300">Assinantes</span>
                            <div className="flex-1 mx-4 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-sky-500 w-[20%]" />
                            </div>
                            <span className="text-white font-bold">20%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-300">Único</span>
                            <div className="flex-1 mx-4 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-teal-500 w-[10%]" />
                            </div>
                            <span className="text-white font-bold">10%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
