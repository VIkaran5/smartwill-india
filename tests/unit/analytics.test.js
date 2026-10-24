import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  trackEvent,
  trackLandingCtaClick,
  trackWizardStart,
  trackStepCompleted,
  trackStepViewed,
  trackDraftPreviewOpened,
  trackBeginCheckout,
  GA_MEASUREMENT_ID
} from '../../js/services/analytics.js';

describe('Analytics Funnel Service', () => {
  beforeEach(() => {
    window.gtag = vi.fn();
  });

  afterEach(() => {
    delete window.gtag;
  });

  it('safely calls window.gtag with GA_MEASUREMENT_ID and custom payload', () => {
    trackEvent('custom_event', { test_key: 'test_val' });
    expect(window.gtag).toHaveBeenCalledTimes(1);
    expect(window.gtag).toHaveBeenCalledWith('event', 'custom_event', {
      send_to: GA_MEASUREMENT_ID,
      test_key: 'test_val'
    });
  });

  it('handles missing window.gtag gracefully without throwing an error', () => {
    delete window.gtag;
    expect(() => trackEvent('test_without_gtag')).not.toThrow();
  });

  it('handles throwing inside window.gtag gracefully', () => {
    window.gtag = () => {
      throw new Error('Analytics blocked by adblock');
    };
    expect(() => trackEvent('test_adblock')).not.toThrow();
  });

  it('tracks landing CTA click with text and location', () => {
    trackLandingCtaClick('Start Your Will - ₹299', 'hero');
    expect(window.gtag).toHaveBeenCalledWith('event', 'click_create_will_cta', {
      send_to: GA_MEASUREMENT_ID,
      cta_text: 'Start Your Will - ₹299',
      cta_location: 'hero',
      destination: '/app'
    });
  });

  it('tracks wizard start event', () => {
    trackWizardStart();
    expect(window.gtag).toHaveBeenCalledWith('event', 'start_will_wizard', {
      send_to: GA_MEASUREMENT_ID,
      step_number: 1,
      step_name: 'personal'
    });
  });

  it('tracks step completion with mapped names and metadata', () => {
    trackStepCompleted(1);
    expect(window.gtag).toHaveBeenCalledWith('event', 'step_personal_completed', {
      send_to: GA_MEASUREMENT_ID,
      step_number: 1,
      step_name: 'personal'
    });

    trackStepCompleted(2, { asset_count: 3 });
    expect(window.gtag).toHaveBeenCalledWith('event', 'step_assets_completed', {
      send_to: GA_MEASUREMENT_ID,
      step_number: 2,
      step_name: 'assets',
      asset_count: 3
    });

    trackStepCompleted(3, { beneficiary_count: 2 });
    expect(window.gtag).toHaveBeenCalledWith('event', 'step_family_completed', {
      send_to: GA_MEASUREMENT_ID,
      step_number: 3,
      step_name: 'family',
      beneficiary_count: 2
    });
  });

  it('tracks step viewed event', () => {
    trackStepViewed(5);
    expect(window.gtag).toHaveBeenCalledWith('event', 'step_review_viewed', {
      send_to: GA_MEASUREMENT_ID,
      step_number: 5,
      step_name: 'review'
    });
  });

  it('tracks draft preview opened', () => {
    trackDraftPreviewOpened('te');
    expect(window.gtag).toHaveBeenCalledWith('event', 'draft_preview_opened', {
      send_to: GA_MEASUREMENT_ID,
      draft_lang: 'te'
    });
  });

  it('tracks begin checkout with standard ecommerce parameters', () => {
    trackBeginCheckout(299);
    expect(window.gtag).toHaveBeenCalledWith('event', 'begin_checkout', {
      send_to: GA_MEASUREMENT_ID,
      value: 299,
      currency: 'INR',
      items: [{
        item_id: 'smartwill_legal_draft',
        item_name: 'SmartWill Legal Will Document',
        price: 299,
        quantity: 1
      }]
    });
  });
});
