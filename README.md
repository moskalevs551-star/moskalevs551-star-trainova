# Trainova

Trainova превращает старые файлы с тестами в современные интерактивные тренажёры.

Live site: https://trainova.vercel.app

## Current production status

The working Trainova app is deployed on Vercel and includes:

- Supabase Auth with Google and email login.
- Fixed `/auth/callback` route for OAuth session exchange and redirects.
- Real dashboard/account/progress pages backed by Supabase tables.
- Upload and parse flow for `.qst`, `.txt`, and `.zip` files.
- Saved tests, questions, answers, settings, progress, attempts, wrong questions, and favorites.
- Guest local mode for trying uploads before login.

See `docs/dashboard-account-flow.md` in this PR for the implementation summary and deployment notes.
