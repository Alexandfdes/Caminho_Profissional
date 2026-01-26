// Example integration of RadioQuestion in QuestionsStep.tsx
// This shows how to replace the current inline radio implementation

import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../types';
import { RadioQuestion } from './RadioQuestion';

interface QuestionsStepProps {
    question: Question;
    onSubmit: (answer: string) => void;
    isThinking: boolean;
    questionsAnsweredCount: number;
    error: string | null;
    onBack: () => void;
    canGoBack: boolean;
    currentAnswer?: string;
    onLogout?: () => void;
    onGoHome?: () => void;
    isLastQuestion?: boolean; // Add this prop to know if it's the last question
}

const QuestionsStep: React.FC<QuestionsStepProps> = ({
    question,
    onSubmit,
    isThinking,
    questionsAnsweredCount,
    error,
    onBack,
    canGoBack,
    currentAnswer,
    onLogout,
    onGoHome,
    isLastQuestion = false,
}) => {
    const [selectedOption, setSelectedOption] = useState<string>('');
    const [textAnswer, setTextAnswer] = useState<string>('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sync local state when question or currentAnswer changes
    useEffect(() => {
        if (currentAnswer) {
            if (question.type === 'radio') {
                setSelectedOption(currentAnswer);
            } else {
                setTextAnswer(currentAnswer);
            }
        } else {
            setSelectedOption('');
            setTextAnswer('');
        }
    }, [question, currentAnswer]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handler for RadioQuestion component
    const handleSetAnswer = (questionId: string, value: string) => {
        setSelectedOption(value);

        // Save to sessionStorage for persistence
        try {
            sessionStorage.setItem(`questionnaire:${questionId}`, value);
        } catch (error) {
            console.warn('Failed to save answer to sessionStorage:', error);
        }
    };

    const handleGoNext = () => {
        if (selectedOption) {
            onSubmit(selectedOption);
        }
    };

    const handleTextSubmit = () => {
        if (textAnswer.trim()) {
            // Save to sessionStorage for persistence
            try {
                sessionStorage.setItem(`questionnaire:${question.id}`, textAnswer);
            } catch (error) {
                console.warn('Failed to save answer to sessionStorage:', error);
            }

            onSubmit(textAnswer);
        }
    };

    if (isThinking) {
        return (
            <div className="max-w-3xl mx-auto text-center py-20 animate-pulse">
                <div className="mb-6 flex justify-center">
                    <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h2 className="text-2xl font-bold text-slate-200 mb-2">Adaptando o caminho...</h2>
                <p className="text-slate-400">A IA está analisando sua resposta para escolher a próxima pergunta ideal.</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header Navigation - Same as before */}
            <div className="mb-8 flex items-center justify-between">
                {/* ... header content ... */}
            </div>

            <div className="bg-slate-800/50 p-8 md:p-10 rounded-3xl shadow-2xl backdrop-blur-md border border-slate-700 animate-fade-in">
                {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-lg mb-6 text-center border border-red-800">{error}</p>}

                <div className="min-h-[320px] flex flex-col">
                    {question.type === 'radio' && question.options ? (
                        <RadioQuestion
                            questionId={question.id}
                            text={question.label}
                            options={[...question.options, 'Nenhum'].filter((v, i, a) => a.indexOf(v) === i)}
                            answer={selectedOption}
                            setAnswer={handleSetAnswer}
                            goNext={handleGoNext}
                            autoAdvance={true}
                            isLastQuestion={isLastQuestion}
                            disabled={isThinking}
                        />
                    ) : question.type === 'textarea' ? (
                        <div className="flex-grow flex flex-col">
                            <label className="block text-2xl md:text-3xl font-bold mb-8 text-slate-100 leading-tight">
                                {question.label}
                            </label>
                            <textarea
                                value={textAnswer}
                                onChange={(e) => setTextAnswer(e.target.value)}
                                placeholder={question.placeholder}
                                className="w-full h-48 p-5 bg-slate-900/60 border-2 border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-slate-200 text-lg resize-none placeholder-slate-600 mb-6"
                            />
                            <button
                                onClick={handleTextSubmit}
                                disabled={!textAnswer.trim()}
                                className="self-end py-3 px-8 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-bold rounded-xl hover:from-teal-400 hover:to-teal-500 transition-all shadow-lg shadow-teal-500/20 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                            >
                                Próximo Passo →
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default QuestionsStep;
