/* Centralized Error & Event Logger Service for SmartWill India */

export const logger = {
  info(message, context = {}) {
    console.info(`[SmartWill INFO]: ${message}`, context);
  },

  debug(message, context = {}) {
    console.debug(`[SmartWill DEBUG]: ${message}`, context);
  },

  warn(message, context = {}) {
    console.warn(`[SmartWill WARN]: ${message}`, context);
  },

  /**
   * Logs an error. Only shows a user-facing toast if `showUserToast` is true.
   * Background/non-critical errors should pass showUserToast=false to avoid
   * flooding the user with irrelevant error notifications.
   */
  error(message, error = null, { showUserToast = false, ...context } = {}) {
    console.error(`[SmartWill ERROR]: ${message}`, error || '', context);

    if (showUserToast) {
      // Lazy import to avoid circular dependency: logger -> toast -> logger
      import('../ui/toast.js').then(({ showToast }) => {
        showToast('error', 'Error Occurred', message);
      }).catch(() => {
        // Toast module unavailable — silent fallback
      });
    }

    // Hook for Sentry or monitoring service integration
    if (window.Sentry && typeof window.Sentry.captureException === 'function') {
      window.Sentry.captureException(error || new Error(message), { extra: context });
    }
  }
};
