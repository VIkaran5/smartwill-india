/**
 * js/ui/nomineeCheck.js
 * Interactive 30-Second "Nominee vs Legal Heir" Reality Check & Risk Calculator
 * Demonstrates the Supreme Court precedent (Ram Chander Talwar v. Devinder Kumar Talwar)
 * and drives user conversion to create a legally binding Will.
 */

import { t, currentLang } from '../i18n/index.js';

export function initNomineeCheck() {
  const container = document.getElementById('nomineeCheckWidget');
  if (!container) {
    console.warn('[NomineeCheck] #nomineeCheckWidget container not found.');
    return;
  }

  // Prevent duplicate binding
  if (container.dataset.initialized === 'true') return;
  container.dataset.initialized = 'true';

  let currentStep = 1;
  const userAnswers = {
    assets: [],
    hasNominees: null,
    hasWill: null
  };

  const steps = {
    step1: container.querySelector('.quiz-step-1'),
    step2: container.querySelector('.quiz-step-2'),
    step3: container.querySelector('.quiz-step-3'),
    result: container.querySelector('.quiz-step-result')
  };

  const progressBar = container.querySelector('.quiz-progress-fill');
  const stepIndicator = container.querySelector('.quiz-step-indicator');
  const step1NextBtn = container.querySelector('#quizStep1Next');
  const chipsGrid = container.querySelector('.quiz-chips-grid');

  function updateProgress(step) {
    if (progressBar) {
      const progressMap = { 1: '25%', 2: '60%', 3: '90%', 4: '100%' };
      progressBar.style.width = progressMap[step] || '25%';
    }

    if (stepIndicator) {
      if (step <= 3) {
        stepIndicator.textContent = `Question ${step} of 3`;
        stepIndicator.style.display = 'block';
      } else {
        stepIndicator.style.display = 'none';
      }
    }
  }

  function showStep(stepNum) {
    currentStep = stepNum;
    Object.values(steps).forEach(s => {
      if (s) {
        s.classList.remove('active');
        s.style.display = 'none';
      }
    });

    if (stepNum === 1 && steps.step1) {
      steps.step1.classList.add('active');
      steps.step1.style.display = 'block';
    } else if (stepNum === 2 && steps.step2) {
      steps.step2.classList.add('active');
      steps.step2.style.display = 'block';
    } else if (stepNum === 3 && steps.step3) {
      steps.step3.classList.add('active');
      steps.step3.style.display = 'block';
    } else if (stepNum === 4 && steps.result) {
      renderResult();
      steps.result.classList.add('active');
      steps.result.style.display = 'block';
    }
    updateProgress(stepNum);
  }

  // ── Step 1: Asset Chips (Event Delegation on Grid) ──
  if (chipsGrid) {
    chipsGrid.addEventListener('click', (e) => {
      const chip = e.target.closest('.quiz-chip');
      if (!chip) return;

      chip.classList.toggle('selected');
      const val = chip.dataset.val;

      if (chip.classList.contains('selected')) {
        if (!userAnswers.assets.includes(val)) userAnswers.assets.push(val);
      } else {
        userAnswers.assets = userAnswers.assets.filter(a => a !== val);
      }

      if (step1NextBtn) {
        const hasSelection = userAnswers.assets.length > 0;
        step1NextBtn.disabled = !hasSelection;
        if (hasSelection) {
          step1NextBtn.classList.remove('disabled');
          step1NextBtn.style.opacity = '1';
          step1NextBtn.style.cursor = 'pointer';
        } else {
          step1NextBtn.classList.add('disabled');
          step1NextBtn.style.opacity = '0.5';
          step1NextBtn.style.cursor = 'not-allowed';
        }
      }
    });
  }

  if (step1NextBtn) {
    step1NextBtn.addEventListener('click', () => {
      if (userAnswers.assets.length > 0) {
        showStep(2);
      }
    });
  }

  // ── Step 2: Nominee Status (Event Delegation on List) ──
  const step2List = container.querySelector('.quiz-step-2 .quiz-options-list');
  if (step2List) {
    step2List.addEventListener('click', (e) => {
      const opt = e.target.closest('.quiz-option-card');
      if (!opt) return;

      userAnswers.hasNominees = opt.dataset.val;
      step2List.querySelectorAll('.quiz-option-card').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      setTimeout(() => showStep(3), 220);
    });
  }

  // ── Step 3: Will Status (Event Delegation on List) ──
  const step3List = container.querySelector('.quiz-step-3 .quiz-options-list');
  if (step3List) {
    step3List.addEventListener('click', (e) => {
      const opt = e.target.closest('.quiz-option-card');
      if (!opt) return;

      userAnswers.hasWill = opt.dataset.val;
      step3List.querySelectorAll('.quiz-option-card').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      setTimeout(() => showStep(4), 250);
    });
  }

  // ── Step 4: Render Calculated Result ──
  function renderResult() {
    const resultBox = container.querySelector('.quiz-result-content');
    if (!resultBox) return;

    const isProtected = userAnswers.hasWill === 'yes_has_will';

    if (isProtected) {
      resultBox.innerHTML = `
        <div class="result-badge-wrap">
          <span class="quiz-badge badge-success">
            <i data-lucide="shield-check"></i> PROTECTED STATUS
          </span>
        </div>
        <h3 class="result-title text-emerald">Great Job! You Have Taken Action.</h3>
        <p class="result-desc">
          Having a signed and witnessed Will protects your assets from arbitrary succession delays. 
          Make sure your Will is updated whenever you acquire new property, open fresh bank/demat accounts, or welcome new family members.
        </p>
        <div class="result-cta-bar">
          <a href="app.html" class="btn btn-gold btn-lg shadow-gold quiz-result-cta">
            <span class="quiz-cta-text">Update or Review Will</span>
            <span class="quiz-cta-action">
              <span class="quiz-cta-sep">—</span>
              <span class="quiz-cta-price">₹299</span>
              <i data-lucide="arrow-right"></i>
            </span>
          </a>
          <button type="button" class="btn btn-outline btn-sm quiz-reset-btn" id="quizRetakeBtn">
            <i data-lucide="rotate-ccw"></i> Retake Reality Check
          </button>
        </div>
      `;
    } else {
      resultBox.innerHTML = `
        <div class="result-badge-wrap">
          <span class="quiz-badge badge-danger">
            <i data-lucide="alert-triangle"></i> CRITICAL LEGAL RISK: THE NOMINEE TRAP
          </span>
        </div>
        <h3 class="result-title text-rose">Your Nominee Does NOT Legally Own Your Assets!</h3>
        
        <div class="supreme-court-callout">
          <div class="sc-badge">
            <i data-lucide="scale"></i> Supreme Court Landmark Precedent
          </div>
          <p class="sc-text">
            Under Indian law (<strong>Ram Chander Talwar v. Devinder Kumar Talwar</strong> and <strong>Sarbati Devi v. Usha Devi</strong>), 
            a bank or demat <strong>Nominee is merely a temporary custodian</strong>, NOT the legal heir. 
            Any other legal heir (children, parents, siblings) can challenge the nominee in civil court!
          </p>
        </div>

        <div class="risk-metrics-grid">
          <div class="risk-metric-card glass-card">
            <div class="metric-icon text-rose"><i data-lucide="clock"></i></div>
            <div class="metric-val text-rose">12 – 24 Months</div>
            <div class="metric-label">Court Succession Certificate Delay</div>
          </div>
          <div class="risk-metric-card glass-card">
            <div class="metric-icon text-rose"><i data-lucide="coins"></i></div>
            <div class="metric-val text-rose">₹25,000 – ₹1,00,000+</div>
            <div class="metric-label">Legal Fees & Court Valuation Fees</div>
          </div>
          <div class="risk-metric-card glass-card highlight-metric">
            <div class="metric-icon text-gold"><i data-lucide="check-circle-2"></i></div>
            <div class="metric-val text-gold">10 Mins • ₹299</div>
            <div class="metric-label">SmartWill Instant Legal Protection</div>
          </div>
        </div>

        <div class="result-cta-bar">
          <a href="app.html" class="btn btn-gold btn-lg shadow-gold quiz-result-cta">
            <span class="quiz-cta-text">Protect Your Family's Wealth</span>
            <span class="quiz-cta-action">
              <span class="quiz-cta-sep">—</span>
              <span class="quiz-cta-price">₹299</span>
              <i data-lucide="arrow-right"></i>
            </span>
          </a>
          <button type="button" class="btn btn-whatsapp" id="quizWhatsAppBtn">
            <i data-lucide="share-2"></i> Share This Reality Check on WhatsApp
          </button>
          <button type="button" class="btn-link quiz-reset-btn" id="quizRetakeBtn">
            Retake Check ↺
          </button>
        </div>
      `;
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }

    // Bind WhatsApp share
    const waBtn = resultBox.querySelector('#quizWhatsAppBtn');
    if (waBtn) {
      waBtn.addEventListener('click', () => {
        const text = encodeURIComponent(
          "⚠️ Did you know? In India, a Bank Nominee does NOT own your money—they are only temporary caretakers under Supreme Court law! Without a written Will, families face frozen accounts and court succession delays.\n\nTake the 30-Second Asset Safety Check here:\nhttps://www.smartwillindia.in/#nominee-check"
        );
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
      });
    }

    // Bind Retake
    const retakeBtn = resultBox.querySelector('#quizRetakeBtn');
    if (retakeBtn) {
      retakeBtn.addEventListener('click', () => {
        userAnswers.assets = [];
        userAnswers.hasNominees = null;
        userAnswers.hasWill = null;
        if (chipsGrid) {
          chipsGrid.querySelectorAll('.quiz-chip').forEach(c => c.classList.remove('selected'));
        }
        if (step2List) {
          step2List.querySelectorAll('.quiz-option-card').forEach(o => o.classList.remove('selected'));
        }
        if (step3List) {
          step3List.querySelectorAll('.quiz-option-card').forEach(o => o.classList.remove('selected'));
        }
        if (step1NextBtn) {
          step1NextBtn.disabled = true;
          step1NextBtn.style.opacity = '0.5';
          step1NextBtn.style.cursor = 'not-allowed';
        }
        showStep(1);
      });
    }
  }

  // Initial step
  showStep(1);
}

// Attach globally for zero-fail invocation
if (typeof window !== 'undefined') {
  window.initNomineeCheck = initNomineeCheck;
}
