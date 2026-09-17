/* Compatibility Bridge Module for Stepper Progression
 * Re-exports legacy functions delegating to WizardController and WizardRenderer */
import { WizardController } from './controller.js';
import { renderWizardView } from './renderer.js';
import { getWizardState } from './stateAdapter.js';

export function updateStepper() {
  renderWizardView(getWizardState());
}

export function goToStep(targetStep) {
  return WizardController.goToStep(targetStep);
}

export function nextStep() {
  return WizardController.next();
}

export function previousStep() {
  return WizardController.prev();
}
