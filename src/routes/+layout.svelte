<script>
  import Header from '$lib/components/Header.svelte';
  import Notification from '$lib/components/Notification.svelte';
  import '../app.css';
</script>
<div class="app"><Header /><Notification /><main><slot /></main></div>
<style>.app{min-height:100vh}main{width:100%}</style>
