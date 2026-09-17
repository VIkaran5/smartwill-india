# SmartWill India — Data Breach Incident Runbook
## DPDP Act 2023 — Internal Operational Document (NOT for public distribution)

**Last Updated:** September 2026  
**Owner:** Dasari G., Grievance Officer, SmartWill Digital Technologies India  
**Confidential — Do not publish to /dist or deploy to production**

---

## 1. What Constitutes a Data Breach

A personal data breach means any accidental or unlawful:
- Access to personal data not authorised by SmartWill
- Disclosure of user personal or financial data to third parties
- Loss, alteration, or destruction of personal data
- Compromise of Firebase Firestore rules allowing cross-user access
- Compromise of the Cashfree API credentials
- Leakage of user Will draft data, names, addresses, or financial details

---

## 2. Breach Response Timeline

| Time | Action |
|------|--------|
| **0h — Detection** | Confirm and document the breach: what data, how many users, how it occurred |
| **0–4h** | Contain: revoke compromised credentials, restrict database access, disable affected API endpoints |
| **4–24h** | Investigate scope: determine exact data affected, users impacted, breach vector |
| **Within 72h** | **MANDATORY:** Notify the Data Protection Board of India (DPBI) — see template below |
| **Within 72h** | Notify affected users — see user notification template below |
| **Ongoing** | Document remediation steps; preserve logs for regulatory inquiry |

> ⚠️ The 72-hour window begins from the point of AWARENESS/DETECTION, not from when the breach occurred.
> Source: DPDP Rules 2025, Rule 7 — notified November 2025, enforcement from May 2027.

---

## 3. Data Protection Board Notification Template

`
TO: Data Protection Board of India
     [Contact details to be filled when DPBI portal is operational]

SUBJECT: Personal Data Breach Notification — SmartWill Digital Technologies India

DATE OF NOTIFICATION: [DATE]
DATE OF BREACH DETECTION: [DATE AND TIME]

DATA FIDUCIARY DETAILS:
Name: SmartWill Digital Technologies India
Grievance Officer: Dasari G.
Email: smartwillindia.help@gmail.com

NATURE OF BREACH:
[Describe: e.g., "Unauthorised access to Firestore database containing user Will drafts"]

DATA CATEGORIES AFFECTED:
[ ] Full Legal Names
[ ] Date of Birth
[ ] Government ID digits
[ ] Contact details (email, phone, address)
[ ] Financial asset details
[ ] Beneficiary details
[ ] Payment transaction records
[ ] Other: ___________

APPROXIMATE NUMBER OF DATA PRINCIPALS AFFECTED: [NUMBER]

LIKELY CONSEQUENCES OF BREACH:
[Describe potential harm: identity theft, financial fraud, privacy violation]

MEASURES TAKEN OR PROPOSED:
[Describe containment, remediation, and prevention steps]

CONTACT FOR FURTHER INFORMATION:
Dasari G., Grievance Officer
smartwillindia.help@gmail.com
`

---

## 4. User Notification Email Template

`
SUBJECT: Important Security Notice — Your SmartWill India Account

Dear [User Name],

We are writing to inform you of a security incident that may have affected your account on SmartWill India.

WHAT HAPPENED:
[Plain-language description of the breach]

WHAT DATA WAS AFFECTED:
[Specific list of data categories for this user]

WHAT WE ARE DOING:
[Remediation steps taken]

WHAT YOU CAN DO:
- Change your email account password if it is the same as your SmartWill account
- Monitor for any suspicious financial activity
- Contact us immediately if you notice any unauthorised use of your data

YOUR RIGHTS:
Under the Digital Personal Data Protection Act 2023, you have the right to:
- Access the personal data we hold about you
- Request correction or erasure of your data
- Lodge a complaint with the Data Protection Board of India

TO EXERCISE YOUR RIGHTS OR ASK QUESTIONS:
Email: smartwillindia.help@gmail.com
Response time: Within 30 days

We sincerely apologise for this incident and the concern it may cause.

Sincerely,
Dasari G.
Grievance Officer
SmartWill Digital Technologies India
`

---

## 5. Post-Breach Remediation Checklist

- [ ] Rotate all Firebase service account credentials
- [ ] Rotate Cashfree API key/secret
- [ ] Rotate EmailJS public key and service credentials
- [ ] Review and tighten Firestore Security Rules
- [ ] Audit server-side API logs for unauthorized access patterns
- [ ] Notify all affected users within 72 hours
- [ ] File DPBI notification within 72 hours
- [ ] Document incident timeline in an internal incident report
- [ ] Review and strengthen key rotation procedures
- [ ] Commission a security audit if breach was external

---

## 6. Key Contacts

| Role | Contact |
|------|---------|
| Grievance Officer | Dasari G. — smartwillindia.help@gmail.com |
| Firebase Console | console.firebase.google.com — project: smartwill-india |
| Cashfree Dashboard | merchant.cashfree.com |
| Vercel Dashboard | vercel.com/smartwillindia |
| Data Protection Board of India | [https://dpboard.gov.in — when operational] |
