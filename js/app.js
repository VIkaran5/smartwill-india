/* Main App Entry Point & Bootstrap for SmartWill India */
import { getState, initStore, isConsentGiven } from './state/store.js';
import { renderAssets } from './render/assets.js';
import { renderBeneficiaries } from './render/beneficiaries.js';
import { updateStepper, goToStep } from './wizard/stepper.js';
import { validateCurrentStep } from './wizard/validation.js';
import { initWizardRenderer } from './wizard/renderer.js';
import { initWizardHistory } from './wizard/history.js';
import { bindEvents, populatePersonalFields } from './events/bindings.js';
import { logger } from './services/logger.js';
import { generateWillPDF } from './services/pdf.js';
import { showToast } from './ui/toast.js';

document.addEventListener('DOMContentLoaded', async () => {
  await initApp();
});

async function initApp() {
  try {
    logger.info('Initializing SmartWill Application');
    await initStore();
    const state = getState();
    populatePersonalFields(state);
    renderAssets();
    renderBeneficiaries();

    const dpdpBox = document.getElementById('dpdpConsentCheckbox');
    if (dpdpBox) {
      dpdpBox.checked = isConsentGiven();
    }

    // Initialize FSM Reactive Renderer and History/Back-Button Listeners
    initWizardRenderer();
    initWizardHistory();

    bindEvents();

    // Wire up the PDF download button (Step 6 post-payment state)
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    if (downloadPdfBtn) {
      downloadPdfBtn.addEventListener('click', async () => {
        try {
          downloadPdfBtn.disabled = true;
          downloadPdfBtn.textContent = '⏳ Generating PDF...';
          await generateWillPDF(getState());
        } catch (err) {
          logger.error('PDF generation failed', err);
          showToast('error', 'PDF Generation Error', err.message || 'Unable to generate PDF document. Please try again.');
        } finally {
          downloadPdfBtn.disabled = false;
          downloadPdfBtn.innerHTML = '<i data-lucide="download"></i> Download Will PDF Document';
          if (window.lucide) window.lucide.createIcons();
        }
      });
    }
  } catch (error) {
    logger.error('Failed to initialize application', error);
  }
}

// Global functions attached to window for HTML inline attribute compatibility
window.goToStep = goToStep;
window.validateCurrentStep = validateCurrentStep;
window.generateWillPDF = generateWillPDF;
