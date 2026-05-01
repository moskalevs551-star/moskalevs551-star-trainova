# Trainova dashboard/account flow

This PR documents the finished implementation currently deployed to production at https://trainova.vercel.app.

## Completed in the working app

- Fixed Supabase OAuth callback at `/auth/callback` so Google login exchanges the `code`, stores the cookie session, creates/updates `profiles`, and redirects to `next` or `/dashboard`.
- Removed Apple login from the UI and auth logic. The auth screen now focuses on Google and email.
- Added a proper authenticated dashboard at `/dashboard` with a welcome state, real Supabase test summaries, progress, best score, last attempt, and empty states.
- Added `/account` with profile details, editable display name, provider, registration date, and real statistics from Supabase.
- Added `/progress` views backed by real Supabase tests, attempts, progress, and wrong-question counts.
- Added `/tests/[id]` as a real test details page with progress, latest attempts, start/settings/retry-wrong actions.
- Added `/api/tests/[id]` to reconstruct a saved quiz from Supabase `tests`, `questions`, `answers`, `test_settings`, `attempts`, `user_progress`, `wrong_questions`, and `favorite_questions`.
- Added `/api/account` for authenticated profile updates.
- Added cloud test actions that load a saved Supabase test into the local runner before opening `/test` or `/settings`.
- Added a save-to-account action after parsing so an authenticated user can persist the current local quiz.
- Kept guest/local mode working: public pages and local upload/demo remain available without login.
- Deployed the production site and aliased it to `https://trainova.vercel.app`.

## Verified locally

- `npm run lint` passes.
- `npm run build` passes with Next.js 16.2.4.
- Production deploy completed successfully on Vercel.
- `https://trainova.vercel.app/` returns HTTP 200.
- `/auth/callback?code=bad-code&next=%2Fupload` no longer 404s; it is handled by the callback route and redirects to `/login?error=auth_callback_failed`.
- Static checks confirm Apple login text/button was removed from source.

## Manual configuration still required outside code

After moving to the clean domain, update external OAuth settings:

- Supabase Site URL: `https://trainova.vercel.app`
- Supabase Redirect URLs:
  - `https://trainova.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`
- Google Cloud Authorized JavaScript origins:
  - `https://trainova.vercel.app`
- Google Cloud Authorized redirect URI remains the Supabase callback:
  - `https://onncdixpnupnxwxvdxos.supabase.co/auth/v1/callback`

## Note

The live app source is present in the local Codex workspace and has been deployed directly through Vercel CLI. The GitHub repository was initialized with only a README, and this PR records the implementation status until the full source tree is pushed from a machine with `git`/`gh` available or through a repository import.