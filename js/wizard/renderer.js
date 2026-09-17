/* Presentation-Only Renderer for SmartWill Wizard Navigation UI
 * Listens to state updates and updates DOM classes, progress bar, and button states.
 * No business logic, validation, or cloud sync calls. */
import { subscribeWizardState, getWizardState } from './stateAdapter.js';
import { t } from '../i18n/index.js';

export function initWizardRenderer() {
  // Update view immediately on init
  renderWizardView(getWizardState());

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateStepperTrack);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(updateStepperTrack);
    }
  }

  // Subscribe to state change notifications
  return subscribeWizardState((wizardState) => {
    renderWizardView(wizardState);
  });
}

export function updateStepperTrack() {
  if (typeof document === 'undefined') return;
  const wrapper = document.querySelector('.stepper-wrapper');
  const track = document.querySelector('.stepper-track');
  const circle1 = document.querySelector('.step-item[data-step="1"] .step-number');
  const circle6 = document.querySelector('.step-item[data-step="6"] .step-number');
  if (!wrapper || !track || !circle1 || !circle6) return;

  const wrapperRect = wrapper.getBoundingClientRect();
  const c1Rect = circle1.getBoundingClientRect();
  const c6Rect = circle6.getBoundingClientRect();

  if (wrapperRect.width === 0 || c6Rect.width === 0) return;

  const c1Center = Math.round(c1Rect.left + c1Rect.width / 2 - wrapperRect.left);
  const c6Center = Math.round(c6Rect.left + c6Rect.width / 2 - wrapperRect.left);
  const vCenter = Math.round(c1Rect.top + c1Rect.height / 2 - wrapperRect.top);

  if (c6Center > c1Center) {
    track.style.left = `${c1Center}px`;
    track.style.width = `${c6Center - c1Center}px`;
    track.style.right = 'auto';
    track.style.top = `${vCenter}px`;
  }
}

export function renderWizardView(wizardState) {
  if (typeof document === 'undefined') return;

  // Update track geometry dynamically
  updateStepperTrack();

  const currentStep = wizardState.uiState.currentStep || 1;

  // 1. Step Indicator items (.step-item)
  document.querySelectorAll('.step-item').forEach(el => {
    const s = Number(el.dataset.step);
    if (s === currentStep) {
      el.classList.add('active');
      el.classList.remove('completed');
    } else if (s < currentStep) {
      el.classList.remove('active');
      el.classList.add('completed');
    } else {
      el.classList.remove('active');
      el.classList.remove('completed');
    }
  });

  // 2. Wizard Step Container visibility (.wizard-step)
  document.querySelectorAll('.wizard-step').forEach(el => {
    el.classList.remove('active');
  });

  const currentStepEl = document.getElementById(`step${currentStep}`);
  if (currentStepEl) {
    currentStepEl.classList.add('active');
  }

  // 3. Progress Bar (% width)
  const progressBar = document.getElementById('progressBar');
  if (progressBar) {
    const pct = Math.max(0, Math.min(100, ((currentStep - 1) / 5) * 100));
    progressBar.style.width = `${pct}%`;
  }

  // 4. Back and Next Buttons
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (prevBtn) {
    prevBtn.disabled = currentStep === 1;
    prevBtn.textContent = t('btn.back');
  }

  if (nextBtn) {
    if (currentStep === 6) {
      nextBtn.style.display = 'none';
    } else {
      nextBtn.style.display = 'inline-flex';
      nextBtn.innerHTML = `${t('btn.next')} <i data-lucide="arrow-right"></i>`;
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    }
  }
}
