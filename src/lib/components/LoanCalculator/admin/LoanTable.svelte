<script>
  import { loanList, loading } from '$lib/stores/loanStore';
  import LoanTableContent from './LoanTableContent.svelte';
</script>

<section class="loan-table-section">
  <h2>Your Loans</h2>

  {#if $loading}
    <div class="loading-state">
      <p>Loading loans...</p>
    </div>
  {:else if $loanList.length > 0}
    <LoanTableContent />
  {:else}
    <div class="empty-state">
      <p>No loans found. Create your first loan using the form above.</p>
    </div>
  {/if}
</section>

<style>
  .loan-table-section {
    background: var(--color-bg-0, #ffffff);
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    margin-bottom: 1.5rem;
  }

  h2 {
    color: var(--color-primary, #4a90e2);
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
  }

  .loading-state,
  .empty-state {
    text-align: center;
    padding: 2rem;
    color: var(--color-text-muted, #666);
  }

  .loading-state p,
  .empty-state p {
    margin: 0;
    font-size: 1rem;
  }
</style>
