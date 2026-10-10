/**
 * reviewWidget.js
 * SmartWill India — Zero-Friction 1-Tap Experience Rating & Emotional Reactions
 * 
 * Features:
 * 1. 5 Vibrant Emotional Reactions: Irresistible 1-tap avatars (Hard, Confusing, Okay, Smooth, Effortless).
 * 2. Instant Local Storage: Captures rating immediately on tap with zero typing required.
 * 3. Smart Reputation Shield:
 *    - Positive (Smooth / Effortless) -> Celebratory tags + "Help others on Google" button.
 *    - Critical (Hard / Confusing / Okay) -> Private concierge feedback to protect public ratings.
 * 4. Value-Driven Impact Tags: High dopamine chips like "⚡ Done in 5 Mins", "💰 Saved Lawyer Fees".
 */

import { logger } from '../services/logger.js';
import { showToast } from './toast.js';

const STORAGE_KEY = 'sw_user_rating';

export function initReviewWidget() {
  const container = document.getElementById('willReviewWidget');
  if (!container) return;

  const moodBtns = container.querySelectorAll('.mood-reaction-btn');
  const detailsBox = document.getElementById('reviewDetailsBox');
  const positivePrompt = document.getElementById('reviewPositivePrompt');
  const criticalPrompt = document.getElementById('reviewCriticalPrompt');
  const commentInput = document.getElementById('reviewCommentInput');
  const submitBtn = document.getElementById('reviewSubmitBtn');
  const googleBtn = document.getElementById('reviewGoogleBtn');
  const successState = document.getElementById('reviewSuccessState');
  const formState = document.getElementById('reviewFormState');
  const ratingStatusText = document.getElementById('reviewStatusText');
  const tagChips = container.querySelectorAll('.review-tag-chip');
  const editRatingBtn = document.getElementById('reviewEditRatingBtn');

  let currentRating = 0;
  const selectedTags = new Set();

  function getOrderId() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlOrder = urlParams.get('order_id') || urlParams.get('orderId');
      if (urlOrder) return urlOrder;
      return sessionStorage.getItem('sw_session_paid_order') ||
             localStorage.getItem('sw_last_paid_order_id') ||
             'TXN_DIRECT';
    } catch (e) {
      return 'TXN_DIRECT';
    }
  }

  const moodLabels = {
    1: '😫 Difficult — Tell us what happened so we can help',
    2: '😕 A bit confusing — We want to improve this for you',
    3: '😐 Okay — Functional, but can be smoother',
    4: '😊 Smooth & Easy — Wonderful to hear!',
    5: '🚀 Effortless & Loved It! — Family Secured!'
  };

  function renderMoodSelection(rating) {
    moodBtns.forEach(btn => {
      const btnRating = parseInt(btn.dataset.rating, 10);
      if (btnRating === rating) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (ratingStatusText && rating > 0) {
      ratingStatusText.textContent = moodLabels[rating] || '';
      ratingStatusText.classList.remove('hidden');
    }
  }

  function restoreExistingRating() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const data = JSON.parse(saved);
      if (data && data.rating >= 1 && data.rating <= 5) {
        currentRating = data.rating;
        renderMoodSelection(currentRating);
        if (data.status === 'submitted') {
          showSuccessView(data.rating, false);
        }
      }
    } catch (e) {
      logger.warn('Failed to parse stored review:', e);
    }
  }

  function handleRatingClick(rating) {
    currentRating = rating;
    renderMoodSelection(rating);

    // 1. INSTANT CAPTURE: Zero typing needed — record vote immediately
    const initialPayload = {
      rating: currentRating,
      tags: Array.from(selectedTags),
      comment: (commentInput ? commentInput.value : '').trim(),
      orderId: getOrderId(),
      timestamp: new Date().toISOString(),
      status: 'tapped'
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialPayload));
    } catch (e) {}

    // Analytics
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'rate_experience', {
        event_category: 'feedback',
        rating: currentRating
      });
    }

    // 2. Smoothly reveal details box
    if (detailsBox) {
      detailsBox.classList.remove('hidden');
      detailsBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // 3. Sentiment Branching
    if (currentRating >= 4) {
      if (positivePrompt) positivePrompt.classList.remove('hidden');
      if (criticalPrompt) criticalPrompt.classList.add('hidden');
      if (googleBtn) googleBtn.classList.remove('hidden');
      if (submitBtn) {
        submitBtn.innerHTML = '<i data-lucide="check" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> Submit Review';
      }
    } else {
      if (positivePrompt) positivePrompt.classList.add('hidden');
      if (criticalPrompt) criticalPrompt.classList.remove('hidden');
      if (googleBtn) googleBtn.classList.add('hidden'); // Shield negative rating from public Google
      if (submitBtn) {
        submitBtn.innerHTML = '<i data-lucide="send" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> Send Private Feedback';
      }
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // Setup Reaction Listeners
  moodBtns.forEach(btn => {
    const rating = parseInt(btn.dataset.rating, 10);

    btn.addEventListener('mouseenter', () => {
      if (!currentRating) {
        if (ratingStatusText) {
          ratingStatusText.textContent = moodLabels[rating] || '';
          ratingStatusText.classList.remove('hidden');
        }
      }
    });

    btn.addEventListener('mouseleave', () => {
      if (!currentRating && ratingStatusText) {
        ratingStatusText.classList.add('hidden');
      } else if (currentRating && ratingStatusText) {
        ratingStatusText.textContent = moodLabels[currentRating] || '';
      }
    });

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      handleRatingClick(rating);
    });
  });

  // Setup Tag Chip Selection
  tagChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const tagText = chip.dataset.tag || chip.textContent.trim();
      if (selectedTags.has(tagText)) {
        selectedTags.delete(tagText);
        chip.classList.remove('active');
      } else {
        selectedTags.add(tagText);
        chip.classList.add('active');
      }
    });
  });

  function showSuccessView(rating, triggerToast = true) {
    if (formState) formState.classList.add('hidden');
    if (successState) successState.classList.remove('hidden');
    const successRatingDisplay = document.getElementById('reviewSuccessRatingDisplay');
    const moodEmojis = { 1: '😫', 2: '😕', 3: '😐', 4: '😊', 5: '🚀' };
    if (successRatingDisplay) {
      successRatingDisplay.textContent = (moodEmojis[rating] || '⭐') + ' ' + (rating >= 4 ? '5/5' : `${rating}/5`);
    }
    if (triggerToast) {
      showToast('success', 'Feedback Received! ❤️', 'Thank you for helping us protect Indian families.');
    }
  }

  // Submit Feedback Handler
  if (submitBtn) {
    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Saving...';

      const finalPayload = {
        rating: currentRating,
        tags: Array.from(selectedTags),
        comment: commentInput ? commentInput.value.trim() : '',
        orderId: getOrderId(),
        timestamp: new Date().toISOString(),
        status: 'submitted'
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(finalPayload));
      } catch (err) {
        logger.warn('Storage save failed:', err);
      }

      try {
        await fetch('/api/submit-review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalPayload)
        });
      } catch (netErr) {
        logger.info('Network sync notice (saved locally):', netErr.message);
      }

      showSuccessView(currentRating, true);
    });
  }

  // Edit / Change Rating Handler
  if (editRatingBtn) {
    editRatingBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (successState) successState.classList.add('hidden');
      if (formState) formState.classList.remove('hidden');
      if (detailsBox) detailsBox.classList.remove('hidden');
    });
  }

  restoreExistingRating();
}
