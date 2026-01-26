# Integração Affinda Resume Parser

Esta funcionalidade permite importar currículos (PDF/DOCX) usando a API do Affinda via Supabase Edge Functions.

## Configuração

### 1. Variáveis de Ambiente (Supabase)

Como o processamento ocorre no backend (Edge Function), as chaves da API do Affinda devem ser configuradas nos **Secrets** do Supabase, e não no `.env` do frontend (por segurança).

Execute os comandos abaixo no terminal (se tiver a CLI do Supabase instalada e linkada):

```bash
supabase secrets set AFFINDA_API_KEY=SEU_TOKEN
supabase secrets set AFFINDA_ENDPOINT=https://api.affinda.com/v3/resumes
```

Ou configure manualmente no Dashboard do Supabase:
1. Vá em **Project Settings** > **Edge Functions**.
2. Adicione os secrets `AFFINDA_API_KEY` e `AFFINDA_ENDPOINT`.

### 2. Deploy da Edge Function

Para que a funcionalidade funcione, você precisa fazer o deploy da função `parse-resume`:

```bash
supabase functions deploy parse-resume
```

Se estiver rodando localmente com `supabase start`:
```bash
supabase functions serve parse-resume --no-verify-jwt
```
(Nota: O frontend espera que a função esteja acessível via `supabase.functions.invoke`).

## Estrutura de Arquivos

*   `supabase/functions/parse-resume/index.ts`: Backend (Deno) que recebe o arquivo e chama a API do Affinda.
*   `components/ResumeImport.tsx`: Componente React com upload e formulário.
*   `types/affinda.ts`: Definições de tipos TypeScript.
*   `pages/CVImportPage.tsx`: Página que exibe o componente.

## Uso

Acesse a rota `/curriculo` na aplicação para testar a importação.
