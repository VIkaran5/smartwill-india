/* Allocation Step Renderer */
import { getState, updateState } from '../state/store.js';
import { escapeHTML } from '../utils/sanitizer.js';
import { t } from '../i18n/index.js';
import { showToast } from '../ui/toast.js';

export function getAllocStatus(totalPct) {
  const is100 = Math.abs(totalPct - 100) < 0.01;
  if (is100) {
    return {
      text: t('form.allocatedValid') || '✓ 100% Allocated',
      badgeClass: 'badge-valid',
      color: '#10b981'
    };
  }
  if (totalPct < 100) {
    const remaining = Math.round(100 - totalPct);
    return {
      text: `${totalPct}% (${remaining}% ${t('form.remaining') || 'remaining'})`,
      badgeClass: 'badge-warning',
      color: '#f59e0b'
    };
  }
  const over = Math.round(totalPct - 100);
  return {
    text: `${totalPct}% (${over}% ${t('form.overallocated') || 'over limit'})`,
    badgeClass: 'badge-invalid',
    color: '#f43f5e'
  };
}

export function renderAllocations() {
  const container = document.getElementById('allocationContainer');
  if (!container) return;

  const state = getState();
  container.innerHTML = '';

  const benCount = state.beneficiaries.length || 1;
  const basePct = Math.floor(100 / benCount);
  const remainder = 100 - (basePct * benCount);

  const assets = state.assets.map(asset => {
    if (!asset.allocations || asset.allocations.length === 0) {
      return {
        ...asset,
        allocations: state.beneficiaries.map((b, idx) => ({
          beneficiaryId: b.id,
          percentage: idx === 0 ? basePct + remainder : basePct
        }))
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
    const status = getAllocStatus(totalPct);

    let html = `
      <div class="alloc-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <h4 class="alloc-asset-title" style="margin:0;">📦 ${escapeHTML(asset.type)}: ${escapeHTML(asset.desc || 'Unspecified Asset')}</h4>
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <button type="button" class="btn btn-outline btn-xs btn-split-equal" data-asset="${asset.id}" style="font-size:0.78rem; padding:4px 10px; border-color:var(--accent-gold, #f59e0b); color:var(--accent-gold, #b45309); border-radius:6px; cursor:pointer; font-weight:600;">${t('form.splitEqually') || '⚡ Split Equally'}</button>
          <span class="alloc-status-badge ${status.badgeClass}" id="alloc-badge-${asset.id}">${status.text}</span>
        </div>
      </div>
      <div class="alloc-progress-bar-bg" style="margin-top:10px; margin-bottom:14px;">
        <div class="alloc-progress-bar-fill" id="alloc-bar-${asset.id}" style="width: ${Math.min(totalPct, 100)}%; background-color: ${status.color};"></div>
      </div>
    `;

    state.beneficiaries.forEach(ben => {
      const currentAlloc = (asset.allocations || []).find(a => a.beneficiaryId === ben.id);
      const pct = currentAlloc !== undefined ? currentAlloc.percentage : 0;
      const benIdStr = (ben.idType && ben.idDigits) ? ` [${ben.idType}: XXXX-${ben.idDigits}]` : '';

      html += `
        <div class="alloc-ben-row">
          <span class="alloc-ben-name">👤 ${escapeHTML(ben.name || 'Beneficiary')} <span style="color:var(--text-muted); font-size:0.88rem;">(${escapeHTML(ben.relation || '')})${escapeHTML(benIdStr)}</span></span>
          <div class="alloc-input-wrap">
            <input type="number" class="form-control alloc-pct-input" 
                   data-asset="${asset.id}" data-ben="${ben.id}" 
                   min="0" max="100" step="1" value="${pct}">
            <span style="font-weight:700; color:var(--text-muted);">%</span>
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
      let rawVal = e.target.value;
      let val = Number(rawVal);

      if (isNaN(val) || val < 0) val = 0;
      if (val > 100) {
        val = 100;
        e.target.value = 100;
      }

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
      const status = getAllocStatus(totalPct);
      
      const badge = document.getElementById(`alloc-badge-${assetId}`);
      const bar = document.getElementById(`alloc-bar-${assetId}`);

      if (badge) {
        badge.className = `alloc-status-badge ${status.badgeClass}`;
        badge.textContent = status.text;
      }

      if (bar) {
        bar.style.width = `${Math.min(totalPct, 100)}%`;
        bar.style.backgroundColor = status.color;
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
  showToast('success', t('toast.splitSuccessTitle') || '100% Split Equally! ⚡', t('toast.splitSuccessDesc') || `Divided asset evenly among family members.`);
}
