-- ==============================================================================
-- SCRIPT DE CORREÇÃO TOTAL (HARD RESET)
-- ATENÇÃO: Isso vai resetar as permissões e configurá-las do zero.
-- ==============================================================================

-- 1. Desabilitar segurança temporariamente para evitar bloqueios
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
DROP FUNCTION IF EXISTS is_admin CASCADE;

-- 2. Remover a tabela completamente (Dropar CASCADE para remover dependências quebradas)
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- 3. Recriar a tabela do zero
CREATE TABLE public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'subscriber', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Habilitar RLS (Segurança)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Criar Política: Usuários podem ver APENAS seu próprio papel
CREATE POLICY "Users can read own role" ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. Recriar função is_admin de forma segura
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar diretamente na tabela, sem recursão
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Restaurar seu Admin (Garante que você não perca acesso)
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Tenta achar pelo email do seu print (teste213323...) ou o oficial
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'teste213323@gmail.com';
  
  -- Se não achar o de teste, tenta o oficial
  IF v_user_id IS NULL THEN
      SELECT id INTO v_user_id FROM auth.users WHERE email = 'alexandrehenriquefdes@gmail.com';
  END IF;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
  END IF;
END $$;
