<script>
  import { notifications, dismissNotification } from '$lib/stores/notificationStore.js';
  import { fly } from 'svelte/transition';
</script>

<div class="notification-container">
  {#each $notifications as notification (notification.id)}
    <div
      class="notification notification-{notification.type}"
      role="alert"
      in:fly={{ x: 100, duration: 300 }}
      out:fly={{ x: 100, duration: 300 }}>
      <span class="notification-message">{notification.message}</span>
      <button
        class="notification-close"
        on:click={() => dismissNotification(notification.id)}
        aria-label="Close notification">
        ×
      </button>
    </div>
  {/each}
</div>

<style lang="scss">
  .notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 1000;
    max-width: 400px;

    @media (max-width: 768px) {
      right: 10px;
      left: 10px;
      max-width: none;
    }
  }

  .notification {
    padding: 1rem 1.5rem;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 1rem;

    .notification-message {
      flex: 1;
      font-weight: 500;
    }

    .notification-close {
      background: none;
      border: none;
      color: inherit;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
    }
  }

  .notification-success {
    background-color: var(--color-success);
    color: white;
  }

  .notification-error {
    background-color: var(--color-error);
    color: white;
  }

  .notification-warning {
    background-color: var(--color-warning);
    color: var(--color-text);
  }

  .notification-info {
    background-color: var(--color-info);
    color: white;
  }
</style>
