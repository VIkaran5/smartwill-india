/* UI Event Listeners & Input Bindings Module */
import { getState, updateState, resetState, recordConsent, isConsentGiven } from '../state/store.js';
import { renderAssets } from '../render/assets.js';
import { renderBeneficiaries } from '../render/beneficiaries.js';
import { renderAllocations } from '../render/allocations.js';
import { renderSummary } from '../render/summary.js';
import { updateStepper, goToStep } from '../wizard/stepper.js';
import { validateCurrentStep } from '../wizard/validation.js';
import { WizardController } from '../wizard/controller.js';
import { cleanAddressField } from '../utils/formatters.js';
import { isValidEmailFormat, getEmailTypoWarning, validateGovtId } from '../utils/validators.js';
import { initPaymentService } from '../services/payment.js';
import { initI18n } from '../i18n/index.js';
import { renderLanguageSelector } from '../ui/langSelector.js';
import { initAuthService } from '../services/auth.js';
import { showToast } from '../ui/toast.js';

export function bindEvents() {
  initI18n();
  renderLanguageSelector();
  initAuthService();
  initPaymentService();
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  const addAssetBtn = document.getElementById('addAssetBtn');
  const addBeneficiaryBtn = document.getElementById('addBeneficiaryBtn');
  const resetDataBtn = document.getElementById('resetDataBtn');

  // Step 1 Input listeners
  const personalInputs = ['fullName', 'dob', 'gender', 'religion', 'govtIdType', 'govtIdDigits', 'phone', 'email', 'addressLine1', 'addressCity', 'addressState', 'addressPincode'];
  personalInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        saveCurrentStepInputs();
      });
    }
  });

  // Blur address cleaning
  ['addressLine1', 'addressCity', 'addressState'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('blur', () => {
        if (el.value) {
          el.value = cleanAddressField(el.value);
          saveCurrentStepInputs();
        }
      });
    }
  });

  const confirmCheckbox = document.getElementById('confirmCheckbox');
  if (confirmCheckbox) {
    confirmCheckbox.addEventListener('change', () => {
      saveCurrentStepInputs();
    });
  }

  setupPincodeAutoLookup();
  setupGovtIdValidation();
  setupMobileAndEmailValidation();

  if (addAssetBtn) {
    addAssetBtn.addEventListener('click', () => {
      const state = getState();
      const newId = (state.assets.length ? Math.max(...state.assets.map(a => a.id)) : 0) + 1;
      const assets = [...state.assets, { id: newId, type: 'Bank Account / FD', desc: '', value: '' }];
      updateState({ assets });
      renderAssets();
    });
  }

  if (addBeneficiaryBtn) {
    addBeneficiaryBtn.addEventListener('click', () => {
      const state = getState();
      const newId = (state.beneficiaries.length ? Math.max(...state.beneficiaries.map(b => b.id)) : 0) + 1;
      const beneficiaries = [...state.beneficiaries, { id: newId, name: '', relation: 'Spouse', phone: '', idType: '', idDigits: '' }];
      updateState({ beneficiaries });
      renderBeneficiaries();
    });
  }

  if (resetDataBtn) {
    resetDataBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all entered details and start fresh?')) {
        const state = resetState();
        populatePersonalFields(state);
        renderAssets();
        renderBeneficiaries();
        updateStepper();
      }
    });
  }

  // DPDP Act 2023: Consent Checkbox Binding
  const dpdpBox = document.getElementById('dpdpConsentCheckbox');
  if (dpdpBox) {
    dpdpBox.checked = isConsentGiven();
    dpdpBox.addEventListener('change', () => {
      if (dpdpBox.checked) {
        recordConsent();
        saveCurrentStepInputs();
      } else {
        localStorage.removeItem('sw_dpdp_consent');
        localStorage.removeItem('smartwill_draft');
      }
    });
  }

  // DPDP Act 2023: Data Rights (Section 11 & 12)
  const btnDownloadData = document.getElementById('btnDownloadMyData');
  if (btnDownloadData) {
    btnDownloadData.addEventListener('click', () => {
      const data = getState();
      const exportPayload = {
        meta: {
          exporter: 'SmartWill India',
          compliance: 'DPDP Act 2023 (Section 11 - Right to Access)',
          exportedAt: new Date().toISOString()
        },
        userData: data
      };
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartwill-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', 'Data Exported! 📥', 'Your complete data has been downloaded as a JSON file.');
    });
  }

  const btnDeleteAccount = document.getElementById('btnDeleteMyAccount');
  if (btnDeleteAccount) {
    btnDeleteAccount.addEventListener('click', async () => {
      const firstConfirm = confirm('Are you sure you want to permanently delete your account and all stored Will data? This action cannot be undone.');
      if (!firstConfirm) return;
      const secondConfirm = confirm('FINAL CONFIRMATION: Your encrypted local draft and any cloud data will be permanently wiped.');
      if (!secondConfirm) return;

      try {
        localStorage.removeItem('smartwill_draft');
        localStorage.removeItem('sw_dpdp_consent');
        localStorage.removeItem('sw_pending_order_id');
        resetState();

        if (window.firebase && window.firebase.auth) {
          const user = window.firebase.auth().currentUser;
          if (user) {
            if (window.firebaseDb) {
              try {
                await window.firebaseDb.collection('users').doc(user.uid).delete();
              } catch (_) {}
            }
            try {
              await user.delete();
            } catch (_) {}
          }
        }

        showToast('success', 'Account & Data Deleted', 'All your stored information has been permanently removed.');
        setTimeout(() => { window.location.href = '/'; }, 1200);
      } catch (err) {
        console.error('Account deletion error', err);
        showToast('error', 'Deletion Notice', 'Local data cleared. For cloud profile deletion, email smartwillindia.help@gmail.com');
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const current = getState().currentStep;
      if (current === 1) {
        const box = document.getElementById('dpdpConsentCheckbox');
        if (box && !box.checked) {
          showToast('error', 'Consent Required 🛡️', 'Please tick the DPDP Act 2023 Consent checkbox at the top to proceed.');
          box.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
      saveCurrentStepInputs();
      WizardController.next();
      updateEmailTargetDisplay();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      saveCurrentStepInputs();
      WizardController.prev();
    });
  }

  // Stepper Header Direct Click Navigation
  document.querySelectorAll('.step-item').forEach(el => {
    el.addEventListener('click', () => {
      const stepNum = Number(el.dataset.step);
      saveCurrentStepInputs();
      WizardController.goToStep(stepNum);
    });
  });
}

export function saveCurrentStepInputs() {
  const state = getState();
  if (state.currentStep === 1) {
    updateState({
      personal: {
        fullName: document.getElementById('fullName')?.value?.trim() || '',
        dob: document.getElementById('dob')?.value || '',
        gender: document.getElementById('gender')?.value || 'Male',
        religion: document.getElementById('religion')?.value || 'Hindu',
        govtIdType: document.getElementById('govtIdType')?.value || 'PAN Card',
        govtIdDigits: document.getElementById('govtIdDigits')?.value?.trim() || '',
        phone: document.getElementById('phone')?.value?.trim() || '',
        email: document.getElementById('email')?.value?.trim() || '',
        addressLine1: document.getElementById('addressLine1')?.value?.trim() || '',
        addressCity: document.getElementById('addressCity')?.value?.trim() || '',
        addressState: document.getElementById('addressState')?.value?.trim() || '',
        addressPincode: document.getElementById('addressPincode')?.value?.trim() || ''
      }
    });
  }

  const confirmEl = document.getElementById('confirmCheckbox');
  if (state.currentStep === 5 || confirmEl) {
    const updateObj = {
      executor: {
        name: document.getElementById('executorName')?.value?.trim() || '',
        relation: document.getElementById('executorRelation')?.value?.trim() || ''
      }
    };
    if (confirmEl) {
      updateObj.declarationAccepted = Boolean(confirmEl.checked);
    }
    updateState(updateObj);
  }
}

export function populatePersonalFields(state) {
  const p = state.personal || {};
  const personalFields = [
    'fullName', 'dob', 'gender', 'religion', 'govtIdType', 'govtIdDigits',
    'phone', 'email', 'addressLine1', 'addressCity', 'addressState', 'addressPincode'
  ];
  personalFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = p[id] || '';
  });

  const e = state.executor || {};
  const executorFields = { executorName: 'name', executorRelation: 'relation' };
  Object.entries(executorFields).forEach(([elId, key]) => {
    const el = document.getElementById(elId);
    if (el) el.value = e[key] || '';
  });

  const confirmCheckbox = document.getElementById('confirmCheckbox');
  if (confirmCheckbox && state.declarationAccepted !== undefined) {
    confirmCheckbox.checked = Boolean(state.declarationAccepted);
  }
}

function updateEmailTargetDisplay() {
  const state = getState();
  const targetEmailEl = document.getElementById('targetEmail');
  if (targetEmailEl) {
    targetEmailEl.textContent = (state.personal && state.personal.email) ? state.personal.email : 'your email address';
  }
}

function setupPincodeAutoLookup() {
  const pinInput = document.getElementById('addressPincode');
  const cityInput = document.getElementById('addressCity');
  const stateInput = document.getElementById('addressState');
  const badge = document.getElementById('pincodeStatusBadge');

  if (!pinInput) return;

  async function lookupPincode() {
    const pin = pinInput.value.trim().replace(/\D/g, '');

    if (pin.length !== 6) {
      if (badge) badge.classList.add('hidden');
      return;
    }

    // Show loading state
    if (badge) {
      badge.classList.remove('hidden');
      badge.style.color = '#f59e0b';
      badge.innerHTML = `⏳ Verifying PIN ${pin}...`;
    }

    let detectedDistrict = '';
    let detectedState = '';
    let primaryApiResponded = false;  // tracks if API responded (even with "not found")
    let primaryApiInvalid = false;    // tracks if API explicitly said "invalid/not found"

    // ── Primary API: api.postalpincode.in ──
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();

      primaryApiResponded = true;

      if (data && data[0]) {
        if (data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
          const po = data[0].PostOffice[0];
          detectedDistrict = po.District || po.Region || po.Division || '';
          detectedState = po.State || '';
        } else if (data[0].Status === 'Error' || data[0].Status === 'No records') {
          // API responded and explicitly says this pincode doesn't exist
          primaryApiInvalid = true;
        }
      }
    } catch (err) {
      // Network error or timeout — primaryApiResponded stays false
      console.warn('[Pincode] Primary API timeout/error, trying fallback...', err.message);
    }

    // ── Fallback API: zippopotam.us ──
    if (!detectedState) {
      try {
        const res2 = await fetch(`https://api.zippopotam.us/IN/${pin}`);
        if (res2.ok) {
          const data2 = await res2.json();
          if (data2 && data2.places && data2.places.length > 0) {
            detectedDistrict = data2.places[0]['place name'] || '';
            detectedState = data2.places[0]['state'] || '';
            primaryApiInvalid = false; // fallback confirmed it's valid
          }
        } else if (res2.status === 404) {
          // Fallback also says not found — definitely invalid
          primaryApiInvalid = true;
        }
      } catch (err2) {
        console.warn('[Pincode] Fallback API error:', err2.message);
      }
    }

    // ── Display Result ──
    if (detectedState) {
      // ✅ CASE 1: Valid pincode — auto-fill and show green
      if (stateInput) stateInput.value = detectedState;
      if (cityInput && detectedDistrict) cityInput.value = detectedDistrict;
      saveCurrentStepInputs();

      if (badge) {
        badge.style.color = '#10b981';
        badge.innerHTML = `✓ PIN ${pin} Verified: <strong>${detectedDistrict ? detectedDistrict + ', ' : ''}${detectedState}</strong>`;
      }
    } else if (primaryApiInvalid) {
      // ❌ CASE 2: Both APIs confirmed this pincode does NOT exist
      if (badge) {
        badge.style.color = '#f43f5e';
        badge.innerHTML = `❌ PIN ${pin} is invalid. This PIN code does not exist in India. Please check.`;
      }
    } else {
      // ⚠️ CASE 3: Network error / API offline — can't verify, warn but don't block
      saveCurrentStepInputs();
      if (badge) {
        badge.style.color = '#f59e0b';
        badge.innerHTML = `⚠️ PIN ${pin} could not be verified (network issue). Please double-check manually.`;
      }
    }
  }

  pinInput.addEventListener('input', lookupPincode);
  pinInput.addEventListener('blur', lookupPincode);
}

function setupGovtIdValidation() {
  const typeSelect = document.getElementById('govtIdType');
  const digitsInput = document.getElementById('govtIdDigits');
  const badge = document.getElementById('govtIdStatusBadge');

  if (!typeSelect || !digitsInput) return;

  function validate() {
    const type = typeSelect.value;
    let val = digitsInput.value.trim();

    if (type !== 'Aadhaar Card' && val) {
      val = val.toUpperCase();
      if (digitsInput.value !== val) digitsInput.value = val;
    }

    if (!val) {
      if (badge) badge.classList.add('hidden');
      return;
    }

    const result = validateGovtId(type, val);
    if (badge) {
      badge.classList.remove('hidden');
      badge.style.color = result.isValid ? '#10b981' : '#f43f5e';
      badge.innerHTML = result.message;
    }
  }

  digitsInput.addEventListener('input', validate);
  typeSelect.addEventListener('change', validate);
}

function setupMobileAndEmailValidation() {
  const phoneInput = document.getElementById('phone');
  const emailInput = document.getElementById('email');
  const phoneBadge = document.getElementById('phoneStatusBadge');
  const emailBadge = document.getElementById('emailStatusBadge');

  if (phoneInput && phoneBadge) {
    phoneInput.addEventListener('input', () => {
      const val = phoneInput.value.trim().replace(/\D/g, '');
      if (phoneInput.value !== val) phoneInput.value = val;

      if (!val) {
        phoneBadge.classList.add('hidden');
        return;
      }

      phoneBadge.classList.remove('hidden');

      if (/^[6-9]\d{9}$/.test(val)) {
        phoneBadge.style.color = '#10b981';
        phoneBadge.innerHTML = `✓ Valid Indian Mobile (+91 ${val})`;
      } else {
        phoneBadge.style.color = '#f43f5e';
        phoneBadge.innerHTML = `⚠️ Must be 10 digits starting with 6, 7, 8, or 9.`;
      }
    });
  }

  if (emailInput && emailBadge) {
    emailInput.addEventListener('input', () => {
      const val = emailInput.value.trim();

      if (!val) {
        emailBadge.classList.add('hidden');
        return;
      }

      emailBadge.classList.remove('hidden');

      const typoWarning = getEmailTypoWarning(val);
      if (typoWarning) {
        emailBadge.style.color = '#f59e0b';
        emailBadge.innerHTML = `⚠️ Typo Detected: ${typoWarning}`;
        return;
      }

      if (isValidEmailFormat(val)) {
        emailBadge.style.color = '#10b981';
        emailBadge.innerHTML = `✓ Valid Email Address (${val})`;
      } else {
        emailBadge.style.color = '#f43f5e';
        emailBadge.innerHTML = `⚠️ Please enter a valid email (e.g. ramesh@gmail.com).`;
      }
    });
  }
}
