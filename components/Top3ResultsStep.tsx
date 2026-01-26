import React from 'react';
import { TopCareer } from '../types';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { SalaryIcon } from './icons/SalaryIcon';
import { MarketIcon } from './icons/MarketIcon';
import { ToolsIcon } from './icons/ToolsIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';


interface Top3ResultsStepProps {
  careers: TopCareer[];
  onSelect: (career: TopCareer) => void;
  onBack: () => void;
  error: string | null;
}

const CareerCard: React.FC<{ career: TopCareer; onSelect: () => void; }> = ({ career, onSelect }) => {
    return (
        <div className="bg-slate-800/70 p-6 rounded-xl border border-slate-700 flex flex-col justify-between backdrop-blur-sm">
            <div>
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-400 mb-3">{career.profession}</h3>
                <p className="text-slate-300 mb-6 text-sm">{career.description}</p>
                
                <div className="space-y-4 text-sm">
                    <InfoItem icon={<LightbulbIcon className="w-5 h-5"/>} title="Especialização" content={career.specialization} />
                    <InfoItem icon={<ToolsIcon className="w-5 h-5"/>} title="Ferramentas Populares" content={career.tools.join(', ')} />
                    <InfoItem icon={<SalaryIcon className="w-5 h-5"/>} title="Faixa Salarial" content={career.salaryRange} />
                    <InfoItem icon={<MarketIcon className="w-5 h-5"/>} title="Demanda de Mercado" content={career.marketDemand} />
                </div>
            </div>
            <button 
                onClick={onSelect}
                className="w-full mt-6 bg-teal-500 text-slate-900 font-bold py-3 px-6 rounded-lg hover:bg-teal-400 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-teal-500/20"
            >
                Escolher este Caminho
            </button>
        </div>
    )
}

const InfoItem: React.FC<{ icon: React.ReactNode; title: string; content: string; }> = ({ icon, title, content }) => (
    <div className="flex items-start">
        <div className="text-teal-400 mr-3 mt-1 flex-shrink-0">{icon}</div>
        <div>
            <p className="font-semibold text-slate-200">{title}</p>
            <p className="text-slate-400">{content}</p>
        </div>
    </div>
)


const Top3ResultsStep: React.FC<Top3ResultsStepProps> = ({ careers, onSelect, onBack, error }) => {
  return (
    <div className="animate-fade-in">
        <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-400 mb-2">
                Seus Caminhos em Potencial
            </h1>
            <p className="text-lg text-slate-300">Analisamos seu perfil e estas são as 3 carreiras com maior sintonia.</p>
        </div>
        
        {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md mb-6 text-center">{error}</p>}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {careers.map(career => (
                <CareerCard key={career.profession} career={career} onSelect={() => onSelect(career)} />
            ))}
        </div>
         <div className="text-center mt-10">
            <button
            onClick={onBack}
            className="bg-slate-700 text-slate-300 font-semibold py-2 px-6 rounded-lg hover:bg-slate-600 transition-all duration-300"
            >
            Voltar e refazer
            </button>
        </div>
    </div>
  );
};

export default Top3ResultsStep;
