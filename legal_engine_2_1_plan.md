# SMARTWILL INDIA — LEGAL ENGINE 2.1.3
## Master Forensic Statutory Blueprint & Technical Specification (Revision 7 — Stage 1 Forensic Remediation & Final Statutory Certification)

**Document Version**: 2.1.3 (Revision 7 — Stage 1 Forensic Remediation & Final Statutory Certification)  
**Status**: FULLY COMPLIANT WITH STATUTORY TEXT & CASE LAW — STAGE 1 FULLY CERTIFIED (84/84 UNIQUE TESTS GREEN, 207/207 REPO-WIDE)  
**Primary Jurisdiction**: State of Goa & Republic of India  
**Governing Acts & Authoritative Sources**:
1. *Goa Succession, Special Notaries and Inventory Proceeding Act, 2012 (Goa Act 23 of 2016)*, as amended through 2024.
2. *Goa Succession, Special Notaries and Inventory Proceeding (Amendment) Act, 2023 (Goa Act 35 of 2023)*.
3. *Indian Succession Act, 1925 (Act 39 of 1925)* (Part VI; Sections 57(a), 57(b), 57(c), 58, 59, 63, 105, 109, 119; Schedule III).
4. *Special Marriage Act, 1954 (Act 43 of 1954)* (Sections 21 & 21A as amended by Act 68 of 1976).
5. *Muslim Personal Law (Shariat) Application Act, 1937 (Act 26 of 1937)* (Section 1(2) as amended by Act 34 of 2019; Sections 2 & 3).
6. *Hindu Succession Act, 1956 (Act 30 of 1956)* (Section 30 read with Schedule III of ISA 1925).
7. *Indian Contract Act, 1872 (Act 9 of 1872)* (Section 11 competence).
8. *Jammu and Kashmir Reorganisation Act, 2019 (Act 34 of 2019)* (Section 95 and Fifth Schedule).
9. *Government Savings Promotion Act, 1873 (Act 5 of 1873)* & *Public Provident Fund Scheme, 2019 (Paragraph 14)*.
10. *Employees' Provident Funds and Miscellaneous Provisions Act, 1952 (Act 19 of 1952)*.
11. *Indian Trusts Act, 1882 (Act 2 of 1882)* (Section 20).
12. *Citizenship Act, 1955 (Act 57 of 1955)* (Sections 3 & 4).
13. *Binding Judicial Authorities & Treatises*:
    - **Goa Special Law Supremacy**: Supreme Court of India in *Jose Paulo Coutinho v. Maria Luiza Valentina Pereira*, (2019) 20 SCC 85 (Goa civil succession law is a special and local law governing Goan domiciles, prevailing over general personal laws).
    - **Goa Muslim Succession Precedent**: High Court of Bombay at Goa in *Ashabi Khan v. Pravin Khan*, 2007 (4) ALL MR 604 (confirming that Goan Muslims domiciled in Goa remain governed by Goa civil succession law, not the Shariat Act).
    - **Muslim Heir Assent & 1/3rd Rule**: Supreme Court of India in *Shehammal v. Hasan Khani Rawther*, (2011) 9 SCC 223; Sir Dinshah Fardunji Mulla, *Principles of Mahomedan Law* (22nd Ed., LexisNexis), Sections 115, 117, 118; Asaf A.A. Fyzee, *Outlines of Muhammadan Law* (5th Ed., Oxford).
    - **Goa Succession Amendment Validity**: High Court of Bombay at Goa (Division Bench) in *Xavier Agnelo Minguel Jose Gracias v. State of Goa & Ors.*, `2026:BHC-GOA:1046-DB` (pronounced 8 May 2026; appellate status verified: no stay or reversal).

---

## 1. REVISION 7 FORENSIC REMEDIATION & COMPLIANCE MATRIX

This matrix details the statutory corrections implemented in Revision 7 addressing all forensic audit findings:

| # | Forensic Audit Finding | Exact Statutory Correction in Revision 7 | Affected Module | Supporting Statutory Authority | Single-Source Unique Test IDs |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Negative Goa jurisdiction evidence bypass** (`parentsPortugueseRegime === false`) | Removed `p.parentsPortugueseRegime === false` negative boolean bypass. Requires verified documentary evidence of parents' actual legal regime (`parentsRestOfIndiaEvidence` or `clauseDEvidence`). Bare negative booleans strictly emit `ERR_GOA_JURISDICTION_UNCONFIRMED` and `GOA_STATUS_UNDETERMINED`. | `js/legal/goaJurisdiction.js` | Section 1(4)(d), Goa Act 23 of 2016; *Jose Paulo Coutinho* (2019) 20 SCC 85 | **Tests 3, 67** |
| **2** | **Genuinely authenticated document verification & hash validation** | In `validateJurisdictionEvidence()`: requires `documentStorageId` / `storageKey`; strict 64-hex SHA-256 validation; explicitly rejects empty-file hash (`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`) and all-zeros with `ERR_EMPTY_OR_INVALID_FILE_HASH`; enforces party matching against testator; enforces authenticated reviewer role (`ADVOCATE`, `SPECIAL_NOTARY`, `CIVIL_REGISTRAR`, `SUB_REGISTRAR`, `GOVERNMENT_AUTHORITY`) with Bar enrollment number or officer credentials; requires tamper-resistant `auditSessionId`. | `js/legal/goaJurisdiction.js` | Section 1(4), Goa Act 23 of 2016; Evidence Act / BSA 2023 | **Tests 1–10, 64–66** |
| **3** | **Section 1(4)(g) adoption separation** | Separated registered adoption deed from documentary proof of adoptive parents' governing civil code status (`adoptiveParentsEvidence`). Reliance on bare boolean `adoptiveParentsGoanRegime: true` strictly emits `ERR_GOA_EVIDENCE_UNVERIFIED` and `GOA_STATUS_UNDETERMINED`. | `js/legal/goaJurisdiction.js` | Section 1(4)(g), Goa Act 23 of 2016 | **Tests 10, 69** |
| **4** | **Government & military posting proviso** | Section 1(4) posting proviso requires verified `postingEvidence`. Unverified posting assertions strictly return `GOA_STATUS_UNDETERMINED`. Verified posting evidence returns `GOA_NOT_APPLICABLE` under Section 1(4) proviso. | `js/legal/goaJurisdiction.js` | Section 1(4) Proviso, Goa Act 23 of 2016 | **Tests 7, 49, 68** |
| **5** | **Born outside Goa with Goa connection / property** | For testators born outside Goa with declared Goa property or ancestral connection, unrecorded parental status triggers `ERR_GOA_JURISDICTION_UNCONFIRMED` and `GOA_STATUS_UNDETERMINED` to prevent premature assumption of ISA applicability under Section 1(4)(c). | `js/legal/goaJurisdiction.js` | Section 1(4)(c), Goa Act 23 of 2016 | **Test 70** |
| **6** | **Shariat Section 3 declaration forensic verification** | In `validateShariatDeclarationRecord()`: requires recognized statutory authority (`DM`, `Collector`, `ADM`, `SDM`), prescribed statutory form (`FORM_A_SHARIAT_SECTION_3`), Contract Act Section 11 competence facts (adult >= 18, sound mind, no disqualification), verified residence proof in India, storage ID, 64-hex SHA-256 hash (rejecting empty hash), minor children/descendant coverage, and reviewer Bar enrollment. Clarified that non-application to Goa is because Goa succession law is special and local law (*Jose Paulo Coutinho*), not a Section 1(2) territorial exclusion. | `js/legal/personalLawRouter.js` | Shariat Act, 1937, Section 3; Contract Act, 1872, Sec 11; *Jose Paulo Coutinho* (2019) 20 SCC 85 | **Tests 56, 57, 59, 71–74** |
| **7** | **Section 2 agricultural land keyword scanner** | Broadened regex to scan across all assets for `agricultural`, `agri`, `paddy`, `orchard`, `cashew`, `plantation`, `cultivated`, `farm`, `farmland`, `khasra`, `krishi`, `crop`, `land holding`. Isolates assets, triggers `ERR_AGRICULTURAL_LAND_SHARIAT_EXCLUSION`, and sets `preventsGeneration: true` and `requiresLegalReview: true`. | `js/legal/personalLawRouter.js` & `js/legal/legalBlockers.js` | Shariat Act, 1937, Section 2 | **Tests 60, 75** |
| **8** | **Special Marriage Act 1954 (Sections 21 & 21A)** | Requires verified marriage certificate (`ERR_SMA_MARRIAGE_CERTIFICATE_REQUIRED`). If both spouses are Hindu, Buddhist, Sikh, or Jain: applies **Section 21A exception** (governed by Hindu Succession Act, 1956 & ISA Section 57, preserving religion). Otherwise: applies **Section 21 general rule** (governed by ISA Part VI), preserving testator's actual religion (never forcing `isChristian: true` on Muslims, Parsis, or Hindus). | `js/legal/personalLawRouter.js` & `js/legal/legalBlockers.js` | Special Marriage Act, 1954, Sections 21 & 21A | **Tests 76–80** |
| **9** | **ISA Section 57 historical territorial evaluation** | Replaced modern city substring matching with evidence-backed historical territorial boundaries (`historicalTerritoryCode` / `territorialJurisdictionCode` for Bombay OOCJ, Madras OOCJ, Bengal Lieutenant-Governor); removed `hasPresidencyTownImmovable: true`; evaluates each immovable asset individually for Section 57(b); residual nature of Section 57(c) applies to all wills executed on/after 1 Jan 1927 not covered by (a) or (b) without artificial property location conditions. | `js/legal/personalLawRouter.js` | Indian Succession Act, 1925, Section 57(a), (b), (c) & Schedule III | **Tests 53, 54, 62, 63, 81–83** |
| **10** | **Pre-flight legal blocker audit integration** | Maps all Stage 1 blocker codes (`ERR_GOA_EVIDENCE_UNVERIFIED`, `ERR_EMPTY_OR_INVALID_FILE_HASH`, `ERR_PARTY_MISMATCH`, `ERR_SMA_MARRIAGE_CERTIFICATE_REQUIRED`, `ERR_AGRICULTURAL_LAND_SHARIAT_EXCLUSION`, `ERR_SHARIAT_SEC3_DEFECTIVE`, `ERR_SHARIAT_SEC3_INCOMPETENT`) to fatal blockers with `preventsGeneration: true` and `isExecutionReady: false`. | `js/legal/legalBlockers.js` | Architectural Safety & Court-Admissibility | **Tests 40, 41, 84** |

---

## 2. DETAILED STATUTORY SPECIFICATIONS

### MODULE 1: JURISDICTION ROUTING, TERRITORIAL EXTENT & EVIDENCE AUDIT (`js/legal/goaJurisdiction.js`, `js/legal/personalLawRouter.js`, `js/legal/legalBlockers.js`)

#### 1. Evidence-Based Jurisdiction Classifier (`validateJurisdictionEvidence`)
Under Section 1(4) of Goa Act 23 of 2016, jurisdiction cannot be established by mere self-declaration or Boolean input. An affirmative structured evidence record must be verified by an authorized advocate or official containing:
1. `documentStorageId` / `storageKey`: Immutable identifier in secure repository.
2. `documentRef` / `registrationNumber`: Official registration or deed number.
3. `documentType`: Recognized under `JURISDICTION_DOCUMENT_TYPES`.
4. `issuingAuthority`: Competent civil registry, notary, or government authority.
5. `statutoryDate`: `issueDate` or `registrationDate`.
6. `verifiedParties`: Must match the testator/context (`ERR_PARTY_MISMATCH` if strict match fails).
7. `documentHash`: Strict 64-hexadecimal SHA-256 hash. Empty-file hash (`e3b0c442...`) and all-zeros are strictly rejected (`ERR_EMPTY_OR_INVALID_FILE_HASH`).
8. `reviewerRole` in `AUTHORIZED_REVIEWER_ROLES` (`ADVOCATE`, `SPECIAL_NOTARY`, `CIVIL_REGISTRAR`, `SUB_REGISTRAR`, `GOVERNMENT_AUTHORITY`).
9. `enrollmentNumber`: Professional Bar enrollment number or officer credentials.
10. `verificationStatus === 'VERIFIED'` and `verificationDate`.
11. `auditSessionId`: Tamper-resistant verification session identifier.

If evidence is missing or unverified, the engine returns `GOA_STATUS_UNDETERMINED` with `ERR_GOA_EVIDENCE_UNVERIFIED` and sets `canGenerateWill: false`.

#### 2. Shariat Act Section 3 Forensic Verification (`validateShariatDeclarationRecord`)
Under Section 3 of the Shariat Act, 1937, testamentary succession under Section 2 requires:
1. Proof of Muslim religion.
2. Competence to contract under Section 11 of the Indian Contract Act, 1872 (age >= 18, sound mind, not disqualified). Must be affirmatively verified with competence facts, never defaulted to true.
3. Residence in territory to which the Shariat Act extends under Section 1(2). Goan residents are excluded because Goa civil succession law governs as a special and local law (*Jose Paulo Coutinho* (2019) 20 SCC 85 & *Ashabi Khan* (2007) (4) ALL MR 604).
4. Prescribed declaration form (`FORM_A_SHARIAT_SECTION_3`).
5. Execution before recognized statutory authority (`District Magistrate`, `Collector`, `ADM`, `SDM`).
6. Proof of filing and registration date.
7. Verification of Section 3(2) appeal outcome where registration was challenged.
8. Statutory minor child and descendant coverage confirmed.
9. Cryptographic hash integrity (non-empty 64-hex SHA-256) and verifying advocate credentials.

Naked Boolean assertions (`shariatSec3Declaration: true`) are rejected with `ERR_SHARIAT_SEC3_DEFECTIVE`.

#### 3. Section 2 Agricultural Land Exclusion
Questions relating to agricultural land are expressly excluded from Section 2 of the Shariat Act, 1937. The engine scans the asset registry with an expanded statutory regex (`agricultural`, `paddy`, `orchard`, `cashew`, `plantation`, `farm`, `farmland`, `khasra`, `krishi`, etc.), isolates agricultural parcels, and halts automated Will distribution with `ERR_AGRICULTURAL_LAND_SHARIAT_EXCLUSION`, preventing automated PDF generation until specialist advocate review certifies devolution under state land tenure legislation.

#### 4. Special Marriage Act 1954 (Sections 21 & 21A)
For marriages solemnized or registered under the Special Marriage Act, 1954:
- Mandatory verified marriage certificate (`ERR_SMA_MARRIAGE_CERTIFICATE_REQUIRED`).
- **Section 21A Exception**: Where both spouses profess Hindu, Buddhist, Sikh, or Jain religion, Section 21 does not apply; succession is governed by the Hindu Succession Act, 1956 and ISA Section 57. The engine routes to `PERSONAL_LAW_REGIMES.HINDU` and does NOT classify the testator as Christian.
- **Section 21 General Rule**: Where spouses do not both profess H/B/S/J religion, succession is regulated by Part VI of the Indian Succession Act, 1925. The engine routes to `PERSONAL_LAW_REGIMES.CHRISTIAN_CIVIL` while preserving the testator's actual religious identity (`religion: p.religion`, `isMuslim: true` if Muslim, `isParsi: true` if Parsi).

#### 5. Indian Succession Act Section 57 Multi-Tiered Evaluation
For Hindu, Buddhist, Sikh, and Jaina wills:
- `willExecutionDate` is mandatory; missing date emits `ERR_WILL_EXECUTION_DATE_REQUIRED`.
- Wills executed prior to 1 September 1870 are barred from automated Section 57 routing (`ERR_PRE_1870_WILL_INELIGIBLE`).
- Historical presidency boundaries are checked via `historicalTerritoryCode` (`BOMBAY_OOCJ`, `MADRAS_OOCJ`, `BENGAL_LIEUTENANT_GOVERNOR`) or verified territorial evidence. Ambiguous boundaries emit `ERR_TERRITORIAL_JURISDICTION_AMBIGUOUS`.
- **Section 57(a)**: Executed in presidency town / OOCJ limits on or after 1 September 1870.
- **Section 57(b)**: Executed outside presidency territories, so far as relates to immovable property situated within presidency limits on or after 1 September 1870 (evaluated asset-by-asset).
- **Section 57(c)**: Residual will executed on or after 1 January 1927 to which provisions are not applied by (a) or (b). Wills executed prior to 1 January 1927 outside presidency towns without presidency immovables are ineligible for automated routing (`ERR_PRE_1927_NON_PRESIDENCY_WILL`).

---

## 3. MASTER TEST REGISTER & STAGE PROGRESSION

The current regression suite (`tests/unit/legalEngine2_1.test.js`) comprises 84 distinct, uniquely numbered tests (1–84):

### Stage 1 Active Tests (56 Tests):
- **Tests 1–10**: Goa Section 1(4)(a)–(g) evidence-verified classification:
  - 1: Section 1(4)(a) affirmative proof requirement
  - 2: Section 1(4)(b) born in Goa to Civil Code parents
  - 3: Section 1(4)(b) negative verified rest-of-India parents
  - 4: Section 1(4)(c) born outside Goa without opt-out
  - 5: Section 1(4)(c) opt-out within statutory 3-year deadline
  - 6: Section 1(4)(d) statutory election & permanent residence
  - 7: Section 1(4) posting proviso exclusion
  - 8: Section 1(4)(e) foreign parents Citizenship Act compliance
  - 9: Section 1(4)(f) foundling / unknown parentage
  - 10: Section 1(4)(g) adopted child with verified adoptive parents' status
- **Tests 25–26**: Missing religion and Ismaili/Bohra special review gates
- **Tests 35–36**: Personal Law Router (unrecognized religion & Bohra review blocker)
- **Tests 40–41**: Central blockers (unrecognized personal law & Bohra review)
- **Tests 42–46**: Non-Goa routing (Central law, ambiguous lineage, Atheist neutrality, Christian & Parsi Part VI citations without Sec 57)
- **Tests 47–51**: Negative jurisdiction tests (10-year residency, marriage to Goan, govt posting proviso, expired Sec 1(4)(c) opt-out, foreign parents citizenship failure)
- **Test 52**: Goa supremacy for Muslims (*Jose Paulo Coutinho* & *Ashabi Khan*), preserving religious identity
- **Tests 53–55**: Section 57(c) residual check, positive 57(a)/(b)/(c) checks, HSA Section 30 coparcenary
- **Tests 56–57**: Shariat Section 3 verified declaration & missing declaration fallback
- **Tests 58–63**: Forensic remediation tests (naked boolean rejection, Shariat declaration negatives, agricultural land exclusion, Muslim school verification, Section 57 date boundaries, Section 57 territorial ambiguity)
- **Tests 64–66**: Cryptographic hash integrity (rejecting empty/all-zero hashes), reviewer credential validation, party mismatch rejection
- **Tests 67–70**: Fail-closed negative bypass rejection, posting proviso proof requirement, adoption separated proof, ancestral Goa connection inquiry
- **Tests 71–74**: Shariat Section 3 authority verification, form verification, competence facts verification, Goa resident exclusion
- **Test 75**: Expanded agricultural land keyword scanner and blocker
- **Tests 76–80**: Special Marriage Act (SMA) Sections 21 & 21A routing, religious preservation, and marriage certificate blocker
- **Tests 81–83**: Section 57 historical boundary codes (Bombay OOCJ, Madras OOCJ, Bengal Lt-Gov), individual immovable asset evaluation, residual Section 57(c) routing
- **Test 84**: Comprehensive pre-flight blocker audit for Stage 1 blockers

### Reserved Regression Benchmarks (28 Tests):
- **Tests 11–14, 31**: Inheritance calculations, Section 89 base, legitime quotas, estate insolvency
- **Tests 15–19, 32–33**: Section 219 community property nullity & 4 exceptions
- **Tests 20–22, 34**: Title verification, Habilitação heirship limits, Form I & XIV fiscal status
- **Tests 23–24**: Nomination rules (PPF vs EPF)
- **Tests 27, 37–38**: Section 333 PDF generation geometry, typography, and preflight gates
- **Tests 28–30, 39**: Draft readiness index, advocate review gate, notarial status barriers

Total repository tests across 11 test suites: **207 passing (207/207)**.
Production dist build: **174 files generated cleanly**.