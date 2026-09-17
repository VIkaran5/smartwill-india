/* i18n Translations Engine for SmartWill India (EN, TE, HI) */
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../config/constants.js';
import { en } from './dictionaries/en.js';
import { te } from './dictionaries/te.js';
import { hi } from './dictionaries/hi.js';

export const dictionaries = { en, te, hi };

// Determine initial language (localStorage -> Cloud/Browser Auto-Detect -> Default)
export function detectInitialLanguage() {
  if (typeof localStorage !== 'undefined') {
    const savedLang = localStorage.getItem('smartwill_lang');
    if (savedLang && dictionaries[savedLang]) {
      return savedLang;
    }
  }

  // First visit browser language auto-detection
  try {
    if (typeof navigator !== 'undefined') {
      const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
      if (browserLang.startsWith('te')) return 'te';
      if (browserLang.startsWith('hi')) return 'hi';
    }
  } catch (e) {
    // Fallback on error
  }

  return DEFAULT_LANGUAGE;
}

export let currentLang = detectInitialLanguage();

export function setLanguage(lang, isManualClick = false) {
  if (!dictionaries[lang]) lang = DEFAULT_LANGUAGE;
  currentLang = lang;

  localStorage.setItem('smartwill_lang', lang);
  if (isManualClick) {
    localStorage.setItem('smartwill_lang_manual', 'true');
  }

  // Update html lang attribute for accessibility & SEO
  document.documentElement.lang = lang;

  // Sync PDF document language choice radio button if present
  if (lang === 'te') {
    const radioTe = document.getElementById('pdfLangTe');
    if (radioTe) radioTe.checked = true;
  } else if (lang === 'hi') {
    const radioHi = document.getElementById('pdfLangHi');
    if (radioHi) radioHi.checked = true;
  } else {
    const radioEn = document.getElementById('pdfLangEn');
    if (radioEn) radioEn.checked = true;
  }

  // Update active state on language switcher buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Apply translations with non-blocking transition
  applyTranslations(lang);
}

export function applyTranslations(lang) {
  const dict = dictionaries[lang] || dictionaries[DEFAULT_LANGUAGE];

  // Query all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict && dict[key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.hasAttribute('placeholder')) {
          el.setAttribute('placeholder', dict[key]);
        }
      } else if (el.tagName === 'OPTION') {
        el.textContent = dict[key];
      } else {
        el.textContent = dict[key];
      }
    }
  });

  // Query all data-i18n-placeholder elements
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict && dict[key]) {
      el.setAttribute('placeholder', dict[key]);
    }
  });
}

export function t(key, fallback = null) {
  const dict = dictionaries[currentLang] || dictionaries[DEFAULT_LANGUAGE];
  if (dict && dict[key]) return dict[key];
  if (dictionaries['en'] && dictionaries['en'][key]) return dictionaries['en'][key];
  return fallback || key;
}

export function initI18n() {
  setLanguage(currentLang);
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetLang = e.currentTarget.dataset.lang || e.target.dataset.lang;
      if (targetLang) setLanguage(targetLang, true);
    });
  });
}

// Auto-initialize on DOM ready (browser only)
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initI18n());
  } else {
    initI18n();
  }
}

// Live getter so window.currentLang always reflects the current language (browser only)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'currentLang', { get: () => currentLang, configurable: true });
  window.setLanguage = setLanguage;
  window.initI18n = initI18n;
  window.t = t;
}
