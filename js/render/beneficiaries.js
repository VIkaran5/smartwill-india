/* Dynamic Beneficiary List Renderer */
import { getState, updateState } from '../state/store.js';
import { escapeHTML } from '../utils/sanitizer.js';

export function renderBeneficiaries() {
  const container = document.getElementById('beneficiariesContainer');
  if (!container) return;

  const state = getState();
  container.innerHTML = '';

  state.beneficiaries.forEach((ben) => {
    const row = document.createElement('div');
    row.className = 'dynamic-row-card glass-card p-3 mb-3';
    row.innerHTML = `
      <div class="grid grid-2">
        <div class="form-group">
          <label class="form-label"><span data-i18n="form.beneficiaryName">Full Legal Name</span> <span class="required">*</span></label>
          <input type="text" class="form-control ben-name" data-id="${ben.id}" value="${escapeHTML(ben.name || '')}" placeholder="e.g. Priya Sharma" data-i18n-placeholder="form.beneficiaryNamePlaceholder">
        </div>
        <div class="form-group">
          <label class="form-label"><span data-i18n="form.relation">Relationship</span> <span class="required">*</span></label>
          <select class="form-select ben-rel" data-id="${ben.id}">
            <option value="Spouse" ${ben.relation === 'Spouse' ? 'selected' : ''} data-i18n="form.relationSpouse">Spouse</option>
            <option value="Son" ${ben.relation === 'Son' ? 'selected' : ''} data-i18n="form.relationSon">Son</option>
            <option value="Daughter" ${ben.relation === 'Daughter' ? 'selected' : ''} data-i18n="form.relationDaughter">Daughter</option>
            <option value="Minor Son (Under 18)" ${ben.relation === 'Minor Son (Under 18)' ? 'selected' : ''} data-i18n="form.relationMinorSon">Minor Son (Under 18)</option>
            <option value="Minor Daughter (Under 18)" ${ben.relation === 'Minor Daughter (Under 18)' ? 'selected' : ''} data-i18n="form.relationMinorDaughter">Minor Daughter (Under 18)</option>
            <option value="Mother" ${ben.relation === 'Mother' ? 'selected' : ''} data-i18n="form.relationMother">Mother</option>
            <option value="Father" ${ben.relation === 'Father' ? 'selected' : ''} data-i18n="form.relationFather">Father</option>
            <option value="Brother" ${ben.relation === 'Brother' ? 'selected' : ''} data-i18n="form.relationBrother">Brother</option>
            <option value="Sister" ${ben.relation === 'Sister' ? 'selected' : ''} data-i18n="form.relationSister">Sister</option>
            <option value="Grandchild" ${ben.relation === 'Grandchild' ? 'selected' : ''} data-i18n="form.relationGrandchild">Grandchild</option>
            <option value="Other" ${ben.relation === 'Other' ? 'selected' : ''} data-i18n="form.relationOther">Other</option>
          </select>
        </div>
      </div>

      <div class="form-group mt-2 ben-guardian-box ${ben.relation && ben.relation.includes('Minor') ? '' : 'hidden'}" id="guardianBox_${ben.id}">
        <label class="form-label" style="color: #f59e0b;" data-i18n="form.minorGuardianLabel">🛡️ Appointed Guardian / Trustee for Minor <span class="required">*</span></label>
        <input type="text" class="form-control ben-guardian" data-id="${ben.id}" value="${escapeHTML(ben.guardian || '')}" placeholder="Full legal name of adult guardian (e.g. Mother / Uncle)" data-i18n-placeholder="form.minorGuardianPlaceholder">
        <p class="form-help-text text-xs" style="color: rgba(255,255,255,0.6); margin-top:2px;" data-i18n="form.minorGuardianHelp">Under Indian Guardian & Wards Act 1890, a guardian manages minor's inheritance until age 18.</p>
      </div>

      <div class="grid grid-3 mt-2">
        <div class="form-group">
          <label class="form-label" data-i18n="form.phone">Mobile Number</label>
          <input type="tel" class="form-control ben-phone" data-id="${ben.id}" value="${escapeHTML(ben.phone || '')}" placeholder="9876543210" maxlength="10" inputmode="tel">
        </div>
        <div class="form-group">
          <label class="form-label" data-i18n="form.beneficiaryIdType">Govt ID Type (Optional)</label>
          <select class="form-select ben-id-type" data-id="${ben.id}">
            <option value="" ${!ben.idType ? 'selected' : ''}>None / Select ID</option>
            <option value="PAN Card" ${ben.idType === 'PAN Card' ? 'selected' : ''}>PAN Card</option>
            <option value="Aadhaar Card" ${ben.idType === 'Aadhaar Card' ? 'selected' : ''}>Aadhaar Card (Last 4 Digits)</option>
            <option value="Voter ID" ${ben.idType === 'Voter ID' ? 'selected' : ''}>Voter ID</option>
            <option value="Passport" ${ben.idType === 'Passport' ? 'selected' : ''}>Passport</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" data-i18n="form.beneficiaryIdDigits">Last 4 Digits / Chars</label>
          <input type="text" class="form-control ben-id-digits" data-id="${ben.id}" maxlength="4" inputmode="numeric" value="${escapeHTML(ben.idDigits || '')}" placeholder="e.g. 5678" data-i18n-placeholder="form.govtIdDigitsPlaceholder">
        </div>
      </div>

      ${state.beneficiaries.length > 1 ? `
        <div class="text-right mt-2">
          <button type="button" class="btn btn-outline btn-sm text-rose btn-remove-ben" data-id="${ben.id}" data-i18n="btn.removeMember">🗑️ Remove Member</button>
        </div>
      ` : ''}
    `;
    container.appendChild(row);
  });

  bindBeneficiaryRowEvents();
}

function bindBeneficiaryRowEvents() {
  document.querySelectorAll('.ben-name').forEach(el => {
    el.addEventListener('input', (e) => {
      const id = Number(e.target.dataset.id);
      const state = getState();
      const beneficiaries = state.beneficiaries.map(b => b.id === id ? { ...b, name: e.target.value } : b);
      updateState({ beneficiaries });
    });
  });

  document.querySelectorAll('.ben-rel').forEach(el => {
    el.addEventListener('change', (e) => {
      const id = Number(e.target.dataset.id);
      const state = getState();
      const beneficiaries = state.beneficiaries.map(b => b.id === id ? { ...b, relation: e.target.value } : b);
      updateState({ beneficiaries });
      
      const gBox = document.getElementById(`guardianBox_${id}`);
      if (gBox) {
        if (e.target.value && e.target.value.includes('Minor')) {
          gBox.classList.remove('hidden');
        } else {
          gBox.classList.add('hidden');
        }
      }
    });
  });

  document.querySelectorAll('.ben-guardian').forEach(el => {
    el.addEventListener('input', (e) => {
      const id = Number(e.target.dataset.id);
      const state = getState();
      const beneficiaries = state.beneficiaries.map(b => b.id === id ? { ...b, guardian: e.target.value } : b);
      updateState({ beneficiaries });
    });
  });

  document.querySelectorAll('.ben-phone').forEach(el => {
    el.addEventListener('input', (e) => {
      const id = Number(e.target.dataset.id);
      const state = getState();
      const beneficiaries = state.beneficiaries.map(b => b.id === id ? { ...b, phone: e.target.value } : b);
      updateState({ beneficiaries });
    });
  });

  document.querySelectorAll('.ben-id-type').forEach(el => {
    el.addEventListener('change', (e) => {
      const id = Number(e.target.dataset.id);
      const state = getState();
      const beneficiaries = state.beneficiaries.map(b => b.id === id ? { ...b, idType: e.target.value } : b);
      updateState({ beneficiaries });
    });
  });

  document.querySelectorAll('.ben-id-digits').forEach(el => {
    el.addEventListener('input', (e) => {
      const id = Number(e.target.dataset.id);
      const state = getState();
      const beneficiaries = state.beneficiaries.map(b => b.id === id ? { ...b, idDigits: e.target.value } : b);
      updateState({ beneficiaries });
    });
  });

  document.querySelectorAll('.btn-remove-ben').forEach(el => {
    el.addEventListener('click', (e) => {
      const id = Number(e.target.dataset.id);
      removeBeneficiary(id);
    });
  });
}

export function removeBeneficiary(id) {
  const state = getState();
  const beneficiaries = state.beneficiaries.filter(b => b.id !== id);
  updateState({ beneficiaries });
  renderBeneficiaries();
}
