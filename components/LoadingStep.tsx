
import React from 'react';

interface LoadingStepProps {
  text?: string;
}

const LoadingStep: React.FC<LoadingStepProps> = ({ text }) => {
  return (
    <div className="text-center p-8 flex flex-col items-center justify-center min-h-screen bg-slate-900">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal-500 mb-6"></div>
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-400 mb-2">
        Traçando seu futuro...
      </h2>
      <p className="text-slate-400">{text || "Nossa IA está trabalhando para criar o caminho perfeito para você."}</p>
    </div>
  );
};

export default LoadingStep;