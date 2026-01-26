
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FinalPlanStep from '../components/ResultStep';
import { storageService } from '../services/storageService';
import { supabaseService } from '../services/supabaseService';
import { TopCareer, CareerPlan } from '../types';
import LoadingStep from '../components/LoadingStep';

export const FinalPlanPage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedCareer, setSelectedCareer] = useState<TopCareer | null>(null);
    const [plan, setPlan] = useState<CareerPlan | null>(null);
    const [user, setUser] = useState<any>(null);
    const [isSubscriber, setIsSubscriber] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initialize = async () => {
            const currentUser = await supabaseService.getUser();
            setUser(currentUser);

            // No momento, planos/pagamentos estão desativados.
            // Mantemos esta flag apenas para UI/navegação: usuário logado vê área “subscriber”.
            setIsSubscriber(Boolean(currentUser));

            const savedState = storageService.loadState();
            if (savedState.selectedCareer) setSelectedCareer(savedState.selectedCareer);
            if (savedState.finalPlan) setPlan(savedState.finalPlan);

            setIsLoading(false);
        };

        initialize();
    }, [navigate]);

    const handleReset = () => {
        storageService.clearProgress();
        navigate('/');
    };

    const handleGoHome = () => {
        if (user && isSubscriber) {
            navigate('/dashboard');
        } else {
            // Explicitly clear state and go to Landing
            navigate('/', { replace: true, state: {} });
            // We can't clear window history but we can ensure the app state is reset if we were using it.
            // Since we are now route based, navigate('/') is usually enough.
            // But if App.tsx still has logic, we might need to be careful.
            // With the new architecture, App.tsx won't have the 'step' logic interfering as much if we mount Pages directly in Router.
        }
    };

    if (isLoading) return <LoadingStep text="Carregando..." />;

    if (!plan || !selectedCareer) {
        // Fallback if data missing
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-slate-300">
                <p className="mb-4">Não foi possível carregar o plano.</p>
                <button onClick={() => navigate('/')} className="text-teal-400 underline">Voltar ao Início</button>
            </div>
        );
    }

    return (
        <FinalPlanStep
            career={selectedCareer}
            plan={plan}
            onReset={handleReset}
            onGoHome={handleGoHome}
            showSubscriberArea={isSubscriber}
        />
    );
};
