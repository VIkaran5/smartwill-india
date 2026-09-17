/* Pure Finite State Machine (FSM) Module for SmartWill Wizard Workflow
 * Version: 1
 * Completely side-effect free: evaluates allowed state transitions against guards. */
import { STEP_GUARDS, validateStepGuard } from './guards.js';

export const FSM_VERSION = 1;

export const WIZARD_STEPS = {
  PERSONAL: 1,
  ASSETS: 2,
  BENEFICIARIES: 3,
  ALLOCATION: 4,
  EXECUTOR: 5,
  PAYMENT: 6
};

export const STEP_NAMES = {
  1: 'PERSONAL',
  2: 'ASSETS',
  3: 'BENEFICIARIES',
  4: 'ALLOCATION',
  5: 'EXECUTOR',
  6: 'PAYMENT'
};

export const TRANSITION_EVENTS = {
  NEXT: 'NEXT',
  PREVIOUS: 'PREVIOUS',
  GO_TO_STEP: 'GO_TO_STEP',
  RESTORE_DRAFT: 'RESTORE_DRAFT',
  PAYMENT_COMPLETED: 'PAYMENT_COMPLETED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  RESET: 'RESET',
  START_NEW_WILL: 'START_NEW_WILL'
};

export const TRANSITION_CONFIG = {
  PERSONAL: {
    next: 'ASSETS',
    guard: 'PERSONAL'
  },
  ASSETS: {
    next: 'BENEFICIARIES',
    prev: 'PERSONAL',
    guard: 'ASSETS'
  },
  BENEFICIARIES: {
    next: 'ALLOCATION',
    prev: 'ASSETS',
    guard: 'BENEFICIARIES'
  },
  ALLOCATION: {
    next: 'EXECUTOR',
    prev: 'BENEFICIARIES',
    guard: 'ALLOCATION'
  },
  EXECUTOR: {
    next: 'PAYMENT',
    prev: 'ALLOCATION',
    guard: 'EXECUTOR'
  },
  PAYMENT: {
    prev: 'EXECUTOR'
  }
};

/**
 * Pure function: evaluates whether a transition event is valid given current state & domainState
 * Returns: { allowed: boolean, nextStepName: string, nextStepNumber: number, error?: object }
 */
export function evaluateTransition(eventType, currentStepNameOrNum, domainState = {}, payload = {}) {
  const currentStepName = typeof currentStepNameOrNum === 'number'
    ? (STEP_NAMES[currentStepNameOrNum] || 'PERSONAL')
    : (currentStepNameOrNum || 'PERSONAL');

  const currentStepNumber = WIZARD_STEPS[currentStepName] || 1;

  if (eventType === TRANSITION_EVENTS.RESET || eventType === TRANSITION_EVENTS.START_NEW_WILL) {
    return { allowed: true, nextStepName: 'PERSONAL', nextStepNumber: 1 };
  }

  if (eventType === TRANSITION_EVENTS.RESTORE_DRAFT) {
    const target = payload.step || 1;
    const targetName = typeof target === 'number' ? (STEP_NAMES[target] || 'PERSONAL') : target;
    return { allowed: true, nextStepName: targetName, nextStepNumber: WIZARD_STEPS[targetName] || 1 };
  }

  if (eventType === TRANSITION_EVENTS.PREVIOUS) {
    const cfg = TRANSITION_CONFIG[currentStepName];
    if (!cfg || !cfg.prev) {
      return { allowed: false, nextStepName: currentStepName, nextStepNumber: currentStepNumber };
    }
    const prevName = cfg.prev;
    return { allowed: true, nextStepName: prevName, nextStepNumber: WIZARD_STEPS[prevName] };
  }

  if (eventType === TRANSITION_EVENTS.NEXT) {
    const cfg = TRANSITION_CONFIG[currentStepName];
    if (!cfg || !cfg.next) {
      return { allowed: false, nextStepName: currentStepName, nextStepNumber: currentStepNumber };
    }

    const guardResult = validateStepGuard(currentStepName, domainState);
    if (!guardResult.ok) {
      return {
        allowed: false,
        nextStepName: currentStepName,
        nextStepNumber: currentStepNumber,
        error: guardResult
      };
    }

    const nextName = cfg.next;
    return { allowed: true, nextStepName: nextName, nextStepNumber: WIZARD_STEPS[nextName] };
  }

  if (eventType === TRANSITION_EVENTS.GO_TO_STEP) {
    const targetStep = payload.step;
    const targetName = typeof targetStep === 'number' ? (STEP_NAMES[targetStep] || 'PERSONAL') : targetStep;
    const targetNum = WIZARD_STEPS[targetName] || 1;

    // Navigating backward is always permitted
    if (targetNum <= currentStepNumber) {
      return { allowed: true, nextStepName: targetName, nextStepNumber: targetNum };
    }

    // Navigating forward requires ALL intermediate guards to pass
    for (let num = currentStepNumber; num < targetNum; num++) {
      const stepName = STEP_NAMES[num];
      const result = validateStepGuard(stepName, domainState);
      if (!result.ok) {
        return {
          allowed: false,
          nextStepName: currentStepName,
          nextStepNumber: currentStepNumber,
          error: result
        };
      }
    }

    return { allowed: true, nextStepName: targetName, nextStepNumber: targetNum };
  }

  return { allowed: false, nextStepName: currentStepName, nextStepNumber: currentStepNumber };
}
