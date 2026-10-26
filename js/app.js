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
import { initReviewWidget } from './ui/reviewWidget.js';
import { trackWizardStart } from './services/analytics.js';

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

    // Track Wizard Start Event for Drop-off Funnel Analytics
    trackWizardStart();

    // Wire up the PDF download button (Step 6 post-payment state)
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    if (downloadPdfBtn) {
      downloadPdfBtn.addEventListener('click', async () => {
        try {
          downloadPdfBtn.disabled = true;
          downloadPdfBtn.textContent = '⏳ Generating PDF...';
          await generateWillPDF(getState());
          const reviewWidget = document.getElementById('willReviewWidget');
          if (reviewWidget && !localStorage.getItem('sw_user_rating')) {
            setTimeout(() => {
              reviewWidget.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 600);
          }
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

    // Wire up WhatsApp Family Share button
    const whatsappShareBtn = document.getElementById('whatsappShareBtn');
    if (whatsappShareBtn) {
      whatsappShareBtn.addEventListener('click', () => {
        try {
          const currentUser = window.currentUser || (typeof firebase !== 'undefined' && firebase.auth ? firebase.auth().currentUser : null);
          const refLink = currentUser && currentUser.uid ? `https://www.smartwillindia.in/?ref=${currentUser.uid}` : 'https://www.smartwillindia.in';
          const shareText = encodeURIComponent(`I just created my official legal Will in 10 minutes on SmartWill India for ₹299! It was fast, clear, and valid in Indian civil courts. Make sure your family's future is protected too: ${refLink}`);
          whatsappShareBtn.href = `https://wa.me/?text=${shareText}`;

          // GA4 Viral Share Event Tracking
          if (typeof window.gtag === 'function') {
            window.gtag('event', 'share', {
              method: 'whatsapp',
              content_type: 'will_document',
              item_id: 'smartwill_legal_draft'
            });
          }
        } catch (err) {}
      });
    }

    // Initialize In-App Review & Rating Widget
    initReviewWidget();

    // Initialize NRI Mode & Pricing Sync
    initNriMode();
  } catch (error) {
    logger.error('Failed to initialize application', error);
  }
}

// Global functions attached to window for HTML inline attribute compatibility
window.goToStep = goToStep;
window.validateCurrentStep = validateCurrentStep;
window.generateWillPDF = generateWillPDF;

function initNriMode() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('plan') === 'nri') {
    sessionStorage.setItem('sw_nri_plan', 'true');
  }
  const isNri = sessionStorage.getItem('sw_nri_plan') === 'true';
  const nriCheckbox = document.getElementById('nriPlanCheckbox');
  if (nriCheckbox) {
    nriCheckbox.checked = isNri;
    nriCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        sessionStorage.setItem('sw_nri_plan', 'true');
      } else {
        sessionStorage.removeItem('sw_nri_plan');
      }
      applyNriUiState(e.target.checked);
    });
  }
  applyNriUiState(isNri);
}

function applyNriUiState(isNri) {
  const amtEl = document.getElementById('checkoutAmountDisplay');
  const strikeEl = document.getElementById('checkoutStrikeDisplay');
  const subEl = document.getElementById('nriPriceSubtext');
  const payBtnText = document.getElementById('payBtnText');
  const badgeEl = document.getElementById('complianceBadgeDisplay');
  const phoneInput = document.getElementById('phone');
  const pincodeInput = document.getElementById('addressPincode');
  const nriNote = document.getElementById('nriPaymentModesNote');

  if (isNri) {
    if (amtEl) amtEl.textContent = '999';
    if (strikeEl) strikeEl.textContent = '₹14,999';
    if (subEl) subEl.classList.remove('hidden');
    if (payBtnText) payBtnText.textContent = 'Pay ₹999 & Unlock Legal Will PDF';
    if (badgeEl) badgeEl.innerHTML = '🇮🇳 100% Legally Binding for Indian Assets under Section 63 &bull; Global NRI Compliant';
    if (phoneInput) phoneInput.placeholder = 'e.g. +1 416 555 1234 or local number';
    if (pincodeInput) pincodeInput.placeholder = 'e.g. M5V 2T6 or Indian PIN';
    if (nriNote) nriNote.classList.remove('hidden');
  } else {
    if (amtEl) amtEl.textContent = '299';
    if (strikeEl) strikeEl.textContent = '₹4,999';
    if (subEl) subEl.classList.add('hidden');
    if (payBtnText) payBtnText.textContent = 'Pay ₹299 & Unlock Legal Will PDF';
    if (badgeEl) badgeEl.innerHTML = '🇮🇳 Aligned with Section 63, Indian Succession Act 1925 &bull; Valid in All Indian Courts';
    if (phoneInput) phoneInput.placeholder = '10-digit mobile number';
    if (pincodeInput) pincodeInput.placeholder = '6-digit PIN code';
    if (nriNote) nriNote.classList.add('hidden');
  }
}
