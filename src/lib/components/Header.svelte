<script>
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { derived } from 'svelte/store';

  const loanCalculatorSubpages = [
    { href: `${base}/loanCalculator`, label: 'Dashboard' },
    { href: `${base}/loanCalculator/admin`, label: 'Manage loans' }
  ];
  const routes = [
    { href: `${base}/`, label: 'Overview', subpages: [] },
    { href: `${base}/loanCalculator`, label: 'Mortgage', subpages: loanCalculatorSubpages }
  ];
  const currentPath = derived(page, ($page) => $page.url.pathname);
  let activeParentRoute, hasSubpages, subpagesToShow;
  $: currentPathValue = $page.url.pathname;
  $: {
    activeParentRoute = routes.find((route) => currentPathValue === route.href || (route.href !== `${base}/` && currentPathValue.startsWith(route.href + '/')));
    hasSubpages = activeParentRoute && activeParentRoute.subpages.length > 0;
    subpagesToShow = hasSubpages ? activeParentRoute.subpages : [];
  }
</script>
<header>
  <div class="nav-inner">
    <a class="brand" href={`${base}/`}>Mortgage Table</a>
    <nav><ul>{#each routes as link}<li aria-current={currentPathValue === link.href ? 'page' : undefined}><a href={link.href}>{link.label}</a></li>{/each}</ul></nav>
  </div>
  {#if hasSubpages}<nav class="sub-nav"><ul>{#each subpagesToShow as subpage}<li aria-current={currentPathValue === subpage.href ? 'page' : undefined}><a href={subpage.href}>{subpage.label}</a></li>{/each}</ul></nav>{/if}
</header>
<style>
header{background:#fff;border-bottom:1px solid #e7eaf0}.nav-inner{max-width:1180px;margin:auto;padding:.9rem 1.5rem;display:flex;align-items:center;justify-content:space-between;gap:2rem}.brand{font-weight:850;color:#172033;text-decoration:none;letter-spacing:-.02em}.nav-inner ul,.sub-nav ul{list-style:none;display:flex;gap:1.35rem;margin:0;padding:0}.nav-inner a,.sub-nav a{color:#64748b;text-decoration:none;font-size:.88rem;font-weight:700}.nav-inner li[aria-current=page] a,.sub-nav li[aria-current=page] a{color:#172033}.sub-nav{background:#fafbfc;border-top:1px solid #f0f2f5;padding:.65rem 1.5rem;display:flex;justify-content:center}.sub-nav a{font-size:.8rem}@media(max-width:600px){.nav-inner{padding:.8rem 1rem}.nav-inner nav{display:none}.sub-nav{justify-content:flex-start;padding:.65rem 1rem;overflow-x:auto}}
</style>
