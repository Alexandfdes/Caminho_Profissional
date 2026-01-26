import React, { useState } from 'react';
import { paymentService } from '../services/paymentService';
import { CheckIcon } from './icons/CheckIcon';
import { RocketIcon } from './icons/RocketIcon';
import { StarIcon } from './icons/StarIcon';
import { CrownIcon } from './icons/CrownIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { HeaderBackButton } from './HeaderBackButton';

interface PaymentPlansStepProps {
    onSelectPlan: (planId: string) => void;
    onBack?: () => void;
    isAdmin?: boolean;
}

const PlanCard: React.FC<{
    title: string;
    features: string[];
    icon: React.ReactNode;
    color: string;
    onClick?: () => void;
    price?: string;
    disabled?: boolean;
    isLoading?: boolean;
}> = ({ title, features, icon, color, onClick, price, disabled, isLoading }) => {
    return (
        <button
            className={`relative p-6 rounded-2xl border-2 border-${color}-400 bg-slate-800/40 backdrop-blur-sm flex flex-col transition-all duration-300 shadow-lg ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105'} focus:outline-none focus:ring-2 focus:ring-${color}-400`}
            onClick={(e) => {
                if (disabled) {
                    e.preventDefault();
                    return;
                }
                onClick && onClick();
            }}
            aria-disabled={disabled}
        >
            <div className={`w-12 h-12 rounded-xl bg-${color}-500/20 flex items-center justify-center mb-4 text-${color}-400`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-2">{title}</h3>
            {price && <div className={`text-2xl font-bold text-${color}-400 mb-2`}>{price}</div>}
            <ul className="space-y-3 mb-8 flex-grow">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm text-slate-300">
                        <CheckIcon className={`w-5 h-5 text-${color}-400 mr-2 flex-shrink-0`} />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>
            {isLoading && (
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center text-white font-medium">
                    Redirecionando...
                </div>
            )}
        </button>
    );
};

export const PaymentPlansStep: React.FC<PaymentPlansStepProps> = ({ onSelectPlan, onBack, isAdmin }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [planLoading, setPlanLoading] = useState<string | null>(null);

    const handleAdminPaymentTest = async () => {
        setLoading(true);
        setError(null);
        try {
            // Parâmetros de teste
            const checkoutUrl = await paymentService.createPreference('admin-test', 'Teste Admin Mercado Pago', 1.00);
            window.location.href = checkoutUrl;
        } catch (e: any) {
            setError(e.message || 'Erro ao iniciar pagamento de teste');
        } finally {
            setLoading(false);
        }
    };

    const handlePlanClick = async (planId: string, title: string, price: number) => {
        setError(null);
        setPlanLoading(planId);
        try {
            const checkoutUrl = await paymentService.createPreference(planId, title, price);
            // redirect to Mercado Pago checkout (same tab)
            window.location.href = checkoutUrl;
        } catch (e: any) {
            console.error('Erro ao criar preferência:', e);
            setError(e?.message || 'Erro ao iniciar pagamento. Tente novamente.');
            setPlanLoading(null);
        }
    };


    return (
        <div className="w-full max-w-5xl mx-auto px-4 animate-fade-in relative">
            {onBack && (
                <div className="flex justify-start mb-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-400 hover:text-teal-400 transition-colors text-sm font-medium"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Voltar para Home
                    </button>
                </div>
            )}

            <div className="text-center mb-12 pt-12 md:pt-0">
                <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-400 mb-4">
                    🎉 Sua Análise Está Pronta!
                </h2>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                    Escolha como deseja acessar seu resultado e descobrir seu caminho profissional ideal.
                </p>
            </div>



            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Plano de Pagamento Único */}
                <PlanCard
                    title="Resultado Completo"
                    color="teal"
                    icon={<RocketIcon className="w-6 h-6" />}
                    price="R$19"
                    features={[
                        "✅ Top 3 Carreiras Recomendadas",
                        "✅ Plano de Ação Passo a Passo",
                        "✅ Exportar em PDF",
                        "✅ Acesso à Área do Assinante",
                        "❌ Análise de Currículo",
                        "❌ Novos Testes"
                    ]}
                    onClick={() => handlePlanClick('plano_completo', 'Resultado Completo', 19)}
                    disabled={!!planLoading}
                    isLoading={planLoading === 'plano_completo'}
                />

                {/* Plano de Assinatura Mensal */}
                <PlanCard
                    title="Assinatura Premium"
                    color="sky"
                    icon={<StarIcon className="w-6 h-6" />}
                    price="R$39"
                    features={[
                        "✅ Tudo do Resultado Completo",
                        "✅ Testes ILIMITADOS",
                        "✅ Análise de Currículo com IA",
                        "✅ Explorar Carreiras (scroll infinito)",
                        "✅ Favoritar carreiras ilimitadas",
                        "✅ Editor de Currículo Profissional",
                        "🔜 Novas funcionalidades mensais"
                    ]}
                    onClick={() => handlePlanClick('assinatura_premium', 'Assinatura Premium', 39)}
                    disabled={!!planLoading}
                    isLoading={planLoading === 'assinatura_premium'}
                />
            </div>

            {/* Mensagem de erro, se houver */}
            {error && <div className="text-red-400 mt-8 text-sm text-center">{error}</div>}
        </div>
    );
};
