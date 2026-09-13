<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import {
    loanUpdates,
    loanUpdateService,
    oneTimePayments,
    oneTimePaymentService,
    formatDate,
    formatCurrency,
  } from '$lib/stores/loanStore';
  import LoanUpdateForm from './LoanUpdateForm.svelte';

  const dispatch = createEventDispatcher();

  export let loanId;

  let showCreateForm = false;
  let editingUpdateId = null;
  let isLoading = false;

  // Subscribed stores
  $: updates = $loanUpdates;
  $: payments = $oneTimePayments;

  onMount(async () => {
    await loadUpdates();
    await loadOneTimePayments();
  });

  async function loadUpdates() {
    if (!loanId) return;
    isLoading = true;
    try {
      await loanUpdateService.fetchLoanUpdates(loanId);
    } catch (error) {
      console.error('Failed to load updates:', error);
    } finally {
      isLoading = false;
    }
  }

  async function loadOneTimePayments() {
    if (!loanId) return;
    try {
      await oneTimePaymentService.fetchOneTimePayments(loanId);
    } catch (error) {
      console.error('Failed to load one-time payments:', error);
    }
  }

  async function handleCreateUpdate(event) {
    const { updateData } = event.detail;
    try {
      await loanUpdateService.createLoanUpdate(loanId, updateData);
      showCreateForm = false;
      dispatch('create-update', { loanId, updateData });
    } catch (error) {
      console.error('Failed to create update:', error);
    }
  }

  async function handleEditUpdate(event) {
    const { updateData, updateId } = event.detail;
    try {
      await loanUpdateService.updateLoanUpdate(loanId, updateId, updateData);
      editingUpdateId = null;
      dispatch('edit-update', { loanId, updateId, updateData });
    } catch (error) {
      console.error('Failed to edit update:', error);
    }
  }

  async function handleDeleteUpdate(updateId) {
    if (!confirm('Are you sure you want to delete this update?')) return;
    try {
      await loanUpdateService.deleteLoanUpdate(loanId, updateId);
      dispatch('delete-update', { loanId, updateId });
    } catch (error) {
      console.error('Failed to delete update:', error);
    }
  }

  async function handleOneTimePaymentSubmit(event) {
    const { amount, payment_date } = event.detail;

    try {
      await oneTimePaymentService.createOneTimePayment(loanId, {
        amount,
        paymentDate: payment_date,
      });

      // Optionally reload payments or notify parent
      console.log('Payment saved!');
    } catch (error) {
      console.error('Failed to save one-time payment:', error);
    }
  }

  async function handleDeleteOneTimePayment(paymentId) {
    if (!confirm('Are you sure you want to delete this payment?')) return;

    try {
      await oneTimePaymentService.deleteOneTimePayment(loanId, paymentId);
    } catch (error) {
      console.error('Failed to delete one-time payment:', error);
    }
  }

  function startEditingUpdate(update) {
    editingUpdateId = update.id;
    showCreateForm = false;
  }

  function cancelCreate() {
    showCreateForm = false;
  }

  function cancelEdit() {
    editingUpdateId = null;
  }

  $: editingUpdate = editingUpdateId ? updates.find((u) => u.id === editingUpdateId) : null;
</script>

<div class="loan-updates-panel">
  <div class="panel-header">
    <h3>Payment & Rate Updates</h3>
    <button
      class="btn-add-update"
      on:click={() => (showCreateForm = !showCreateForm)}
      disabled={editingUpdateId !== null}>
      {showCreateForm ? 'Cancel' : 'Add Update'}
    </button>
  </div>

  {#if showCreateForm}
    <div class="form-section">
      <LoanUpdateForm
        on:submit={handleCreateUpdate}
        on:submitOneTimePayment={handleOneTimePaymentSubmit}
        on:cancel={cancelCreate}
        isSubmitting={false} />
    </div>
  {/if}

  {#if editingUpdateId && editingUpdate}
    <div class="form-section">
      <LoanUpdateForm
        {editingUpdate}
        on:submit={handleEditUpdate}
        on:cancel={cancelEdit}
        isSubmitting={false} />
    </div>
  {/if}

  <div class="updates-content">
    {#if isLoading}
      <p>Loading updates...</p>
    {:else if updates.length > 0}
      <table class="updates-table">
        <thead>
          <tr>
            <th>Monthly Payment</th>
            <th>Interest Rate</th>
            <th>Effective Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each updates as update (update.id)}
            <tr class:editing={editingUpdateId === update.id}>
              <td>{formatCurrency(update.updated_amortization)}</td>
              <td>{update.updated_interest_rate}%</td>
              <td>{formatDate(update.update_date)}</td>
              <td>
                <button
                  on:click={() => startEditingUpdate(update)}
                  disabled={editingUpdateId || showCreateForm}>
                  Edit
                </button>
                <button
                  on:click={() => handleDeleteUpdate(update.id)}
                  disabled={editingUpdateId || showCreateForm}>
                  Delete
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p>No payment or rate updates recorded for this loan.</p>
    {/if}
  </div>

  <div class="one-time-payments">
    <h4>One-Time Payments</h4>
    {#if payments.length > 0}
      <table class="updates-table">
        <thead>
          <tr>
            <th>Amount</th>
            <th>Payment Date</th>
          </tr>
        </thead>
        <tbody>
          {#each payments as payment (payment.id)}
            <tr>
              <td>{formatCurrency(payment.amount)}</td>
              <td>{formatDate(payment.payment_date)}</td>
              <td>
                <button
                  class="btn-delete-small"
                  on:click={() => handleDeleteOneTimePayment(payment.id)}
                  title="Delete this payment">
                  Delete
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p>No one-time payments recorded for this loan.</p>
    {/if}
  </div>
</div>

<style>
  .loan-updates-panel {
    background: var(--color-bg-1, #f8f9fa);
    border-radius: 8px;
    padding: 1.5rem;
    margin: 1rem 0;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border, #ddd);
  }

  h3 {
    margin: 0;
    color: var(--color-text, #333);
    font-size: 1.25rem;
    font-weight: 600;
  }

  .btn-add-update {
    background-color: var(--color-secondary, #7ed321);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .btn-add-update:hover:not(:disabled) {
    background-color: #6bb91a;
  }

  .btn-add-update:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .form-section {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--color-bg-0, #ffffff);
    border-radius: 6px;
    border: 1px solid var(--color-border, #ddd);
  }

  .updates-table {
    width: 100%;
    border-collapse: collapse;
  }

  .updates-table th {
    background-color: var(--color-bg-2, #e9ecef);
    color: var(--color-text, #333);
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid var(--color-border, #ddd);
  }
</style>
