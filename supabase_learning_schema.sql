-- Tabela para armazenar respostas dos usuários e resultados
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Dados demográficos do usuário
  age INTEGER,
  city TEXT,
  state TEXT,
  
  -- Respostas do questionário
  answers JSONB NOT NULL,
  
  -- Resultados sugeridos
  top_careers JSONB NOT NULL,
  selected_career TEXT,
  
  -- Metadados
  total_questions INTEGER,
  session_duration_seconds INTEGER,
  completed BOOLEAN DEFAULT false
);

-- Índices para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_state ON user_sessions(state);
CREATE INDEX IF NOT EXISTS idx_user_sessions_age ON user_sessions(age);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON user_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_completed ON user_sessions(completed);

-- Índice GIN para busca em JSONB
CREATE INDEX IF NOT EXISTS idx_user_sessions_answers ON user_sessions USING GIN (answers);
CREATE INDEX IF NOT EXISTS idx_user_sessions_careers ON user_sessions USING GIN (top_careers);

-- Row Level Security (RLS)
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Usuários podem inserir suas próprias sessões
CREATE POLICY "Users can insert their own sessions"
  ON user_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem ver suas próprias sessões
CREATE POLICY "Users can view their own sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias sessões
CREATE POLICY "Users can update their own sessions"
  ON user_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- View para análise agregada (dados anônimos para a IA)
CREATE OR REPLACE VIEW career_patterns AS
SELECT 
  state,
  age,
  selected_career,
  COUNT(*) as frequency,
  AVG(total_questions) as avg_questions,
  jsonb_agg(DISTINCT answers) as common_answers
FROM user_sessions
WHERE completed = true
GROUP BY state, age, selected_career;

-- Comentários para documentação
COMMENT ON TABLE user_sessions IS 'Armazena sessões de usuários para aprendizado da IA';
COMMENT ON COLUMN user_sessions.answers IS 'Respostas do questionário em formato JSONB';
COMMENT ON COLUMN user_sessions.top_careers IS 'Top 3 carreiras sugeridas pela IA';
COMMENT ON COLUMN user_sessions.selected_career IS 'Carreira escolhida pelo usuário';
COMMENT ON VIEW career_patterns IS 'Padrões agregados para análise da IA (dados anônimos)';
