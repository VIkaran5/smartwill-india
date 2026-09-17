/* Dynamic Asset List Renderer */
import { getState, updateState } from '../state/store.js';
import { escapeHTML } from '../utils/sanitizer.js';
import { formatIndianRupeeWords } from '../utils/formatters.js';

export function renderAssets() {
  const container = document.getElementById('assetsContainer');
  if (!container) return;

  const state = getState();
  container.innerHTML = '';

  state.assets.forEach((asset) => {
    const row = document.createElement('div');
    row.className = 'dynamic-row';
    row.innerHTML = `
      <div class="form-group asset-col-type">
        <label class="form-label" data-i18n="form.assetCategory">Asset Category</label>
        <select class="form-select asset-type" data-id="${asset.id}" style="width:100%;font-size:16px;">
          <option value="Bank Account / FD" ${asset.type === 'Bank Account / FD' ? 'selected' : ''}>Bank Account / FD</option>
          <option value="Property / Land" ${asset.type === 'Property / Land' ? 'selected' : ''}>Property / Land</option>
          <option value="Gold / Jewelry" ${asset.type === 'Gold / Jewelry' ? 'selected' : ''}>Gold / Jewelry</option>
          <option value="Mutual Funds / Stocks" ${asset.type === 'Mutual Funds / Stocks' ? 'selected' : ''}>Mutual Funds / Stocks</option>
          <option value="Insurance Policy" ${asset.type === 'Insurance Policy' ? 'selected' : ''}>Insurance Policy</option>
          <option value="Vehicle" ${asset.type === 'Vehicle' ? 'selected' : ''}>Vehicle</option>
          <option value="Other Asset" ${asset.type === 'Other Asset' ? 'selected' : ''}>Other Asset</option>
        </select>
      </div>

      <div class="form-group asset-col-desc">
        <label class="form-label" data-i18n="form.assetDesc">Asset Description / Details</label>
        <input type="text" class="form-control asset-desc" data-id="${asset.id}"
          value="${escapeHTML(asset.desc)}"
          placeholder="e.g. HDFC Bank A/C XXXX1234, Flat No. 302 etc."
          style="width:100%;font-size:16px;">
      </div>

      <div class="form-group asset-col-val">
        <label class="form-label" data-i18n="form.assetValue">Estimated Value (₹)</label>
        <input type="number" class="form-control asset-val" data-id="${asset.id}"
          value="${escapeHTML(asset.value)}"
          placeholder="e.g. 500000"
          style="width:100%;font-size:16px;">
        <div class="asset-rupee-words text-xs font-semibold mt-1" id="rupeeWords_${asset.id}"
          style="color:var(--accent-gold);min-height:16px;">
          ${asset.value ? escapeHTML(formatIndianRupeeWords(asset.value)) : ''}
        </div>
      </div>

      ${state.assets.length > 1 ? `
        <div class="asset-col-action">
          <button type="button" class="btn-remove-row" data-id="${asset.id}" title="Remove Asset" aria-label="Remove Asset">&times;</button>
        </div>
      ` : ''}
    `;
    container.appendChild(row);
  });

  bindAssetRowEvents();
}

function bindAssetRowEvents() {
  document.querySelectorAll('.asset-type').forEach(el => {
    el.addEventListener('change', (e) => {
      const id = Number(e.target.dataset.id);
      const state = getState();
      const assets = state.assets.map(a => a.id === id ? { ...a, type: e.target.value } : a);
      updateState({ assets });
    });
  });

  document.querySelectorAll('.asset-desc').forEach(el => {
    el.addEventListener('input', (e) => {
      const id = Number(e.target.dataset.id);
      const state = getState();
      const assets = state.assets.map(a => a.id === id ? { ...a, desc: e.target.value } : a);
      updateState({ assets });
    });
  });

  document.querySelectorAll('.asset-val').forEach(el => {
    el.addEventListener('input', (e) => {
      const id = Number(e.target.dataset.id);
      const state = getState();
      const assets = state.assets.map(a => a.id === id ? { ...a, value: e.target.value } : a);
      updateState({ assets });

      const wordsEl = document.getElementById(`rupeeWords_${id}`);
      if (wordsEl) {
        wordsEl.textContent = e.target.value ? formatIndianRupeeWords(e.target.value) : '';
      }
    });
  });

  document.querySelectorAll('.btn-remove-row').forEach(el => {
    el.addEventListener('click', (e) => {
      const id = Number(e.target.dataset.id);
      removeAsset(id);
    });
  });
}

export function removeAsset(id) {
  const state = getState();
  const assets = state.assets.filter(a => a.id !== id);
  updateState({ assets });
  renderAssets();
}
