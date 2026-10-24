/* Analytics Service for SmartWill India
 * Encapsulates Google Analytics 4 (GA4) event dispatching with safety guards.
 * Enables funnel tracking across:
 * 1. Landing CTA clicks (click_create_will_cta)
 * 2. Wizard Start (start_will_wizard)
 * 3. Step Progression & Drop-offs (step_personal_completed, step_assets_completed, etc.)
 * 4. Draft Document Preview (draft_preview_opened)
 * 5. Payment Checkout (begin_checkout)
 * 6. Payment Success (purchase)
 */

export const GA_MEASUREMENT_ID = 'G-HGQ9XHMEWH';

export const FUNNEL_STEPS = {
  1: 'personal',
  2: 'assets',
  3: 'family',
  4: 'allocation',
  5: 'review',
  6: 'checkout'
};

/**
 * Safe wrapper around window.gtag.
 * Silently catches errors and handles environments without gtag.
 */
export function trackEvent(eventName, params = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, {
        send_to: GA_MEASUREMENT_ID,
        ...params
      });
    }
  } catch (err) {
    // Silently ignore to guarantee analytics never impacts user functionality
  }
}

/**
 * Tracks CTA clicks on the landing page
 */
export function trackLandingCtaClick(ctaText, location) {
  trackEvent('click_create_will_cta', {
    cta_text: ctaText || 'Create Will',
    cta_location: location || 'landing',
    destination: '/app'
  });
}

/**
 * Tracks when a user opens and initializes the Will creation wizard
 */
export function trackWizardStart() {
  trackEvent('start_will_wizard', {
    step_number: 1,
    step_name: 'personal'
  });
}

/**
 * Tracks when a user completes a wizard step and advances to the next step
 */
export function trackStepCompleted(stepNumber, meta = {}) {
  const stepName = FUNNEL_STEPS[stepNumber] || `step_${stepNumber}`;
  trackEvent(`step_${stepName}_completed`, {
    step_number: stepNumber,
    step_name: stepName,
    ...meta
  });
}

/**
 * Tracks when a user views a specific step in the wizard
 */
export function trackStepViewed(stepNumber) {
  const stepName = FUNNEL_STEPS[stepNumber] || `step_${stepNumber}`;
  trackEvent(`step_${stepName}_viewed`, {
    step_number: stepNumber,
    step_name: stepName
  });
}

/**
 * Tracks when a user opens the Draft Will Document preview modal
 */
export function trackDraftPreviewOpened(lang = 'en') {
  trackEvent('draft_preview_opened', {
    draft_lang: lang
  });
}

/**
 * Tracks when a user initiates the payment checkout process
 */
export function trackBeginCheckout(amount = 299) {
  trackEvent('begin_checkout', {
    value: amount,
    currency: 'INR',
    items: [{
      item_id: 'smartwill_legal_draft',
      item_name: 'SmartWill Legal Will Document',
      price: amount,
      quantity: 1
    }]
  });
}
