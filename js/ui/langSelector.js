/* Accessible Responsive Language Selector UI Component for SmartWill India */
import { SUPPORTED_LANGUAGES } from '../config/constants.js';
import { currentLang, setLanguage } from '../i18n/index.js';

export function renderLanguageSelector(containerId = 'langSwitcherContainer') {
  const container = document.getElementById(containerId) || document.querySelector('.lang-switcher');
  if (!container) return;

  container.setAttribute('role', 'region');
  container.setAttribute('aria-label', 'Language Selection');

  const activeLangObj = SUPPORTED_LANGUAGES.find(l => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  let html = `
    <!-- Desktop Pill Switcher -->
    <div class="lang-pills-desktop flex align-center gap-1" role="radiogroup" aria-label="Language Switcher">
  `;

  SUPPORTED_LANGUAGES.forEach(lang => {
    const isActive = lang.code === currentLang;
    html += `
      <button type="button" 
              class="lang-btn ${isActive ? 'active' : ''}" 
              data-lang="${lang.code}"
              role="radio"
              aria-checked="${isActive ? 'true' : 'false'}"
              aria-label="${lang.label}">
        ${lang.nativeLabel}
      </button>
    `;
  });

  html += `
    </div>

    <!-- Mobile Modern Dropdown -->
    <div class="lang-dropdown-mobile">
      <select id="mobileLangSelect" class="form-select lang-select-mobile" aria-label="Select Language">
  `;

  SUPPORTED_LANGUAGES.forEach(lang => {
    html += `
      <option value="${lang.code}" ${lang.code === currentLang ? 'selected' : ''}>
        🌐 ${lang.nativeLabel} (${lang.label})
      </option>
    `;
  });

  html += `
      </select>
    </div>
  `;

  container.innerHTML = html;
  bindLanguageSelectorEvents(container);
}

function bindLanguageSelectorEvents(container) {
  // Desktop pill clicks
  container.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetLang = e.currentTarget.dataset.lang;
      if (targetLang) {
        setLanguage(targetLang, true);
        renderLanguageSelector();
      }
    });
  });

  // Mobile dropdown selection
  const mobileSelect = container.querySelector('#mobileLangSelect');
  if (mobileSelect) {
    mobileSelect.addEventListener('change', (e) => {
      const targetLang = e.target.value;
      if (targetLang) {
        setLanguage(targetLang, true);
        renderLanguageSelector();
      }
    });
  }
}

// Temporary window binding
window.renderLanguageSelector = renderLanguageSelector;
