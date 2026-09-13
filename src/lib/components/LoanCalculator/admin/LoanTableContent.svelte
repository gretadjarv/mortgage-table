<script>
  import {
    loanList,
    expandedLoanId,
    loanActions,
    formatDate,
    formatCurrency,
  } from '$lib/stores/loanStore';
  import LoanUpdatesPanel from './LoanUpdatesPanel.svelte';

  function handleEditLoan(loan) {
    loanActions.editLoan(loan);
  }

  function handleDeleteLoan(loanId) {
    loanActions.deleteLoan(loanId);
  }

  function toggleLoanExpansion(loanId) {
    loanActions.expandLoan(loanId);
  }
</script>

<div class="table-container">
  <table class="loan-table">
    <thead>
      <tr>
        <th>Initial Amount</th>
        <th>Interest Rate</th>
        <th>Monthly Payment</th>
        <th>Start Date</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {#each $loanList as loan (loan.id)}
        <tr class="loan-row" class:expanded={$expandedLoanId === loan.id}>
          <td class="amount-cell">{formatCurrency(loan.start_sum)}</td>
          <td class="rate-cell">{loan.interest_rate}%</td>
          <td class="payment-cell">{formatCurrency(loan.amortization)}</td>
          <td class="date-cell">{formatDate(loan.start_date)}</td>
          <td class="actions-cell">
            <div class="action-buttons">
              <button class="btn-edit" on:click={() => handleEditLoan(loan)} title="Edit loan">
                Edit
              </button>
              <button
                class="btn-delete"
                on:click={() => handleDeleteLoan(loan.id)}
                title="Delete loan">
                Delete
              </button>
              <button
                class="btn-expand"
                on:click={() => toggleLoanExpansion(loan.id)}
                title={$expandedLoanId === loan.id ? 'Hide updates' : 'Show updates'}>
                {$expandedLoanId === loan.id ? 'Collapse' : 'Updates'}
              </button>
            </div>
          </td>
        </tr>

        {#if $expandedLoanId === loan.id}
          <tr class="updates-row">
            <td colspan="5" class="updates-cell">
              <LoanUpdatesPanel loanId={loan.id} />
            </td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
</div>

<style>
  .table-container {
    overflow-x: auto;
    border-radius: 8px;
    border: 1px solid var(--color-border, #ddd);
  }

  .loan-table {
    width: 100%;
    border-collapse: collapse;
    background-color: var(--color-bg-0, #ffffff);
  }

  th {
    background-color: var(--color-primary, #4a90e2);
    color: white;
    padding: 1rem 0.75rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  td {
    padding: 0.75rem;
    border-bottom: 1px solid var(--color-border, #ddd);
    font-size: 0.9rem;
  }

  .loan-row:hover {
    background-color: var(--color-bg-1, #f8f9fa);
  }

  .loan-row.expanded {
    background-color: var(--color-bg-1, #f8f9fa);
  }

  .amount-cell,
  .payment-cell {
    font-weight: 600;
    color: var(--color-primary, #4a90e2);
  }

  .rate-cell {
    font-weight: 500;
  }

  .actions-cell {
    white-space: nowrap;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .action-buttons button {
    padding: 0.5rem 0.75rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 500;
    transition: all 0.2s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .btn-edit {
    background-color: var(--color-secondary, #7ed321);
    color: white;
  }

  .btn-edit:hover {
    background-color: #6bb91a;
  }

  .btn-delete {
    background-color: var(--color-accent, #d0021b);
    color: white;
  }

  .btn-delete:hover {
    background-color: #b30218;
  }

  .btn-expand {
    background-color: #f5a623;
    color: white;
  }

  .btn-expand:hover {
    background-color: #e0941f;
  }

  .updates-row {
    background-color: var(--color-bg-1, #f8f9fa);
  }

  .updates-cell {
    padding: 0;
    border-bottom: 2px solid var(--color-border, #ddd);
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .action-buttons {
      flex-direction: column;
    }

    .action-buttons button {
      width: 100%;
      margin-bottom: 0.25rem;
    }

    th,
    td {
      padding: 0.5rem;
      font-size: 0.8rem;
    }
  }
</style>
