import React, { useState } from 'react';
import { supabaseService } from '../services/supabaseService';

const SupabaseStatusCard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [detail, setDetail] = useState('Clique no botão para confirmar a conexão com Supabase.');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleCheckConnection = async () => {
    setIsLoading(true);
    setStatus('idle');
    setDetail('Aguardando resposta do Supabase...');
    try {
      const result = await supabaseService.testConnection();

      if (result.success) {
        setDetail(result.message);
        setStatus('success');
      } else {
        setDetail(result.message);
        setStatus('error');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido ao contatar o Supabase.';
      setDetail(message);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const borderColor = status === 'success' ? 'border-emerald-500/70' : status === 'error' ? 'border-rose-500/70' : 'border-slate-700';
  const textColor = status === 'success' ? 'text-emerald-300' : status === 'error' ? 'text-rose-300' : 'text-slate-400';

  return (
    <div className={`mt-8 p-6 rounded-2xl border ${borderColor} bg-slate-900/60`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-slate-500 mb-1">Supabase</p>
          <h3 className="text-xl font-semibold text-white">Teste de Conexão</h3>
        </div>
        <button
          onClick={handleCheckConnection}
          disabled={isLoading}
          className="bg-teal-500 text-slate-900 font-semibold px-4 py-2 rounded-lg hover:bg-teal-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Testando...' : 'Verificar'}
        </button>
      </div>
      <p className={`mt-4 text-sm leading-relaxed ${textColor}`}>{detail}</p>
      <p className="text-xs text-slate-500 mt-2">Verifica a conexão com a tabela `career_plans`.</p>
    </div>
  );
};

export default SupabaseStatusCard;