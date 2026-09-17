import { describe, it, expect, beforeEach } from 'vitest';
import {
  getWizardState,
  updateWizardUiState,
  updateWizardDomainState,
  subscribeWizardState,
  resetWizardState
} from '../../js/wizard/stateAdapter.js';
import { WizardController } from '../../js/wizard/controller.js';
import { validateStepGuard } from '../../js/wizard/guards.js';

describe('State Adapter Layer (js/wizard/stateAdapter.js)', () => {
  beforeEach(() => {
    resetWizardState();
  });

  it('should adapt raw store state into clean domainState and uiState', () => {
    const wizardState = getWizardState();
    expect(wizardState.domainState).toBeDefined();
    expect(wizardState.uiState).toBeDefined();
    expect(wizardState.uiState.currentStep).toBe(1);
    expect(wizardState.uiState.currentStepName).toBe('PERSONAL');
  });

  it('should update uiState without altering domain objects', () => {
    updateWizardUiState({ currentStep: 3, errors: { phone: 'Invalid' } });
    const wizardState = getWizardState();
    expect(wizardState.uiState.currentStep).toBe(3);
    expect(wizardState.uiState.currentStepName).toBe('BENEFICIARIES');
    expect(wizardState.uiState.errors.phone).toBe('Invalid');

    // Test empty patch
    updateWizardUiState({});
    expect(getWizardState().uiState.currentStep).toBe(3);
  });

  it('should update domainState cleanly', () => {
    updateWizardDomainState({
      personal: { fullName: 'Sunita Verma', phone: '9876543210' }
    });
    const wizardState = getWizardState();
    expect(wizardState.domainState.personal.fullName).toBe('Sunita Verma');
  });

  it('should reset wizard state to defaults', () => {
    updateWizardUiState({ currentStep: 4 });
    resetWizardState();
    expect(getWizardState().uiState.currentStep).toBe(1);
  });

  it('should notify subscriber on state change', () => {
    let notified = false;
    const unsubscribe = subscribeWizardState((state) => {
      notified = true;
      expect(state.uiState.currentStep).toBe(2);
    });

    updateWizardUiState({ currentStep: 2 });
    expect(notified).toBe(true);
    unsubscribe();
  });

  /* -------------------------------------------------------------
   * SCENARIO A: Cloud Draft Restore During Step Validation
   * ------------------------------------------------------------- */
  it('Scenario A: Cloud draft restores Step 5 state, FSM validates restored state cleanly', () => {
    // 1. Simulate Cloud Sync restoring step 5 state payload
    updateWizardDomainState({
      personal: {
        fullName: 'Kiran Patel', dob: '1990-01-01', addressLine1: 'Station Road',
        addressCity: 'Ahmedabad', addressState: 'Gujarat', addressPincode: '380001',
        phone: '9876543210', email: 'kiran@gmail.com'
      },
      beneficiaries: [{ id: 1, name: 'Anil Patel' }],
      assets: [{ id: 1, type: 'Bank', allocations: [{ beneficiaryId: 1, percentage: 100 }] }],
      declarationAccepted: true
    });
    updateWizardUiState({ currentStep: 5 });

    // 2. Validate state directly from stateAdapter
    const state = getWizardState();
    expect(state.uiState.currentStep).toBe(5);
    expect(state.uiState.currentStepName).toBe('EXECUTOR');

    // 3. FSM validates step 5 guard directly against domainState
    const guardResult = validateStepGuard(5, state.domainState);
    expect(guardResult.ok).toBe(true);
  });

  /* -------------------------------------------------------------
   * SCENARIO B: Rapid Navigation Stress Test
   * ------------------------------------------------------------- */
  it('Scenario B: Rapid navigation sequence (NEXT -> NEXT -> PREV -> NEXT)', () => {
    // Seed valid domain data so forward guards pass
    updateWizardDomainState({
      personal: {
        fullName: 'Kiran Patel', dob: '1990-01-01', addressLine1: 'Station Road',
        addressCity: 'Ahmedabad', addressState: 'Gujarat', addressPincode: '380001',
        phone: '9876543210', email: 'kiran@gmail.com'
      },
      beneficiaries: [{ id: 1, name: 'Anil' }],
      assets: [{ id: 1, type: 'Bank', allocations: [{ beneficiaryId: 1, percentage: 100 }] }]
    });

    expect(getWizardState().uiState.currentStep).toBe(1);

    // Rapid sequence 1: NEXT (1 -> 2)
    WizardController.next();
    expect(getWizardState().uiState.currentStep).toBe(2);

    // Rapid sequence 2: NEXT (2 -> 3)
    WizardController.next();
    expect(getWizardState().uiState.currentStep).toBe(3);

    // Rapid sequence 3: PREV (3 -> 2)
    WizardController.prev();
    expect(getWizardState().uiState.currentStep).toBe(2);

    // Rapid sequence 4: NEXT (2 -> 3)
    WizardController.next();
    expect(getWizardState().uiState.currentStep).toBe(3);
  });
});
