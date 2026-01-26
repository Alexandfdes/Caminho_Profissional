-- Tabela de Planos de Carreira
CREATE TABLE IF NOT EXISTS public.career_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_data jsonb NOT NULL,
  career_title text,
  career_description text,
  created_at timestamptz DEFAULT now()
);

-- Tabela de Sessões do Usuário (Respostas e Top 3)
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS career_plans_user_id_idx ON public.career_plans (user_id);
CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON public.user_sessions (user_id);

-- RLS (Segurança)
ALTER TABLE public.career_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas career_plans
DROP POLICY IF EXISTS "Users can insert their own plans" ON public.career_plans;
CREATE POLICY "Users can insert their own plans" ON public.career_plans
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own plans" ON public.career_plans;
CREATE POLICY "Users can view their own plans" ON public.career_plans
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own plans" ON public.career_plans;
CREATE POLICY "Users can delete their own plans" ON public.career_plans
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Políticas user_sessions
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.user_sessions;
CREATE POLICY "Users can insert their own sessions" ON public.user_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
