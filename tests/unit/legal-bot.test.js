import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { findBestAnswer, checkConversationalIntent, LEGAL_KB, SmartWillLegalBot } from '../../js/ui/legalBot.js';

describe('SmartWill Legal Assistant Bot — Conversational AI & Legal Engine', () => {
  describe('Conversational Greeting & Intent Handling', () => {
    it('should properly respond to simple "hi"', () => {
      const result = findBestAnswer('hi');
      expect(result).not.toBeNull();
      expect(result.id).toBe('intent_greeting');
      expect(result.answer).toContain('Hello! 👋');
      expect(result.cta.action).toBe('view_sample');
    });

    it('should properly respond to "hello" and variations like "hey", "hii", "namaste"', () => {
      const queries = ['hello', 'hey', 'hii', 'hiii', 'namaste', 'namaskar', 'good morning', 'vanakkam'];
      for (const q of queries) {
        const result = findBestAnswer(q);
        expect(result, `Query "${q}" should return a greeting match`).not.toBeNull();
        expect(result.id).toBe('intent_greeting');
        expect(result.answer).toContain('Hello! 👋');
      }
    });

    it('should respond in Telugu for Telugu greetings', () => {
      const teluguQueries = ['హలో', 'హాయ్', 'నమస్తే', 'నమస్కారం'];
      for (const q of teluguQueries) {
        const result = findBestAnswer(q, true);
        expect(result, `Telugu query "${q}" should return a Telugu greeting`).not.toBeNull();
        expect(result.id).toBe('intent_greeting');
        expect(result.answer).toContain('నమస్కారం');
      }
    });

    it('should handle casual pleasantries like "how are you" and "hi how are you"', () => {
      const res1 = findBestAnswer('how are you');
      expect(res1).not.toBeNull();
      expect(res1.id).toBe('intent_greeting_pleasantry');

      const res2 = findBestAnswer('hi how are you');
      expect(res2).not.toBeNull();
      expect(res2.id).toBe('intent_greeting_pleasantry');
    });

    it('should handle identity and capability inquiries: "who are you", "help", "what can you do"', () => {
      const helpQueries = ['who are you', 'what can you do', 'help', 'what is smartwill'];
      for (const q of helpQueries) {
        const result = findBestAnswer(q);
        expect(result, `Query "${q}" should return help/identity info`).not.toBeNull();
        expect(result.id).toBe('intent_help');
        expect(result.answer).toContain('SmartWill Legal Guide');
      }
    });

    it('should explain the 3-step process for "how does it work" and "steps"', () => {
      const processQueries = ['how does it work', 'how it works', 'steps', 'procedure', 'how to make will'];
      for (const q of processQueries) {
        const result = findBestAnswer(q);
        expect(result, `Query "${q}" should return how-it-works steps`).not.toBeNull();
        expect(result.id).toBe('intent_how_it_works');
        expect(result.answer).toContain('Step 1');
        expect(result.answer).toContain('Step 2');
        expect(result.answer).toContain('Step 3');
      }
    });

    it('should reassure users asking about legitimacy, scam, or fake: "is this legit"', () => {
      const trustQueries = ['is this legit', 'is it real', 'is this a scam', 'can i trust this'];
      for (const q of trustQueries) {
        const result = findBestAnswer(q);
        expect(result, `Query "${q}" should reassure about legitimacy`).not.toBeNull();
        expect(result.id).toBe('intent_trust');
        expect(result.answer).toContain('100% legitimate');
      }
    });

    it('should route human contact requests: "talk to human", "phone", "whatsapp"', () => {
      const contactQueries = ['talk to human', 'agent', 'contact', 'call', 'whatsapp support'];
      for (const q of contactQueries) {
        const result = findBestAnswer(q);
        expect(result, `Query "${q}" should provide helpdesk contact details`).not.toBeNull();
        expect(result.id).toBe('intent_human_support');
        expect(result.answer).toContain('smartwillindia.help@gmail.com');
      }
    });

    it('should politely handle gratitude: "thank you", "thanks"', () => {
      const thanksQueries = ['thank you', 'thanks', 'thx', 'awesome thanks'];
      for (const q of thanksQueries) {
        const result = findBestAnswer(q);
        expect(result).not.toBeNull();
        expect(result.id).toBe('intent_thanks');
      }
    });

    it('should warmly handle goodbyes: "bye", "goodbye"', () => {
      const byeQueries = ['bye', 'goodbye', 'see you'];
      for (const q of byeQueries) {
        const result = findBestAnswer(q);
        expect(result).not.toBeNull();
        expect(result.id).toBe('intent_goodbye');
      }
    });
  });

  describe('Statutory Legal Knowledge Base Matching (English)', () => {
    it('should answer questions on plain paper validity under Section 63', () => {
      const result = findBestAnswer('is plain paper valid in court?');
      expect(result).not.toBeNull();
      expect(result.id).toBe('validity_plain_paper');
      expect(result.answer).toContain('Section 63');
    });

    it('should answer questions on nominee vs legal heir trap', () => {
      const result = findBestAnswer('does nominee get all my money?');
      expect(result).not.toBeNull();
      expect(result.id).toBe('nominee_trap');
      expect(result.answer).toContain('Supreme Court');
    });

    it('should answer questions on registration being optional', () => {
      const result = findBestAnswer('is registration compulsory with sub registrar?');
      expect(result).not.toBeNull();
      expect(result.id).toBe('registration_sub_registrar');
      expect(result.answer).toContain('Section 18');
    });

    it('should answer who can sign as 2 witnesses under Section 67', () => {
      const result = findBestAnswer('who can sign as my two witnesses?');
      expect(result).not.toBeNull();
      expect(result.id).toBe('two_witnesses');
      expect(result.answer).toContain('Section 67');
    });

    it('should trigger sample will preview for sample requests', () => {
      const result = findBestAnswer('can i see a sample will?');
      expect(result).not.toBeNull();
      expect(result.id).toBe('sample_will_preview');
      expect(result.cta.action).toBe('view_sample');
    });

    it('should answer handwritten holographic will legality', () => {
      const result = findBestAnswer('can a will be handwritten with pen?');
      expect(result).not.toBeNull();
      expect(result.id).toBe('holographic_handwritten');
    });

    it('should answer will vs gift deed comparison', () => {
      const result = findBestAnswer('difference between will vs gift deed?');
      expect(result).not.toBeNull();
      expect(result.id).toBe('will_vs_gift_deed');
    });
  });

  describe('Telugu Legal Queries & Quick Chips', () => {
    it('should answer "సాదా కాగితం చెల్లుతుందా?" in Telugu with Section 63', () => {
      const result = findBestAnswer('సాదా కాగితం చెల్లుతుందా?');
      expect(result).not.toBeNull();
      expect(result.id).toBe('validity_plain_paper');
      expect(result.answer).toContain('100% చట్టబద్ధంగా చెల్లుతుంది');
      expect(result.answer).toContain('సెక్షన్ 63');
    });

    it('should answer "నామినీకి డబ్బు చెందుతుందా?" in Telugu', () => {
      const result = findBestAnswer('నామినీకి డబ్బు చెందుతుందా?');
      expect(result).not.toBeNull();
      expect(result.id).toBe('nominee_trap');
      expect(result.answer).toContain('నామినీ అంటే యజమాని కాదు');
    });

    it('should answer "రిజిస్ట్రేషన్ తప్పనిసరా?" in Telugu', () => {
      const result = findBestAnswer('రిజిస్ట్రేషన్ తప్పనిసరా?');
      expect(result).not.toBeNull();
      expect(result.id).toBe('registration_sub_registrar');
      expect(result.answer).toContain('రిజిస్ట్రేషన్ పూర్తిగా ఐచ్ఛికం');
    });

    it('should answer "సాక్షులు ఎవరు ఉండాలి?" in Telugu', () => {
      const result = findBestAnswer('సాక్షులు ఎవరు ఉండాలి?');
      expect(result).not.toBeNull();
      expect(result.id).toBe('two_witnesses');
      expect(result.answer).toContain('ఇద్దరు మేజర్లు');
    });

    it('should answer "లాయర్ vs స్మార్ట్‌విల్" in Telugu', () => {
      const result = findBestAnswer('లాయర్ vs స్మార్ట్‌విల్');
      expect(result).not.toBeNull();
      expect(result.id).toBe('cost_lawyer_vs_smartwill');
      expect(result.answer).toContain('లీగల్ ఆటోమేషన్');
    });

    it('should answer "నమూనా వీలునామా చూడండి" in Telugu', () => {
      const result = findBestAnswer('నమూనా వీలునామా చూడండి');
      expect(result).not.toBeNull();
      expect(result.id).toBe('sample_will_preview');
      expect(result.answer).toContain('నమూనా వీలునామాను ఉచితంగా చూడవచ్చు');
    });
  });

  describe('Route and Language Detection', () => {
    let originalLocation;
    let bot;

    beforeEach(() => {
      bot = new SmartWillLegalBot();
      originalLocation = window.location;
    });

    afterEach(() => {
      delete window.location;
      window.location = originalLocation;
      document.documentElement.lang = 'en';
    });

    it('should detect English for /terms route (never false-positive match /te)', () => {
      delete window.location;
      window.location = new URL('https://smartwill-india.vercel.app/terms');
      document.documentElement.lang = 'en';
      expect(bot.detectLanguage()).toBe('en');
    });

    it('should detect English for /terms.html route', () => {
      delete window.location;
      window.location = new URL('https://smartwill-india.vercel.app/terms.html');
      document.documentElement.lang = 'en';
      expect(bot.detectLanguage()).toBe('en');
    });

    it('should detect English for /blog route', () => {
      delete window.location;
      window.location = new URL('https://smartwill-india.vercel.app/blog');
      document.documentElement.lang = 'en';
      expect(bot.detectLanguage()).toBe('en');
    });

    it('should detect Telugu for /te/ route', () => {
      delete window.location;
      window.location = new URL('https://smartwill-india.vercel.app/te/');
      expect(bot.detectLanguage()).toBe('te');
    });

    it('should detect Telugu for /te route', () => {
      delete window.location;
      window.location = new URL('https://smartwill-india.vercel.app/te');
      expect(bot.detectLanguage()).toBe('te');
    });
  });
});

