/* History & Hardware Back Button Integration Module
 * Integrates HTML5 History API (replaceState/pushState/popstate)
 * and Capacitor Android Native backButton event with WizardController. */
import { getWizardState, subscribeWizardState } from './stateAdapter.js';
import { WizardController } from './controller.js';

let isInternalNavigation = false;

export function initWizardHistory() {
  if (typeof window === 'undefined') return;

  const initialState = getWizardState();
  const currentStep = initialState.uiState.currentStep || 1;

  // Initialize history entry with replaceState
  if (window.history && window.history.replaceState) {
    window.history.replaceState({ step: currentStep }, `Step ${currentStep}`, `#step${currentStep}`);
  }

  // Listen to state changes to push history entries
  subscribeWizardState((wizardState) => {
    if (isInternalNavigation) return;
    const step = wizardState.uiState.currentStep || 1;
    if (window.history && window.history.pushState) {
      if (!window.history.state || window.history.state.step !== step) {
        window.history.pushState({ step }, `Step ${step}`, `#step${step}`);
      }
    }
  });

  // Intercept Browser Back / Forward buttons (popstate)
  window.addEventListener('popstate', (event) => {
    if (event.state && typeof event.state.step === 'number') {
      const targetStep = event.state.step;
      const currentStep = getWizardState().uiState.currentStep;

      isInternalNavigation = true;
      if (targetStep < currentStep) {
        WizardController.goToStep(targetStep);
      } else if (targetStep > currentStep) {
        WizardController.goToStep(targetStep);
      }
      isInternalNavigation = false;
    }
  });

  // Intercept Capacitor Android Hardware Back Button
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
    try {
      window.Capacitor.Plugins.App.addListener('backButton', (data) => {
        const currentStep = getWizardState().uiState.currentStep;
        if (currentStep > 1) {
          WizardController.prev();
        } else {
          // If on step 1, minimize app / standard back behavior
          if (data && data.canGoBack) {
            window.history.back();
          }
        }
      });
    } catch (e) {
      console.warn('[Capacitor BackButton Warning] Native back button listener not bound:', e);
    }
  }
}
