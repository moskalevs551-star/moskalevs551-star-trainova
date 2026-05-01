# Trainova

Trainova — premium educational SaaS prototype: "превратите тесты в умные тренажёры".

## What Works

- Landing page in a cleaner Brilliant + Linear + Typeform direction.
- Upload flow for `.qst`, `.txt`, and `.zip`.
- Safe ZIP discovery that ignores executable files and never runs them.
- QST parser with UTF-8 then Windows-1251 decoding fallback.
- Parse summary with progressive disclosure for validation details.
- Lightweight editor for question text, answers, correct answer, flags, favorites, and difficult questions.
- Simplified quick settings with advanced settings hidden behind disclosure.
- Training, exam, quick test, mistakes, and review mode foundations.
- One-question test-taking flow with immediate feedback.
- Supabase Auth pages for Google, Apple, email magic link, and optional password flow.
- Protected account routes through Next.js 16 `proxy.ts`.
- Real Supabase persistence endpoints for tests, questions, answers, settings, attempts, attempt answers, progress, and wrong questions.
- Favorite questions are modeled separately in Supabase for real user progress.
- localStorage fallback for guests, with a prompt to save local tests after login.

## Routes

- `/` landing
- `/demo` read-only sample trainers
- `/upload` file import
- `/parse-result` recognition summary
- `/editor` question editor
- `/settings` quick and advanced test settings
- `/test` trainer
- `/results` results
- `/dashboard` user dashboard
- `/progress` progress
- `/login` auth
- `/signup` signup
- `/auth/callback` OAuth code exchange
- `/account` account page

## Environment

Create `.env.local` when Supabase is available:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it with a `NEXT_PUBLIC_` prefix.

Supabase redirect URLs:

- `http://localhost:3000/auth/callback`
- `https://MY-VERCEL-DOMAIN.vercel.app/auth/callback`
- future custom domain with `/auth/callback`

For Google OAuth, create a Google OAuth Client and add the redirect URI shown in the Supabase Google provider settings.
For Apple OAuth, configure Sign in with Apple, Services ID, Return URL, and rotate the Apple client secret every 6 months.

## Commands

```bash
npm run dev
npm run lint
npm run build
```

## Supabase

The migration is in `supabase/migrations/0001_testflow_schema.sql` and includes:

- `profiles`
- `tests`
- `questions`
- `answers`
- `test_settings`
- `attempts`
- `attempt_answers`
- `user_progress`
- `wrong_questions`
- `favorite_questions`

RLS is enabled for every public table. Private tests are owner-only, public/link tests are readable, and user progress/attempts remain user-scoped.
