# My Economy

A SvelteKit loan tracker using **GitHub Pages + Supabase**.

## Local development

Create `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Then:

```bash
npm install
npm run dev
```

Run `loan_calculator_supabase.sql` in Supabase SQL Editor first.

## GitHub Pages

1. Push this project to a GitHub repository.
2. In Supabase, configure Authentication → URL Configuration with your GitHub Pages URL.
3. In GitHub → Settings → Secrets and variables → Actions, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Actions → run **Deploy to GitHub Pages**.
5. In Settings → Pages, make sure the source is **GitHub Actions**.

The workflow automatically uses the repository name as the Pages base path.

## Data security

The frontend only contains the Supabase publishable/anon key. RLS policies ensure authenticated users can only read and modify their own rows. Never put a Supabase service-role/secret key in this repository.

## Existing data

The old SQL seed is retained in the project history, but Supabase rows need a `user_id`. Create your account first, copy the UUID from the Setup page, then insert/migrate your old loan data with that UUID.
