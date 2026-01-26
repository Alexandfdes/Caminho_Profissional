import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../types';

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
  isLastQuestion?: boolean;
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
  isLastQuestion = false
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

  const handleOptionChange = (value: string) => {
    console.log('[QuestionsStep] handleOptionChange called with:', value);
    console.log('[QuestionsStep] onSubmit type:', typeof onSubmit);

    try {
      setSelectedOption(value);

      // Save to sessionStorage for persistence
      try {
        sessionStorage.setItem(`questionnaire:${question.id}`, value);
        console.log('[QuestionsStep] Saved to sessionStorage');
      } catch (error) {
        console.warn('Failed to save answer to sessionStorage:', error);
      }

      // Auto-advance for radio after a short delay - passing value to avoid race condition
      console.log('[QuestionsStep] Setting timeout for auto-advance');
      setTimeout(() => {
        console.log('[QuestionsStep] Timeout fired, calling onSubmit with:', value);
        if (typeof onSubmit === 'function') {
          onSubmit(value); // Pass value directly instead of relying on state
          console.log('[QuestionsStep] onSubmit called successfully');
        } else {
          console.error('[QuestionsStep] onSubmit is not a function!', onSubmit);
        }
      }, 300);
    } catch (error) {
      console.error('[QuestionsStep] Error in handleOptionChange:', error);
    }
  };

  const handleTextSubmit = () => {
    if (textAnswer.trim()) {
      // Save to sessionStorage for persistence
      try {
        const storageKey = `questionnaire:${question.id}`;
        sessionStorage.setItem(storageKey, textAnswer);
      } catch (error) {
        console.warn('Failed to save answer to sessionStorage:', error);
      }

      onSubmit(textAnswer);
    }
  };

  if (isThinking) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center animate-pulse">
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 border-4 border-teal-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(20,184,166,0.2)]"></div>
        </div>
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-400 mb-4">
          Adaptando o caminho...
        </h2>
        <p className="text-slate-400 text-lg max-w-md">
          A IA está analisando sua resposta para escolher a próxima pergunta ideal.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pt-8 md:pt-12 flex-shrink-0 relative">
        {/* Header Navigation */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            {onGoHome && (
              <button
                onClick={onGoHome}
                className="text-slate-400 hover:text-white transition-all flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-2xl hover:bg-slate-800/80 group border border-transparent hover:border-slate-700/50"
                title="Voltar para a página inicial"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 group-hover:text-teal-400 transition-colors"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                Sair
              </button>
            )}

            {canGoBack && (
              <button
                onClick={onBack}
                className="text-slate-400 hover:text-teal-400 transition-all flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-2xl hover:bg-teal-500/5 group border border-transparent hover:border-teal-500/20"
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                Pergunta Anterior
              </button>
            )}
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:block">
            <span className="inline-block py-2 px-6 rounded-full bg-slate-800/90 border border-slate-700/50 text-teal-400 text-sm font-bold backdrop-blur-xl shadow-2xl">
              {questionsAnsweredCount} {questionsAnsweredCount === 1 ? 'pergunta respondida' : 'perguntas respondidas'}
            </span>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-all focus:outline-none transform hover:scale-105 active:scale-95"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-teal-500 to-sky-500 p-[2px] shadow-xl shadow-teal-500/20">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-400">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in-up">
                <div className="px-4 py-3 border-b border-slate-700">
                  <p className="text-sm text-white font-bold">Meu Perfil</p>
                </div>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full text-left px-5 py-3 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors"
                >
                  Sair da Conta
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-6xl bg-slate-800/40 p-10 md:p-16 rounded-[3rem] animate-fade-in backdrop-blur-md shadow-2xl border border-slate-700/50">

          {error && <p className="text-red-400 bg-red-900/50 p-4 rounded-xl mb-8 text-center border border-red-800 animate-shake">{error}</p>}

          <div className="min-h-[280px] flex flex-col">
            <label className="block text-xl md:text-2xl font-bold mb-8 text-slate-100 leading-tight tracking-tight">
              {question.label}
            </label>

            {question.type === 'radio' && question.options && (
              <div className="grid grid-cols-1 gap-3">
                {[...question.options, 'Nenhum'].filter((v, i, a) => a.indexOf(v) === i).map(option => {
                  const isSelected = selectedOption === option;
                  return (
                    <div
                      key={option}
                      onClick={() => handleOptionChange(option)}
                      className={`group relative flex items-center p-5 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${isSelected
                        ? 'bg-teal-500/10 border-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.15)] ring-1 ring-teal-500/30'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-600 hover:bg-slate-800/60'
                        }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 transition-all duration-300 ${isSelected ? 'border-teal-500 scale-110' : 'border-slate-600 group-hover:border-slate-400'}`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-scale-in" />}
                      </div>
                      <span className={`text-lg transition-colors ${isSelected ? 'text-white font-semibold' : 'text-slate-300 group-hover:text-slate-100'}`}>{option}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {question.type === 'textarea' && (
              <div className="flex-grow flex flex-col">
                <textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder={question.placeholder}
                  className="w-full h-48 p-6 bg-slate-900/40 border-2 border-slate-800 rounded-2xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all text-slate-200 text-lg resize-none placeholder-slate-700 mb-6"
                />
                <button
                  onClick={handleTextSubmit}
                  disabled={!textAnswer.trim()}
                  className="self-end py-3.5 px-10 bg-gradient-to-r from-teal-500 to-teal-600 text-slate-900 font-black rounded-2xl hover:from-teal-400 hover:to-teal-500 transition-all shadow-xl shadow-teal-500/20 transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:transform-none"
                >
                  Próximo Passo →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionsStep;
