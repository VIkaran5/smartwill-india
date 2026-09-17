/* Wizard Controller Module for SmartWill India
 * Orchestrates user navigation actions, invokes pure FSM evaluation,
 * translates guard error codes into localized UI toasts, and updates state. */
import { getWizardState, updateWizardUiState } from './stateAdapter.js';
import { evaluateTransition, TRANSITION_EVENTS } from './fsm.js';
import { GUARD_ERROR_CODES } from './guards.js';
import { showToast } from '../ui/toast.js';
import { t } from '../i18n/index.js';
import { renderAllocations } from '../render/allocations.js';
import { renderSummary } from '../render/summary.js';

export class WizardController {
  static next() {
    return this.handleTransition(TRANSITION_EVENTS.NEXT);
  }

  static prev() {
    return this.handleTransition(TRANSITION_EVENTS.PREVIOUS);
  }

  static goToStep(targetStep) {
    return this.handleTransition(TRANSITION_EVENTS.GO_TO_STEP, { step: targetStep });
  }

  static restoreDraft(step) {
    return this.handleTransition(TRANSITION_EVENTS.RESTORE_DRAFT, { step });
  }

  static reset() {
    return this.handleTransition(TRANSITION_EVENTS.RESET);
  }

  static handleTransition(eventType, payload = {}) {
    const wizardState = getWizardState();
    const currentStepNum = wizardState.uiState.currentStep;
    const domainState = wizardState.domainState;

    const result = evaluateTransition(eventType, currentStepNum, domainState, payload);

    if (!result.allowed) {
      if (result.error) {
        this.handleGuardError(result.error);
      }
      return false;
    }

    const targetStep = result.nextStepNumber;

    // Trigger child list rendering before view transition if entering specific steps
    if (targetStep === 4 && typeof renderAllocations === 'function') {
      try { renderAllocations(); } catch (e) { console.error('Error rendering allocations:', e); }
    }
    if (targetStep === 5 && typeof renderSummary === 'function') {
      try { renderSummary(); } catch (e) { console.error('Error rendering summary:', e); }
    }

    // Persist UI step update
    updateWizardUiState({ currentStep: targetStep });

    // Smooth scroll to top of wizard on transition
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return true;
  }

  static handleGuardError(error) {
    const { code, field, meta } = error;

    let message = t('toast.mandatoryFields');

    switch (code) {
      case GUARD_ERROR_CODES.MANDATORY_FIELDS_MISSING:
        message = t('toast.mandatoryFields');
        break;
      case GUARD_ERROR_CODES.INVALID_PHONE:
        message = t('toast.invalidPhone');
        break;
      case GUARD_ERROR_CODES.INVALID_EMAIL:
        message = t('toast.invalidEmail');
        break;
      case GUARD_ERROR_CODES.EMAIL_TYPO_WARNING:
        message = `${t('toast.emailTypo')} ${meta ? meta.suggestion : ''}`;
        break;
      case GUARD_ERROR_CODES.INVALID_GOVT_ID_FORMAT:
        if (meta && meta.idType === 'Aadhaar Card') message = t('toast.aadhaarFormat');
        else if (meta && meta.idType === 'PAN Card') message = t('toast.panFormat');
        else if (meta && meta.idType === 'Passport') message = t('toast.passportFormat');
        else if (meta && meta.idType === 'Voter ID') message = t('toast.voterFormat');
        else message = t('toast.govtIdFormat');
        break;
      case GUARD_ERROR_CODES.BENEFICIARY_REQUIRED:
        message = t('toast.beneficiaryRequired') || 'Please add at least one beneficiary before proceeding.';
        break;
      case GUARD_ERROR_CODES.ASSET_REQUIRED:
        message = t('toast.assetRequired') || 'Please add at least one asset before proceeding.';
        break;
      case GUARD_ERROR_CODES.ALLOCATION_INCOMPLETE:
        message = `${t('toast.allocationError')} "${meta ? meta.assetType : 'Asset'}": ${meta ? meta.totalPercentage : 0}%. ${t('toast.allocationMustBe100')}`;
        break;
      case GUARD_ERROR_CODES.DECLARATION_REQUIRED:
        message = t('toast.confirmDeclaration');
        break;
    }

    showToast('warning', message, '');

    // Focus / highlight offending field if specified
    if (field && typeof document !== 'undefined') {
      const el = document.getElementById(field);
      if (el) {
        el.focus();
        el.classList.add('input-error-highlight');
        setTimeout(() => el.classList.remove('input-error-highlight'), 3000);
      }
    }
  }
}
