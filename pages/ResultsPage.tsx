
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Top3ResultsStep from '../components/Top3ResultsStep';
import { storageService } from '../services/storageService';
import { supabaseService } from '../services/supabaseService';
import { generateTop3Careers, generateStepByStepPlan } from '../services/geminiService';
import { TopCareer, UserAnswers } from '../types';
import LoadingStep from '../components/LoadingStep';

export const ResultsPage: React.FC = () => {
    const navigate = useNavigate();
    const [top3Careers, setTop3Careers] = useState<TopCareer[]>([]);
    const [answers, setAnswers] = useState<UserAnswers>({});
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initialize = async () => {
            const currentUser = await supabaseService.getUser();
            setUser(currentUser);

            const savedState = storageService.loadState();
            const currentAnswers = savedState.answers || {};
            setAnswers(currentAnswers);

            if (savedState.top3 && savedState.top3.length > 0) {
                setTop3Careers(savedState.top3);
            } else if (Object.keys(currentAnswers).length > 0) {
                // Auto-generate if missing but we have answers
                await handleAutoGenerate(currentAnswers, currentUser);
            } else {
                // No answers and no top3? Go back
                navigate('/quiz');
            }
        };
        initialize();
    }, [navigate]);

    const handleAutoGenerate = async (currentAnswers: UserAnswers, currentUser: any) => {
        setIsGenerating(true);
        setError(null);
        try {
            const results = await generateTop3Careers(currentAnswers);
            setTop3Careers(results);

            // Save to storage
            storageService.saveState(
                'top3_results',
                currentAnswers,
                results,
                null, null, undefined, [], 0
            );

            // Optional: save session
            if (currentUser) {
                try {
                    await supabaseService.saveUserSession({
                        answers: Object.entries(currentAnswers).map(([q, a]) => ({ questionId: q, answer: a })),
                        topCareers: results,
                        totalQuestions: Object.keys(currentAnswers).length,
                        sessionDuration: 0
                    });
                } catch (sErr) {
                    console.error("Error saving session auto-gen:", sErr);
                }
            }
        } catch (err) {
            console.error("Error auto-generating results:", err);
            setError('Não foi possível gerar suas sugestões de carreira. Por favor, tente novamente.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCareerSelection = useCallback(async (career: TopCareer) => {
        setIsLoading(true);
        setError(null);
        try {
            const plan = await generateStepByStepPlan(answers, career);

            // Save to storage
            storageService.saveState(
                'final_plan',
                answers,
                top3Careers,
                career,
                plan,
                undefined, [], 0
            );

            // Save to Supabase
            if (user) {
                try {
                    await supabaseService.saveCareerPlan(user.id, plan, career.profession, career.description);
                } catch (saveErr) {
                    console.error("Erro ao salvar plano:", saveErr);
                }
            }

            navigate('/plano');

        } catch (err) {
            console.error(err);
            setError('Ocorreu um erro ao detalhar seu plano de ação. Por favor, tente novamente.');
            setIsLoading(false);
        }
    }, [answers, top3Careers, user, navigate]);

    if (isLoading) return <LoadingStep text="Criando seu plano de ação personalizado..." />;
    if (isGenerating) return <LoadingStep text="Analisando seu perfil e encontrando as melhores carreiras..." />;

    return (
        <Top3ResultsStep
            careers={top3Careers}
            onSelect={handleCareerSelection}
            onBack={() => navigate('/quiz')} // Back to questions to retry/review
            error={error}
        />
    );
};
