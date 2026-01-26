<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1eg-_MwJe1pVHBb-fxy00-y9jqdeQu7e0

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` (already contains the provided Gemini key) or set `GEMINI_API_KEY` manually
3. Run the app:
   `npm run dev`

## Connect Supabase

1. Create a Supabase project and copy the **project URL** and **anon key**.
2. Store them in `.env.local` using `SUPABASE_URL` and `SUPABASE_ANON_KEY` (the file already ships with placeholders).
3. Use `services/supabaseService.ts` to interact with your tables.

Suggested tables (names used by the service):

- `career_progress` with columns `user_id` (text, primary key), `answers` (jsonb), `top3` (jsonb), `final_plan` (jsonb), `updated_at` (timestamp with time zone).
- `career_suggestions` with columns `title`, `description`, `tools`, `salaryRange`, and a `created_at` timestamp.
- `resume_analysis_cache` with columns `user_id`, `text_hash`, `analysis_result`, and `created_at`. The SQL file `supabase/tables/resume_analysis_cache.sql` already creates this table for you; run it once in the Supabase SQL editor.

The client will throw a clear error and log a warning if the env vars are missing, keeping Prisma-style safety while you iterate locally.

### Validar a conexão pelo front

- Na tela de boas-vindas há um card "Teste de Conexão" com o botão `Verificar`. Clique nele para chamar `fetchTopCareers` e garantir que a tabela `career_suggestions` responde.
- Se o Supabase não estiver configurado, o card exibirá o erro recebido; caso contrário, mostrará quantos registros retornaram. É um atalho rápido para confirmar que o `.env.local` está populado corretamente.
