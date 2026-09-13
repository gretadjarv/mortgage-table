<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser, initAuth, supabaseConfigured } from '$lib/stores/loanStore';
  onMount(async () => { await initAuth(); if (!$currentUser) goto('/'); });
</script>

<svelte:head><title>Setup · My Economy</title></svelte:head>
<section>
  <h1>Supabase setup</h1>
  <p>This app is now a static GitHub Pages frontend backed directly by Supabase.</p>
  <h2>1. Create the database</h2>
  <p>Open <code>loan_calculator_supabase.sql</code> in the project and run it in Supabase → SQL Editor.</p>
  <h2>2. Configure the frontend</h2>
  <p>Set these Vite environment variables when running locally or in GitHub Actions:</p>
  <pre>VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-publishable-key</pre>
  <h2>3. Authentication</h2>
  <p>Create an account on the home page. Row Level Security makes each user's loans private to their account.</p>
  {#if !supabaseConfigured}
    <p class="warning">Supabase environment variables are missing in this build.</p>
  {/if}
  <p><strong>Your user ID:</strong> {$currentUser?.id ?? 'not signed in'}</p>
</section>

<style>
  section{max-width:800px;margin:2rem auto;padding:2rem;background:white;border-radius:1rem}
  h1{color:var(--color-primary);margin-top:0} h2{margin-top:2rem}
  pre{padding:1rem;background:#f3f4f6;border-radius:.5rem;overflow:auto}
  .warning{color:#b91c1c;font-weight:700}
</style>
