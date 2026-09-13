<script>
  import { onMount } from 'svelte';
  import { loanActions } from '$lib/stores/loanStore';
  import { supabase } from '$lib/supabase.js';
  import LoanForm from '$lib/components/LoanCalculator/admin/LoanForm.svelte';
  import LoanTable from '$lib/components/LoanCalculator/admin/LoanTable.svelte';

  let authenticated = true;
  onMount(async () => {
    const { data } = await supabase.auth.getSession();
    authenticated = Boolean(data.session);
    if (authenticated) await loanActions.loadLoans();
  });
</script>

<svelte:head>
  <title>Loan Management System</title>
  <meta name="description" content="Manage your loans and track payment updates" />
</svelte:head>

{#if !authenticated}
  <main class="loan-management-app"><div class="app-header"><h1>Sign in required</h1><p class="app-description">Please sign in from the Overview page before managing loans.</p></div></main>
{:else}
<main class="loan-management-app">
  <div class="app-header">
    <h1>Loan Management System</h1>
    <p class="app-description">Track your loans and manage payment updates over time</p>
  </div>

  <LoanForm />
  <LoanTable />
</main>
{/if}

<style>
  .loan-management-app {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .app-header {
    text-align: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid var(--color-border);

    > h1 {
      color: var(--color-primary);
      margin: 0 0 0.5rem 0;
      font-size: 2.5rem;
      font-weight: 700;
    }
  }

  .app-description {
    color: var(--color-text-muted);
    font-size: 1.1rem;
    margin: 0;
  }

  @media (max-width: 768px) {
    .loan-management-app {
      padding: 1rem 0.5rem;
    }

    .app-header h1 {
      font-size: 2rem;
    }

    .app-description {
      font-size: 1rem;
    }
  }

  @media (max-width: 480px) {
    .app-header h1 {
      font-size: 1.75rem;
    }
  }
</style>
