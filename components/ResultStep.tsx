import React from 'react';
import { CareerPlan, TopCareer } from '../types';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { PathIcon } from './icons/PathIcon';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { CareerPlanPDF } from './CareerPlanPDF';
import { RatingSection } from './RatingSection';

interface FinalPlanStepProps {
  career: TopCareer;
  plan: CareerPlan;
  onReset: () => void;
  onGoHome: () => void;
  showSubscriberArea?: boolean;
}

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-slate-800/70 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
    <div className="flex items-center mb-3">
      <div className="text-teal-400 mr-3">{icon}</div>
      <h3 className="text-xl font-bold text-slate-200">{title}</h3>
    </div>
    <div className="text-slate-300 leading-relaxed">{children}</div>
  </div>
);

const FinalPlanStep: React.FC<FinalPlanStepProps> = ({ career, plan, onReset, onGoHome, showSubscriberArea = false }) => {
  console.log('[FinalPlanStep] Rendering...', { showSubscriberArea });
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-400 mb-2">
          Seu Plano de Ação para
        </h1>
        <p className="text-2xl md:text-3xl font-semibold text-slate-200">{career.profession}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <InfoCard icon={<BriefcaseIcon />} title="Sua Missão">
          <p>{career.description}</p>
        </InfoCard>
        <InfoCard icon={<LightbulbIcon />} title="Sua Especialização">
          <p className="font-semibold text-sky-300">{career.specialization}</p>
        </InfoCard>
      </div>

      <div>
        <InfoCard icon={<PathIcon />} title="Seu Caminho Detalhado">
          <div className="space-y-6 mt-4">
            {plan.stepByStepPlan.map((step, index) => (
              <div key={index} className="relative pl-8 border-l-2 border-slate-700">
                <div className="absolute w-4 h-4 bg-teal-500 rounded-full -left-[9px] top-1 border-4 border-slate-800"></div>
                <h4 className="font-bold text-teal-300 text-lg mb-2">{step.timeframe}</h4>
                <ul className="list-disc list-inside space-y-2 text-slate-300">
                  {step.actions.map((action, actionIndex) => (
                    <li key={actionIndex}>{action}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </InfoCard>
      </div>

      <div className="text-center mt-10 flex flex-col sm:flex-row justify-center gap-4">
        <PDFDownloadLink
          document={<CareerPlanPDF career={career} plan={plan} />}
          fileName={`plano-de-acao-${career.profession.toLowerCase().replace(/\s+/g, '-')}.pdf`}
          className="bg-teal-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-teal-500 transition-all duration-300 shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
        >
          {({ blob, url, loading, error }) =>
            loading ? 'Gerando PDF...' : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Baixar PDF
              </>
            )
          }
        </PDFDownloadLink>

        <button
          onClick={() => {
            console.log('[FinalPlanStep] Go Home button clicked');
            onGoHome();
          }}
          className={`font-extrabold py-4 px-10 rounded-xl border-2 transition-all duration-500 flex items-center justify-center gap-3 transform hover:scale-105 active:scale-95 ${showSubscriberArea
              ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:shadow-[0_0_30px_rgba(244,63,94,0.5)]'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
        >
          {showSubscriberArea && (
            <svg className="w-6 h-6 text-white animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          )}
          <span className="tracking-wide">
            {showSubscriberArea ? 'ÁREA DO ASSINANTE' : 'Voltar ao Início'}
          </span>
        </button>
        <button
          onClick={onReset}
          className="bg-slate-800 text-slate-300 font-semibold py-3 px-8 rounded-lg border border-slate-700 hover:bg-slate-700 transition-all duration-300"
        >
          Refazer Teste
        </button>
      </div>

      {/* Rating Section */}
      <div className="mt-10 max-w-2xl mx-auto">
        <RatingSection
          onRate={(rating, feedback) => {
            console.log('Rating:', rating, 'Feedback:', feedback);
            // TODO: Save to Supabase analytics
          }}
        />
      </div>
    </div>
  );
};

export default FinalPlanStep;