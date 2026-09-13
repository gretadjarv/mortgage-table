<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser, authReady, initAuth, authService } from '$lib/stores/loanStore';

  let email = '';
  let password = '';
  let mode = 'login';
  let busy = false;
  let error = '';

  onMount(async () => {
    await initAuth();
    if ($currentUser) goto('/loanCalculator');
  });

  async function submit() {
    busy = true; error = '';
    try {
      if (mode === 'login') await authService.signIn(email, password);
      else await authService.signUp(email, password);
      if ($currentUser) goto('/loanCalculator');
      else error = 'Check your email to confirm your account, then sign in.';
    } catch (e) {
      error = e.message || 'Something went wrong.';
    } finally { busy = false; }
  }
</script>

<svelte:head><title>My Economy</title></svelte:head>

<div class="auth">
  <div class="card">
    <h1>My Economy</h1>
    <p>Loan tracking and repayment projections.</p>

    {#if !$authReady}
      <p>Loading…</p>
    {:else}
      <form on:submit|preventDefault={submit}>
        <label>Email<input type="email" bind:value={email} required /></label>
        <label>Password<input type="password" bind:value={password} minlength="6" required /></label>
        {#if error}<p class="error">{error}</p>{/if}
        <button disabled={busy}>{busy ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
      </form>
      <button class="link" on:click={() => { mode = mode === 'login' ? 'signup' : 'login'; error=''; }}>
        {mode === 'login' ? 'Create a new account' : 'Already have an account? Sign in'}
      </button>
    {/if}
  </div>
</div>

<style>
  .auth { min-height:60vh; display:grid; place-items:center; padding:2rem; }
  .card { width:min(420px,100%); padding:2rem; background:white; border-radius:1rem; box-shadow:0 8px 30px rgba(0,0,0,.08); }
  h1 { margin:0 0 .5rem; color:var(--color-primary,#2563eb); }
  label { display:block; margin:1rem 0; font-weight:600; }
  input { width:100%; box-sizing:border-box; padding:.75rem; margin-top:.4rem; border:1px solid #d1d5db; border-radius:.5rem; }
  button { width:100%; padding:.75rem 1rem; border:0; border-radius:.5rem; background:#2563eb; color:#fff; cursor:pointer; font-weight:600; }
  button:disabled { opacity:.6; }
  .link { margin-top:1rem; background:none; color:#2563eb; }
  .error { color:#b91c1c; }
</style>
