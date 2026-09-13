<script>
  import { onMount } from 'svelte';
  import LoanChart from '$lib/components/LoanCalculator/LoanChart.svelte';
  import LoanSumsChart from '$lib/components/LoanCalculator/LoanSumsChart.svelte';
  import Table from '$lib/components/LoanCalculator/LoanProjectionTable.svelte';
  import { goto } from '$app/navigation';
  import { loanService, loanUpdateService, oneTimePaymentService, currentUser, initAuth } from '$lib/stores/loanStore';
  import { calculateLoanProjection } from '$lib/utils/loanProjection';

  let loanData = [];
  let isLoading = true;
  let error = null;

  $: initialBalance = loanData[0]?.remainingBalances?.reduce((a, b) => a + b, 0) ?? 0;
  $: currentBalance = loanData.find((x) => x.monthKey === new Date().toISOString().slice(0, 7))?.remainingBalances?.reduce((a,b) => a+b,0)
    ?? loanData[0]?.remainingBalances?.reduce((a,b)=>a+b,0) ?? 0;
  $: paidOff = initialBalance - currentBalance;
  $: percentageWidth = initialBalance > 0 ? (currentBalance / initialBalance) * 100 : 0;

  onMount(async () => {
    await initAuth();
    if (!$currentUser) { goto('/'); return; }
    try {
      const loans = await loanService.fetchAllLoans();
      const updates = [];
      const payments = [];
      for (const loan of loans) {
        const [u, p] = await Promise.all([
          loanUpdateService.fetchLoanUpdates(loan.id),
          oneTimePaymentService.fetchOneTimePayments(loan.id)
        ]);
        updates.push(...u);
        payments.push(...p);
      }
      loanData = calculateLoanProjection(loans, updates, payments, new Date(), 50);
      if (!loanData.length) error = 'No loan data found.';
    } catch (e) {
      console.error(e);
      error = e.message || 'Failed to load loan data.';
    } finally {
      isLoading = false;
    }
  });
</script>

<svelte:head>
  <title>Loan Calculator</title>
</svelte:head>

{#if isLoading}
  <p>Loading loan data...</p>
{:else if error}
  <p class="error">{error}</p>
{:else if loanData.length}
  <section>
    <h1>Loan Calculator</h1>
    <div class="summary">
      <p><strong>Total debt:</strong> {initialBalance.toLocaleString('sv-SE')} kr</p>
      <p><strong>Paid off:</strong> {paidOff.toLocaleString('sv-SE')} kr</p>
      <p><strong>Remaining:</strong> {currentBalance.toLocaleString('sv-SE')} kr</p>
    </div>
    <div class="progress">
      <div class="progress-bar" style={`width: ${percentageWidth}%;`}></div>
    </div>
    <LoanSumsChart {loanData} />
    <LoanChart {loanData} />
    <Table {loanData} />
  </section>
{:else}
  <p>No loan data available.</p>
{/if}

<style>
  section { padding: 20px 32px; background:#fff; border-radius:8px; margin:20px 0; }
  h1 { color:var(--color-primary); font-size:2rem; margin-bottom:20px; }
  .summary { max-width:600px; background:white; padding:1.5rem; border-radius:1rem; box-shadow:0 1px 2px rgba(0,0,0,.05); margin-bottom:1rem; }
  .summary p { color:#1f2937; margin:.5rem 0; }
  .progress { background:#f3f4f6; height:16px; border-radius:8px; overflow:hidden; border:1px solid #e5e7eb; margin-bottom:2rem; }
  .progress-bar { height:100%; background:#2563eb; transition:width .4s ease; }
  .error { color:#b91c1c; padding:1rem; }
</style>
