# SmartWill India — Comprehensive Security Audit Report

**Date**: October 4, 2026 (supersedes September 18, 2026 report)  
**Auditor**: Antigravity Security Analysis Engine  
**Standards Evaluated**: OWASP Top 10 (2025 Standard), DPDP Act 2023, Cashfree / RBI Guidelines  
**Target Environment**: `smartwill-india` (Vanilla ES Modules + Node.js Serverless + Firebase Firestore + Cashfree Gateway + Capacitor Android)  
**Source Ref**: `eddc38a` (latest `main`)  
**Overall Posture Rating**: **A- (Strong / Production-Grade)**

---

## 1. Executive Summary

Two comprehensive white-box security audits have been conducted (Sept 18 and Oct 4, 2026). This consolidated report reflects the current state after all remediations.

### Key Highlights:
1. **Zero Exploitable High/Critical Vulnerabilities in Shipped Code**: Core financial flows, payment verification, and user access boundaries are robustly designed with server-authoritative state checks, atomic Firestore transactions, and strict ID token enforcement.
2. **DPDP Act 2023 Compliance**: Draft will data is held in-memory until explicit user consent. Once consented, local storage is encrypted at rest using AES-GCM (256-bit key derived via PBKDF2 with 100,000 iterations).
3. **Defense-in-Depth Hardening**: Reflected DOM sinks converted to `textContent` and protected with `escapeHTML()`. CDN scripts protected with Subresource Integrity (SRI) hashes.
4. **Android Security Hardened**: WebView remote debugging disabled in production (Oct 4 fix).

---

## 2. Vulnerability & Risk Matrix

| Finding ID | Category (OWASP 2025) | Severity | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | A05: Injection (DOM-XSS) | Low | Dynamic innerHTML in `bindings.js` | **RESOLVED ✅** (Sept 18) |
| **SEC-02** | A01: Broken Access Control | Pass ✅ | IDOR / horizontal privilege escalation | **SECURE ✅** — Verified twice |
| **SEC-03** | A02: Security Misconfiguration | Low / Info | CSP `unsafe-inline` in `vercel.json` | **ACCEPTABLE** — Deferred until bundler migration |
| **SEC-04** | Financial Logic & Tampering | Pass ✅ | Price modification / referral abuse | **SECURE ✅** — Verified twice |
| **SEC-05** | A04: Cryptographic Failures | Pass ✅ | Client storage encryption | **COMPLIANT ✅** — Verified twice |
| **SEC-06** | A03: Software Supply Chain | Low / Dev | npm audit vulnerabilities | **PARTIALLY RESOLVED** — `npm audit fix` applied; remaining require major upgrades |
| **FINDING-01** | A02: Security Misconfiguration | **High → Fixed** | `webContentsDebuggingEnabled: true` in `capacitor.config.json` | **RESOLVED ✅** (Oct 4) |
| **FINDING-03** | A02: Security Misconfiguration | Medium / Info | In-memory rate limiting per Vercel instance | **DOCUMENTED** — Acceptable at current scale; upgrade path noted |
| **FINDING-04** | A03: Supply Chain | **Medium → Fixed** | CDN scripts without SRI | **ALREADY RESOLVED ✅** — SRI hashes present on all scripts (Cashfree excluded per VULN-003) |
| **FINDING-06** | A02: Security Misconfiguration | Low | EmailJS public keys abuse potential | **DOCUMENTED** — Domain restriction required in EmailJS dashboard |
| **FINDING-07** | A05: Information Disclosure | Low / Info | Payment session_id in URL params | **ACCEPTABLE** — Mitigated by `Referrer-Policy` header |

---

## 3. Detailed Component Analysis

### 3.1 Serverless APIs (`api/`)

#### A. Authentication & Session Validation (`api/middleware.js`)
- **Mechanism**: All mutating routes enforce `verifyAuth()` via Firebase JWT ID token (`admin.auth().verifyIdToken()`).
- **IDOR Protection**: Order documents strictly checked against `auth.uid` (verified in both audits).
- **Rate Limiting**: Sliding-window in-memory per UID/IP. Known limitation: per-instance on Vercel serverless (documented in code with upgrade path to Vercel KV/Upstash Redis).
  - `create-order`: 5 attempts / 60 seconds
  - `verify-payment`: 15 polling attempts / 60 seconds
  - `verify-download`: 20 attempts / 60 seconds
  - `attach-referral`: 6 attempts / 60 seconds

#### B. Financial & Payment Integrity
- **Price Authority**: `WILL_PRICE_INR = 299` hardcoded server-side. Never accepted from client.
- **Referral Credit Security**: `calculateReferralDiscount()` in `api/referral-helpers.js`. Single source of truth.
- **Verification Predicate**: Triple-check — `cfStatus === 'PAID' && Number(cfAmount) === expectedAmount && cfCurrency === 'INR'`
- **Atomic Transactions**: Credit deductions, order transitions, and audit logs in single `db.runTransaction()`.

### 3.2 Cloud Firestore Security Rules (`firestore.rules`)
- Clients cannot write to `orders`, `referralCredits`, or `auditLogs` (`allow write: if false`).
- Clients cannot overwrite `referredBy` (field diff assertion).
- Cross-user data access strictly prevented by auth UID matching.

### 3.3 Supply Chain Security
- CDN scripts in `app.html` and `index.html` include SRI `integrity` + `crossorigin="anonymous"` attributes.
- Cashfree SDK (`sdk.cashfree.com`) excluded from SRI — documented as VULN-003 (unversioned URL, no CORS headers).
- Build script (`scripts/build-dist.cjs`) sanitizes backend code from client distribution.

### 3.4 Android / Capacitor Security
- `webContentsDebuggingEnabled: false` — prevents USB-based WebView inspection (fixed Oct 4).
- `allowMixedContent: false` — prevents mixed HTTP/HTTPS content.
- Payment deep link uses `encodeURIComponent()` for order_id injection prevention.

### 3.5 Data Privacy & DPDP Act 2023 Compliance
- Consent prior to persistence (`js/consent-banner.js`).
- AES-GCM 256-bit encryption for localStorage drafts (`js/state/storage.js`).
- Session inactivity lockout with PII wipe (45 minutes).
- Account deletion with two-step confirmation.

### 3.6 HTTP Security Headers (`vercel.json`)
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## 4. Deployment Validation Checklist

These items require verification in live dashboards:

- [ ] **Firestore Rules**: Run `firebase deploy --only firestore:rules` to ensure repo rules are active
- [ ] **Vercel Env Vars**: Confirm `FIREBASE_SERVICE_ACCOUNT`, `CASHFREE_CLIENT_ID`/`CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY` are set
- [ ] **Cloud Function**: Verify `reconcileOrders` is deployed with hourly schedule
- [ ] **Firebase Auth Domains**: Confirm authorized domains include `smartwill-india.vercel.app`
- [ ] **Firestore Index**: Composite index for `status==PENDING + createdAt<cutoff` exists
- [ ] **EmailJS Domain Lock**: Configure allowed origins in EmailJS dashboard

---

## 5. Audit History

| Date | Auditor | Rating | Findings | Key Actions |
|------|---------|--------|----------|-------------|
| Sept 18, 2026 | Antigravity | A- | 6 (1 low, 5 pass) | Fixed DOM-XSS sinks in `bindings.js` |
| Oct 4, 2026 | Antigravity | A- | 7 confirmed + 5 NV | Fixed WebView debug, npm audit fix, SRI verified, rate limit documented |

---

## 6. Forward-Looking Recommendations

1. **CSP Nonce Strategy**: Replace `'unsafe-inline'` with nonces when adopting a build bundler (Vite/Rollup).
2. **Redis Rate Limiting**: Migrate to Vercel KV or Upstash Redis when traffic exceeds ~1000 users.
3. **Firebase Secret Rotation**: Rotate `CASHFREE_SECRET_KEY` and Firebase service account credentials every 90 days.
4. **Major Dependency Upgrades**: Schedule `@capacitor/cli@8.x` and `firebase-admin@14.x` upgrades with testing.
5. **Cashfree Webhooks**: Add server-to-server webhook verification as a secondary payment confirmation path.
