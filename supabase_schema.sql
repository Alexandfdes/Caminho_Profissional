-- Tabela de Favoritos
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  career_id text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS user_favorites_user_id_idx ON public.user_favorites (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_favorites_user_career_idx ON public.user_favorites (user_id, career_id);

-- Habilitar RLS (Segurança)
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança (RLS)

-- Permitir inserir apenas seus próprios favoritos
CREATE POLICY "allow_insert_own" ON public.user_favorites 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Permitir ver apenas seus próprios favoritos
CREATE POLICY "allow_select_own" ON public.user_favorites 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Permitir deletar apenas seus próprios favoritos
CREATE POLICY "allow_delete_own" ON public.user_favorites 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);
