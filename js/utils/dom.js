/* Centralized DOM Elements Cache & Utilities */

export function getEl(id) {
  return document.getElementById(id);
}

export function query(selector) {
  return document.querySelector(selector);
}

export function queryAll(selector) {
  return document.querySelectorAll(selector);
}

export function hide(el) {
  if (el) el.classList.add('hidden');
}

export function show(el) {
  if (el) el.classList.remove('hidden');
}

export function toggle(el, condition) {
  if (!el) return;
  if (condition) show(el);
  else hide(el);
}
