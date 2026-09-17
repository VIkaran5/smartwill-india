/* Compatibility Bridge Module for Step Validation
 * Re-exports legacy validateCurrentStep delegating to pure guards engine */
import { getWizardState } from './stateAdapter.js';
import { validateStepGuard } from './guards.js';
import { WizardController } from './controller.js';

export function validateCurrentStep() {
  const wizardState = getWizardState();
  const result = validateStepGuard(wizardState.uiState.currentStep, wizardState.domainState);
  if (!result.ok) {
    WizardController.handleGuardError(result);
    return false;
  }
  return true;
}
