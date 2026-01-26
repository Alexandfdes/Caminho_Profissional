import React from 'react';
import { RocketIcon } from './icons/RocketIcon';
import SupabaseStatusCard from './SupabaseStatusCard';

interface WelcomeStepProps {
  onStartDiscovery: () => void;
  onStartExploration: () => void;
  onViewMyCareers?: () => void;
  isSubscriber?: boolean;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onStartDiscovery, onStartExploration, onViewMyCareers, isSubscriber }) => {
  return (
    <div className="text-center p-8 bg-slate-800/50 rounded-2xl shadow-2xl backdrop-blur-sm border border-slate-700 animate-fade-in">
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-teal-500/10 rounded-full border border-teal-500/30">
          <RocketIcon className="w-10 h-10 text-teal-400" />
        </div>
      </div>
      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-400 mb-4">
        O Caminho Profissional
      </h1>
      <p className="max-w-2xl mx-auto text-lg text-slate-300 mb-8">
        Descubra sua profissão dos sonhos com nosso guia de IA ou explore diversas carreiras em detalhes.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button
          onClick={onStartDiscovery}
          className="bg-teal-500 text-slate-900 font-bold py-3 px-8 rounded-lg hover:bg-teal-400 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-teal-500/20 focus:outline-none focus:ring-4 focus:ring-teal-500/50"
        >
          Descobrir Meu Caminho
        </button>
        <button
          onClick={onStartExploration}
          className="bg-slate-700 text-slate-200 font-bold py-3 px-8 rounded-lg hover:bg-slate-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-slate-600/50"
        >
          Explorar Carreiras
        </button>
        {onViewMyCareers && isSubscriber && (
          <button
            onClick={onViewMyCareers}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 px-8 rounded-lg hover:from-pink-400 hover:to-purple-400 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500/50"
          >
            ⭐ Área do Assinante
          </button>
        )}
      </div>
      <SupabaseStatusCard />
    </div>
  );
};

export default WelcomeStep;
