-- ============================================
-- ADMIN DASHBOARD RPC FUNCTIONS
-- ============================================

-- Função para verificar se o usuário atual é admin
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

-- 1. Obter Estatísticas Gerais (Admin Stats)
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSONB AS $$
DECLARE
  total_users INTEGER;
  active_users_24h INTEGER;
  total_subscribers INTEGER;
  total_revenue NUMERIC;
BEGIN
  -- Verificar permissão de admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem ver estatísticas.';
  END IF;

  -- Contar total de usuários (da tabela auth.users)
  SELECT COUNT(*) INTO total_users FROM auth.users;

  -- Contar usuários ativos nas últimas 24h (baseado em last_sign_in_at)
  SELECT COUNT(*) INTO active_users_24h 
  FROM auth.users 
  WHERE last_sign_in_at > (NOW() - INTERVAL '24 hours');

  -- Contar assinantes (role = 'subscriber')
  SELECT COUNT(*) INTO total_subscribers 
  FROM user_roles 
  WHERE role = 'subscriber';

  -- Calcular receita estimada (mock por enquanto, ou baseado em tabela de pagamentos se existir)
  -- Assumindo R$ 49,90 por assinante
  total_revenue := total_subscribers * 49.90;

  RETURN jsonb_build_object(
    'totalUsers', total_users,
    'activeUsers', active_users_24h,
    'subscribers', total_subscribers,
    'revenue', total_revenue
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Obter Todos os Usuários com Roles
CREATE OR REPLACE FUNCTION get_all_users_with_roles()
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Verificar permissão de admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem listar usuários.';
  END IF;

  RETURN QUERY
  SELECT 
    au.id,
    au.email::TEXT,
    COALESCE(ur.role, 'user')::TEXT as role,
    au.created_at,
    au.last_sign_in_at
  FROM auth.users au
  LEFT JOIN user_roles ur ON au.id = ur.user_id
  ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Atualizar Role de Usuário
CREATE OR REPLACE FUNCTION update_user_role_admin(target_user_id UUID, new_role TEXT)
RETURNS VOID AS $$
BEGIN
  -- Verificar permissão de admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem alterar roles.';
  END IF;

  -- Validar role
  IF new_role NOT IN ('user', 'subscriber', 'admin') THEN
    RAISE EXCEPTION 'Role inválida.';
  END IF;

  -- Atualizar ou Inserir na tabela user_roles
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id)
  DO UPDATE SET role = new_role, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
