# Próximos Passos - Análise de Currículo

## ✅ O que já foi feito:
1. SQL Schema executado no Supabase
2. Types TypeScript criados
3. Service layer implementado
4. Componente de upload criado
5. Função de análise com Gemini preparada

## 🔧 O que você precisa fazer AGORA no Supabase:

### 1. Criar Storage Bucket "resumes"

**Via Dashboard:**
1. Acesse o Supabase Dashboard
2. Vá em **Storage** (menu lateral)
3. Clique em **New Bucket**
4. Preencha:
   - **Name**: `resumes`
   - **Public**: `false` (IMPORTANTE: deixar privado)
5. Clique em **Create Bucket**

**Configurar Políticas de Acesso:**

Vá em **SQL Editor** e execute:

```sql
-- Permitir upload
CREATE POLICY "Users can upload their own resumes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Permitir leitura
CREATE POLICY "Users can read their own resumes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Permitir deleção
CREATE POLICY "Users can delete their own resumes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 📋 Próximos Arquivos a Criar:

### 1. Componente de Processamento (`CVProcessingStep.tsx`)
- Mostra loading enquanto analisa
- Extrai texto do PDF/DOCX
- Chama Gemini API
- Salva resultado no banco

### 2. Componente de Resultado (`CVAnalysisResult.tsx`)
- Exibe score
- Mostra pontos fortes/fracos
- Accordion com sugestões por seção
- Botões para aplicar reescritas

### 3. Biblioteca de Parsing
- Instalar `pdf-parse` para PDF
- Instalar `mammoth` para DOCX
- Criar helper para extrair texto

### 4. Integração no App.tsx
- Adicionar rota para CV Analyzer
- Conectar com fluxo de navegação

## 🚀 Ordem de Implementação:

1. **Você**: Criar bucket no Supabase ✋
2. **Eu**: Instalar bibliotecas de parsing
3. **Eu**: Criar componente de processamento
4. **Eu**: Criar componente de resultado
5. **Eu**: Integrar no App.tsx
6. **Nós**: Testar com CV real

## ⚠️ Bloqueadores Atuais:

- ❌ Storage bucket "resumes" não existe
- ⏳ Bibliotecas de parsing não instaladas
- ⏳ Componentes de processamento/resultado não criados

## 💡 Decisão Técnica - Parsing:

**Opção escolhida**: Client-side parsing (navegador)
- ✅ Mais simples
- ✅ Sem necessidade de Edge Functions
- ✅ Funciona com Vite
- ❌ Arquivo fica no navegador (privacidade OK)

**Bibliotecas**:
- `pdf-parse` ou `pdfjs-dist` para PDF
- `mammoth` para DOCX

---

**Quando terminar de criar o bucket, me avise para continuar! 🚀**
