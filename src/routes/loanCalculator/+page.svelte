<script>
  import { onMount } from 'svelte';
  import LoanChart from '$lib/components/LoanCalculator/LoanChart.svelte';
  import LoanSumsChart from '$lib/components/LoanCalculator/LoanSumsChart.svelte';
  import Table from '$lib/components/LoanCalculator/LoanProjectionTable.svelte';
  import { loans, loanUpdates, oneTimePayments, balanceAdjustments, loanActions, formatCurrency } from '$lib/stores/loanStore';
  import { projectLoans } from '$lib/utils/loanProjection.js';
  import { supabase } from '$lib/supabase.js';

  let isLoading = true;
  let authenticated = false;
  let error = null;
  let showHistory = false;

  const money = (value) => formatCurrency(Math.round(Number(value) || 0));

  $: loanData = projectLoans({
    loans: $loans,
    updates: $loanUpdates,
    oneTimePayments: $oneTimePayments,
    balanceAdjustments: $balanceAdjustments,
    years: 50
  });

  $: currentRow = loanData.find((row) => row.current) || loanData[loanData.length - 1];
  $: initialBalance = $loans.reduce((sum, loan) => sum + Number(loan.start_sum || 0), 0);
  // The dashboard total is based on the same per-loan balances shown in the
  // loan cards, so a historical balance reset cannot be lost from the total.
  $: currentBalance = currentLoans?.reduce((sum, item) => sum + Number(item.balance || 0), 0) ?? currentRow?.totalRemainingBalance ?? initialBalance;
  $: balanceMonth = currentRow?.monthYear || 'current projection';
  $: paidOff = Math.max(0, initialBalance - currentBalance);
  $: progress = initialBalance > 0 ? Math.min(100, Math.max(0, paidOff / initialBalance * 100)) : 0;
  $: weightedInterest = currentRow && currentBalance > 0
    ? currentRow.rates.reduce((sum, rate, i) => sum + Number(rate || 0) * Number(currentRow.balancesBeforePayment[i] || 0), 0) / Math.max(currentRow.balancesBeforePayment.reduce((a,b) => a + Number(b || 0), 0), 1)
    : 0;
  $: monthlyInterest = Number(currentRow?.totalInterest || 0);
  $: monthlyAmortization = Number(currentRow?.totalAmortization || 0);
  $: monthlyCost = Number(currentRow?.total || 0);
  $: projectedPayoff = loanData.find((row) => Number(row.totalRemainingBalance) <= 0.01)?.monthYear || '—';
  $: historicalRows = loanData.filter((row) => row.historical);
  // The overview must always reflect the latest calculated balance for each
  // individual loan, not the original start_sum. Use the current projection
  // row (which includes balance corrections, one-time payments and monthly
  // amortization) and fall back to the most recent row if the current month
  // isn't present.
  $: latestProjectionRow = currentRow || loanData[loanData.length - 1];

  // The overview balance is always taken from the CURRENT projection row.
  // A historical balance adjustment is an absolute balance reset, so it must
  // flow into the projection state before any later amortization/payment.
  // Never use start_sum here once a projection exists.
  $: todayString = new Date().toISOString().slice(0, 10);
  $: currentLoans = $loans.map((loan, index) => {
    const projectedBalance = latestProjectionRow?.remainingBalances?.[index];
    const projectedRate = latestProjectionRow?.rates?.[index];
    const projectedAmortization = latestProjectionRow?.recurringAmortizations?.[index];
    const projectedMonthlyCost = latestProjectionRow?.monthlyCosts?.[index];

    // The projection is the single source of truth for the overview balance.
    // Balance adjustments are absolute balances, so projectLoans applies the
    // latest adjustment before that month's regular amortization/payment.
    // This keeps the card, total and projection table consistent.
    const balance = Number.isFinite(Number(projectedBalance))
      ? Number(projectedBalance)
      : Number(loan.start_sum || 0);

    return {
      loan,
      index,
      balance,
      rate: Number.isFinite(Number(projectedRate)) ? Number(projectedRate) : Number(loan.interest_rate || 0),
      amortization: Number.isFinite(Number(projectedAmortization)) ? Number(projectedAmortization) : Number(loan.amortization || 0),
      monthlyCost: Number.isFinite(Number(projectedMonthlyCost)) ? Number(projectedMonthlyCost) : 0
    };
  });

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

<svelte:head>
  <title>Mortgage Dashboard</title>
  <meta name="description" content="Mortgage dashboard with historical data and projected monthly costs" />
</svelte:head>

{#if isLoading}
  <div class="loading">Loading your mortgage dashboard…</div>
{:else if error}
  <div class="error-panel">{error}</div>
{:else if !authenticated}
  <div class="empty-state">Please sign in from the Overview page first.</div>
{:else}
  <div class="dashboard">
    <div class="hero">
      <div>
        <div class="eyebrow">MORTGAGE DASHBOARD</div>
        <h1>Your mortgage at a glance</h1>
        <p>Historical figures and a month-by-month projection based on your actual loan changes.</p>
      </div>
      <a class="manage" href="/mortgage-table/loanCalculator/admin">Manage loans →</a>
    </div>

    <div class="metric-grid">
      <article class="metric featured">
        <span>Total current balance</span>
        <strong>{money(currentBalance)}</strong>
        <small>Latest actual balance + payments recorded to today</small>
      </article>
      <article class="metric">
        <span>Weighted interest</span>
        <strong>{weightedInterest.toFixed(2)}%</strong>
        <small>Balance weighted</small>
      </article>
      <article class="metric">
        <span>Monthly interest</span>
        <strong>{money(monthlyInterest)}</strong>
        <small>Current projection</small>
      </article>
      <article class="metric">
        <span>Monthly amortization</span>
        <strong>{money(monthlyAmortization)}</strong>
        <small>Principal paid</small>
      </article>
      <article class="metric">
        <span>Monthly cost</span>
        <strong>{money(monthlyCost)}</strong>
        <small>Interest + amortization</small>
      </article>
      <article class="metric payoff">
        <span>Projected payoff</span>
        <strong>{projectedPayoff}</strong>
        <small>Based on current settings</small>
      </article>
    </div>

    <section class="progress-card">
      <div class="progress-head"><span>Debt progress</span><strong>{money(paidOff)} paid off</strong></div>
      <div class="progress-track"><div class="progress-fill" style={`width:${progress}%`}></div></div>
      <div class="progress-labels"><span>{money(initialBalance)} starting balance</span><span>{progress.toFixed(1)}%</span></div>
      <div class="balance-note">Balances are recalculated from your latest historical balance, regular amortization and one-time payments. The loan cards show the latest projected balance after the current month's payments.</div>
    </section>

    <section class="section">
      <div class="section-heading">
        <div><div class="eyebrow">CURRENT LOANS</div><h2>Loan overview</h2></div>
        <span class="count">{$loans.length} loans</span>
      </div>
      <div class="snowball-note"><strong>Automatic amortization rollover</strong><span>When a loan is paid off, its recurring monthly amortization moves to the next loan with a balance and stays there every month. The receiving loan keeps its own amortization too. A manual amortization update overrides the automatic total for that loan.</span></div>
      <div class="loan-grid">
        {#each currentLoans as item}
          <article class="loan-card">
            <div class="loan-title"><h3>{item.loan.name || `Loan ${item.index + 1}`}</h3><span>{item.rate.toFixed(2)}%</span></div>
            <div class="loan-balance">{money(item.balance)}</div><div class="balance-caption">Latest recorded / paid balance</div>
            <div class="loan-stats">
              <div><span>Monthly cost</span><b>{money(item.monthlyCost)}</b></div>
              <div><span>Amortization</span><b>{money(item.amortization)}</b></div>
            </div>
            {#if item.loan.amortization > 0}<div class="auto-label">Automatic rollover enabled</div>{/if}
          </article>
        {/each}
      </div>
    </section>

    {#if loanData.length > 0}
      <section class="section charts">
        <div class="section-heading"><div><div class="eyebrow">TREND</div><h2>Balance & cost projection</h2></div></div>
        <LoanSumsChart {loanData} />
        <LoanChart {loanData} />
      </section>

      <section class="section projection">
        <div class="section-heading">
          <div><div class="eyebrow">MONTH BY MONTH</div><h2>Projection table</h2><p>Historical months are included so your actual journey and future projection can be viewed together.</p></div>
          <button class="history-toggle" type="button" on:click={() => showHistory = !showHistory}>{showHistory ? 'Hide historical rows' : 'Show historical rows'}</button>
        </div>
        <div class:hide-history={!showHistory}>
          <Table {loanData} year={new Date().getFullYear()} monthName={new Date().toLocaleDateString('en-US', {month:'long'})} />
        </div>
      </section>
    {/if}
  </div>
{/if}

<style lang="scss">
  .dashboard { max-width: 1180px; margin: 0 auto; padding: 2.25rem 1.5rem 4rem; }
  .hero { display:flex; justify-content:space-between; gap:2rem; align-items:end; margin-bottom:2rem; }
  .eyebrow { font-size:.72rem; letter-spacing:.14em; font-weight:800; color:#64748b; margin-bottom:.35rem; }
  h1 { margin:0; font-size:clamp(2rem,4vw,3.2rem); letter-spacing:-.04em; color:#172033; }
  .hero p { color:#64748b; margin:.45rem 0 0; max-width:650px; }
  .manage,.history-toggle { border:1px solid #d9dee8; background:#fff; color:#334155; border-radius:10px; padding:.7rem 1rem; font-weight:700; text-decoration:none; white-space:nowrap; }
  .metric-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:.85rem; }
  .metric { background:#fff; border:1px solid #e5e7eb; border-radius:16px; padding:1.15rem; min-width:0; box-shadow:0 3px 12px rgba(15,23,42,.04); }
  .metric.featured { background:#172033; color:#fff; border-color:#172033; }
  .metric span,.metric small { display:block; color:#64748b; font-size:.78rem; }
  .metric.featured span,.metric.featured small { color:#cbd5e1; }
  .metric strong { display:block; font-size:1.45rem; margin:.45rem 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .payoff strong { font-size:1.15rem; }
  .progress-card,.section { background:#fff; border:1px solid #e5e7eb; border-radius:18px; margin-top:1rem; box-shadow:0 3px 12px rgba(15,23,42,.04); }
  .progress-card { padding:1.25rem 1.4rem; }
  .progress-head,.progress-labels { display:flex; justify-content:space-between; gap:1rem; font-size:.86rem; }
  .progress-track { height:10px; border-radius:99px; background:#eef2f7; overflow:hidden; margin:.7rem 0 .4rem; }
  .progress-fill { height:100%; background:#608d87; border-radius:99px; }
  .progress-labels { color:#94a3b8; font-size:.72rem; }
  .balance-note { margin-top:.75rem; color:#94a3b8; font-size:.72rem; }
  .snowball-note { display:flex; gap:.75rem; align-items:flex-start; padding:.85rem 1rem; margin-bottom:1rem; background:#f7faf9; border:1px solid #dfe9e6; border-radius:12px; color:#52616d; font-size:.8rem; }
  .snowball-note strong { color:#334155; white-space:nowrap; }
  .auto-label { margin-top:.75rem; color:#608d87; font-size:.7rem; font-weight:700; }
  .section { padding:1.4rem; }
  .section-heading { display:flex; justify-content:space-between; align-items:end; gap:1rem; margin-bottom:1rem; }
  h2 { margin:0; color:#172033; font-size:1.45rem; letter-spacing:-.025em; }
  .section-heading p { color:#64748b; margin:.25rem 0 0; font-size:.9rem; }
  .count { background:#f1f5f9; color:#64748b; padding:.35rem .65rem; border-radius:999px; font-size:.75rem; }
  .loan-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:.85rem; }
  .loan-card { border:1px solid #e6eaf0; border-radius:14px; padding:1.1rem; background:#fbfcfe; }
  .loan-title { display:flex; justify-content:space-between; align-items:center; gap:1rem; }
  .loan-title h3 { margin:0; font-size:1rem; color:#334155; }
  .loan-title span { font-weight:800; color:#608d87; }
  .balance-caption { color:#94a3b8; font-size:.68rem; margin-top:-.8rem; }
  .loan-balance { font-size:1.8rem; font-weight:800; letter-spacing:-.03em; color:#172033; margin:1rem 0; }
  .loan-stats { display:grid; grid-template-columns:1fr 1fr; border-top:1px solid #e6eaf0; padding-top:.8rem; gap:1rem; }
  .loan-stats span { display:block; color:#94a3b8; font-size:.72rem; }
  .loan-stats b { color:#334155; font-size:.9rem; }
  .charts :global(canvas) { max-height:360px; }
  .projection :global(.table-wrap) { margin:0; }
  .hide-history :global(tr.previousYear) { display:none; }
  .error-panel,.empty-state,.loading { margin:2rem auto; max-width:700px; padding:1rem 1.2rem; background:#fff; border:1px solid #e5e7eb; border-radius:12px; }
  .error-panel { color:#9f1239; }
  @media (max-width:1050px) { .metric-grid { grid-template-columns:repeat(3,1fr); } }
  @media (max-width:760px) { .dashboard{padding:1.25rem .8rem 3rem}.hero{align-items:start;flex-direction:column}.metric-grid{grid-template-columns:repeat(2,1fr)}.loan-grid{grid-template-columns:1fr}.section-heading{align-items:start;flex-direction:column}.manage{display:inline-block}.metric strong{font-size:1.25rem} }
  @media (max-width:430px) { .metric-grid{grid-template-columns:1fr}.progress-labels{font-size:.65rem}.loan-balance{font-size:1.55rem} }
</style>
