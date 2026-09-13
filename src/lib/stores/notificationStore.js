import { writable } from "svelte/store";

const MAX_VISIBLE = 5;

let nextId = 0;
const notifications = writable([]);

/**
 * Show a notification
 * @param {string} message - Notification message
 * @param {'success'|'error'|'warning'|'info'} type - Notification type
 */
function showNotification(message, type = "info") {
  const id = nextId++;
  const notification = { id, message, type };

  notifications.update((list) => {
    const updated = [...list, notification];
    return updated.slice(-MAX_VISIBLE); // Keep only the last MAX_VISIBLE
  });

  // Auto-remove after 5 seconds
  setTimeout(() => {
    notifications.update((list) => list.filter((n) => n.id !== id));
  }, 5000);
}

function dismissNotification(id) {
  notifications.update((list) => list.filter((n) => n.id !== id));
}

export { dismissNotification, notifications, showNotification };
