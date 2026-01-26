
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateNextQuestion } from '../services/geminiService';
import { UserAnswers, Question } from '../types';
import QuestionsStep from '../components/QuestionsStep';
import LoadingStep from '../components/LoadingStep';
import { SEED_QUESTION } from '../constants';
import { storageService } from '../services/storageService';
import { supabaseService } from '../services/supabaseService';
import { roleService } from '../services/roleService';

export const QuizPage: React.FC = () => {
    const navigate = useNavigate();
    const [answers, setAnswers] = useState<UserAnswers>({});
    const [currentQuestion, setCurrentQuestion] = useState<Question>(SEED_QUESTION);
    const [questionHistory, setQuestionHistory] = useState<Question[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [questionsAnsweredCount, setQuestionsAnsweredCount] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const initialize = async () => {
            const currentUser = await supabaseService.getUser();
            setUser(currentUser);
            if (currentUser) {
                const adminStatus = await roleService.isAdmin();
                setIsAdmin(adminStatus);
            }

            // Load state
            const savedState = storageService.loadState();
            if (savedState.answers) setAnswers(savedState.answers);
            if (savedState.currentQuestion) setCurrentQuestion(savedState.currentQuestion);
            if (savedState.questionHistory) setQuestionHistory(savedState.questionHistory);
            if (savedState.questionsAnsweredCount) setQuestionsAnsweredCount(savedState.questionsAnsweredCount);

            setIsInitializing(false);
        };
        initialize();
    }, []);

    // Persist state
    useEffect(() => {
        if (!isInitializing) {
            storageService.saveState(
                'questions', // We still use the 'step' string for compatibility or specific page identifier
                answers,
                [], // top3 not needed here
                null, // selectedCareer not needed here
                null, // finalPlan not needed here
                currentQuestion,
                questionHistory,
                questionsAnsweredCount
            );
        }
    }, [answers, currentQuestion, questionHistory, questionsAnsweredCount, isInitializing]);

    const handleQuestionSubmit = async (answerValue: string) => {
        // 1. Save the answer
        const newAnswers = { ...answers, [currentQuestion.id]: answerValue };
        setAnswers(newAnswers);
        setQuestionsAnsweredCount(prev => prev + 1);

        // 2. Push current question to history BEFORE updating to the new one
        setQuestionHistory(prev => [...prev, currentQuestion]);

        // 3. Show "Thinking" state
        setIsThinking(true);
        setError(null);

        try {
            // 4. Ask AI for next step
            const fullHistory = [...questionHistory, currentQuestion];
            const response = await generateNextQuestion(newAnswers, fullHistory);

            if (response.isComplete) {
                // AI says we have enough info -> Go to Payment/Plans
                navigate('/resultados');
            } else if (response.nextQuestion) {
                // AI generated a new question -> Show it
                setCurrentQuestion(response.nextQuestion);
            } else {
                throw new Error("IA não retornou próxima pergunta nem conclusão.");
            }
        } catch (err) {
            console.error(err);
            const msg = err instanceof Error ? err.message : null;
            setError(msg || 'Ocorreu um erro ao processar sua resposta. Tente novamente.');
            // Revert history/count on error
            setQuestionHistory(prev => prev.slice(0, -1));
            setQuestionsAnsweredCount(prev => prev - 1);
        } finally {
            setIsThinking(false);
        }
    };

    const handleBack = () => {
        if (questionHistory.length === 0) return;

        const previousQuestion = questionHistory[questionHistory.length - 1];
        setCurrentQuestion(previousQuestion);
        setQuestionHistory(prev => prev.slice(0, -1));
        setQuestionsAnsweredCount(prev => Math.max(0, prev - 1));
    };

    const handleLogout = async () => {
        roleService.clearCache();
        storageService.clearProgress();
        await supabaseService.signOut();
        navigate('/');
    };

    const handleAdminSkip = () => {
        const mockAnswers = {
            "question_1": "Gosto de resolver problemas lógicos e trabalhar com computadores.",
            "question_2": "Prefiro ambientes calmos e trabalho remoto.",
            "question_3": "Valorizo alta remuneração e aprendizado contínuo.",
            "question_4": "Tenho interesse em desenvolvimento de software e inteligência artificial.",
            "question_5": "Gosto de criar coisas novas e ver o resultado do meu trabalho."
        };
        setAnswers(mockAnswers);
        // Force navigation to next step with mock answers
        // We probably need to ensure state is saved? 
        // Or just navigate and let the next page pick up (if we saved).
        // For now, let's just save and nav.
        storageService.saveState(
            'results',
            mockAnswers,
            [], null, null, currentQuestion, questionHistory, questionsAnsweredCount
        );
        navigate('/resultados');
    };

    if (isInitializing) return <LoadingStep text="Carregando..." />;

    return (
        <>
            <QuestionsStep
                question={currentQuestion}
                onSubmit={handleQuestionSubmit}
                isThinking={isThinking}
                questionsAnsweredCount={questionsAnsweredCount}
                error={error}
                onBack={handleBack}
                canGoBack={questionHistory.length > 0}
                currentAnswer={answers[currentQuestion.id]}
                onLogout={handleLogout}
                onGoHome={() => navigate('/', { replace: true, state: {} })}
            />
            {isAdmin && (
                <button
                    onClick={handleAdminSkip}
                    className="fixed bottom-4 left-4 bg-red-500/20 hover:bg-red-500/40 text-red-300 text-xs px-3 py-1 rounded border border-red-500/30 transition-colors z-50"
                    title="Pular perguntas (Modo Admin)"
                >
                    [Admin] Pular Perguntas
                </button>
            )}
        </>
    );
};
