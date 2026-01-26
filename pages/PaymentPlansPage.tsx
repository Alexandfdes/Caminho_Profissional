
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PaymentPlansStep } from '../components/PaymentPlansStep';
import { storageService } from '../services/storageService';
import { supabaseService } from '../services/supabaseService';
import { roleService } from '../services/roleService';
import { generateTop3Careers } from '../services/geminiService';
import { UserAnswers, TopCareer } from '../types';
import LoadingStep from '../components/LoadingStep';

export const PaymentPlansPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState<any>(null);
    const [answers, setAnswers] = useState<UserAnswers>({});
    const [isAdmin, setIsAdmin] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initialize = async () => {
            const currentUser = await supabaseService.getUser();
            setUser(currentUser);
            if (currentUser) {
                const adminStatus = await roleService.isAdmin();
                setIsAdmin(adminStatus);
            }

            const savedState = storageService.loadState();
            if (savedState.answers) {
                setAnswers(savedState.answers);
            }
        };
        initialize();
    }, []);

    // Monitor URL params for payment success
    useEffect(() => {
        const handlePaymentRedirect = async () => {
            const params = new URLSearchParams(location.search);
            const isPaymentSuccess = params.get('payment') === 'success';
            const isPaymentFailure = params.get('payment') === 'failure';
            const isPaymentPending = params.get('payment') === 'pending';

            if (isPaymentSuccess || isPaymentFailure || isPaymentPending) {
                // Clean URL
                const newUrl = window.location.pathname + window.location.hash;
                window.history.replaceState({}, document.title, newUrl);

                // IMPORTANT: Do NOT trust querystring for payment approval.
                // Only proceed when the backend (webhook) has granted the role in DB.
                roleService.clearCache();
                const isSub = await roleService.isSubscriber();
                if (isSub) {
                    await handlePaymentSuccessFlow();
                    return;
                }

                if (isPaymentFailure) {
                    setError('Pagamento não aprovado. Você pode tentar novamente.');
                } else if (isPaymentPending) {
                    setError('Pagamento pendente. Aguarde a confirmação e clique em "Verificar status".');
                } else {
                    setError('Pagamento ainda não confirmado. Aguarde alguns segundos e clique em "Verificar status".');
                }
            }
        };
        handlePaymentRedirect();
    }, [location.search]);

    const handlePaymentSuccessFlow = async () => {
        setIsProcessing(true);
        try {
            // Ensure we have answers
            let currentAnswers = answers;
            if (!currentAnswers || Object.keys(currentAnswers).length === 0) {
                const saved = storageService.loadState();
                if (saved.answers && Object.keys(saved.answers).length > 0) {
                    currentAnswers = saved.answers;
                    setAnswers(currentAnswers);
                } else {
                    throw new Error('Respostas não encontradas para gerar o resultado.');
                }
            }

            // Generate Top 3
            const topCareers = await generateTop3Careers(currentAnswers);

            // Save to storage
            // We need to keep answers and other state safe
            storageService.saveState(
                'top3_results', // next step
                answers,
                topCareers,
                null,
                null,
                undefined, [], 0 // Question state irrelevant here
            );

            // Save session to Supabase if logged in
            if (user) {
                try {
                    await supabaseService.saveUserSession({
                        answers: Object.entries(answers).map(([q, a]) => ({ questionId: q, answer: a })),
                        topCareers: topCareers,
                        totalQuestions: Object.keys(answers).length,
                        sessionDuration: 0
                    });
                } catch (err) {
                    console.error("Error saving session", err);
                }
            }

            // Navigate
            navigate('/resultados');

        } catch (err) {
            console.error(err);
            setError('Erro ao gerar resultados. Tente novamente.');
            setIsProcessing(false);
        }
    };

    const handleSelectPlan = async (planId: string) => {
        // This is called when a plan is selected.
        // If it's a direct flow (not involving payment redirect for some reason, or admin skip), we normally wait for redirect.
        // But the PaymentPlansStep component handles the redirection to MercadoPago itself.
        // So this callback might be unused unless we want to do something BEFORE redirect, 
        // OR if the PaymentPlansStep calls this for some "free" plan or skipping.

        // Actually, looking at App.tsx, `handlePlanSelection` just calls `handlePaymentSuccessFlow`.
        // But `PaymentPlansStep` handles the CLICK on the card by opening MP checkout.
        // Wait, `PaymentPlansStep` calls `onSelectPlan`? 
        // Let's check PaymentPlansStep.tsx again.
        // checking...
        // ... onClick={() => handlePlanClick(...)} ...
        // handlePlanClick calls `paymentService.createPreference` and `window.location.href = ...`
        // It DOES NOT call `onSelectPlan` prop in `handlePlanClick`.

        // So when is `onSelectPlan` used?
        // It seems `PaymentPlansStep` doesn't actually call `onSelectPlan` for the main cards!
        // It might be dead code in App.tsx or I missed where it's called.
        // Ah, `handleAdminPaymentTest` merely does redirect too.

        // So `handlePaymentSuccessFlow` is ONLY triggered by the `useEffect` listening to URL params?
        // OR by `handleAdminSkip` in App.tsx?
        // App.tsx `handleAdminSkip` sets step to `payment_plans`. 
        // It doesn't skip payment automatically there.
        // Wait, I missed something. Is there a "Skip Payment" button for admins? 
        // No.

        // So standard flow relies on redirect back.
        // BUT, what if I want to simulate success?
        // I can add a hidden admin button here too? 
        // Or relying on the Redirect is correct.
    };

    // Admin Skip convenience
    const handleAdminBypass = async () => {
        if (isAdmin && user) {
            console.log('[PaymentPlansPage] Admin bypass triggered. Setting user as subscriber in DB...');
            try {
                await supabaseService.updateUserRole(user.id, 'subscriber');
                roleService.clearCache();
                console.log('[PaymentPlansPage] Role updated successfully.');
            } catch (err) {
                console.error('[PaymentPlansPage] Error updating role during bypass:', err);
            }
        }
        handlePaymentSuccessFlow();
    };


    if (isProcessing) return <LoadingStep text="Analisando seu perfil e encontrando as melhores carreiras..." />;

    return (
        <>
            <PaymentPlansStep
                onSelectPlan={handleSelectPlan}
                onBack={() => navigate('/')}
                isAdmin={isAdmin}
            />
            {isAdmin && (
                <button
                    onClick={handleAdminBypass}
                    className="fixed bottom-4 right-4 bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-300 text-xs px-3 py-1 rounded border border-yellow-500/30 transition-colors z-50"
                >
                    [Admin] Simular Pagamento Aprovado
                </button>
            )}

            <div className="mt-8 text-center p-4 bg-slate-800/50 rounded-lg max-w-md mx-auto border border-slate-700 z-40 relative">
                <p className="text-slate-300 text-sm mb-3">Já realizou o pagamento mas ainda não liberou?</p>
                <button
                    onClick={async () => {
                        roleService.clearCache();
                        const isSub = await roleService.isSubscriber();
                        if (isSub) {
                            await handlePaymentSuccessFlow();
                        } else {
                            alert("O pagamento ainda não foi identificado. Aguarde alguns segundos e tente novamente. Se persistir, contate o suporte.");
                        }
                    }}
                    className="text-teal-400 hover:text-teal-300 text-sm underline font-medium"
                >
                    Verificar status do pagamento agora
                </button>
            </div>

            {error && <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg">{error}</div>}
        </>
    );
};
