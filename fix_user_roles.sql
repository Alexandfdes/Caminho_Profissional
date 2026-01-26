-- ==============================================================================
-- SCRIPT DE CORREÇÃO: USER ROLES
-- Execute este script no SQL Editor do Supabase para corrigir o erro 500.
-- ==============================================================================

-- 1. Criar a tabela se ela ainda não existir
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'subscriber', 'admin', 'subscriber_basic')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS (Segurança)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Limpar políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;

-- 4. Criar Política: Usuários podem ver APENAS seu próprio papel
CREATE POLICY "Users can read own role" ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Função Utilitária: is_admin() (caso não exista ou esteja quebrada)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Garantir que o seu usuário seja ADMIN (Substitua o email se necessário, ou ignore se já for)
-- O script abaixo tenta encontrar seu usuário pelo email e setá-lo como admin.
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'alexandrehenriquefdes@gmail.com';
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
  END IF;
END $$;
