import React from 'react';

export interface RadioQuestionProps {
    questionId: string;
    text: string;
    options: string[];
    answer?: string;
    setAnswer: (questionId: string, value: string) => void;
    goNext: (value?: string) => void;
    autoAdvance?: boolean;
    isLastQuestion?: boolean;
    disabled?: boolean;
}

/**
 * RadioQuestion Component
 * 
 * Single-choice radio button question with auto-advance functionality.
 * Fully accessible with ARIA attributes and keyboard support.
 * 
 * @param questionId - Unique identifier for the question
 * @param text - Question text to display
 * @param options - Array of answer options
 * @param answer - Currently selected answer
 * @param setAnswer - Callback to update the answer (questionId, value)
 * @param goNext - Callback to advance to next question (accepts optional value)
 * @param autoAdvance - If true, automatically advance after selection (default: true)
 * @param isLastQuestion - If true, don't auto-advance (just mark as answered)
 * @param disabled - Disable all inputs
 */
export const RadioQuestion: React.FC<RadioQuestionProps> = ({
    questionId,
    text,
    options,
    answer = '',
    setAnswer,
    goNext,
    autoAdvance = true,
    isLastQuestion = false,
    disabled = false,
}) => {
    const handleOptionChange = (value: string) => {
        console.log('[RadioQuestion] Option changed:', value);
        console.log('[RadioQuestion] autoAdvance:', autoAdvance);
        console.log('[RadioQuestion] isLastQuestion:', isLastQuestion);
        console.log('[RadioQuestion] disabled:', disabled);

        // Step 1: Set answer immediately
        setAnswer(questionId, value);

        // Step 2: Auto-advance if enabled and not last question
        if (autoAdvance && !isLastQuestion && !disabled) {
            console.log('[RadioQuestion] Will call goNext in 300ms with value:', value);
            // Small delay to ensure state is applied and provide visual feedback
            setTimeout(() => {
                console.log('[RadioQuestion] Calling goNext now with:', value);
                goNext(value); // Pass value directly to avoid race condition
            }, 300);
        } else {
            console.log('[RadioQuestion] NOT auto-advancing because:', {
                autoAdvance,
                isLastQuestion,
                disabled
            });
        }
    };

    const labelId = `question-label-${questionId}`;

    return (
        <div
            role="group"
            aria-labelledby={labelId}
            className="space-y-4"
        >
            <label
                id={labelId}
                className="block text-2xl md:text-3xl font-bold mb-8 text-slate-100 leading-tight"
            >
                {text}
            </label>

            <div className="grid grid-cols-1 gap-4">
                {options.map((option, index) => {
                    const isSelected = answer === option;
                    const inputId = `${questionId}-option-${index}`;

                    return (
                        <label
                            key={option}
                            htmlFor={inputId}
                            className={`group relative flex items-center p-5 rounded-xl cursor-pointer transition-all duration-300 border-2 ${isSelected
                                    ? 'bg-teal-500/10 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.2)]'
                                    : 'bg-slate-900/60 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <input
                                type="radio"
                                id={inputId}
                                name={questionId}
                                value={option}
                                checked={isSelected}
                                onChange={() => handleOptionChange(option)}
                                disabled={disabled}
                                className="hidden"
                                aria-labelledby={`${inputId}-label`}
                            />
                            <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 transition-colors ${isSelected ? 'border-teal-500' : 'border-slate-500 group-hover:border-slate-400'
                                    }`}
                            >
                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />}
                            </div>
                            <span
                                id={`${inputId}-label`}
                                className={`text-lg transition-colors ${isSelected ? 'text-white font-medium' : 'text-slate-300 group-hover:text-slate-200'
                                    }`}
                            >
                                {option}
                            </span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
};
