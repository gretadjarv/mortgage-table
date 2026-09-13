<script>
  import { page } from '$app/stores';
  import { currentUser, authService } from '$lib/stores/loanStore';

  const routes = [
    { href: '/loanCalculator', label: 'Loan Calculator' },
    { href: '/loanCalculator/admin', label: 'Manage Loans' },
    { href: '/loanCalculator/setup', label: 'Setup' }
  ];
  $: currentPathValue = $page.url.pathname;

  async function signOut() {
    await authService.signOut();
  }
</script>

<header>
  <nav>
    <a class="brand" href="/loanCalculator">My Economy</a>
    <div class="links">
      {#each routes as link}
        <a class:active={currentPathValue === link.href} href={link.href}>{link.label}</a>
      {/each}
      {#if $currentUser}
        <button on:click={signOut}>Sign out</button>
      {/if}
    </div>
  </nav>
</header>

<style>
  header { background:var(--color-bg-1); padding:15px 24px; border-bottom:1px solid var(--color-border,#ddd); }
  nav { max-width:1100px; margin:auto; display:flex; align-items:center; justify-content:space-between; gap:20px; }
  .brand { font-size:18px; font-weight:800; color:var(--color-text); text-decoration:none; }
  .links { display:flex; align-items:center; gap:18px; flex-wrap:wrap; }
  a { text-decoration:none; color:var(--color-text); font-weight:600; }
  a:hover,.active { color:var(--color-primary); }
  button { border:0; background:transparent; color:var(--color-text-muted,#666); font-weight:600; cursor:pointer; }
  @media(max-width:650px){ nav{flex-direction:column;align-items:flex-start}.links{gap:12px} }
</style>
