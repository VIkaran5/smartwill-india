/* Landing Page Interactivity Module */

export function initLandingPage() {
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
}

document.addEventListener('DOMContentLoaded', () => {
  initLandingPage();
});
