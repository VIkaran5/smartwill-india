import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  startSessionGuardian,
  stopSessionGuardian,
  recordUserActivity,
  executeSessionLock,
  isNativeApp,
  isPaymentStepActive,
  _setTestConfig,
  _isGuardianActive,
  _isWarningShown
} from '../../js/services/sessionTimeout.js';

describe('Gentle Session Inactivity Guardian (sessionTimeout.js)', () => {
  beforeEach(() => {
    vi.useRealTimers();
    stopSessionGuardian();
    _setTestConfig(45 * 60 * 1000, 2 * 60 * 1000, 10 * 1000);
  });

  it('detects standard web environment as not native app', () => {
    expect(isNativeApp()).toBe(false);
  });

  it('detects step 5 payment URL param correctly', () => {
    expect(isPaymentStepActive()).toBe(false);
  });

  it('starts guardian when user object is provided and stops on stopSessionGuardian', () => {
    const mockUser = { uid: 'user_xyz', email: 'test@smartwill.in' };

    startSessionGuardian(mockUser);
    expect(_isGuardianActive()).toBe(true);

    stopSessionGuardian();
    expect(_isGuardianActive()).toBe(false);
  });

  it('does not start guardian if user is null or undefined', () => {
    startSessionGuardian(null);
    expect(_isGuardianActive()).toBe(false);
  });

  it('reschedules timers when user activity is recorded', () => {
    const mockUser = { uid: 'user_xyz', email: 'test@smartwill.in' };
    startSessionGuardian(mockUser);

    expect(_isGuardianActive()).toBe(true);
    // Force reset simulates activity
    recordUserActivity(true);
    expect(_isGuardianActive()).toBe(true);

    stopSessionGuardian();
  });

  it('executes session lock gracefully without throwing errors', async () => {
    window.firebaseAuth = {
      signOut: vi.fn().mockResolvedValue()
    };
    window.updateAuthUI = vi.fn();

    await executeSessionLock();

    expect(_isGuardianActive()).toBe(false);
    expect(window.firebaseAuth.signOut).toHaveBeenCalled();
    expect(window.updateAuthUI).toHaveBeenCalledWith(null);
  });
});
