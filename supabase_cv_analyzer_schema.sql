  -- ============================================
  -- ANÁLISE DE CURRÍCULO COM IA - SQL SCHEMA
  -- ============================================

  -- Tabela para armazenar análises de currículos
  CREATE TABLE IF NOT EXISTS resume_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Arquivo
    file_path TEXT, -- Caminho no Supabase Storage
    filename TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT, -- 'pdf' ou 'docx'
    
    -- Conteúdo (apenas se opt-in)
    content_text TEXT,
    
    -- Resultado da análise (JSON completo do Gemini)
    analysis_result JSONB NOT NULL,
    
    -- Score principal
    score NUMERIC(3,1) CHECK (score >= 0 AND score <= 10),
    
    -- Privacidade
    opt_in_save BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- Status
    status TEXT DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed'))
  );

  -- Índices para performance
  CREATE INDEX IF NOT EXISTS idx_resume_analyses_user_id ON resume_analyses(user_id);
  CREATE INDEX IF NOT EXISTS idx_resume_analyses_created_at ON resume_analyses(created_at);
  CREATE INDEX IF NOT EXISTS idx_resume_analyses_expires_at ON resume_analyses(expires_at);
  CREATE INDEX IF NOT EXISTS idx_resume_analyses_status ON resume_analyses(status);

  -- Tabela para CVs de referência (exemplos de sucesso)
  CREATE TABLE IF NOT EXISTS reference_cvs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Classificação
    career_area TEXT NOT NULL, -- 'Tecnologia', 'Saúde', etc.
    seniority_level TEXT, -- 'junior', 'pleno', 'senior'
    job_title TEXT, -- 'Desenvolvedor Full Stack', etc.
    
    -- Conteúdo
    content_text TEXT NOT NULL,
    
    -- Embeddings para comparação (se usar pgvector)
    -- embedding VECTOR(768), -- Gemini embeddings
    
    -- Destaques (o que torna este CV bom)
    highlights JSONB,
    
    -- Metadados
    source TEXT, -- 'manual', 'contributed', etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Índices
  CREATE INDEX IF NOT EXISTS idx_reference_cvs_area ON reference_cvs(career_area);
  CREATE INDEX IF NOT EXISTS idx_reference_cvs_seniority ON reference_cvs(seniority_level);
  CREATE INDEX IF NOT EXISTS idx_reference_cvs_active ON reference_cvs(is_active);

  -- Tabela para controle de uso (quotas)
  CREATE TABLE IF NOT EXISTS cv_analysis_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL, -- 'YYYY-MM'
    analyses_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, month_year)
  );

  CREATE INDEX IF NOT EXISTS idx_cv_usage_user_month ON cv_analysis_usage(user_id, month_year);

  -- ============================================
  -- ROW LEVEL SECURITY (RLS)
  -- ============================================

  -- Habilitar RLS
  ALTER TABLE resume_analyses ENABLE ROW LEVEL SECURITY;
  ALTER TABLE reference_cvs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE cv_analysis_usage ENABLE ROW LEVEL SECURITY;

  -- Políticas para resume_analyses
  CREATE POLICY "Users can insert their own analyses"
    ON resume_analyses
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can view their own analyses"
    ON resume_analyses
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can update their own analyses"
    ON resume_analyses
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own analyses"
    ON resume_analyses
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

  -- Políticas para reference_cvs (somente leitura para usuários)
  CREATE POLICY "Anyone can view active reference CVs"
    ON reference_cvs
    FOR SELECT
    TO authenticated
    USING (is_active = true);

  -- Políticas para cv_analysis_usage
  CREATE POLICY "Users can view their own usage"
    ON cv_analysis_usage
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own usage"
    ON cv_analysis_usage
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own usage"
    ON cv_analysis_usage
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  -- ============================================
  -- FUNÇÕES AUXILIARES
  -- ============================================

  -- Função para limpar análises expiradas (executar via cron)
  CREATE OR REPLACE FUNCTION cleanup_expired_analyses()
  RETURNS void AS $$
  BEGIN
    DELETE FROM resume_analyses
    WHERE expires_at < NOW() AND opt_in_save = false;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Função para incrementar contador de uso
  CREATE OR REPLACE FUNCTION increment_cv_usage(p_user_id UUID)
  RETURNS void AS $$
  DECLARE
    v_month_year TEXT := TO_CHAR(NOW(), 'YYYY-MM');
  BEGIN
    INSERT INTO cv_analysis_usage (user_id, month_year, analyses_count)
    VALUES (p_user_id, v_month_year, 1)
    ON CONFLICT (user_id, month_year)
    DO UPDATE SET
      analyses_count = cv_analysis_usage.analyses_count + 1,
      updated_at = NOW();
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Função para verificar quota do usuário
  CREATE OR REPLACE FUNCTION check_cv_quota(p_user_id UUID, p_max_analyses INTEGER DEFAULT 1)
  RETURNS BOOLEAN AS $$
  DECLARE
    v_month_year TEXT := TO_CHAR(NOW(), 'YYYY-MM');
    v_count INTEGER;
  BEGIN
    SELECT COALESCE(analyses_count, 0) INTO v_count
    FROM cv_analysis_usage
    WHERE user_id = p_user_id AND month_year = v_month_year;
    
    RETURN v_count < p_max_analyses;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- ============================================
  -- STORAGE BUCKET
  -- ============================================

  -- Criar bucket para CVs (executar via Supabase Dashboard ou SQL)
  -- INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);

  -- Políticas de storage
  -- CREATE POLICY "Users can upload their own resumes"
  --   ON storage.objects FOR INSERT
  --   TO authenticated
  --   WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

  -- CREATE POLICY "Users can read their own resumes"
  --   ON storage.objects FOR SELECT
  --   TO authenticated
  --   USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

  -- ============================================
  -- COMENTÁRIOS
  -- ============================================

  COMMENT ON TABLE resume_analyses IS 'Armazena análises de currículos feitas pela IA';
  COMMENT ON TABLE reference_cvs IS 'CVs de referência para comparação e aprendizado';
  COMMENT ON TABLE cv_analysis_usage IS 'Controle de uso mensal de análises por usuário';
  COMMENT ON FUNCTION cleanup_expired_analyses() IS 'Remove análises expiradas (executar via cron)';
  COMMENT ON FUNCTION increment_cv_usage(UUID) IS 'Incrementa contador de uso mensal';
  COMMENT ON FUNCTION check_cv_quota(UUID, INTEGER) IS 'Verifica se usuário ainda tem quota disponível';
