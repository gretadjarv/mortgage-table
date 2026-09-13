<script>
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { derived } from 'svelte/store';

  const loanCalculatorSubpages = [
    { href: `${base}/loanCalculator`, label: 'Home' },
    { href: `${base}/loanCalculator/admin`, label: 'Admin' },
    { href: `${base}/loanCalculator/setup`, label: 'Setup' },
  ];

  const routes = [
    { href: `${base}/`, label: 'Overview', subpages: [] },
    { href: `${base}/loanCalculator`, label: 'Loan Calculator', subpages: loanCalculatorSubpages },
    { href: `${base}/budget`, label: 'Budget', subpages: [] },
  ];

  // Derived store for current path
  const currentPath = derived(page, ($page) => $page.url.pathname);

  // Reactive values based on currentPath
  let activeParentRoute;
  let hasSubpages;
  let subpagesToShow;

  // Let’s create a reactive `isMainRouteActive` map
  let activeMap = new Map();

  $: currentPathValue = $page.url.pathname;

  $: {
    // Determine the active parent route
    activeParentRoute = routes.find((route) => {
      if (currentPathValue === route.href) return true;
      return route.href !== '/' && currentPathValue.startsWith(route.href + '/');
    });

    hasSubpages = activeParentRoute && activeParentRoute.subpages.length > 0;
    subpagesToShow = hasSubpages ? activeParentRoute.subpages : [];

    // Update activeMap
    activeMap = new Map();

    // Check if any subpage is active
    const isAnySubpageActive = routes.some((route) =>
      route.subpages?.some((sub) => currentPathValue === sub.href),
    );

    for (const route of routes) {
      let active = false;
      if (!isAnySubpageActive) {
        if (route.href === '/') {
          active = currentPathValue === '/';
        } else if (!route.subpages?.length) {
          active = currentPathValue === route.href;
        } else if (currentPathValue === route.href) {
          active = true;
        }
      }
      activeMap.set(route.href, active);
    }
  }
</script>

<header>
  <nav>
    <ul>
      {#each routes as link}
        <li aria-current={activeMap.get(link.href) ? 'page' : undefined}>
          <a href={link.href}>{link.label}</a>
        </li>
      {/each}
    </ul>
  </nav>

  {#if hasSubpages}
    <nav class="sub-nav">
      <ul>
        {#each subpagesToShow as subpage}
          <li aria-current={$page.url.pathname === subpage.href ? 'page' : undefined}>
            <a href={subpage.href}>{subpage.label}</a>
          </li>
        {/each}
      </ul>
    </nav>
  {/if}
</header>

<style lang="scss">
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  header {
    background-color: var(--color-bg-1);
    padding: 15px;
  }

  nav {
    display: flex;
    justify-content: center;
  }

  ul {
    list-style: none;
    display: flex;
    gap: 20px;
  }

  li {
    position: relative;
  }

  a {
    text-decoration: none;
    color: var(--color-text);
    font-weight: 600;
    font-size: 16px;
    transition:
      color 0.3s ease,
      border-bottom 0.3s ease;

    &:hover {
      color: var(--color-primary);
    }
  }

  li[aria-current='page'] > a {
    color: var(--color-primary);
  }

  li[aria-current='page'] > a {
    position: relative;
  }
</style>
