
import { UserAnswers, TopCareer, CareerPlan } from '../types';

const STORAGE_KEYS = {
  USER: 'app_user',
  ENTRY_SOURCE: 'app_entry_source',
  STEP: 'app_step',
  ANSWERS: 'app_answers',
  TOP3: 'app_top3',
  SELECTED_CAREER: 'app_selected_career',
  FINAL_PLAN: 'app_final_plan'
};

export interface UserProfile {
  name: string;
  email: string;
  provider: 'Google' | 'Microsoft' | 'Email';
}

export const storageService = {
  setEntrySource: (source: 'dashboard' | 'landing' | null) => {
    if (source) {
      localStorage.setItem(STORAGE_KEYS.ENTRY_SOURCE, source);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ENTRY_SOURCE);
    }
  },

  getEntrySource: (): 'dashboard' | 'landing' | null => {
    const value = localStorage.getItem(STORAGE_KEYS.ENTRY_SOURCE);
    return value === 'dashboard' || value === 'landing' ? value : null;
  },

  // Simula Login/Sessão
  saveUser: (user: UserProfile) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  getUser: (): UserProfile | null => {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  logout: () => {
    localStorage.clear(); // Limpa tudo ao sair
  },

  // Persistência de Estado (Para não perder progresso no F5)
  saveState: (
    step: string,
    answers?: UserAnswers,
    top3?: TopCareer[],
    selected?: TopCareer | null,
    plan?: CareerPlan | null,
    currentQuestion?: any,
    questionHistory?: any[],
    questionsAnsweredCount?: number
  ) => {
    if (step) localStorage.setItem(STORAGE_KEYS.STEP, step);
    if (answers) localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(answers));
    if (top3) localStorage.setItem(STORAGE_KEYS.TOP3, JSON.stringify(top3));
    if (selected) localStorage.setItem(STORAGE_KEYS.SELECTED_CAREER, JSON.stringify(selected));
    if (plan) localStorage.setItem(STORAGE_KEYS.FINAL_PLAN, JSON.stringify(plan));
    if (currentQuestion) localStorage.setItem('app_current_question', JSON.stringify(currentQuestion));
    if (questionHistory) localStorage.setItem('app_question_history', JSON.stringify(questionHistory));
    if (questionsAnsweredCount !== undefined) localStorage.setItem('app_questions_count', String(questionsAnsweredCount));
  },

  loadState: () => {
    return {
      step: localStorage.getItem(STORAGE_KEYS.STEP),
      answers: JSON.parse(localStorage.getItem(STORAGE_KEYS.ANSWERS) || '{}'),
      top3: JSON.parse(localStorage.getItem(STORAGE_KEYS.TOP3) || '[]'),
      selectedCareer: JSON.parse(localStorage.getItem(STORAGE_KEYS.SELECTED_CAREER) || 'null'),
      finalPlan: JSON.parse(localStorage.getItem(STORAGE_KEYS.FINAL_PLAN) || 'null'),
      currentQuestion: JSON.parse(localStorage.getItem('app_current_question') || 'null'),
      questionHistory: JSON.parse(localStorage.getItem('app_question_history') || '[]'),
      questionsAnsweredCount: Number(localStorage.getItem('app_questions_count') || 0),
    };
  },

  clearProgress: () => {
    // Remove apenas chaves de progresso da aplicação
    // NÃO usar localStorage.clear() pois remove o token do Supabase
    localStorage.removeItem(STORAGE_KEYS.ENTRY_SOURCE);
    localStorage.removeItem(STORAGE_KEYS.STEP);
    localStorage.removeItem(STORAGE_KEYS.ANSWERS);
    localStorage.removeItem(STORAGE_KEYS.TOP3);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_CAREER);
    localStorage.removeItem(STORAGE_KEYS.FINAL_PLAN);
    localStorage.removeItem('app_current_question');
    localStorage.removeItem('app_question_history');
    localStorage.removeItem('app_questions_count');

    // Limpar também chaves do sessionStorage se houver
    sessionStorage.clear();

    // Remover chaves específicas que podem ter sido criadas dinamicamente
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('questionnaire:')) {
        localStorage.removeItem(key);
      }
    });
  }
};
