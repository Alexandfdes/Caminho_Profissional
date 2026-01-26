-- Tabela de Progresso do Plano (Checklist)
CREATE TABLE IF NOT EXISTS public.plan_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.career_plans(id) ON DELETE CASCADE,
  completed_actions text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, plan_id)
);

CREATE INDEX IF NOT EXISTS plan_progress_user_id_idx ON public.plan_progress (user_id);
CREATE INDEX IF NOT EXISTS plan_progress_plan_id_idx ON public.plan_progress (plan_id);

-- RLS (Segurança)
ALTER TABLE public.plan_progress ENABLE ROW LEVEL SECURITY;

-- Políticas plan_progress
DROP POLICY IF EXISTS "Users can insert their own plan progress" ON public.plan_progress;
CREATE POLICY "Users can insert their own plan progress" ON public.plan_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own plan progress" ON public.plan_progress;
CREATE POLICY "Users can view their own plan progress" ON public.plan_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own plan progress" ON public.plan_progress;
CREATE POLICY "Users can update their own plan progress" ON public.plan_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
