/* Country Code Dropdown & International Mobile Picker for SmartWill India */
import { POPULAR_COUNTRIES, ALL_COUNTRIES, findCountry, filterCountries, cleanLocalPhone, validatePhone } from '../utils/countries.js';

let currentSelectedCountry = POPULAR_COUNTRIES[0]; // Default India (+91)
let isPickerOpen = false;

export function getSelectedCountry() {
  return currentSelectedCountry;
}

export function setSelectedCountry(dialCodeOrIso, triggerValidation = true) {
  const country = findCountry(dialCodeOrIso);
  if (!country) return;

  currentSelectedCountry = country;

  const flagEl = document.getElementById('selectedCountryFlag');
  const codeEl = document.getElementById('selectedCountryCode');
  const hiddenInput = document.getElementById('countryCode');
  const phoneInput = document.getElementById('phone');
  const triggerBtn = document.getElementById('countryCodeBtn');

  if (flagEl) flagEl.textContent = country.flag;
  if (codeEl) codeEl.textContent = country.dialCode;
  if (hiddenInput) hiddenInput.value = country.dialCode;
  if (triggerBtn) {
    triggerBtn.setAttribute('data-iso', country.iso);
    triggerBtn.setAttribute('data-dial', country.dialCode);
    triggerBtn.setAttribute('title', `${country.name} (${country.dialCode})`);
  }

  if (phoneInput) {
    phoneInput.placeholder = country.placeholder || 'e.g. 98765 43210';
    phoneInput.maxLength = country.maxDigits || 15;

    // Re-clean existing digits in the input if present
    if (phoneInput.value) {
      phoneInput.value = cleanLocalPhone(phoneInput.value, country);
    }

    if (triggerValidation) {
      phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  renderCountryList();
}

export function initCountryPicker() {
  const triggerBtn = document.getElementById('countryCodeBtn');
  const dropdownPanel = document.getElementById('countryDropdownPanel');
  const searchInput = document.getElementById('countrySearchInput');
  const searchClear = document.getElementById('countrySearchClear');
  const phoneInput = document.getElementById('phone');

  if (!triggerBtn || !dropdownPanel) return;

  // Render initial list
  renderCountryList();

  // Toggle Dropdown
  triggerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  // Search input typing
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      if (searchClear) {
        if (query.trim()) {
          searchClear.classList.remove('hidden');
        } else {
          searchClear.classList.add('hidden');
        }
      }
      renderCountryList(query);
    });

    // Clear search button
    if (searchClear) {
      searchClear.addEventListener('click', (e) => {
        e.stopPropagation();
        searchInput.value = '';
        searchClear.classList.add('hidden');
        searchInput.focus();
        renderCountryList('');
      });
    }

    // Keyboard navigation inside search input
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDropdown();
        triggerBtn.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const firstItem = dropdownPanel.querySelector('.country-item');
        if (firstItem) firstItem.focus();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const firstItem = dropdownPanel.querySelector('.country-item');
        if (firstItem) firstItem.click();
      }
    });
  }

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (isPickerOpen && !dropdownPanel.contains(e.target) && !triggerBtn.contains(e.target)) {
      closeDropdown();
    }
  });

  // Close on Escape anywhere
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isPickerOpen) {
      closeDropdown();
      triggerBtn.focus();
    }
  });

  // Prevent clicks inside panel from closing
  dropdownPanel.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

function openDropdown() {
  const dropdownPanel = document.getElementById('countryDropdownPanel');
  const triggerBtn = document.getElementById('countryCodeBtn');
  const searchInput = document.getElementById('countrySearchInput');
  const searchClear = document.getElementById('countrySearchClear');

  if (!dropdownPanel || !triggerBtn) return;

  dropdownPanel.classList.remove('hidden');
  triggerBtn.setAttribute('aria-expanded', 'true');
  isPickerOpen = true;

  if (searchInput) {
    searchInput.value = '';
    if (searchClear) searchClear.classList.add('hidden');
    renderCountryList('');
    setTimeout(() => searchInput.focus(), 50);
  }
}

function closeDropdown() {
  const dropdownPanel = document.getElementById('countryDropdownPanel');
  const triggerBtn = document.getElementById('countryCodeBtn');

  if (!dropdownPanel || !triggerBtn) return;

  dropdownPanel.classList.add('hidden');
  triggerBtn.setAttribute('aria-expanded', 'false');
  isPickerOpen = false;
}

function toggleDropdown() {
  if (isPickerOpen) {
    closeDropdown();
  } else {
    openDropdown();
  }
}

function renderCountryList(query = '') {
  const container = document.getElementById('countryList');
  if (!container) return;

  const { popular, all } = filterCountries(query);

  let html = '';

  const isFiltered = Boolean(query && query.trim());

  if (isFiltered) {
    // Show flat search results
    const combined = [...popular, ...all.filter(c => !popular.some(p => p.iso === c.iso))];
    if (combined.length === 0) {
      container.innerHTML = `
        <div class="country-no-results">
          <span>🔍</span> No country found for "${query}".
        </div>
      `;
      return;
    }

    html += `<div class="country-group-label">SEARCH RESULTS (${combined.length})</div>`;
    combined.forEach(c => {
      html += renderCountryItemHtml(c);
    });
  } else {
    // Show Top 7 Popular NRI Countries
    if (popular.length > 0) {
      html += `<div class="country-group-label">⭐ POPULAR NRI COUNTRIES</div>`;
      popular.forEach(c => {
        html += renderCountryItemHtml(c);
      });
    }

    // Show All Countries
    html += `<div class="country-group-label">ALL COUNTRIES (A–Z)</div>`;
    all.forEach(c => {
      html += renderCountryItemHtml(c);
    });
  }

  container.innerHTML = html;

  // Bind click handlers to country items
  container.querySelectorAll('.country-item').forEach(item => {
    item.addEventListener('click', () => {
      const iso = item.dataset.iso;
      setSelectedCountry(iso);
      closeDropdown();

      const phoneInput = document.getElementById('phone');
      if (phoneInput) phoneInput.focus();
    });

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = item.nextElementSibling;
        if (next && next.classList.contains('country-item')) {
          next.focus();
        } else if (next && next.nextElementSibling) {
          next.nextElementSibling.focus();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = item.previousElementSibling;
        if (prev && prev.classList.contains('country-item')) {
          prev.focus();
        } else if (prev && prev.previousElementSibling) {
          prev.previousElementSibling.focus();
        } else {
          document.getElementById('countrySearchInput')?.focus();
        }
      }
    });
  });
}

function renderCountryItemHtml(c) {
  const isSelected = (currentSelectedCountry.iso === c.iso);
  const activeClass = isSelected ? 'active' : '';

  return `
    <div class="country-item ${activeClass}" role="option" aria-selected="${isSelected}" tabindex="0" data-iso="${c.iso}" data-dial="${c.dialCode}">
      <span class="country-item-flag">${c.flag}</span>
      <span class="country-item-name">${c.name}</span>
      <span class="country-item-dial">${c.dialCode}</span>
      ${isSelected ? '<span class="country-item-check">✓</span>' : ''}
    </div>
  `;
}
