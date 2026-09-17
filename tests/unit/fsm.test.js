import { describe, it, expect } from 'vitest';
import {
  FSM_VERSION,
  WIZARD_STEPS,
  STEP_NAMES,
  TRANSITION_EVENTS,
  TRANSITION_CONFIG,
  evaluateTransition
} from '../../js/wizard/fsm.js';

describe('Pure Finite State Machine (FSM Engine)', () => {
  it('should export FSM_VERSION = 1', () => {
    expect(FSM_VERSION).toBe(1);
  });

  const validDomainState = {
    personal: {
      fullName: 'Ramesh Sharma',
      dob: '1985-05-15',
      addressLine1: 'MG Road',
      addressCity: 'Mumbai',
      addressState: 'Maharashtra',
      addressPincode: '400001',
      phone: '9876543210',
      email: 'ramesh@gmail.com'
    },
    beneficiaries: [{ id: 1, name: 'Priya' }],
    assets: [
      {
        id: 1,
        type: 'Bank Account',
        allocations: [{ beneficiaryId: 1, percentage: 100 }]
      }
    ],
    declarationAccepted: true
  };

  describe('Sequential NEXT Transitions', () => {
    it('should block NEXT from Step 1 if personal details are invalid', () => {
      const result = evaluateTransition(TRANSITION_EVENTS.NEXT, 'PERSONAL', {});
      expect(result.allowed).toBe(false);
      expect(result.nextStepName).toBe('PERSONAL');
      expect(result.error).toBeDefined();
    });

    it('should allow NEXT from Step 1 to Step 2 when personal details are valid', () => {
      const result = evaluateTransition(TRANSITION_EVENTS.NEXT, 'PERSONAL', validDomainState);
      expect(result.allowed).toBe(true);
      expect(result.nextStepName).toBe('ASSETS');
      expect(result.nextStepNumber).toBe(2);
    });

    it('should allow NEXT from Step 2 to Step 3 when assets exist', () => {
      const result = evaluateTransition(TRANSITION_EVENTS.NEXT, 'ASSETS', validDomainState);
      expect(result.allowed).toBe(true);
      expect(result.nextStepName).toBe('BENEFICIARIES');
      expect(result.nextStepNumber).toBe(3);
    });
  });

  describe('Sequential PREVIOUS Transitions', () => {
    it('should allow PREVIOUS from Step 2 to Step 1 without running guards', () => {
      const result = evaluateTransition(TRANSITION_EVENTS.PREVIOUS, 'ASSETS', {});
      expect(result.allowed).toBe(true);
      expect(result.nextStepName).toBe('PERSONAL');
      expect(result.nextStepNumber).toBe(1);
    });

    it('should reject PREVIOUS when on Step 1', () => {
      const result = evaluateTransition(TRANSITION_EVENTS.PREVIOUS, 'PERSONAL', {});
      expect(result.allowed).toBe(false);
      expect(result.nextStepName).toBe('PERSONAL');
    });
  });

  describe('GO_TO_STEP Direct Navigation & Multi-step Skips', () => {
    it('should allow GO_TO_STEP backward navigation at any time', () => {
      const result = evaluateTransition(TRANSITION_EVENTS.GO_TO_STEP, 'ALLOCATION', {}, { step: 1 });
      expect(result.allowed).toBe(true);
      expect(result.nextStepName).toBe('PERSONAL');
      expect(result.nextStepNumber).toBe(1);
    });

    it('should block multi-step forward skip from Step 1 to Step 6 if intermediate guards fail', () => {
      const result = evaluateTransition(TRANSITION_EVENTS.GO_TO_STEP, 'PERSONAL', {}, { step: 6 });
      expect(result.allowed).toBe(false);
      expect(result.nextStepName).toBe('PERSONAL');
    });

    it('should allow multi-step forward skip if all intermediate guards pass', () => {
      const result = evaluateTransition(TRANSITION_EVENTS.GO_TO_STEP, 'PERSONAL', validDomainState, { step: 5 });
      expect(result.allowed).toBe(true);
      expect(result.nextStepName).toBe('EXECUTOR');
      expect(result.nextStepNumber).toBe(5);
    });
  });

  describe('Special System Events', () => {
    it('should handle RESTORE_DRAFT event with step number, string name, or undefined payload', () => {
      const res1 = evaluateTransition(TRANSITION_EVENTS.RESTORE_DRAFT, 'PERSONAL', {}, { step: 2 });
      expect(res1.allowed).toBe(true);
      expect(res1.nextStepName).toBe('ASSETS');

      const res2 = evaluateTransition(TRANSITION_EVENTS.RESTORE_DRAFT, 'PERSONAL', {}, { step: 'EXECUTOR' });
      expect(res2.allowed).toBe(true);
      expect(res2.nextStepName).toBe('EXECUTOR');

      const res3 = evaluateTransition(TRANSITION_EVENTS.RESTORE_DRAFT, 'PERSONAL', {}, {});
      expect(res3.allowed).toBe(true);
      expect(res3.nextStepName).toBe('PERSONAL');
    });

    it('should handle GO_TO_STEP event with step string or invalid step number', () => {
      const res1 = evaluateTransition(TRANSITION_EVENTS.GO_TO_STEP, 3, {}, { step: 'PERSONAL' });
      expect(res1.allowed).toBe(true);
      expect(res1.nextStepName).toBe('PERSONAL');

      const res2 = evaluateTransition(TRANSITION_EVENTS.GO_TO_STEP, undefined, {}, { step: 1 });
      expect(res2.allowed).toBe(true);
      expect(res2.nextStepName).toBe('PERSONAL');
    });

    it('should handle unknown currentStep input fallback to PERSONAL', () => {
      const res = evaluateTransition(TRANSITION_EVENTS.NEXT, 99, validDomainState);
      expect(res.allowed).toBe(true);
      expect(res.nextStepName).toBe('ASSETS');
    });

    it('should handle RESET event', () => {
      const result = evaluateTransition(TRANSITION_EVENTS.RESET, 'PAYMENT', {});
      expect(result.allowed).toBe(true);
      expect(result.nextStepName).toBe('PERSONAL');
      expect(result.nextStepNumber).toBe(1);
    });

    it('should reject NEXT on PAYMENT step (no next step)', () => {
      const result = evaluateTransition(TRANSITION_EVENTS.NEXT, 'PAYMENT', {});
      expect(result.allowed).toBe(false);
    });

    it('should reject unrecognized event types', () => {
      const result = evaluateTransition('UNKNOWN_EVENT', 'PERSONAL', {});
      expect(result.allowed).toBe(false);
    });
  });
});
