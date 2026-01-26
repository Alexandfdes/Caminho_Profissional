import React, { useState, useEffect, useRef } from 'react';

// Função utilitária para buscar cidades do IBGE
async function fetchCidadesPorUF(uf) {
  const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
  if (!res.ok) return [];
  return res.json();
}

import { GoogleIcon } from './icons/GoogleIcon';
import { RocketIcon } from './icons/RocketIcon';
import { supabaseService } from '../services/supabaseService';

interface AuthStepProps {
  onLogin: () => void;
  onBack?: () => void;/*  */
}

const AuthStep: React.FC<AuthStepProps> = ({ onLogin, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);


  // Estados do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [cidades, setCidades] = useState<any[]>([]);
  const [cidadesLoading, setCidadesLoading] = useState(false);
  const cidadesLoadedFor = useRef('');

  // Validação de campos
  // Regex robusta para telefone celular brasileiro (com DDD, 9 dígitos, rejeita repetições)
  const validatePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    // 11 dígitos: 2 DDD + 9 número (padrão celular BR)
    return digits.length === 11 && digits[2] === '9';
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    // Aplica máscara (XX) XXXXX-XXXX
    if (value.length > 10) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 6) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value.slice(0, 2)}`;
    }
    setPhone(value);
  };
  // Regex robusta para e-mail
  const validateEmail = (email: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  // Idade de 12 a 100 anos
  const validateAge = (age: string) => {
    const n = Number(age);
    return !isNaN(n) && n >= 12 && n <= 100;
  };



  const translateAuthError = (errorMessage: string) => {
    if (errorMessage.includes('Email not confirmed')) {
      return 'E-mail não confirmado. Verifique sua caixa de entrada.';
    }
    if (errorMessage.includes('Invalid login credentials')) {
      return 'E-mail ou senha incorretos.';
    }
    if (errorMessage.includes('User already registered')) {
      return 'Este e-mail já está cadastrado.';
    }
    if (errorMessage.includes('Password should be at least')) {
      return 'A senha deve ter pelo menos 6 caracteres.';
    }
    return errorMessage || 'Ocorreu um erro na autenticação.';
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Validações extras
    if (!isLogin) {
      if (!validateAge(age)) {
        setError('Idade inválida. Informe um valor entre 12 e 100.'); setIsLoading(false); return;
      }
      if (!validatePhone(phone)) {
        setError('Telefone inválido. Informe um número de celular válido com DDD (ex: 11999999999) e não use repetições.'); setIsLoading(false); return;
      }
      if (!validateEmail(email)) {
        setError('E-mail inválido.'); setIsLoading(false); return;
      }
      if (!state) {
        setError('Selecione o estado.'); setIsLoading(false); return;
      }
      if (!city) {
        setError('Selecione a cidade.'); setIsLoading(false); return;
      }
    }

    try {
      if (isLogin) {
        await supabaseService.signIn(email, password);
        onLogin();
      } else {
        const signUpData = { name, username, age, phone, city, state };
        const data = await supabaseService.signUp(email, password, name, age, phone, city, state, username);
        if (data.user && !data.session) {
          setSuccessMessage('Cadastro realizado com sucesso! Você já pode entrar com seus dados.');
          setIsLogin(true); // Switch to login mode
        } else if (data.session) {
          // Auto logged in (email confirmation disabled)
          onLogin();
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(translateAuthError(err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'Google') => {
    setIsLoading(true);
    setError(null);
    try {
      const supabaseProvider = 'google';
      await supabaseService.signInWithProvider(supabaseProvider);
    } catch (err: any) {
      console.error(err);
      setError(translateAuthError(err.message));
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg bg-slate-800/50 p-10 rounded-2xl shadow-2xl backdrop-blur-sm border border-slate-700 animate-fade-in">
      {/* Botão Voltar no canto superior esquerdo */}
      {onBack && (
        <button
          onClick={onBack}
          className="mb-4 text-sm text-slate-400 hover:text-teal-400 transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para Home
        </button>
      )}

      <div className="flex justify-center mb-6 relative">
        <div className="p-3 bg-teal-500/10 rounded-full border border-teal-500/30">
          <RocketIcon className="w-8 h-8 text-teal-400" />
        </div>
      </div>



      <h2 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-400 mb-4">
        {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
      </h2>
      <p className="text-center text-slate-400 mb-8">
        {isLogin ? 'Continue sua jornada profissional' : 'Comece a descobrir seu futuro hoje'}
      </p>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-200 text-sm text-center">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-200 text-sm text-center">
          {successMessage}
        </div>
      )}

      <div className="space-y-3 mb-6">
        <button
          onClick={() => handleSocialLogin('Google')}
          type="button"
          disabled={isLoading}
          className="group w-full flex items-center justify-center gap-3 bg-slate-900/60 hover:bg-slate-800 text-slate-200 border border-slate-600 hover:border-teal-500/50 font-medium py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-teal-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="p-1 bg-white rounded-full">
            <GoogleIcon className="w-4 h-4" />
          </div>
          <span className="group-hover:text-white transition-colors">Continuar com Google</span>
        </button>
      </div>

      <div className="relative flex items-center justify-center mb-6">
        <hr className="w-full border-slate-600" />
        <span className="absolute bg-slate-800 px-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Ou via e-mail</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nome Completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-slate-900/80 border border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors text-slate-200 placeholder-slate-500"
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nome de Usuário</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                className="w-full p-3 bg-slate-900/80 border border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors text-slate-200 placeholder-slate-500"
                placeholder="ex: joaosilva"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Estado</label>
                <select
                  required
                  value={state}
                  onChange={async e => {
                    setState(e.target.value);
                    setCity('');
                    setCidades([]);
                    cidadesLoadedFor.current = '';
                    if (e.target.value) {
                      setCidadesLoading(true);
                      const cidadesData = await fetchCidadesPorUF(e.target.value);
                      setCidades(cidadesData);
                      cidadesLoadedFor.current = e.target.value;
                      setCidadesLoading(false);
                    }
                  }}
                  className="w-full p-3 bg-slate-900/80 border border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors text-slate-200"
                >
                  <option value="">Selecione</option>
                  <option value="AC">Acre (AC)</option>
                  <option value="AL">Alagoas (AL)</option>
                  <option value="AP">Amapá (AP)</option>
                  <option value="AM">Amazonas (AM)</option>
                  <option value="BA">Bahia (BA)</option>
                  <option value="CE">Ceará (CE)</option>
                  <option value="DF">Distrito Federal (DF)</option>
                  <option value="ES">Espírito Santo (ES)</option>
                  <option value="GO">Goiás (GO)</option>
                  <option value="MA">Maranhão (MA)</option>
                  <option value="MT">Mato Grosso (MT)</option>
                  <option value="MS">Mato Grosso do Sul (MS)</option>
                  <option value="MG">Minas Gerais (MG)</option>
                  <option value="PA">Pará (PA)</option>
                  <option value="PB">Paraíba (PB)</option>
                  <option value="PR">Paraná (PR)</option>
                  <option value="PE">Pernambuco (PE)</option>
                  <option value="PI">Piauí (PI)</option>
                  <option value="RJ">Rio de Janeiro (RJ)</option>
                  <option value="RN">Rio Grande do Norte (RN)</option>
                  <option value="RS">Rio Grande do Sul (RS)</option>
                  <option value="RO">Rondônia (RO)</option>
                  <option value="RR">Roraima (RR)</option>
                  <option value="SC">Santa Catarina (SC)</option>
                  <option value="SP">São Paulo (SP)</option>
                  <option value="SE">Sergipe (SE)</option>
                  <option value="TO">Tocantins (TO)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Cidade</label>
                <select
                  required
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full p-3 bg-slate-900/80 border border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors text-slate-200"
                  disabled={!state || cidadesLoading}
                >
                  <option value="">{cidadesLoading ? 'Carregando...' : 'Selecione'}</option>
                  {cidades.map(cidade => (
                    <option key={cidade.id} value={cidade.nome}>{cidade.nome}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Idade</label>
                <input
                  type="number"
                  required
                  min="14"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full p-3 bg-slate-900/80 border border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors text-slate-200 placeholder-slate-500"
                  placeholder="18"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Telefone</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={handlePhoneChange}
                  className="w-full p-3 bg-slate-900/80 border border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors text-slate-200 placeholder-slate-500"
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">E-mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-slate-900/80 border border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors text-slate-200 placeholder-slate-500"
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Senha</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-slate-900/80 border border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors text-slate-200 placeholder-slate-500"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-900 font-bold py-3.5 px-4 rounded-lg transition-all duration-300 shadow-lg shadow-teal-500/20 flex justify-center items-center transform hover:scale-[1.02]"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            isLogin ? 'Entrar na Plataforma' : 'Criar Conta Gratuita'
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-slate-400 text-sm">
          {isLogin ? 'Ainda não tem uma conta?' : 'Já possui cadastro?'}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="ml-2 text-teal-400 hover:text-teal-300 font-semibold hover:underline focus:outline-none transition-colors"
          >
            {isLogin ? 'Cadastre-se' : 'Fazer Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthStep;
