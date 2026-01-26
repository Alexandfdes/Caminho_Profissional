import React, { useState, useEffect } from 'react';
import { usageMonitor } from '../services/usageMonitorService';
import { UsageStats, UsageStatus } from '../types/usage';
import { Activity, TrendingUp, DollarSign, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export const UsageStatsPanel: React.FC = () => {
    const [stats, setStats] = useState<UsageStats | null>(null);
    const [status, setStatus] = useState<UsageStatus>('ok');

    useEffect(() => {
        // Load initial stats
        updateStats();

        // Update stats every 5 seconds
        const interval = setInterval(updateStats, 5000);
        return () => clearInterval(interval);
    }, []);

    const updateStats = () => {
        setStats(usageMonitor.getUsageStats());
        setStatus(usageMonitor.getUsageStatus());
    };

    if (!stats) return null;

    const percentage = usageMonitor.getUsagePercentage();
    const formattedCost = usageMonitor.getFormattedCost();

    // Status colors and icons
    const statusConfig = {
        ok: {
            color: 'text-green-400',
            bgColor: 'bg-green-500/10',
            borderColor: 'border-green-500/30',
            icon: CheckCircle,
            label: 'Normal',
        },
        warning: {
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-500/10',
            borderColor: 'border-yellow-500/30',
            icon: AlertTriangle,
            label: 'Atenção',
        },
        critical: {
            color: 'text-orange-400',
            bgColor: 'bg-orange-500/10',
            borderColor: 'border-orange-500/30',
            icon: AlertCircle,
            label: 'Crítico',
        },
        exceeded: {
            color: 'text-red-400',
            bgColor: 'bg-red-500/10',
            borderColor: 'border-red-500/30',
            icon: AlertCircle,
            label: 'Limite Atingido',
        },
    };

    const config = statusConfig[status];
    const StatusIcon = config.icon;

    return (
        <div className={`rounded-xl border ${config.borderColor} ${config.bgColor} p-5 space-y-4`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <Activity className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-100">Uso da API</h3>
                        <p className="text-sm text-slate-400">Monitoramento em tempo real</p>
                    </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} border ${config.borderColor}`}>
                    <StatusIcon className={`w-4 h-4 ${config.color}`} />
                    <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Requests Counter */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-teal-400" />
                        <span className="text-xs font-medium text-slate-400 uppercase">Requisições Hoje</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-100">{stats.dailyRequests}</span>
                        <span className="text-sm text-slate-500">/ {stats.dailyLimit}</span>
                    </div>
                    <div className="mt-3">
                        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${status === 'ok' ? 'bg-green-500' :
                                    status === 'warning' ? 'bg-yellow-500' :
                                        status === 'critical' ? 'bg-orange-500' : 'bg-red-500'
                                    }`}
                                style={{ width: `${Math.min(percentage * 100, 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{(percentage * 100).toFixed(1)}% usado</p>
                    </div>
                </div>

                {/* Estimated Cost */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-medium text-slate-400 uppercase">Custo Estimado</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-100">{formattedCost}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Baseado em USD $1 = R$ 5,00</p>
                </div>

                {/* Request Types */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-medium text-slate-400 uppercase">Por Tipo</span>
                    </div>
                    <div className="space-y-1 text-sm">
                        {Object.entries(stats.requestsByType).map(([type, count]) => {
                            const countNum = Number(count);
                            return countNum > 0 ? (
                                <div key={type} className="flex justify-between">
                                    <span className="text-slate-400 capitalize">{getTypeLabel(type)}:</span>
                                    <span className="text-slate-200 font-medium">{countNum}</span>
                                </div>
                            ) : null;
                        })}
                        {stats.dailyRequests === 0 && (
                            <p className="text-slate-500 text-xs">Nenhuma requisição ainda</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Warning Message */}
            {status === 'warning' && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-sm text-yellow-300">
                        ⚠️ Você já usou {(percentage * 100).toFixed(0)}% do limite diário gratuito.
                    </p>
                </div>
            )}

            {status === 'critical' && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                    <p className="text-sm text-orange-300">
                        🔥 Atenção! Você está muito próximo do limite diário ({stats.dailyRequests}/{stats.dailyLimit} requisições).
                    </p>
                </div>
            )}

            {status === 'exceeded' && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-sm text-red-300">
                        🚫 Limite diário atingido! Novas requisições serão bloqueadas até amanhã.
                    </p>
                </div>
            )}

            {/* Info Footer */}
            <div className="pt-3 border-t border-slate-700/50">
                <p className="text-xs text-slate-500">
                    Última atualização: {new Date(stats.lastReset).toLocaleDateString('pt-BR')} •
                    Os contadores resetam automaticamente à meia-noite
                </p>
            </div>
        </div>
    );
};

// Helper function to get friendly type labels
function getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        question: 'Perguntas',
        careers: 'Carreiras',
        plan: 'Planos',
        cv: 'CV Análise',
        chat: 'Chat',
        explore: 'Explorar',
    };
    return labels[type] || type;
}
