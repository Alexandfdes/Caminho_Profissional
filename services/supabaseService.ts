/// <reference types="vite/client" />

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { CareerPlan, TopCareer, UserAnswers } from '../types';

const normalizeEnvValue = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  // Handle accidental wrapping quotes in .env files
  return trimmed.replace(/^['"](.*)['"]$/g, '$1').trim();
};

// Vite exposes client env vars via import.meta.env (only VITE_*)
const SUPABASE_URL = normalizeEnvValue(import.meta.env.VITE_SUPABASE_URL);
const SUPABASE_ANON_KEY = normalizeEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);



let supabase: SupabaseClient | null = null;

// Lightweight auth cache to prevent repeated network calls on screen transitions
let cachedUser: User | null = null;
let cachedUserAt = 0;
let inflightUserPromise: Promise<User | null> | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  if (!/^https?:\/\//i.test(SUPABASE_URL)) {
    console.warn(
      'VITE_SUPABASE_URL inválida. Use o formato https://<project-ref>.supabase.co (sem aspas). Valor atual:',
      SUPABASE_URL
    );
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true, // Persist session in localStorage
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
} else {
  console.warn(
    'Supabase não está configurado corretamente. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
  );
}

const requireSupabase = () => {
  if (!supabase) throw new Error('Supabase não inicializado');
  return supabase;
};

export const supabaseService = {
  getClient: () => supabase,

  clearAuthCache: () => {
    cachedUser = null;
    cachedUserAt = 0;
    inflightUserPromise = null;
  },

  // Auth Methods
  signUp: async (email: string, password: string, name: string, age?: string, phone?: string, city?: string, state?: string, username?: string) => {
    if (!supabase) throw new Error('Supabase não inicializado');
    // Desabilita a confirmação de e-mail para novos usuários
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Garante que não será enviado e-mail de confirmação
        data: {
          name,
          username,
          age,
          phone,
          city,
          state
        },
        // Força o usuário como confirmado (apenas se o projeto Supabase permitir)

      },
    });
    if (error) throw error;
    return data;
  },

  signIn: async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase não inicializado');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  signInWithProvider: async (provider: 'google' | 'azure') => {
    if (!supabase) throw new Error('Supabase não inicializado');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    if (!supabase) throw new Error('Supabase não inicializado');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Make sure UI auth checks don't re-use stale cached user
    supabaseService.clearAuthCache();
  },

  getUser: async (): Promise<User | null> => {
    if (!supabase) return null;
    try {
      // Try to get session from local storage first (much faster)
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) return sessionData.session.user;

      // Fallback to server validation if needed
      const { data } = await supabase.auth.getUser();
      return data.user;
    } catch (err) {
      console.warn('Erro ao obter usuário:', err);
      return null;
    }
  },

  /**
   * Fast user lookup used by UI guards and route wrappers.
   * - Prefer reading from local session first (no network)
   * - Cache results briefly
   * - De-dupe concurrent calls
   */
  getUserCached: async (options?: { maxAgeMs?: number }): Promise<User | null> => {
    if (!supabase) return null;

    const maxAgeMs = options?.maxAgeMs ?? 30_000;
    const now = Date.now();

    if (now - cachedUserAt < maxAgeMs) {
      return cachedUser;
    }

    if (inflightUserPromise) {
      return inflightUserPromise;
    }

    inflightUserPromise = (async () => {
      try {
        // Prefer local session cache first
        const { data: sessionData } = await supabase!.auth.getSession();
        const sessionUser = sessionData.session?.user ?? null;
        if (sessionUser) {
          cachedUser = sessionUser;
          cachedUserAt = Date.now();
          return cachedUser;
        }

        // Fallback to server validation
        const { data } = await supabase!.auth.getUser();
        cachedUser = data.user;
        cachedUserAt = Date.now();
        return cachedUser;
      } finally {
        inflightUserPromise = null;
      }
    })();

    return inflightUserPromise;
  },

  onAuthStateChange: (callback: (user: User | null) => void) => {
    if (!supabase) return { data: { subscription: { unsubscribe: () => { } } } };
    return supabase.auth.onAuthStateChange((event, session) => {
      cachedUser = session?.user ?? null;
      cachedUserAt = Date.now();
      callback(cachedUser);
    });
  },

  // Data Methods
  saveCareerPlan: async (userId: string, plan: CareerPlan, careerTitle?: string, careerDescription?: string) => {
    if (!supabase) throw new Error('Supabase não inicializado');
    const { data, error } = await supabase
      .from('career_plans')
      .insert({
        user_id: userId,
        career_title: careerTitle || 'Plano de Carreira',
        career_description: careerDescription || '',
        plan_data: plan,
        created_at: new Date().toISOString(),
      })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  getCareerPlans: async (userId: string) => {
    if (!supabase) throw new Error('Supabase não inicializado');
    const { data, error } = await supabase
      .from('career_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  getCareerPlanById: async (planId: string) => {
    const client = requireSupabase();
    const user = await supabaseService.getUserCached();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await client
      .from('career_plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  deleteCareerPlan: async (planId: string): Promise<void> => {
    const client = requireSupabase();
    const user = await supabaseService.getUserCached();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await client
      .from('career_plans')
      .delete()
      .eq('id', planId)
      .eq('user_id', user.id);

    if (error) throw new Error(error.message);
  },

  getPlanProgress: async (planId: string): Promise<{ completed_actions: string[] } | null> => {
    const client = requireSupabase();
    const user = await supabaseService.getUserCached();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await client
      .from('plan_progress')
      .select('completed_actions')
      .eq('plan_id', planId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      completed_actions: (data as any).completed_actions ?? [],
    };
  },

  upsertPlanProgress: async (planId: string, completedActions: string[]): Promise<void> => {
    const client = requireSupabase();
    const user = await supabaseService.getUserCached();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await client
      .from('plan_progress')
      .upsert(
        {
          user_id: user.id,
          plan_id: planId,
          completed_actions: completedActions,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,plan_id' }
      );

    if (error) throw new Error(error.message);
  },

  saveUserAnswers: async (userId: string, answers: UserAnswers) => {
    if (!supabase) throw new Error('Supabase não inicializado');
    const { data, error } = await supabase
      .from('user_answers')
      .insert({
        user_id: userId,
        answers: answers,
        created_at: new Date().toISOString(),
      });
    if (error) throw error;
    return data;
  },

  testConnection: async () => {
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase não inicializado. Verifique as variáveis de ambiente.',
      };
    }

    try {
      const { data, error } = await supabase.from('career_plans').select('count').limit(1);
      if (error) {
        return {
          success: false,
          message: `Erro na conexão: ${error.message}`,
        };
      }
      return {
        success: true,
        message: 'Conexão com Supabase estabelecida com sucesso!',
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Erro inesperado: ${err.message}`,
      };
    }
  },

  // Learning System Methods
  saveUserSession: async (sessionData: {
    answers: any[];
    topCareers: TopCareer[];
    selectedCareer?: string;
    totalQuestions: number;
    sessionDuration?: number;
  }) => {
    if (!supabase) throw new Error('Supabase não inicializado');

    const user = await supabaseService.getUserCached();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        age: user.user_metadata?.age ? parseInt(user.user_metadata.age) : null,
        city: user.user_metadata?.city || null,
        state: user.user_metadata?.state || null,
        answers: sessionData.answers,
        top_careers: sessionData.topCareers,
        selected_career: sessionData.selectedCareer || null,
        total_questions: sessionData.totalQuestions,
        session_duration_seconds: sessionData.sessionDuration || null,
        completed: !!sessionData.selectedCareer,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateSessionCareer: async (sessionId: string, selectedCareer: string) => {
    if (!supabase) throw new Error('Supabase não inicializado');

    const { data, error } = await supabase
      .from('user_sessions')
      .update({
        selected_career: selectedCareer,
        completed: true,
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getCareerPatterns: async (state?: string, ageRange?: { min: number; max: number }) => {
    if (!supabase) throw new Error('Supabase não inicializado');

    let query = supabase
      .from('user_sessions')
      .select('state, age, selected_career, answers, top_careers')
      .eq('completed', true);

    if (state) {
      query = query.eq('state', state);
    }

    if (ageRange) {
      query = query.gte('age', ageRange.min).lte('age', ageRange.max);
    }

    const { data, error } = await query.limit(100);

    if (error) throw error;
    return data || [];
  },

  getPopularCareers: async (state?: string) => {
    if (!supabase) throw new Error('Supabase não inicializado');

    let query = supabase
      .from('user_sessions')
      .select('selected_career, state')
      .eq('completed', true)
      .not('selected_career', 'is', null);

    if (state) {
      query = query.eq('state', state);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Aggregate data
    const careerCounts: Record<string, number> = {};
    data?.forEach((session: any) => {
      const career = session.selected_career;
      if (career) {
        careerCounts[career] = (careerCounts[career] || 0) + 1;
      }
    });

    // Sort by frequency
    return Object.entries(careerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([career, count]) => ({ career, count }));
  },

  clearResumeAnalysisCache: async (options: { cacheKey?: string; userId?: string; olderThan?: string } = {}) => {
    const client = requireSupabase();
    let query = client.from('resume_analysis_cache').delete();

    if (options.cacheKey) {
      query = query.eq('cache_key', options.cacheKey);
    }

    if (options.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options.olderThan) {
      query = query.lte('created_at', options.olderThan);
    }

    const { error } = await query;
    if (error) throw error;
  },
  // Admin Methods
  getAdminStats: async () => {
    if (!supabase) throw new Error('Supabase não inicializado');
    const { data, error } = await supabase.rpc('get_admin_stats');
    if (error) throw error;
    return data;
  },

  getAllUsers: async () => {
    if (!supabase) throw new Error('Supabase não inicializado');
    const { data, error } = await supabase.rpc('get_all_users_with_roles');
    if (error) throw error;
    return data;
  },

  updateUserRole: async (userId: string, newRole: string) => {
    if (!supabase) throw new Error('Supabase não inicializado');
    const { error } = await supabase.rpc('update_user_role_admin', {
      target_user_id: userId,
      new_role: newRole,
    });
    if (error) throw error;
  },
};

// Helper function to ensure supabase is initialized
// Favorites functions
export const addToFavorites = async (careerId: string, metadata?: any) => {
  const client = requireSupabase();
  const user = await supabaseService.getUserCached();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await client
    .from('user_favorites')
    .insert({
      user_id: user.id,
      career_id: careerId,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const removeFromFavorites = async (careerId: string) => {
  const client = requireSupabase();
  const user = await supabaseService.getUserCached();
  if (!user) throw new Error('Usuário não autenticado');

  const { error } = await client
    .from('user_favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('career_id', careerId);

  if (error) throw new Error(error.message);
};

export const getFavorites = async () => {
  const client = requireSupabase();
  const user = await supabaseService.getUserCached();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await client
    .from('user_favorites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
};

export const isCareerFavorite = async (careerId: string): Promise<boolean> => {
  const client = requireSupabase();
  const user = await supabaseService.getUserCached();
  if (!user) return false;

  const { data, error } = await client
    .from('user_favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('career_id', careerId)
    .maybeSingle();

  if (error) return false;
  return !!data;
};

// Career Comparison functions
export interface SavedComparison {
  id: string;
  careers: any[];
  recommendation: string;
  created_at: string;
}

export const saveCareerComparison = async (careers: any[], recommendation: string): Promise<SavedComparison> => {
  const client = requireSupabase();
  const user = await supabaseService.getUserCached();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await client
    .from('career_comparisons')
    .insert({
      user_id: user.id,
      careers: careers,
      recommendation: recommendation,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const getCareerComparisons = async (): Promise<SavedComparison[]> => {
  const client = requireSupabase();
  const user = await supabaseService.getUserCached();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await client
    .from('career_comparisons')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
};

export const deleteCareerComparison = async (comparisonId: string): Promise<void> => {
  const client = requireSupabase();
  const user = await supabaseService.getUserCached();
  if (!user) throw new Error('Usuário não autenticado');

  const { error } = await client
    .from('career_comparisons')
    .delete()
    .eq('id', comparisonId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
};
