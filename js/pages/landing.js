/* Landing Page Interactivity Module */
import { initNomineeCheck } from '../ui/nomineeCheck.js';

export function initLandingPage() {
  initNomineeCheck();

  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    item.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });
  // Mobile Sticky Conversion Bar
  const stickyBar = document.getElementById('mobileStickyBar');
  if (stickyBar) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY > 450) {
            stickyBar.classList.add('visible');
          } else {
            stickyBar.classList.remove('visible');
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // Close sample modal on escape or backdrop click
  const sampleModal = document.getElementById('sampleWillModal');
  if (sampleModal) {
    sampleModal.addEventListener('click', (e) => {
      if (e.target === sampleModal) {
        closeSampleWillModal();
      }
    });
  }
}

export function openSampleWillModal() {
  const modal = document.getElementById('sampleWillModal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }
}

export function closeSampleWillModal() {
  const modal = document.getElementById('sampleWillModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

// Global window assignments for inline onclick handlers
if (typeof window !== 'undefined') {
  window.openSampleWillModal = openSampleWillModal;
  window.closeSampleWillModal = closeSampleWillModal;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initLandingPage());
  } else {
    initLandingPage();
  }
}

