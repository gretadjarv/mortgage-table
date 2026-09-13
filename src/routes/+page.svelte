<script>
  import { onMount } from 'svelte';
  import { supabase, supabaseConfigured } from '$lib/supabase.js';
  import { base } from '$app/paths';

  let session = null;
  let authMode = 'login';
  let email = '';
  let password = '';
  let message = '';
  let loading = true;

  onMount(async () => {
    if (!supabase) { loading = false; return; }
    const { data } = await supabase.auth.getSession();
    session = data.session;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => session = next);
    loading = false;
    return () => listener.subscription.unsubscribe();
  });

  async function authenticate() {
    message = '';
    const result = authMode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (result.error) message = result.error.message;
    else message = authMode === 'login' ? 'Signed in.' : 'Account created. Check your email if confirmation is enabled.';
  }

  async function logout() { await supabase.auth.signOut(); }
</script>

<svelte:head><title>Mortgage Table</title></svelte:head>

{#if loading}
  <p>Loading...</p>
{:else if !supabaseConfigured}
  <section class="card"><h1>Mortgage Table</h1><p>Supabase is not configured.</p></section>
{:else if !session}
  <section class="auth card">
    <h1>Mortgage Table</h1>
    <p>Track your loans, historical balances, rates, amortization and monthly costs.</p>
    <form on:submit|preventDefault={authenticate}>
      <label>Email<input type="email" bind:value={email} required autocomplete="email" /></label>
      <label>Password<input type="password" bind:value={password} required minlength="6" autocomplete={authMode === 'login' ? 'current-password' : 'new-password'} /></label>
      {#if message}<p class="message">{message}</p>{/if}
      <button type="submit">{authMode === 'login' ? 'Sign in' : 'Create account'}</button>
    </form>
    <button class="link" type="button" on:click={() => { authMode = authMode === 'login' ? 'signup' : 'login'; message = ''; }}>
      {authMode === 'login' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
    </button>
  </section>
{:else}
  <section class="welcome card">
    <div class="top"><div><h1>Mortgage Table</h1><p>Your loan data is stored in Supabase and protected by your account.</p></div><button on:click={logout}>Sign out</button></div>
    <div class="links">
      <a href={`${base}/loanCalculator`}>Loan Calculator →</a>
      <a href={`${base}/loanCalculator/admin`}>Loan Management →</a>
          </div>
  </section>
{/if}

<style>
  .card { max-width: 760px; margin: 3rem auto; padding: 2rem; background:#fff; border:1px solid var(--color-border); border-radius:12px; }
  .auth { max-width:480px; }
  h1 { margin-top:0; }
  form { display:grid; gap:1rem; }
  label { display:grid; gap:.4rem; font-weight:600; }
  input { padding:.7rem; border:1px solid #ccc; border-radius:5px; font:inherit; box-sizing:border-box; }
  button { padding:.7rem 1rem; border:0; border-radius:5px; background:var(--color-primary); color:#fff; cursor:pointer; }
  .link { background:transparent; color:var(--color-link); margin-top:1rem; padding-left:0; }
  .message { color:var(--color-error); }
  .top { display:flex; justify-content:space-between; gap:1rem; align-items:start; }
  .links { display:grid; grid-template-columns:repeat(2,1fr); gap:1rem; margin-top:2rem; }
  .links a { padding:1rem; border:1px solid var(--color-border); border-radius:8px; font-weight:700; }
  @media(max-width:650px){ .links { grid-template-columns:1fr; } .top { flex-direction:column; } }
</style>
