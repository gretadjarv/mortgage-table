# Mortgage Table

A static SvelteKit mortgage tracker designed for GitHub Pages and Supabase.

## 1. Create Supabase project

Create a project in Supabase, open **SQL Editor**, and run `supabase.sql`.

Authentication uses Supabase email/password.

## 2. Configure local development

Copy `.env.example` to `.env` and add your Supabase project URL and publishable/anon key.

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_KEY
```

Then:

```bash
npm install
npm run dev
```

## 3. Put it on GitHub

Create a repository named exactly:

`mortgage-table`

Push the contents of this folder to the `main` branch.

The included GitHub Action builds the app and deploys it to GitHub Pages. The repository name is already used as the base path:

`https://YOUR-USERNAME.github.io/mortgage-table/`

## 4. Add GitHub secrets

In **Settings → Secrets and variables → Actions**, create:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Use the public Supabase project URL and publishable/anon key. **Never use the service-role key in this frontend.**

## 5. Enable Pages

Go to **Settings → Pages** and choose **GitHub Actions** as the build/deployment source.

A push to `main` will run `.github/workflows/deploy.yml`.

## Features

- Supabase email/password authentication
- Private per-user loan data with Row Level Security
- Add/edit/delete loans
- Interest-rate and amortization history
- One-time payments
- Debt projection chart
- GitHub Pages deployment
- No backend server required
