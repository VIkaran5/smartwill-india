/* Toast Notification UI Module for SmartWill India */

export function showToast(type, title, message) {
  const toast = document.getElementById('toastNotification');
  const toastIcon = document.getElementById('toastIcon');
  const toastTitle = document.getElementById('toastTitle');
  const toastMessage = document.getElementById('toastMessage');

  if (!toast) return;

  const icons = {
    loading: '⏳',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };
  if (toastIcon) toastIcon.textContent = icons[type] || '📧';
  
  toast.className = `toast-notification toast-${type}`;
  
  // Accessibility: Announce toast to screen readers
  toast.setAttribute('role', type === 'error' || type === 'warning' ? 'alert' : 'status');
  toast.setAttribute('aria-live', type === 'error' || type === 'warning' ? 'assertive' : 'polite');

  if (toastTitle) toastTitle.textContent = title;
  if (toastMessage) toastMessage.textContent = message;

  toast.classList.remove('hidden');
  toast.classList.add('toast-show');

  if (type !== 'loading') {
    setTimeout(() => hideToast(), 6000);
  }
}

export function hideToast() {
  const toast = document.getElementById('toastNotification');
  if (toast) {
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');
    setTimeout(() => {
      toast.classList.add('hidden');
      toast.classList.remove('toast-hide');
    }, 400);
  }
}

// Temporary compatibility bindings for legacy non-module scripts
if (typeof window !== 'undefined') {
  window.showToast = showToast;
  window.hideToast = hideToast;
}

