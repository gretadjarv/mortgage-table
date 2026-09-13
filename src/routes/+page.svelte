<script>
  import { onMount } from 'svelte';
  import { createClient } from '@supabase/supabase-js';
  import Chart from '$lib/Chart.svelte';

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const configured = Boolean(supabaseUrl && supabaseKey);
  const supabase = configured ? createClient(supabaseUrl, supabaseKey) : null;

  let session = null;
  let authMode = 'login';
  let email = '';
  let password = '';
  let authMessage = '';
  let loading = true;
  let saving = false;
  let error = '';
  let loans = [];
  let updates = [];
  let oneTimePayments = [];
  let showLoanForm = false;
  let editingLoan = null;
  let selectedLoanId = null;
  let showUpdateForm = false;
  let showOneTimeForm = false;
  let projectionYears = 10;

  let loanForm = emptyLoan();
  let updateForm = emptyUpdate();
  let paymentForm = emptyPayment();

  function emptyLoan() {
    return {
      name: '',
      start_sum: '',
      interest_rate: '',
      amortization: '',
      start_date: new Date().toISOString().slice(0, 10)
    };
  }

  function emptyUpdate() {
    return {
      updated_amortization: '',
      updated_interest_rate: '',
      update_date: new Date().toISOString().slice(0, 10)
    };
  }

  function emptyPayment() {
    return {
      amount: '',
      payment_date: new Date().toISOString().slice(0, 10)
    };
  }

  const money = (n) =>
    new Intl.NumberFormat('sv-SE', {
      maximumFractionDigits: 0
    }).format(Math.max(0, n || 0)) + ' kr';

  const pct = (n) => `${Number(n || 0).toFixed(2)} %`;

  const dateLabel = (value) =>
    new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(`${value}T00:00:00`));

  onMount(async () => {
    if (!supabase) {
      loading = false;
      return;
    }

    const { data } = await supabase.auth.getSession();
    session = data.session;

    if (session) {
      await loadData();
    } else {
      loading = false;
    }

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        session = nextSession;

        if (nextSession) {
          loadData();
        } else {
          loans = [];
          updates = [];
          oneTimePayments = [];
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  });

  async function loadData() {
    loading = true;
    error = '';

    const [loanRes, updateRes, paymentRes] = await Promise.all([
      supabase
        .from('loans')
        .select('*')
        .order('start_date', { ascending: true }),

      supabase
        .from('loan_updates')
        .select('*')
        .order('update_date', { ascending: true }),

      supabase
        .from('one_time_payments')
        .select('*')
        .order('payment_date', { ascending: true })
    ]);

    if (loanRes.error) {
      error = loanRes.error.message;
    } else {
      loans = loanRes.data || [];
    }

    if (updateRes.error) {
      error = updateRes.error.message;
    } else {
      updates = updateRes.data || [];
    }

    if (paymentRes.error) {
      error = paymentRes.error.message;
    } else {
      oneTimePayments = paymentRes.data || [];
    }

    loading = false;
  }

  async function authenticate() {
    authMessage = '';
    error = '';

    if (!email || !password) {
      authMessage = 'Enter your email and password.';
      return;
    }

    const result =
      authMode === 'login'
        ? await supabase.auth.signInWithPassword({
            email,
            password
          })
        : await supabase.auth.signUp({
            email,
            password
          });

    if (result.error) {
      authMessage = result.error.message;
    } else {
      authMessage =
        authMode === 'login'
          ? 'Signed in.'
          : 'Account created. Check your email if confirmation is enabled in Supabase.';
    }
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  function openLoan(loan = null) {
    editingLoan = loan;
    loanForm = loan
      ? {
          name: loan.name,
          start_sum: loan.start_sum,
          interest_rate: loan.interest_rate,
          amortization: loan.amortization,
          start_date: loan.start_date
        }
      : emptyLoan();

    showLoanForm = true;
  }

  async function saveLoan() {
    saving = true;
    error = '';

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      error = 'You are not logged in.';
      saving = false;
      return;
    }

    const payload = {
      user_id: user.id,
      name: loanForm.name.trim() || `Loan ${loans.length + 1}`,
      start_sum: Number(loanForm.start_sum),
      interest_rate: Number(loanForm.interest_rate),
      amortization: Number(loanForm.amortization),
      start_date: loanForm.start_date
    };

    let result;

    if (editingLoan) {
      result = await supabase
        .from('loans')
        .update(payload)
        .eq('id', editingLoan.id)
        .eq('user_id', user.id);
    } else {
      result = await supabase
        .from('loans')
        .insert(payload);
    }

    if (result.error) {
      error = result.error.message;
    } else {
      showLoanForm = false;
      editingLoan = null;
      loanForm = emptyLoan();
      await loadData();
    }

    saving = false;
  }

  async function deleteLoan(loan) {
    if (
      !confirm(
        `Delete ${loan.name}? Its updates and one-time payments will also be deleted.`
      )
    ) {
      return;
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      error = 'You are not logged in.';
      return;
    }

    const result = await supabase
      .from('loans')
      .delete()
      .eq('id', loan.id)
      .eq('user_id', user.id);

    if (result.error) {
      error = result.error.message;
    } else {
      selectedLoanId = null;
      await loadData();
    }
  }

  function selectLoan(id) {
    selectedLoanId = selectedLoanId === id ? null : id;
    showUpdateForm = false;
    showOneTimeForm = false;
    updateForm = emptyUpdate();
    paymentForm = emptyPayment();
  }

  async function saveUpdate() {
    if (!selectedLoanId) return;

    saving = true;
    error = '';

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      error = 'You are not logged in.';
      saving = false;
      return;
    }

    const result = await supabase.from('loan_updates').insert({
      user_id: user.id,
      loan_id: selectedLoanId,
      updated_amortization: Number(
        updateForm.updated_amortization
      ),
      updated_interest_rate: Number(
        updateForm.updated_interest_rate
      ),
      update_date: updateForm.update_date
    });

    if (result.error) {
      error = result.error.message;
    } else {
      showUpdateForm = false;
      updateForm = emptyUpdate();
      await loadData();
    }

    saving = false;
  }

  async function deleteUpdate(id) {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      error = 'You are not logged in.';
      return;
    }

    const result = await supabase
      .from('loan_updates')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (result.error) {
      error = result.error.message;
    } else {
      await loadData();
    }
  }

  async function savePayment() {
    if (!selectedLoanId) return;

    saving = true;
    error = '';

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      error = 'You are not logged in.';
      saving = false;
      return;
    }

    const result = await supabase.from('one_time_payments').insert({
      user_id: user.id,
      loan_id: selectedLoanId,
      amount: Number(paymentForm.amount),
      payment_date: paymentForm.payment_date
    });

    if (result.error) {
      error = result.error.message;
    } else {
      showOneTimeForm = false;
      paymentForm = emptyPayment();
      await loadData();
    }

    saving = false;
  }

  async function deletePayment(id) {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      error = 'You are not logged in.';
      return;
    }

    const result = await supabase
      .from('one_time_payments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (result.error) {
      error = result.error.message;
    } else {
      await loadData();
    }
  }

  function eventsForLoan(id) {
    return updates.filter((x) => x.loan_id === id);
  }

  function paymentsForLoan(id) {
    return oneTimePayments.filter((x) => x.loan_id === id);
  }

  function simulate(months = projectionYears * 12) {
    if (!loans.length) return [];

    const start = new Date(
      `${
        loans.reduce(
          (min, l) =>
            l.start_date < min ? l.start_date : min,
          loans[0].start_date
        )
      }T00:00:00`
    );

    const states = loans.map((loan) => ({
      loan,
      balance: Number(loan.start_sum),
      amortization: Number(loan.amortization),
      rate: Number(loan.interest_rate)
    }));

    const rows = [];

    for (let m = 0; m < months; m++) {
      const date = new Date(start);
      date.setMonth(date.getMonth() + m);

      const iso = date.toISOString().slice(0, 10);

      let totalInterest = 0;
      let totalAmortization = 0;
      let totalPayment = 0;

      const balances = [];

      for (const state of states) {
        const relevant = eventsForLoan(state.loan.id)
          .filter((u) => u.update_date <= iso)
          .sort((a, b) =>
            a.update_date.localeCompare(b.update_date)
          );

        if (relevant.length) {
          const u = relevant[relevant.length - 1];

          state.amortization = Number(
            u.updated_amortization
          );

          state.rate = Number(
            u.updated_interest_rate
          );
        }

        const previousDate =
          m === 0
            ? state.loan.start_date
            : new Date(
                new Date(start).setMonth(
                  start.getMonth() + m - 1
                )
              )
                .toISOString()
                .slice(0, 10);

        const oneTimes = paymentsForLoan(state.loan.id).filter(
          (p) =>
            p.payment_date >= previousDate &&
            p.payment_date <= iso
        );

        for (const p of oneTimes) {
          state.balance = Math.max(
            0,
            state.balance - Number(p.amount)
          );
        }

        if (state.balance <= 0) {
          balances.push(0);
          continue;
        }

        const interest =
          state.balance * (state.rate / 100 / 12);

        const amortization = Math.min(
          state.amortization,
          state.balance
        );

        totalInterest += interest;
        totalAmortization += amortization;
        totalPayment += interest + amortization;

        state.balance = Math.max(
          0,
          state.balance - amortization
        );

        balances.push(state.balance);
      }

      rows.push({
        date: iso,
        label: new Intl.DateTimeFormat('en-GB', {
          month: 'short',
          year: 'numeric'
        }).format(date),
        balance: balances.reduce(
          (a, b) => a + b,
          0
        ),
        totalInterest,
        totalAmortization,
        totalPayment
      });
    }

    return rows;
  }

  $: projection = simulate();

  $: startingDebt = loans.reduce(
    (s, l) => s + Number(l.start_sum || 0),
    0
  );

  $: currentDebt =
    projection[0]?.balance ?? startingDebt;

  $: monthlyAmortization = loans.reduce(
    (s, l) => s + Number(l.amortization || 0),
    0
  );

  $: weightedRate = startingDebt
    ? loans.reduce(
        (s, l) =>
          s +
          Number(l.start_sum) *
            Number(l.interest_rate),
        0
      ) / startingDebt
    : 0;

  $: selectedLoan = loans.find(
    (l) => l.id === selectedLoanId
  );

  $: chartLabels = projection
    .filter((_, i) => i % 3 === 0)
    .map((r) => r.label);

  $: chartValues = projection
    .filter((_, i) => i % 3 === 0)
    .map((r) => Math.round(r.balance));
</script>

<svelte:head>
  <title>Mortgage Table</title>
  <meta
    name="description"
    content="Personal mortgage and amortization tracker"
  />
</svelte:head>

{#if !configured}
  <main class="center">
    <div class="card narrow">
      <h1>Mortgage Table</h1>
      <p>Supabase isn't configured yet.</p>
      <p class="muted">
        Add the Supabase environment variables to your
        GitHub Actions secrets.
      </p>
    </div>
  </main>

{:else if !session}

  <main class="center">
    <div class="auth card">

      <div class="brand">
        <span>Mortgage</span>
        <strong>Table</strong>
      </div>

      <h1>
        {authMode === 'login'
          ? 'Sign in'
          : 'Create account'}
      </h1>

      <p class="muted">
        {authMode === 'login'
          ? 'Sign in to manage your mortgages.'
          : 'Create an account to get started.'}
      </p>

      <form on:submit|preventDefault={authenticate}>

        <label>
          Email
          <input
            type="email"
            bind:value={email}
            autocomplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            bind:value={password}
            autocomplete={
              authMode === 'login'
                ? 'current-password'
                : 'new-password'
            }
            required
          />
        </label>

        {#if authMessage}
          <div class="notice">
            {authMessage}
          </div>
        {/if}

        <button
          class="primary wide"
          type="submit"
        >
          {authMode === 'login'
            ? 'Sign in'
            : 'Create account'}
        </button>

      </form>

      <button
        class="link"
        type="button"
        on:click={() =>
          (authMode =
            authMode === 'login'
              ? 'signup'
              : 'login')}
      >
        {authMode === 'login'
          ? 'Create an account'
          : 'Already have an account? Sign in'}
      </button>

    </div>
  </main>

{:else}

  <main class="page">

    <header class="topbar">
      <div class="brand">
        <span>Mortgage</span>
        <strong>Table</strong>
      </div>

      <button
        class="ghost"
        type="button"
        on:click={logout}
      >
        Sign out
      </button>
    </header>

    <section class="hero">

      <div>
        <h1>Your mortgages</h1>
        <p class="muted">
          Track your debt, rates and amortization.
        </p>
      </div>

      <button
        class="primary"
        type="button"
        on:click={() => openLoan()}
      >
        + Add loan
      </button>

    </section>

    {#if error}
      <div class="error">
        {error}
      </div>
    {/if}

    {#if loading}

      <div class="card loading">
        Loading your loans…
      </div>

    {:else}

      <section class="stats">

        <div class="stat card">
          <span>Total starting debt</span>
          <strong>
            {money(startingDebt)}
          </strong>
        </div>

        <div class="stat card">
          <span>Monthly amortization</span>
          <strong>
            {money(monthlyAmortization)}
          </strong>
        </div>

        <div class="stat card">
          <span>Weighted interest rate</span>
          <strong>
            {pct(weightedRate)}
          </strong>
        </div>

        <div class="stat card">
          <span>
            Projected debt after 12 months
          </span>
          <strong>
            {money(
              projection[11]?.balance ??
                currentDebt
            )}
          </strong>
        </div>

      </section>

      {#if loans.length === 0}

        <div class="empty card">

          <h2>No loans yet</h2>

          <p class="muted">
            Add your first mortgage to start
            the table and projection.
          </p>

          <button
            class="primary"
            type="button"
            on:click={() => openLoan()}
          >
            Add your first loan
          </button>

        </div>

      {:else}

        <section class="card chart-card">

          <div class="section-head">

            <div>
              <h2>Debt projection</h2>

              <p class="muted">
                Based on the current amortization
                and rate settings.
              </p>
            </div>

            <select bind:value={projectionYears}>
              <option value={5}>
                5 years
              </option>

              <option value={10}>
                10 years
              </option>

              <option value={20}>
                20 years
              </option>

              <option value={30}>
                30 years
              </option>
            </select>

          </div>

          <Chart
            labels={chartLabels}
            values={chartValues}
          />

        </section>

        <section class="card">

          <div class="section-head">

            <div>
              <h2>Loans</h2>

              <p class="muted">
                Click a loan to manage its
                rate and payment history.
              </p>
            </div>

          </div>

          <div class="table-wrap">

            <table>

              <thead>
                <tr>
                  <th>Loan</th>
                  <th>Starting balance</th>
                  <th>Rate</th>
                  <th>Amortization</th>
                  <th>Start date</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>

                {#each loans as loan}

                  <tr
                    class:selected={
                      selectedLoanId === loan.id
                    }
                    on:click={() =>
                      selectLoan(loan.id)}
                  >

                    <td>
                      <strong>
                        {loan.name}
                      </strong>
                    </td>

                    <td>
                      {money(loan.start_sum)}
                    </td>

                    <td>
                      {pct(loan.interest_rate)}
                    </td>

                    <td>
                      {money(loan.amortization)}
                    </td>

                    <td>
                      {dateLabel(
                        loan.start_date
                      )}
                    </td>

                    <td class="actions">

                      <button
                        class="small"
                        type="button"
                        on:click|stopPropagation={() =>
                          openLoan(loan)}
                      >
                        Edit
                      </button>

                      <button
                        class="danger small"
                        type="button"
                        on:click|stopPropagation={() =>
                          deleteLoan(loan)}
                      >
                        Delete
                      </button>

                    </td>

                  </tr>

                  {#if selectedLoanId === loan.id}

                    <tr class="detail">

                      <td colspan="6">

                        <div class="detail-inner">

                          <div class="section-head">

                            <div>

                              <h3>
                                {selectedLoan.name}
                              </h3>

                              <p class="muted">
                                Rate and amortization
                                changes become
                                effective on their
                                selected date.
                              </p>

                            </div>

                            <div class="button-row">

                              <button
                                class="secondary"
                                type="button"
                                on:click={() => {
                                  showUpdateForm =
                                    !showUpdateForm;
                                  showOneTimeForm =
                                    false;
                                }}
                              >
                                + Rate / amortization
                                change
                              </button>

                              <button
                                class="secondary"
                                type="button"
                                on:click={() => {
                                  showOneTimeForm =
                                    !showOneTimeForm;
                                  showUpdateForm =
                                    false;
                                }}
                              >
                                + One-time payment
                              </button>

                            </div>

                          </div>

                          {#if showUpdateForm}

                            <form
                              class="inline-form"
                              on:submit|preventDefault={
                                saveUpdate
                              }
                            >

                              <label>
                                Monthly amortization
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  bind:value={
                                    updateForm.updated_amortization
                                  }
                                  required
                                />
                              </label>

                              <label>
                                Interest rate %
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  bind:value={
                                    updateForm.updated_interest_rate
                                  }
                                  required
                                />
                              </label>

                              <label>
                                Effective date
                                <input
                                  type="date"
                                  bind:value={
                                    updateForm.update_date
                                  }
                                  required
                                />
                              </label>

                              <button
                                class="primary"
                                disabled={saving}
                              >
                                Save change
                              </button>

                            </form>

                          {/if}

                          {#if showOneTimeForm}

                            <form
                              class="inline-form"
                              on:submit|preventDefault={
                                savePayment
                              }
                            >

                              <label>
                                Payment amount
                                <input
                                  type="number"
                                  min="0.01"
                                  step="1"
                                  bind:value={
                                    paymentForm.amount
                                  }
                                  required
                                />
                              </label>

                              <label>
                                Payment date
                                <input
                                  type="date"
                                  bind:value={
                                    paymentForm.payment_date
                                  }
                                  required
                                />
                              </label>

                              <button
                                class="primary"
                                disabled={saving}
                              >
                                Save payment
                              </button>

                            </form>

                          {/if}

                          <div class="history-grid">

                            <div>

                              <h4>Changes</h4>

                              {#if eventsForLoan(
                                loan.id
                              ).length}

                                {#each eventsForLoan(
                                  loan.id
                                ) as item}

                                  <div class="history-row">

                                    <span>
                                      {dateLabel(
                                        item.update_date
                                      )}
                                      ·
                                      {pct(
                                        item.updated_interest_rate
                                      )}
                                      ·
                                      {money(
                                        item.updated_amortization
                                      )}
                                      /mo
                                    </span>

                                    <button
                                      class="danger small"
                                      type="button"
                                      on:click={() =>
                                        deleteUpdate(
                                          item.id
                                        )}
                                    >
                                      Delete
                                    </button>

                                  </div>

                                {/each}

                              {:else}

                                <p class="muted">
                                  No changes recorded.
                                </p>

                              {/if}

                            </div>

                            <div>

                              <h4>
                                One-time payments
                              </h4>

                              {#if paymentsForLoan(
                                loan.id
                              ).length}

                                {#each paymentsForLoan(
                                  loan.id
                                ) as item}

                                  <div class="history-row">

                                    <span>
                                      {dateLabel(
                                        item.payment_date
                                      )}
                                      ·
                                      {money(
                                        item.amount
                                      )}
                                    </span>

                                    <button
                                      class="danger small"
                                      type="button"
                                      on:click={() =>
                                        deletePayment(
                                          item.id
                                        )}
                                    >
                                      Delete
                                    </button>

                                  </div>

                                {/each}

                              {:else}

                                <p class="muted">
                                  No one-time payments
                                  recorded.
                                </p>

                              {/if}

                            </div>

                          </div>

                        </div>

                      </td>

                    </tr>

                  {/if}

                {/each}

              </tbody>

            </table>

          </div>

        </section>

      {/if}

    {/if}

  </main>

{/if}

{#if showLoanForm}

  <div
    class="modal-backdrop"
    role="presentation"
    on:click={(e) =>
      e.currentTarget === e.target &&
      (showLoanForm = false)}
  >

    <div class="modal card">

      <div class="section-head">

        <h2>
          {editingLoan
            ? 'Edit loan'
            : 'Add loan'}
        </h2>

        <button
          class="ghost"
          type="button"
          on:click={() =>
            (showLoanForm = false)}
        >
          Close
        </button>

      </div>

      <form
        on:submit|preventDefault={saveLoan}
      >

        <label>
          Name
          <input
            bind:value={loanForm.name}
            placeholder="e.g. Mortgage 1"
            required
          />
        </label>

        <div class="form-grid">

          <label>
            Starting balance
            <input
              type="number"
              min="0"
              step="1"
              bind:value={loanForm.start_sum}
              required
            />
          </label>

          <label>
            Interest rate %
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              bind:value={
                loanForm.interest_rate
              }
              required
            />
          </label>

          <label>
            Monthly amortization
            <input
              type="number"
              min="0"
              step="1"
              bind:value={
                loanForm.amortization
              }
              required
            />
          </label>

          <label>
            Start date
            <input
              type="date"
              bind:value={
                loanForm.start_date
              }
              required
            />
          </label>

        </div>

        <div class="button-row end">

          <button
            class="secondary"
            type="button"
            on:click={() =>
              (showLoanForm = false)}
          >
            Cancel
          </button>

          <button
            class="primary"
            disabled={saving}
          >
            {saving
              ? 'Saving…'
              : editingLoan
                ? 'Save loan'
                : 'Create loan'}
          </button>

        </div>

      </form>

    </div>

  </div>

{/if}

<style>
  :global(body) {
    background: #f5f6f8;
  }

  .page {
    max-width: 1180px;
    margin: 0 auto;
    padding: 24px;
  }

  .topbar,
  .hero,
  .section-head,
  .button-row,
  .history-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .topbar {
    margin-bottom: 48px;
  }

  .brand {
    font-size: 1.25rem;
    letter-spacing: -.04em;
  }

  .brand span {
    font-weight: 400;
  }

  .brand strong {
    font-weight: 800;
  }

  .hero {
    margin-bottom: 28px;
  }

  .hero h1 {
    margin: 0 0 8px;
    font-size: clamp(2rem, 5vw, 3.2rem);
    letter-spacing: -.05em;
  }

  .muted {
    color: #6b7280;
  }

  .card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 24px;
    box-shadow:
      0 4px 20px rgba(0, 0, 0, .04);
  }

  .stats {
    display: grid;
    grid-template-columns:
      repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 20px;
  }

  .stat {
    padding: 20px;
  }

  .stat span {
    display: block;
    color: #6b7280;
    font-size: .85rem;
    margin-bottom: 8px;
  }

  .stat strong {
    font-size: 1.35rem;
    letter-spacing: -.03em;
  }

  h2,
  h3,
  h4 {
    margin-top: 0;
  }

  h2 {
    margin-bottom: 4px;
  }

  h3 {
    margin-bottom: 2px;
  }

  h4 {
    margin-bottom: 10px;
  }

  .chart-card {
    margin-bottom: 20px;
  }

  select,
  input {
    width: 100%;
    border: 1px solid #d1d5db;
    border-radius: 9px;
    padding: 11px 12px;
    background: #fff;
    color: #111827;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 7px;
    font-weight: 600;
    font-size: .9rem;
    margin-bottom: 14px;
  }

  select {
    width: auto;
    min-width: 130px;
  }

  button {
    border: 0;
    border-radius: 9px;
    padding: 10px 15px;
    font-weight: 650;
    cursor: pointer;
  }

  button:disabled {
    opacity: .6;
    cursor: not-allowed;
  }

  .primary {
    background: #111827;
    color: white;
  }

  .secondary {
    background: #eef0f3;
    color: #111827;
  }

  .ghost {
    background: transparent;
    color: #4b5563;
  }

  .link {
    background: none;
    color: #374151;
    text-decoration: underline;
    padding: 8px 0;
  }

  .wide {
    width: 100%;
    margin-top: 4px;
  }

  .small {
    padding: 6px 9px;
    font-size: .8rem;
  }

  .danger {
    color: #b91c1c;
    background: #fee2e2;
  }

  .table-wrap {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 760px;
  }

  th,
  td {
    padding: 14px 12px;
    border-bottom: 1px solid #eef0f2;
    text-align: left;
    white-space: nowrap;
  }

  th {
    color: #6b7280;
    font-size: .8rem;
    text-transform: uppercase;
    letter-spacing: .04em;
  }

  tr.selected td {
    background: #f8fafc;
  }

  .actions {
    text-align: right;
  }

  .actions button + button {
    margin-left: 6px;
  }

  .detail td {
    padding: 0;
  }

  .detail-inner {
    padding: 22px;
    background: #fafafa;
  }

  .history-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-top: 20px;
  }

  .history-row {
    padding: 9px 0;
    border-bottom: 1px solid #e5e7eb;
    font-size: .9rem;
  }

  .inline-form,
  .form-grid {
    display: grid;
    grid-template-columns:
      repeat(3, 1fr);
    gap: 14px;
    align-items: end;
    margin-top: 18px;
  }

  .inline-form label,
  .form-grid label {
    margin-bottom: 0;
  }

  .inline-form button {
    align-self: end;
  }

  .form-grid {
    grid-template-columns: 1fr 1fr;
  }

  .end {
    justify-content: flex-end;
    margin-top: 18px;
  }

  .empty,
  .loading {
    text-align: center;
    padding: 56px 24px;
  }

  .error,
  .notice {
    background: #fff4f2;
    color: #9f1239;
    border: 1px solid #fecdd3;
    padding: 12px 14px;
    border-radius: 10px;
    margin-bottom: 18px;
  }

  .center {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 20px;
  }

  .auth {
    width: min(430px, 100%);
  }

  .narrow {
    max-width: 520px;
  }

  .auth h1 {
    margin-bottom: 6px;
  }

  .auth form {
    margin-top: 22px;
  }

  .auth .link {
    display: block;
    margin: 14px auto 0;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(17, 24, 39, .42);
    display: grid;
    place-items: center;
    padding: 20px;
    z-index: 20;
  }

  .modal {
    width: min(680px, 100%);
    max-height: 90vh;
    overflow: auto;
  }

  code {
    background: #f3f4f6;
    padding: 2px 5px;
    border-radius: 4px;
  }

  @media (max-width: 850px) {
    .stats {
      grid-template-columns: 1fr 1fr;
    }

    .hero {
      align-items: flex-end;
    }

    .history-grid {
      grid-template-columns: 1fr;
    }

    .inline-form {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 560px) {
    .page {
      padding: 16px;
    }

    .topbar {
      margin-bottom: 30px;
    }

    .stats {
      grid-template-columns: 1fr;
    }

    .hero {
      flex-direction: column;
      align-items: stretch;
    }

    .card {
      padding: 18px;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .section-head {
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .button-row {
      flex-wrap: wrap;
    }
  }
</style>
