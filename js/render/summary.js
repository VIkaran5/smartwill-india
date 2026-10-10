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

    <div class="summary-section">
      <h4>${t('summary.allocations') || '📊 Asset Allocations (Distribution)'}</h4>
  `;

  if (assets.length === 0) {
    html += `<p><em>${notProvidedStr}</em></p>`;
  } else {
    assets.forEach(asset => {
      const allocs = asset.allocations || [];
      const shareLabel = (t('summary.share') && t('summary.share') !== 'summary.share') ? t('summary.share') : 'Share';
      html += `
        <div style="margin-bottom: 12px; padding: 10px 14px; background: rgba(0,0,0,0.02); border-left: 3px solid var(--primary, #1e3a8a); border-radius: 6px;">
          <div style="font-weight: 700; color: var(--text-main); margin-bottom: 6px;">📦 ${escapeHTML(asset.type || 'Asset')}: ${escapeHTML(asset.desc || notProvidedStr)}</div>
          <ul style="margin: 0; padding: 0; list-style: none;">
      `;
      if (allocs.length === 0) {
        html += `<li style="color:var(--text-muted); font-style:italic; padding:4px 0;">100% Equal distribution among all beneficiaries</li>`;
      } else {
        allocs.forEach(al => {
          const ben = beneficiaries.find(b => b.id === al.beneficiaryId);
          const benName = ben ? `${ben.name || 'Beneficiary'} (${ben.relation || ''})` : `Beneficiary #${al.beneficiaryId}`;
          html += `
            <li style="display:flex; justify-content:space-between; align-items:center; padding:5px 0; border-bottom:1px dashed var(--border-light, rgba(0,0,0,0.08));">
              <span>👤 ${escapeHTML(benName)}</span>
              <span style="background:rgba(245, 158, 11, 0.12); color:#b45309; font-weight:700; padding:2px 10px; border-radius:999px; font-size:0.85rem; border:1px solid rgba(245, 158, 11, 0.3);">${al.percentage}% ${shareLabel}</span>
            </li>
          `;
        });
      }
      html += `
          </ul>
        </div>
      `;
    });
  }

  html += `
    </div>

    <div class="summary-section">
      <h4>${t('summary.executor') || '⚖️ Appointed Will Executor'}</h4>
  `;

  const executor = state.executor || {};
  const execName = (executor.name || '').trim();
  const execRelation = (executor.relation || '').trim();

  if (execName) {
    html += `
      <p><strong>${t('summary.name') || 'Name:'}</strong> ${escapeHTML(execName)} | <strong>${t('summary.relation') || 'Relationship:'}</strong> ${escapeHTML(execRelation || notProvidedStr)}</p>
    `;
    if (executor.alternateName) {
      html += `
        <p class="text-xs text-muted" style="margin-top:4px;"><strong>Alternate:</strong> ${escapeHTML(executor.alternateName)} (${escapeHTML(executor.alternateRelation || notProvidedStr)})</p>
      `;
    }
  } else {
    html += `
      <p style="color: var(--text-muted); font-style: italic; font-size: 0.9rem;">${t('summary.executorNone') || 'No Executor appointed (Under Indian Succession Act, court will appoint administrator if unassigned).'}</p>
    `;
  }

  html += `
    </div>
  `;

  container.innerHTML = html;
}
