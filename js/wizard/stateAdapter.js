/* State Adapter Layer for SmartWill Wizard Architecture
 * Adapts existing store schema to present clean domainState and uiState interfaces
 * without modifying the underlying store structure or breaking Cloud Sync / Storage. */
import { getState, updateState, resetState as resetStore } from '../state/store.js';

export function getWizardState() {
  const rawState = getState();
  return {
    domainState: {
      testator: rawState.personal || {},
      personal: rawState.personal || {},
      beneficiaries: rawState.beneficiaries || [],
      assets: rawState.assets || [],
      executor: rawState.executor || {},
      declarationAccepted: Boolean(rawState.declarationAccepted)
    },
    uiState: {
      currentStep: rawState.currentStep || 1,
      currentStepName: getStepNameFromNumber(rawState.currentStep || 1),
      isSaving: Boolean(rawState.isSaving),
      isSyncing: Boolean(rawState.isSyncing),
      errors: rawState.errors || {}
    }
  };
}

export function updateWizardUiState(uiPatch, isRemoteUpdate = false) {
  const patch = {};
  if (uiPatch.currentStep !== undefined) {
    patch.currentStep = uiPatch.currentStep;
  }
  if (uiPatch.errors !== undefined) {
    patch.errors = uiPatch.errors;
  }
  return updateState(patch, isRemoteUpdate);
}

export function updateWizardDomainState(domainPatch, isRemoteUpdate = false) {
  return updateState(domainPatch, isRemoteUpdate);
}

export function subscribeWizardState(callback) {
  if (typeof window === 'undefined') return () => {};

  const listener = (event) => {
    callback(getWizardState(), event.detail ? event.detail.isRemoteUpdate : false);
  };

  window.addEventListener('smartwill_state_change', listener);
  return () => {
    window.removeEventListener('smartwill_state_change', listener);
  };
}

export function resetWizardState(isRemoteUpdate = false) {
  return resetStore(isRemoteUpdate);
}

function getStepNameFromNumber(num) {
  const stepMap = {
    1: 'PERSONAL',
    2: 'ASSETS',
    3: 'BENEFICIARIES',
    4: 'ALLOCATION',
    5: 'EXECUTOR',
    6: 'PAYMENT'
  };
  return stepMap[num] || 'PERSONAL';
}
