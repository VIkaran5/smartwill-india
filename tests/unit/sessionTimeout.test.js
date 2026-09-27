import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  startSessionGuardian,
  stopSessionGuardian,
  recordUserActivity,
  executeSessionLock,
  isNativeApp,
  isPaymentStepActive,
  checkInactivity,
  _setTestConfig,
  _isGuardianActive,
  _isWarningShown
} from '../../js/services/sessionTimeout.js';

describe('Gentle Session Inactivity Guardian (sessionTimeout.js)', () => {
  beforeEach(() => {
    vi.useRealTimers();
    stopSessionGuardian();
    _setTestConfig(45 * 60 * 1000, 2 * 60 * 1000, 10 * 1000);
    localStorage.clear();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    stopSessionGuardian();
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('detects standard web environment as not native app', () => {
    expect(isNativeApp()).toBe(false);
  });

  it('detects step 5 payment URL param correctly', () => {
    expect(isPaymentStepActive()).toBe(false);
  });

  it('returns false when step6 DOM element exists without active class (the critical bugfix)', () => {
    // In app.html, step6 exists on all steps but only has .active on step 6
    const step6 = document.createElement('div');
    step6.id = 'step6';
    step6.className = 'wizard-step step-content';
    document.body.appendChild(step6);

    expect(isPaymentStepActive()).toBe(false);
  });

  it('returns true when step6 DOM element has active class', () => {
    const step6 = document.createElement('div');
    step6.id = 'step6';
    step6.className = 'wizard-step step-content active';
    document.body.appendChild(step6);

    expect(isPaymentStepActive()).toBe(true);
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

  it('immediately triggers session lock if user activity occurs after idle timeout elapsed (e.g. laptop woke from sleep)', async () => {
    window.firebaseAuth = { signOut: vi.fn().mockResolvedValue() };
    window.updateAuthUI = vi.fn();

    const mockUser = { uid: 'user_xyz', email: 'test@smartwill.in' };
    startSessionGuardian(mockUser);

    // Simulate system waking from sleep 50 minutes later
    _setTestConfig(45 * 60 * 1000, 2 * 60 * 1000, 10 * 1000, Date.now() - 50 * 60 * 1000);

    // User moves mouse upon returning
    await recordUserActivity(false);

    expect(_isGuardianActive()).toBe(false);
    expect(window.firebaseAuth.signOut).toHaveBeenCalled();
  });

  it('locks immediately on startup if stored activity is older than idle timeout', async () => {
    window.firebaseAuth = { signOut: vi.fn().mockResolvedValue() };
    window.updateAuthUI = vi.fn();

    // 2 hours ago
    localStorage.setItem('sw_last_activity_time', (Date.now() - 2 * 60 * 60 * 1000).toString());

    const mockUser = { uid: 'user_xyz', email: 'test@smartwill.in' };
    await startSessionGuardian(mockUser);

    expect(_isGuardianActive()).toBe(false);
    expect(window.firebaseAuth.signOut).toHaveBeenCalled();
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
