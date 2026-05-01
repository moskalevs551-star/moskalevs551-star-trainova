# Trainova

Trainova turns old test files into modern interactive trainers.

Tagline: "превратите тесты в умные тренажёры".

## What Works

- Premium educational SaaS landing page.
- Upload flow for `.qst`, `.txt`, and `.zip`.
- Safe ZIP discovery that ignores executable files and never runs them.
- QST parser with UTF-8 first and Windows-1251 fallback.
- Parse summary, lightweight editor, quick settings, test runner, results, dashboard, account, and progress pages.
- Google and email auth through Supabase Auth.
- Protected account routes through Next.js 16 `proxy.ts`.
- Real Supabase persistence endpoints for tests, questions, answers, settings, attempts, attempt answers, progress, wrong questions, and favorite questions.
- localStorage fallback for guests.

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

Create `.env.local` locally:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Supabase redirect URLs:

- `http://localhost:3000/auth/callback`
- `https://trainova.vercel.app/auth/callback`
- future custom domain with `/auth/callback`

For Google OAuth, create a Google OAuth Client and add the redirect URI shown in the Supabase Google provider settings.

## Commands

```bash
npm install
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
