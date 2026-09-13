<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  export let editingAdjustment = null;
  export let isSubmitting = false;

  let formData = { balance: '', adjustmentDate: '', note: '' };
  $: if (editingAdjustment) formData = { balance: editingAdjustment.balance, adjustmentDate: editingAdjustment.adjustment_date, note: editingAdjustment.note || '' };
  $: if (!editingAdjustment && !formData.adjustmentDate) formData.adjustmentDate = new Date().toISOString().slice(0, 10);

  function submit() {
    if (isSubmitting) return;
    dispatch('submit', { adjustmentData: formData, adjustmentId: editingAdjustment?.id });
  }
  function cancel() { dispatch('cancel'); }
</script>

<div class="balance-form">
  <h4>{editingAdjustment ? 'Edit Historical Balance' : 'Set Balance at a Specific Date'}</h4>
  <p class="help">Use this when the actual loan balance changed because of a transfer, refinancing, a bank correction, or another event. The amount is the <strong>new absolute balance</strong>, not an extra payment.</p>
  <form on:submit|preventDefault={submit}>
    <div class="form-row">
      <label>Actual balance (SEK)<input type="number" min="0" step="0.01" bind:value={formData.balance} required disabled={isSubmitting} /></label>
      <label>Effective date<input type="date" bind:value={formData.adjustmentDate} required disabled={isSubmitting} /></label>
      <label>Note (optional)<input type="text" bind:value={formData.note} placeholder="e.g. Loan moved to new bank" disabled={isSubmitting} /></label>
    </div>
    <div class="actions">
      <button class="primary" type="submit" disabled={isSubmitting}>{editingAdjustment ? 'Save Balance' : 'Set Balance'}</button>
      {#if editingAdjustment}<button type="button" on:click={cancel} disabled={isSubmitting}>Cancel</button>{/if}
    </div>
  </form>
</div>

<style>
  .balance-form { padding: 1rem; border: 1px solid var(--color-border, #ddd); border-radius: 6px; background: #fff; }
  h4 { margin: 0 0 .5rem; }
  .help { font-size: .9rem; color: #666; margin-bottom: 1rem; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr 1.4fr; gap: 1rem; }
  label { display:flex; flex-direction:column; gap:.4rem; font-weight:600; font-size:.85rem; }
  input { width:100%; padding:.6rem; box-sizing:border-box; border:1px solid #ccc; border-radius:4px; font:inherit; }
  .actions { display:flex; justify-content:flex-end; gap:.75rem; margin-top:1rem; }
  button { padding:.6rem 1rem; border:0; border-radius:4px; cursor:pointer; }
  .primary { background:var(--color-primary); color:#fff; }
  @media(max-width:768px){ .form-row { grid-template-columns:1fr; } .actions { flex-direction:column; } }
</style>
