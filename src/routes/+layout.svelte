<script>
  import Header from '$lib/components/Header.svelte';
  import Notification from '$lib/components/Notification.svelte';
  import '../app.css';
</script>

<div class="app">
  <Header />
  <Notification />
  <main>
    <slot />
  </main>
</div>

<style lang="scss">
  .app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 64rem;
    margin: 0 auto;
    box-sizing: border-box;
    background-color: white;
    padding: 1.5rem;
    border-radius: 1rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    margin-bottom: 1rem;
  }
</style>
