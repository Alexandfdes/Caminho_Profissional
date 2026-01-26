# Copilot Guidance

## Core purpose
- `App.tsx` orchestrates a multi-step career discovery experience (landing → auth → dynamic questionnaire → payment → top-3 results → final plan) while keeping progress persisted in `localStorage` via `services/storageService.ts`.
- Gemini is called server-side via Supabase Edge Functions. The frontend uses `services/geminiService.ts` as a thin client that invokes `supabase/functions/gemini-json` (and `analyze-cv`) so API keys and enforcement never live in the browser.
- Supabase is the single backend: `services/supabaseService.ts` talks to tables such as `career_plans`, `user_sessions` and `resume_analysis_cache` (see `supabase/tables/resume_analysis_cache.sql` and the schema SQL files under the repo root) and powers auth, favorites, admin RPCs, and the learning system described in `docs/AI_LEARNING_SYSTEM.md`.

## Setup & run
- Run `npm install` once, then `npm run dev` to start Vite or `npm run build` for production artifacts.
- Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Supabase edge functions (`supabase/functions/analyze-cv`, `create-preference`, `webhook-mercadopago`) expect their own env vars (`GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MERCADO_PAGO_ACCESS_TOKEN`) and run on Deno — keep their secrets out of the client bundle.

## Architecture & borders
- `AppRouter.tsx` defines three protected playgrounds (`/dashboard`, `/admin`, `/cv-analyzer`) that require subscribers or admins via `roleService.ts`; the default route renders `App` for the landing/question flow.
- State flows: UI state is stored in React hooks, persisted through `storageService.saveState`, and restored once `supabaseService.getUser` completes so long as the step isn’t `auth` or `landing`.
- Gemini calls go through Edge Functions (`supabase/functions/gemini-json` and `supabase/functions/analyze-cv`). Daily limits are enforced server-side via a Postgres RPC (`check_and_increment_gemini_usage`).
- Supabase writes happen only via `supabaseService` helpers (`saveCareerPlan`, `saveUserSession`, `getCareerPatterns`, etc.); reference `docs/AI_LEARNING_SYSTEM.md` to see how sessions feed learning tables.
- CV-related data: `resume_analysis_cache` keeps hashes of analyzed text (`supabase/tables/resume_analysis_cache.sql`), the Supabase function `analyze-cv` writes parsed Gemini JSON to `resume_analyses`, and `docs/CV_ANALYZER_NEXT_STEPS.md` lists the outstanding bucket/policy setup steps.

## Conventions & patterns
- Questions from Gemini keep `questionHistory`, `questionsAnsweredCount`, and `currentQuestion` in sync; `handleBack` rehydrates the last question without re-querying the AI whenever possible (see `App.tsx` around the `handleQuestionSubmit`/`handleBack` pair).
- Payment and plan logic is mocked (`handlePlanSelection` simulates payment), but Supabase is still called to save sessions and career plans so use `supabaseService.saveUserSession` after flow completion.
- Admin access is controlled by the `user_roles` table (no hardcoded allowlists).
- The landing view (`components/LandingPage.tsx`) doubles as the post-login welcome step, so reuse its callbacks (`onStartDiscovery`, `onOpenAdmin`, etc.) instead of duplicating layout.

## Validation & documentation pointers
- Verify Supabase setup using the “Teste de Conexão” card in `components/LandingPage.tsx`, which calls `supabaseService.testConnection` and surfaces errors so you can confirm `career_suggestions` is reachable.
- Run the SQL files (`supabase_schema.sql`, `supabase_learning_schema.sql`, `supabase_cv_analyzer_schema.sql`, the cache table SQL, etc.) in the Supabase SQL editor whenever you touch database-backed features.
- Consult `docs/AI_LEARNING_SYSTEM.md` for learning-system expectations and `docs/CV_ANALYZER_NEXT_STEPS.md` for current blockers/next work items (e.g., storage bucket policies and component gaps).

Please flag any unclear sections or missing context so I can refine these instructions.