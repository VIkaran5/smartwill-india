/**
 * SmartWill India — Interactive Product Tour & Zero-Fail Slide Carousel
 * Provides dual-view: Arcade Video Tour + 100% locally hosted Retina Slide Carousel
 * Includes automatic slow-network fallback detection so visitors never see broken iframes.
 */

(function () {
  'use strict';

  const isTelugu = document.documentElement.getAttribute('lang') === 'te' || window.location.pathname.startsWith('/te');

  const slidesData = [
    {
      img: '/assets/arcade-slides/01_smartwill_hero_hook.png',
      titleEn: '1. Fast 10-Minute Questionnaire',
      descEn: 'Start with guided, plain-language questions. No legal jargon, confusing clauses, or intimidating paperwork.',
      titleTe: '1. సులభమైన 10 నిమిషాల ప్రక్రియ',
      descTe: 'సరళమైన ప్రశ్నలతో ప్రారంభించండి. ఎటువంటి క్లిష్టమైన న్యాయ పదాలు లేదా ఇబ్బందికరమైన ఫారమ్‌లు ఉండవు.'
    },
    {
      img: '/assets/arcade-slides/02_personal_legal_details.png',
      titleEn: '2. Personal & Legal Details',
      descEn: 'Enter full legal name, religion, and family status as legally required under the Indian Succession Act.',
      titleTe: '2. వ్యక్తిగత & కుటుంబ వివరాలు',
      descTe: 'భారతీయ వారసత్వ చట్టం ప్రకారం అవసరమైన పూర్తి చట్టపరమైన పేరు, మతం మరియు కుటుంబ వివరాలను నమోదు చేయండి.'
    },
    {
      img: '/assets/arcade-slides/03_assets_portfolio.png',
      titleEn: '3. Comprehensive Asset Portfolio',
      descEn: 'Easily organize bank savings, fixed deposits, mutual funds, gold jewelry, and real estate properties.',
      titleTe: '3. సమగ్ర ఆస్తుల జాబితా',
      descTe: 'బ్యాంక్ ఖాతాలు, FDలు, మ్యూచువల్ ఫండ్స్, బంగారం మరియు స్థిరాస్తులను స్పష్టంగా ఒకే చోట నమోదు చేయండి.'
    },
    {
      img: '/assets/arcade-slides/04_family_beneficiaries.png',
      titleEn: '4. Beneficiaries & Allocation',
      descEn: 'Assign exact percentage shares to your spouse, children, or parents with zero room for future disputes.',
      titleTe: '4. లబ్ధిదారుల కేటాయింపు',
      descTe: 'మీ భార్య/భర్త, పిల్లలు లేదా తల్లిదండ్రులకు స్పష్టమైన శాతం వాటాలను కేటాయించి వివాదాలను నివారించండి.'
    },
    {
      img: '/assets/arcade-slides/05_review_will_summary.png',
      titleEn: '5. Review & Asset Verification',
      descEn: 'Instant structured summary to review all asset allocations and appointed executors before finalizing.',
      titleTe: '5. సమీక్ష & ధృవీకరణ',
      descTe: 'వీలునామా ఖరారు చేయడానికి ముందు మీ కేటాయింపులు మరియు ఎగ్జిక్యూటర్ వివరాలను పూర్తిగా తనిఖీ చేసుకోండి.'
    },
    {
      img: '/assets/arcade-slides/06_legal_will_document.png',
      titleEn: '6. Court-Admissible Legal Will',
      descEn: 'Download your finalized, lawyer-vetted Will formatted strictly under the Indian Succession Act 1925.',
      titleTe: '6. చట్టబద్ధమైన వీలునామా పత్రం',
      descTe: 'ఇండియన్ సక్సెషన్ యాక్ట్ 1925 ప్రకారం రూపొందించబడిన అధికారిక, న్యాయ నిపుణుల ధృవీకరణ పొందిన PDF పత్రం.'
    },
    {
      img: '/assets/arcade-slides/07_physical_will_document.jpg',
      titleEn: '7. Physical Signing & 2 Witnesses',
      descEn: 'Print on plain paper and sign in the presence of 2 witnesses for 100% legal enforceability in court.',
      titleTe: '7. సంతకం & ఇద్దరు సాక్షులు',
      descTe: 'సాధారణ కాగితంపై ప్రింట్ చేసి ఇద్దరు సాక్షుల సమక్షంలో సంతకం చేస్తే భారతీయ కోర్టులలో 100% చట్టబద్ధం అవుతుంది.'
    }
  ];

  let currentIndex = 0;
  let autoplayTimer = null;
  let isUserInteracted = false;

  function initDemoTour() {
    const wrapper = document.querySelector('.demo-player-wrapper');
    if (!wrapper) return;

    const tabBtns = wrapper.querySelectorAll('.demo-tab-btn');
    const viewVideo = wrapper.querySelector('.demo-view-video');
    const viewSlides = wrapper.querySelector('.demo-view-slides');
    const slowHint = document.getElementById('demoSlowHint');
    const iframe = document.getElementById('demoArcadeIframe');

    // Tab switcher
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab');
        switchTab(target);
      });
    });

    window.switchToDemoSlides = function () {
      switchTab('slides');
      if (slowHint) slowHint.style.display = 'none';
    };

    function switchTab(target) {
      tabBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === target));
      if (viewVideo) viewVideo.classList.toggle('active', target === 'video');
      if (viewSlides) viewSlides.classList.toggle('active', target === 'slides');

      if (target === 'slides') {
        startAutoplay();
      } else {
        stopAutoplay();
      }
    }

    // Slow connection / DNS failure detector
    // If Arcade iframe hasn't loaded within 3.8s or network is offline, show fallback prompt
    if (slowHint && iframe) {
      let iframeLoaded = false;

      iframe.addEventListener('load', () => {
        iframeLoaded = true;
        if (slowHint) slowHint.style.display = 'none';
      });

      // Check online status or timeout
      setTimeout(() => {
        if (!iframeLoaded || !navigator.onLine) {
          slowHint.style.display = 'flex';
        }
      }, 3800);

      window.addEventListener('offline', () => {
        slowHint.style.display = 'flex';
      });
    }

    // Render Dots
    const dotsContainer = document.getElementById('demoSlideDots');
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      slidesData.forEach((_, idx) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = `demo-dot ${idx === 0 ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Go to step ${idx + 1}`);
        dot.addEventListener('click', () => {
          isUserInteracted = true;
          goToSlide(idx);
        });
        dotsContainer.appendChild(dot);
      });
    }

    // Navigation buttons
    const prevBtn = document.getElementById('demoPrevBtn');
    const nextBtn = document.getElementById('demoNextBtn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        isUserInteracted = true;
        goToSlide((currentIndex - 1 + slidesData.length) % slidesData.length);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        isUserInteracted = true;
        goToSlide((currentIndex + 1) % slidesData.length);
      });
    }

    // Touch swipe support
    const slideViewer = wrapper.querySelector('.demo-slide-viewer');
    if (slideViewer) {
      let touchStartX = 0;
      let touchEndX = 0;

      slideViewer.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      slideViewer.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 40) {
          isUserInteracted = true;
          if (diff > 0) {
            goToSlide((currentIndex + 1) % slidesData.length);
          } else {
            goToSlide((currentIndex - 1 + slidesData.length) % slidesData.length);
          }
        }
      }, { passive: true });

      // Pause on hover
      slideViewer.addEventListener('mouseenter', stopAutoplay);
      slideViewer.addEventListener('mouseleave', () => {
        if (!isUserInteracted) startAutoplay();
      });
    }

    // Initialize slide 0
    updateSlideDisplay();
  }

  function goToSlide(index) {
    currentIndex = index;
    updateSlideDisplay();
  }

  function updateSlideDisplay() {
    const slide = slidesData[currentIndex];
    if (!slide) return;

    const img = document.getElementById('demoCurrentSlideImg');
    const badge = document.getElementById('demoSlideBadge');
    const title = document.getElementById('demoSlideTitle');
    const desc = document.getElementById('demoSlideDesc');
    const dots = document.querySelectorAll('.demo-dot');

    if (img) {
      img.src = slide.img;
      img.alt = isTelugu ? slide.titleTe : slide.titleEn;
    }

    if (badge) {
      badge.textContent = isTelugu 
        ? `దశ ${currentIndex + 1} / ${slidesData.length}` 
        : `Step ${currentIndex + 1} of ${slidesData.length}`;
    }

    if (title) {
      title.textContent = isTelugu ? slide.titleTe : slide.titleEn;
    }

    if (desc) {
      desc.textContent = isTelugu ? slide.descTe : slide.descEn;
    }

    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentIndex);
    });

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(() => {
      if (!isUserInteracted) {
        currentIndex = (currentIndex + 1) % slidesData.length;
        updateSlideDisplay();
      }
    }, 5500);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDemoTour);
  } else {
    initDemoTour();
  }
})();
