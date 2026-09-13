<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let editingUpdate = null;
  export let isSubmitting = false;

  let formData = {
    updatedPayment: '',
    updatedRate: '',
    updateDate: '',
  };

  // Populate form when editing
  $: if (editingUpdate) {
    formData = {
      updatedPayment: editingUpdate.updated_amortization,
      updatedRate: editingUpdate.updated_interest_rate,
      updateDate: editingUpdate.update_date,
    };
  }

  // Set default date to today when creating new update
  $: if (!editingUpdate && !formData.updateDate) {
    const today = new Date();
    formData.updateDate = today.toISOString().split('T')[0];
  }

  function handleSubmit() {
    if (isSubmitting) return;

    const submitData = {
      updateData: formData,
    };

    if (editingUpdate) {
      submitData.updateId = editingUpdate.id;
    }

    dispatch('submit', submitData);
  }

  function handleCancel() {
    resetForm();
    dispatch('cancel');
  }

  function resetForm() {
    formData = {
      updatedPayment: '',
      updatedRate: '',
      updateDate: '',
    };
  }

  // Reset form when editingUpdate becomes null
  $: if (!editingUpdate) {
    resetForm();
  }

  let oneTimeAmount = '';
  let oneTimeDate = new Date().toISOString().split('T')[0];

  function handleOneTimeSubmit() {
    if (!oneTimeAmount || !oneTimeDate) return;

    dispatch('submitOneTimePayment', {
      amount: parseFloat(oneTimeAmount),
      payment_date: oneTimeDate,
    });

    oneTimeAmount = '';
    oneTimeDate = new Date().toISOString().split('T')[0];
  }
</script>

<div class="loan-update-form">
  <h4>{editingUpdate ? 'Edit Payment Update' : 'Add Payment Update'}</h4>

  <form on:submit|preventDefault={handleSubmit}>
    <div class="form-row">
      <div class="form-group">
        <label for="updatedPayment">New Monthly Payment:</label>
        <input
          type="number"
          id="updatedPayment"
          bind:value={formData.updatedPayment}
          required
          min="0"
          step="0.01"
          disabled={isSubmitting}
          placeholder="Enter new payment amount" />
      </div>

      <div class="form-group">
        <label for="updatedRate">New Interest Rate (%):</label>
        <input
          type="number"
          id="updatedRate"
          bind:value={formData.updatedRate}
          required
          min="0"
          max="100"
          step="0.01"
          disabled={isSubmitting}
          placeholder="Enter new interest rate" />
      </div>

      <div class="form-group">
        <label for="updateDate">Effective Date:</label>
        <input
          type="date"
          id="updateDate"
          bind:value={formData.updateDate}
          required
          disabled={isSubmitting} />
      </div>
    </div>

    <div class="form-actions">
      <button type="submit" disabled={isSubmitting} class="btn-primary">
        {isSubmitting ? 'Saving...' : editingUpdate ? 'Update' : 'Add Update'}
      </button>

      <button type="button" on:click={handleCancel} disabled={isSubmitting} class="btn-secondary">
        Cancel
      </button>
    </div>
  </form>
</div>

<hr style="margin: 2rem 0; border: none; border-top: 1px solid var(--color-border, #ddd);" />

<h4>Add One-Time Payment</h4>

<form on:submit|preventDefault={handleOneTimeSubmit}>
  <div class="form-row">
    <div class="form-group">
      <label for="oneTimeAmount">Payment Amount:</label>
      <input
        type="number"
        id="oneTimeAmount"
        bind:value={oneTimeAmount}
        required
        min="0"
        step="0.01"
        placeholder="Enter one-time payment"
        disabled={isSubmitting} />
    </div>

    <div class="form-group">
      <label for="oneTimeDate">Payment Date:</label>
      <input
        type="date"
        id="oneTimeDate"
        bind:value={oneTimeDate}
        required
        disabled={isSubmitting} />
    </div>
  </div>

  <div class="form-actions">
    <button type="submit" disabled={isSubmitting} class="btn-primary">
      {isSubmitting ? 'Saving...' : 'Add One-Time Payment'}
    </button>
  </div>
</form>

<style>
  .loan-update-form {
    background: var(--color-bg-0, #ffffff);
    border-radius: 6px;
    padding: 1rem;
    border: 1px solid var(--color-border, #ddd);
  }

  h4 {
    margin: 0 0 1rem 0;
    color: var(--color-text, #333);
    font-size: 1.1rem;
    font-weight: 600;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  label {
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--color-text, #333);
    font-size: 0.875rem;
  }

  input {
    padding: 0.5rem;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 4px;
    font-size: 0.875rem;
    transition: border-color 0.2s ease;
  }

  input:focus {
    outline: none;
    border-color: var(--color-primary, #4a90e2);
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
  }

  input:disabled {
    background-color: var(--color-bg-2, #f5f5f5);
    opacity: 0.6;
  }

  input::placeholder {
    color: var(--color-text-muted, #999);
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border, #eee);
  }

  .btn-primary,
  .btn-secondary {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .btn-primary {
    background-color: var(--color-primary, #4a90e2);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: var(--color-primary-dark, #357abd);
  }

  .btn-secondary {
    background-color: var(--color-bg-2, #e1e1e1);
    color: var(--color-text, #333);
  }

  .btn-secondary:hover:not(:disabled) {
    background-color: var(--color-bg-1, #d4d4d4);
  }

  .btn-primary:disabled,
  .btn-secondary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .form-row {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .form-actions {
      flex-direction: column;
    }

    .btn-primary,
    .btn-secondary {
      width: 100%;
    }
  }

  @media (max-width: 480px) {
    .loan-update-form {
      padding: 0.75rem;
    }
  }
</style>
