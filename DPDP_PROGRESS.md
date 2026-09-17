# SmartWill India — DPDP Act 2023 Compliance Progress Log

**Branch:** compliance/dpdp  
**Date:** September 2026  
**Audited By:** Development Agent  
**Review Status:** Implemented & Verified in Code — Awaiting Formal Legal Sign-Off

---

## 1. Summary of What Was Built

### A. Data Inventory & Mapping
- **Personal Data Points Identified:** Full Legal Name, Date of Birth, Gender, Religion/Personal Law, Government ID (PAN/Aadhaar last 4/Voter ID/Passport), Mobile Number, Email Address, Full Physical Address (Door/Street/City/State/PIN).
- **Financial & Physical Assets:** Bank Name & Account Last 4 Digits, Fixed Deposits, Property/Land, Gold/Jewelry, Mutual Funds, Stocks, Vehicles, Insurance Policies.
- **Family & Beneficiaries:** Beneficiary Legal Names, Relationships, Contact numbers, Govt ID digits, and Minor Guardian/Trustee names under Guardian & Wards Act 1890.
- **Will Execution:** Percentage asset allocations, Appointed Executor details.
- **Processors:** Google Firebase (Auth & Firestore), Cashfree Payments India Pvt Ltd, EmailJS Ltd, Google Analytics 4 (opt-in gated).

### B. Client-Side Storage Encryption (Fix A)
- **File:** js/state/storage.js
- **Mechanism:** Upgraded from insecure Base64 encoding to **AES-GCM 256-bit encryption** using the native Web Crypto API (window.crypto.subtle).
- **Key Derivation:** PBKDF2 (100,000 iterations, SHA-256) keyed by client device ID + local salt.
- **Threat Model Scope:** Protects against casual inspection, shoulder-surfing, public/shared computer inspection in browser dev tools, and generic scraping extensions. Does NOT protect against attackers with full local profile forensic access.

### C. Consent-First Gating (Fix B)
- **Files:** js/state/store.js, js/events/bindings.js, pp.html
- **Behavior:** Un-ticked DPDP Act 2023 Consent checkbox at the top of Step 1.
- **In-Memory Gating:** State changes remain strictly in-memory (state variable) until consent is ticked. No data is written to encrypted localStorage or Firestore before consent is given.
- **Enforcement:** Clicking "Next" on Step 1 is blocked if consent is not granted, with an alert guiding the user to the consent box.

### D. Privacy Notice Page (Fix C)
- **File:** privacy.html (21KB)
- **Sections:** 12 structured sections covering: Data Fiduciary identification, complete data categories table, storage & security architecture, legal basis under DPDP Act 2023 (Section 4 & 6), third-party processors, retention periods, user data rights, cookies/localStorage inventory, minor protection, and Grievance Officer details.
- **Grievance Officer:** Dasari G., SmartWill Digital Technologies India (smartwillindia.help@gmail.com). Response window: 30 days.

### E. GA4 Opt-In Consent Banner (Fix D)
- **Files:** privacy.html, 	erms.html, with banner script gating GA4 execution until the user clicks "Accept". If declined or ignored, GA4 scripts and gtag('config') are withheld.

### F. User Data Rights: Access & Erasure (Fix E)
- **Files:** pp.html, js/events/bindings.js
- **Right to Access (Section 11):** "Download My Data (JSON)" button in the dashboard modal exports a complete JSON backup of the user's data snapshot.
- **Right to Erasure (Section 12):** "Delete My Account & Data" button double-confirms, wipes all local encrypted storage, deletes Firebase Firestore documents, and invokes user.delete() on Firebase Auth.

### G. Terms & Conditions Expansion (Fix F)
- **File:** 	erms.html
- **Changes:** Section 4 expanded into a comprehensive DPDP Act 2023 compliance clause detailing purpose limitation, consent, security, no sale of data, user rights, and breach notification.

### H. Data Breach Incident Runbook (Fix G)
- **File:** BREACH_RUNBOOK.md
- **Components:** Incident response timeline, statutory 72-hour Data Protection Board of India notification template, affected user email notification template, and credential rotation checklist.

### I. Telugu Page Safety Net
- **File:** 	e/index.html
- **Action:** Added <meta name="robots" content="noindex, follow" /> to keep /te/ from being indexed until an independent Telugu reader reviews the legal terms cold.

---

## 2. What Needs Formal Lawyer Review

The following items are marked with <!-- LAWYER REVIEW REQUIRED --> comments and should be reviewed by a qualified Indian legal counsel or DPDP compliance specialist:

1. **Entity Structure:** Representation of "SmartWill Digital Technologies India" as sole Data Fiduciary.
2. **Cross-Border Processing:** Disclosure of Google Cloud (USA) and EmailJS (UK/EU) data hosting under Section 16 of the DPDP Act 2023.
3. **Retention Schedules:** Alignment of policy with architecture — local client drafts auto-expire after 24 hours of inactivity; cloud Firestore drafts persist for the life of the account to allow user editing until explicit user erasure request; payment transaction records retained for 7 years per statutory Indian tax and accounting regulations.
4. **Limitation of Liability:** Terms & Conditions Section 5 disclaiming liability for user-supplied data in generated Wills.
5. **Minors Clause:** Confirmation that the under-18 exclusion in Privacy Policy Section 10 complies with Section 9 of the DPDP Act.
6. **Registration Optional Citation:** Review of Section 18(e) of the Indian Registration Act 1908 citation in Telugu and English marketing copy.

---

## 3. Open Items & Future Roadmap

- [ ] Obtain independent native Telugu speaker review for the 5 legal phrases on /te/ (remove 
oindex tag once approved).
- [ ] Connect custom domain (smartwillindia.in / smartwillindia.com) to Cloudflare email routing for branded support@ address.
- [ ] Upgrade client-side encryption key derivation to use Firebase Auth session token rather than device ID once user login is mandatory.
- [ ] Conduct a 30-day compliance review after DPDP Rules enter active administrative enforcement.
