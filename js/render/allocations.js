/* Allocation Step Renderer */
import { getState, updateState } from '../state/store.js';
import { escapeHTML } from '../utils/sanitizer.js';
import { t } from '../i18n/index.js';

export function renderAllocations() {
  const container = document.getElementById('allocationContainer');
  if (!container) return;

  const state = getState();
  container.innerHTML = '';

  const assets = state.assets.map(asset => {
    if (!asset.allocations) {
      const perHead = Math.floor(100 / (state.beneficiaries.length || 1));
      return {
        ...asset,
        allocations: state.beneficiaries.map(b => ({ beneficiaryId: b.id, percentage: perHead }))
      };
    }
    return asset;
  });

  updateState({ assets });

  assets.forEach(asset => {
    const card = document.createElement('div');
    card.className = 'allocation-card';
    card.id = `alloc-card-${asset.id}`;

    const totalPct = (asset.allocations || []).reduce((sum, a) => sum + (Number(a.percentage) || 0), 0);
    const is100 = Math.abs(totalPct - 100) < 0.01;

    let badgeClass = is100 ? 'badge-valid' : 'badge-invalid';
    let badgeText = is100 ? t('form.allocatedValid') : `${totalPct}% ${t('form.allocatedInvalid')}`;

    let html = `
      <div class="alloc-header" style="display:flex; justify-content:space-between; align-items:center;">
        <h4 class="alloc-asset-title">📦 ${escapeHTML(asset.type)}: ${escapeHTML(asset.desc || 'Unspecified Asset')}</h4>
        <div style="display:flex; align-items:center; gap:8px;">
          <button type="button" class="btn btn-outline btn-xs btn-split-equal" data-asset="${asset.id}" style="font-size:0.75rem; padding:3px 8px; border-color:var(--accent-gold); color:var(--accent-gold); border-radius:6px; cursor:pointer;">${t('form.splitEqually')}</button>
          <span class="alloc-status-badge ${badgeClass}" id="alloc-badge-${asset.id}">${badgeText}</span>
        </div>
      </div>
      <div class="alloc-progress-bar-bg">
        <div class="alloc-progress-bar-fill" id="alloc-bar-${asset.id}" style="width: ${Math.min(totalPct, 100)}%; background-color: ${is100 ? '#10b981' : '#f43f5e'};"></div>
      </div>
    `;

    state.beneficiaries.forEach(ben => {
      const currentAlloc = (asset.allocations || []).find(a => a.beneficiaryId === ben.id);
      const pct = currentAlloc ? currentAlloc.percentage : 0;
      const benIdStr = (ben.idType && ben.idDigits) ? ` [${ben.idType}: XXXX-${ben.idDigits}]` : '';

      html += `
        <div class="alloc-ben-row">
          <span class="alloc-ben-name">👤 ${escapeHTML(ben.name || 'Beneficiary')} (${escapeHTML(ben.relation)})${escapeHTML(benIdStr)}</span>
          <div class="alloc-input-wrap">
            <input type="number" class="form-control alloc-pct-input" 
                   data-asset="${asset.id}" data-ben="${ben.id}" 
                   min="0" max="100" value="${pct}">
            <span>%</span>
          </div>
        </div>
      `;
    });

    card.innerHTML = html;
    container.appendChild(card);
  });

  bindAllocationEvents();
}

function bindAllocationEvents() {
  document.querySelectorAll('.alloc-pct-input').forEach(el => {
    el.addEventListener('input', (e) => {
      const assetId = Number(e.target.dataset.asset);
      const benId = Number(e.target.dataset.ben);
      const val = Number(e.target.value);

      const state = getState();
      const assets = state.assets.map(asset => {
        if (asset.id === assetId) {
          const allocations = asset.allocations || [];
          const existing = allocations.find(a => a.beneficiaryId === benId);
          let newAllocations;
          if (existing) {
            newAllocations = allocations.map(a => a.beneficiaryId === benId ? { ...a, percentage: val } : a);
          } else {
            newAllocations = [...allocations, { beneficiaryId: benId, percentage: val }];
          }
          return { ...asset, allocations: newAllocations };
        }
        return asset;
      });

      updateState({ assets });

      const updatedAsset = assets.find(a => a.id === assetId);
      const totalPct = (updatedAsset.allocations || []).reduce((sum, a) => sum + (Number(a.percentage) || 0), 0);
      const is100 = Math.abs(totalPct - 100) < 0.01;
      
      const badge = document.getElementById(`alloc-badge-${assetId}`);
      const bar = document.getElementById(`alloc-bar-${assetId}`);

      if (badge) {
        badge.className = `alloc-status-badge ${is100 ? 'badge-valid' : 'badge-invalid'}`;
        badge.textContent = is100 ? '✓ 100% Allocated' : `${totalPct}% Allocated (Must be 100%)`;
      }

      if (bar) {
        bar.style.width = `${Math.min(totalPct, 100)}%`;
        bar.style.backgroundColor = is100 ? '#10b981' : '#f43f5e';
      }
    });
  });

  document.querySelectorAll('.btn-split-equal').forEach(el => {
    el.addEventListener('click', (e) => {
      const assetId = Number(e.target.dataset.asset);
      splitEqually(assetId);
    });
  });
}

export function splitEqually(assetId) {
  const state = getState();
  const asset = state.assets.find(a => a.id === assetId);
  if (!asset || !state.beneficiaries.length) return;

  const count = state.beneficiaries.length;
  const basePct = Math.floor(100 / count);
  const remainder = 100 - (basePct * count);

  const allocations = state.beneficiaries.map((b, idx) => ({
    beneficiaryId: b.id,
    percentage: idx === 0 ? basePct + remainder : basePct
  }));

  const assets = state.assets.map(a => a.id === assetId ? { ...a, allocations } : a);
  updateState({ assets });

  renderAllocations();
  if (typeof showToast === 'function') {
    showToast('success', '100% Split Equally! ⚡', `Divided ${asset.desc || asset.type} evenly among ${count} family members.`);
  }
}
