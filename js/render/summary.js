/* Summary Preview Step Renderer with Localized Labels */
import { getState } from '../state/store.js';
import { escapeHTML } from '../utils/sanitizer.js';
import { buildCleanAddress } from '../utils/formatters.js';
import { t } from '../i18n/index.js';

export function renderSummary() {
  const container = document.getElementById('willSummaryPreview');
  if (!container) return;

  const state = getState();
  const p = state.personal || {};
  const fullAddress = buildCleanAddress(p);
  const notProvidedStr = t('summary.notProvided');
  const idRef = (p.govtIdType && p.govtIdDigits) ? `${p.govtIdType} (Ending in: ${p.govtIdDigits})` : notProvidedStr;

  let formattedDob = escapeHTML(p.dob || notProvidedStr);
  if (p.dob && p.dob.includes('-')) {
    const parts = p.dob.split('-');
    if (parts.length === 3) {
      const year = Number(parts[0]);
      if (year > new Date().getFullYear()) {
        formattedDob = `${escapeHTML(p.dob)} <span style="color:#f43f5e; font-size:0.75rem;">${t('summary.checkYearWarning')}</span>`;
      }
    }
  }

  const assets = Array.isArray(state.assets) ? state.assets : [];
  const beneficiaries = Array.isArray(state.beneficiaries) ? state.beneficiaries : [];

  let html = `
    <div class="summary-section">
      <h4>${t('summary.testatorDetails') || '👤 Testator (Will Creator) Details'}</h4>
      <p><strong>${t('summary.name') || 'Name:'}</strong> ${escapeHTML(p.fullName || notProvidedStr)}</p>
      <p><strong>${t('summary.dob') || 'DOB:'}</strong> ${formattedDob} | <strong>${t('summary.religion') || 'Religion:'}</strong> ${escapeHTML(p.religion || notProvidedStr)}</p>
      <p><strong>${t('summary.govtIdRef') || 'Govt Identity Reference:'}</strong> ${escapeHTML(idRef)}</p>
      <p><strong>${t('summary.address') || 'Permanent Address:'}</strong> ${escapeHTML(fullAddress || notProvidedStr)}</p>
    </div>

    <div class="summary-section">
      <h4>${t('summary.assets') || '📦 Assets'} (${assets.length})</h4>
      <ul>
  `;

  if (assets.length === 0) {
    html += `<li><em>${notProvidedStr}</em></li>`;
  } else {
    assets.forEach(a => {
      html += `<li><strong>${escapeHTML(a.type || 'Asset')}:</strong> ${escapeHTML(a.desc || notProvidedStr)} ${a.value ? '(' + (t('summary.approx') || 'Approx') + ' ₹' + Number(a.value).toLocaleString('en-IN') + ')' : ''}</li>`;
    });
  }

  html += `
      </ul>
    </div>

    <div class="summary-section">
      <h4>${t('summary.beneficiaries') || '👨‍👩‍👧‍👦 Beneficiaries'} (${beneficiaries.length})</h4>
      <ul>
  `;

  if (beneficiaries.length === 0) {
    html += `<li><em>${notProvidedStr}</em></li>`;
  } else {
    beneficiaries.forEach(b => {
      const benIdRef = (b.idType && b.idDigits) ? ` [${t('summary.idLabel') || 'ID'}: ${b.idType} ${t('summary.endingLabel') || 'Ending'} XXXX-${b.idDigits}]` : '';
      html += `<li><strong>${escapeHTML(b.name || 'Beneficiary')}:</strong> ${escapeHTML(b.relation || '')} (${escapeHTML(b.phone || '')})${escapeHTML(benIdRef)}</li>`;
    });
  }

  html += `
      </ul>
    </div>
  `;

  container.innerHTML = html;
}
