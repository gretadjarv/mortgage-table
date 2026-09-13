<script>
  import { onMount } from 'svelte';
  import LoanChart from '$lib/components/LoanCalculator/LoanChart.svelte';
  import LoanSumsChart from '$lib/components/LoanCalculator/LoanSumsChart.svelte';
  import Table from '$lib/components/LoanCalculator/LoanProjectionTable.svelte';
  import { loans, loanUpdates, oneTimePayments, balanceAdjustments, loanActions } from '$lib/stores/loanStore';
  import { projectLoans } from '$lib/utils/loanProjection.js';
  import { supabase } from '$lib/supabase.js';

  let isLoading = true;
  let authenticated = false;
  let error = null;
  let loanData = [];

  const today = new Date();
  const year = today.getFullYear();
  const monthName = today.toLocaleDateString('en-US', { month: 'long' });

  $: loanData = projectLoans({
    loans: $loans,
    updates: $loanUpdates,
    oneTimePayments: $oneTimePayments,
    balanceAdjustments: $balanceAdjustments,
    years: 50
  });
  $: initialBalance = $loans.reduce((sum, loan) => sum + Number(loan.start_sum || 0), 0);
  $: currentRow = loanData.find((row) => row.current) || loanData[0];
  $: currentBalance = currentRow?.totalRemainingBalance ?? initialBalance;
  $: paidOff = Math.max(0, initialBalance - currentBalance);
  $: percentageWidth = initialBalance > 0 ? Math.min(100, (currentBalance / initialBalance) * 100) : 0;

  async function load() {
    if (!supabase) { error = 'Supabase is not configured.'; isLoading = false; return; }
    isLoading = true; error = null;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) { authenticated = false; return; }
      authenticated = true;
      await loanActions.loadLoans();
      const [updatesRes, paymentsRes, balancesRes] = await Promise.all([
        supabase.from('loan_updates').select('*').order('update_date', { ascending: true }),
        supabase.from('one_time_payments').select('*').order('payment_date', { ascending: true }),
        supabase.from('loan_balance_adjustments').select('*').order('adjustment_date', { ascending: true })
      ]);
      if (updatesRes.error) throw updatesRes.error;
      if (paymentsRes.error) throw paymentsRes.error;
      if (balancesRes.error) throw balancesRes.error;
      loanUpdates.set(updatesRes.data || []);
      oneTimePayments.set(paymentsRes.data || []);
      balanceAdjustments.set(balancesRes.data || []);
    } catch (e) {
      console.error(e);
      error = e.message || 'Failed to load loan data.';
    } finally { isLoading = false; }
  }

  onMount(load);
</script>

<svelte:head><title>Loan Calculator</title><meta name="description" content="Historical and projected mortgage costs" /></svelte:head>

{#if isLoading}
  <p>Loading loan data...</p>
{:else if error}
  <p class="error">{error}</p>
{:else if !authenticated}
  <section><p>Please sign in from the Overview page first.</p></section>
{:else}
  <section>
    <h1>Loan Calculator</h1>
    <div class="summary">
      <p><strong>Starting loan:</strong> {Math.round(initialBalance).toLocaleString('sv-SE')} kr</p>
      <p><strong>Paid off:</strong> {Math.round(paidOff).toLocaleString('sv-SE')} kr</p>
      <p><strong>Current/projected balance:</strong> {Math.round(currentBalance).toLocaleString('sv-SE')} kr</p>
    </div>
    <div class="progress"><div class="progress-bar" style={`width: ${percentageWidth}%;`}></div></div>

    {#if loanData.length > 0}
      <LoanSumsChart {loanData} />
      <LoanChart {loanData} />
      <Table {loanData} {year} {monthName} />
    {:else}
      <p>No loan data available.</p>
    {/if}
  </section>
{/if}

<style lang="scss">
  section { padding: 20px 32px; background: #fff; border-radius: 8px; margin: 20px 0; }
  .progress { background: #f3f4f6; height: 16px; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; margin-bottom: 2rem; }
  .progress-bar { height: 100%; background: var(--color-secondary); transition: width .4s ease; }
  .summary { max-width: 600px; background: white; padding: 1.5rem; border-radius: 1rem; border: 1px solid var(--color-border); margin-bottom: 1rem; }
  .summary p { margin: .4rem 0; }
  .error { color: var(--color-error); }
</style>
