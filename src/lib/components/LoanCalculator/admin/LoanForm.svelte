<script>
  import { editingLoan, isSubmittingForm, loanActions } from '$lib/stores/loanStore';

  let formData = {
    startAmount: '',
    interestRate: '',
    monthlyPayment: '',
    startDate: '',
  };

  // Populate form when editing
  $: if ($editingLoan) {
    formData = {
      startAmount: $editingLoan.start_sum,
      interestRate: $editingLoan.interest_rate,
      monthlyPayment: $editingLoan.amortization,
      startDate: $editingLoan.start_date,
    };
  }

  async function handleSubmit() {
    if ($isSubmittingForm) return;

    await loanActions.submitLoan(formData, $editingLoan?.id);

    // Reset form if creating (not editing)
    if (!$editingLoan) {
      resetForm();
    }
  }

  function handleCancel() {
    resetForm();
    loanActions.cancelEdit();
  }

  function resetForm() {
    formData = {
      startAmount: '',
      interestRate: '',
      monthlyPayment: '',
      startDate: '',
    };
  }

  // Reset form when editingLoan becomes null
  $: if (!$editingLoan) {
    resetForm();
  }
</script>

<section class="loan-form">
  <h2>{$editingLoan ? 'Edit Loan' : 'Create New Loan'}</h2>

  <form on:submit|preventDefault={handleSubmit}>
    <div class="form-group">
      <label for="startAmount">Initial Loan Amount:</label>
      <input
        type="number"
        id="startAmount"
        bind:value={formData.startAmount}
        required
        min="0"
        step="0.01"
        disabled={$isSubmittingForm} />
    </div>

    <div class="form-group">
      <label for="interestRate">Annual Interest Rate (%):</label>
      <input
        type="number"
        id="interestRate"
        bind:value={formData.interestRate}
        required
        min="0"
        max="100"
        step="0.01"
        disabled={$isSubmittingForm} />
    </div>

    <div class="form-group">
      <label for="monthlyPayment">Monthly Payment:</label>
      <input
        type="number"
        id="monthlyPayment"
        bind:value={formData.monthlyPayment}
        required
        min="0"
        step="0.01"
        disabled={$isSubmittingForm} />
    </div>

    <div class="form-group">
      <label for="startDate">Loan Start Date:</label>
      <input
        type="date"
        id="startDate"
        bind:value={formData.startDate}
        required
        disabled={$isSubmittingForm} />
    </div>

    <div class="form-actions">
      <button type="submit" disabled={$isSubmittingForm} class="btn-primary">
        {$isSubmittingForm ? 'Saving...' : $editingLoan ? 'Update Loan' : 'Create Loan'}
      </button>

      {#if $editingLoan}
        <button
          type="button"
          on:click={handleCancel}
          disabled={$isSubmittingForm}
          class="btn-secondary">
          Cancel
        </button>
      {/if}
    </div>
  </form>
</section>

<style>
  .loan-form {
    background: var(--color-bg-0, #ffffff);
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    margin-bottom: 1.5rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: var(--color-text, #333);
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border, #ddd);
    border-radius: 4px;
    box-sizing: border-box;
    font-size: 1rem;
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

  .form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .btn-primary,
  .btn-secondary {
    padding: 0.75rem 1.5rem;
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

  h2 {
    color: var(--color-primary, #4a90e2);
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
  }
</style>
