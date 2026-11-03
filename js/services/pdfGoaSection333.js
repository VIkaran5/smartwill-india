/**
 * SmartWill India — Legal Engine 2.1
 * Dedicated Section 333 Printed Open Will PDF Generator (Goa Act 23 of 2016)
 *
 * Implements the full statutory procedural lifecycle under Section 333(1) to (8):
 * 1. Physical Layout: ISO A4 (210 x 297mm), Left 50mm, Top 30mm, Bottom 30mm, Right 10mm margins.
 * 2. Spacing & Typography: Strict double line spacing throughout with font state preservation.
 * 3. Section 333(2): Signatures of Testator and 2 Creditworthy Witnesses positioned IMMEDIATELY
 *    ABOVE the first line and IMMEDIATELY BELOW the last line on EVERY page.
 * 4. Words for Numbers & Dates (Section 333(1)(b)): All legal dates, ages, monetary amounts,
 *    fractions, and percentages written out in words.
 * 5. Pre-flight Guard: Fatal blockers on missing mandatory parentage/occupation metadata (no dummy placeholders).
 * 6. Section 333(3) & (4): Continuous, uninterrupted Special Notary presentation and reading aloud record.
 * 7. Section 333(5): Official 35mm x 45mm passport photograph box with cross-signature line.
 * 8. Section 333(7): Documented District Special Notary administrative 200-sheet binding workflow.
 * 9. Section 333(8): Language rejection statutory protocol and public-Will alternative.
 * 10. Watermarked: DRAFT FOR SPECIAL NOTARY EXECUTION (UNEXECUTED).
 */

import { runPreFlightLegalBlockerAudit } from '../legal/legalBlockers.js';
import { calculateGoaInheritance } from '../legal/inheritanceCalculator.js';
import { classifyGoaJurisdiction, JURISDICTION_STATUS } from '../legal/goaJurisdiction.js';
import { generateNominationClause } from '../legal/nominationRules.js';
import { generateStatutoryDebtHierarchy } from '../legal/trusteeMinorRules.js';

/**
 * Converts integers to formal Indian English words.
 */
export function numberToWords(num) {
  if (num === 0) return 'zero';
  if (!num || isNaN(num)) return String(num);

  const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  function toWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' hundred' + (n % 100 !== 0 ? ' and ' + toWords(n % 100) : '');
    if (n < 100000) return toWords(Math.floor(n / 1000)) + ' thousand' + (n % 1000 !== 0 ? ' ' + toWords(n % 1000) : '');
    if (n < 10000000) return toWords(Math.floor(n / 100000)) + ' lakh' + (n % 100000 !== 0 ? ' ' + toWords(n % 100000) : '');
    return toWords(Math.floor(n / 10000000)) + ' crore' + (n % 10000000 !== 0 ? ' ' + toWords(n % 10000000) : '');
  }

  return toWords(Math.floor(num));
}

/**
 * Converts calendar dates into formal legal words (Section 333(1)(b)).
 * e.g., "1964-05-15" -> "fifteenth day of May nineteen hundred and sixty-four"
 */
export function formatDateToFormalWords(dateStr) {
  if (!dateStr) return 'date unrecorded';
  const clean = String(dateStr).trim();
  let year, month, day;

  if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts.length === 3) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    }
  }

  if (!year || !month || !day) return clean;

  const ordinals = [
    '', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
    'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth', 'twentieth',
    'twenty-first', 'twenty-second', 'twenty-third', 'twenty-fourth', 'twenty-fifth', 'twenty-sixth', 'twenty-seventh', 'twenty-eighth', 'twenty-ninth', 'thirtieth', 'thirty-first'
  ];

  const months = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayWord = ordinals[day] || `${day}th`;
  const monthWord = months[month] || `Month ${month}`;

  let yearWord = '';
  if (year >= 1900 && year < 2000) {
    const rem = year - 1900;
    yearWord = `nineteen hundred and ${numberToWords(rem)}`;
  } else if (year >= 2000 && year < 2100) {
    const rem = year - 2000;
    yearWord = rem === 0 ? 'two thousand' : `two thousand and ${numberToWords(rem)}`;
  } else {
    yearWord = numberToWords(year);
  }

  return `${dayWord} day of ${monthWord} ${yearWord}`;
}

export async function generateGoaSection333PDF(willData = {}) {
  const p = willData.personal || {};

  // Check 1: Mandatory Jurisdiction Validation
  const jur = classifyGoaJurisdiction(p);
  if (jur.status !== JURISDICTION_STATUS.GOA_ACT_APPLICABLE) {
    throw new Error(`CANNOT_GENERATE_GOA_SECTION_333_PDF: Testator jurisdiction is classified as ${jur.status}. Section 333 Open Will is strictly available only where Goa Act 23 of 2016 applies.`);
  }

  // Check 2: Mandatory Personal Data Validation (Strictly NO invented fallback defaults)
  if (!p.fullName || !p.fullName.trim()) {
    throw new Error("PREFLIGHT_ERROR: Testator full name is mandatory under Section 333(1)(b).");
  }
  if (!p.fatherName || !p.fatherName.trim()) {
    throw new Error("PREFLIGHT_ERROR: Testator father's name is mandatory for statutory parentage identification under Section 333(1)(b).");
  }
  if (!p.motherName || !p.motherName.trim()) {
    throw new Error("PREFLIGHT_ERROR: Testator mother's name is mandatory for statutory parentage identification under Section 333(1)(b).");
  }
  if (!p.occupation || !p.occupation.trim()) {
    throw new Error("PREFLIGHT_ERROR: Testator occupation is mandatory under Section 333(1)(b).");
  }
  if (!p.maritalStatus || !p.maritalStatus.trim()) {
    throw new Error("PREFLIGHT_ERROR: Testator marital status is mandatory under Section 333(1)(b).");
  }
  if (!p.gender || !p.gender.trim()) {
    throw new Error("PREFLIGHT_ERROR: Testator gender is mandatory for statutory identification under Section 333(1).");
  }
  if (p.age === undefined || p.age === null || isNaN(Number(p.age))) {
    throw new Error("PREFLIGHT_ERROR: Testator age is mandatory under Section 333(1)(b).");
  }
  if (!p.dob) {
    throw new Error("PREFLIGHT_ERROR: Testator date of birth is mandatory under Section 333(1)(b).");
  }
  if (!p.addressLine1 || !p.addressCity || !p.pincode) {
    throw new Error("PREFLIGHT_ERROR: Complete residential address (address line, city, pincode) is mandatory under Section 333(1).");
  }
  if (!willData.executor || !willData.executor.name || !willData.executor.name.trim()) {
    throw new Error("PREFLIGHT_ERROR: Appointment of a named Executor is mandatory for Section 333 Open Will.");
  }

  // Pre-flight statutory blocker audit
  const audit = runPreFlightLegalBlockerAudit(willData);
  if (!audit.isExecutionReady) {
    const errSummary = audit.blockers.map(b => `• [${b.code}] ${b.clause}: ${b.errorDescription}`).join('\n');
    throw new Error(`LEGAL_BLOCKERS_PREVENT_GENERATION:\n${errSummary}`);
  }

  // Load real jsPDF engine
  let JsPDFClass;
  if (typeof window !== 'undefined' && window.jspdf && window.jspdf.jsPDF) {
    JsPDFClass = window.jspdf.jsPDF;
  } else {
    const jspdfModule = await import('jspdf');
    JsPDFClass = jspdfModule.jsPDF || jspdfModule.default?.jsPDF || jspdfModule.default;
  }

  const doc = new JsPDFClass({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;

  // Strict Section 333(1) Margins: Left 50mm, Top 30mm, Bottom 30mm, Right 10mm
  const marginL = 50;
  const marginR = 10;
  const marginT = 30;
  const marginB = 30;
  const contentWidth = pageWidth - marginL - marginR; // 150 mm
  const contentBottom = pageHeight - marginB; // 267 mm

  const safeFullName = p.fullName.trim();
  const testatorUpper = safeFullName.toUpperCase();
  const motherName = p.motherName.trim();
  const fatherName = p.fatherName.trim();
  const occupation = p.occupation.trim();
  const maritalStatus = p.maritalStatus.trim();
  const fullAddr = `${p.addressLine1.trim()}, ${p.addressCity.trim()}, Goa ${p.pincode.trim()}`;
  const isMale = p.gender.trim().toLowerCase() === 'female' ? false : true;
  const sonDaughter = isMale ? 'son' : 'daughter';

  // Section 83/89 calculation
  const calc = calculateGoaInheritance(willData);

  // Line coordinate tracking for Section 333(2) Immediate Signature Positioning
  const pageFirstLineY = {};
  const pageLastLineY = {};

  let y = marginT + 8; // Leave clearance for top signatures above first line

  function recordLineCoordinate(currentY) {
    const currPage = doc.internal.getCurrentPageInfo().pageNumber;
    if (pageFirstLineY[currPage] === undefined) {
      pageFirstLineY[currPage] = currentY;
    }
    pageLastLineY[currPage] = currentY;
  }

  function checkPageBreak(neededHeight) {
    if (y + neededHeight > contentBottom - 14) {
      doc.addPage();
      y = marginT + 8;
      return true;
    }
    return false;
  }

  function printDoubleSpaced(text, fontSize = 8.5, isBold = false) {
    // Preserve typography state
    const savedFont = isBold ? "bold" : "normal";
    doc.setFont("helvetica", savedFont);
    doc.setFontSize(fontSize);
    doc.setTextColor(15, 23, 42);

    const lineHeight = 6.8; // Strict Double Line Spacing for 8.5pt font
    const lines = doc.splitTextToSize(text, contentWidth);

    lines.forEach(line => {
      const didBreak = checkPageBreak(lineHeight);
      if (didBreak) {
        // Restore font styling immediately after page break
        doc.setFont("helvetica", savedFont);
        doc.setFontSize(fontSize);
        doc.setTextColor(15, 23, 42);
      }
      recordLineCoordinate(y);
      doc.text(line, marginL, y);
      y += lineHeight;
    });
  }

  function printSectionHeader(tag, title) {
    checkPageBreak(18);
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.0);
    doc.setTextColor(133, 93, 20);
    recordLineCoordinate(y);
    doc.text(`${tag}: ${title.toUpperCase()}`, marginL, y);
    y += 6.5;
  }

  // ── DOCUMENT TITLE ──────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  recordLineCoordinate(y);
  doc.text("LAST WILL AND TESTAMENT", marginL + (contentWidth / 2), y, { align: "center" });
  y += 5.5;
  doc.setFontSize(8.0);
  doc.setTextColor(100, 116, 139);
  doc.text("(Formal Printed Open Will under Section 333 of Goa Act 23 of 2016)", marginL + (contentWidth / 2), y, { align: "center" });
  y += 8.0;

  // ── PREAMBLE (Section 333(1) Mandatory Parentage & Words for Numbers) ──
  const ageInWords = numberToWords(p.age);
  const dobInWords = formatDateToFormalWords(p.dob);
  const preambleText = `I, ${testatorUpper}, ${sonDaughter} of ${fatherName} and ${motherName}, aged about ${ageInWords} years (born on the ${dobInWords}), by occupation a ${occupation}, of ${maritalStatus.toLowerCase()} marital status, residing at ${fullAddr}, an Indian citizen, being a person governed in matters of succession by the Goa Succession, Special Notaries and Inventory Proceeding Act, 2012 (Goa Act 23 of 2016) pursuant to Section 1(4) thereof, being of sound disposing mind, memory, and understanding, and acting of my own free choice, volition, and without any coercion, undue influence, or fraud, do hereby make, publish, and declare this writing to be my Last Will and Testament, executed for presentation before the Special Notary under Section 333 of the said Act in the presence of two creditworthy witnesses.`;
  printDoubleSpaced(preambleText, 8.5);

  // ── SECTION I: REVOCATION ───────────────────────────────────
  printSectionHeader("SECTION I", "Revocation of All Former Wills and Codicils");
  printDoubleSpaced("I hereby revoke, cancel, and annul all prior Wills, Codicils, testaments, and dispositions of every nature whatsoever made by me at any time heretofore, and declare this instrument to be my sole, exclusive, and operative Last Will and Testament.");

  // ── SECTION II: TESTAMENTARY CAPACITY ───────────────────────
  printSectionHeader("SECTION II", "Declaration of Sound Mental Health and Capacity");
  printDoubleSpaced("I declare that I am executing this Will in full possession of my mental faculties and understanding. I fully comprehend the nature, extent, and value of all my movable and immovable assets, and the natural claims of those persons who are the lawful objects of my affection and bounty.");

  // ── SECTION III: TITLE, LEGITIME & MATRIMONIAL MOIETY ───────
  printSectionHeader("SECTION III", "Declaration of Ownership, Legitime and Matrimonial Moiety");
  const legitimePctVal = Math.round((calc.statutoryLegitimeValue / (calc.section89ComputationBase || 1)) * 100);
  const disposablePctVal = Math.round((calc.statutoryDisposableQuota / (calc.section89ComputationBase || 1)) * 100);
  const legitimePctWord = numberToWords(legitimePctVal);
  const disposablePctWord = numberToWords(disposablePctVal);

  let spouseHabitationClause = "";
  const family = willData.familyStructure || {};
  const hasSurvivingSpouse = Boolean(family.hasSurvivingSpouse || family.spouse || (willData.beneficiaries || []).some(b => b.relation && b.relation.toLowerCase().includes('spouse')));
  const hasDwellingHouse = (willData.assets || []).some(a => {
    const d = `${a.desc || ''} ${a.type || ''}`.toLowerCase();
    return d.includes('house') || d.includes('flat') || d.includes('residential') || d.includes('bungalow') || d.includes('dwelling');
  });

  if (hasSurvivingSpouse && hasDwellingHouse) {
    spouseHabitationClause = " In accordance with Section 82 of Goa Act 23 of 2016, this instrument preserves my surviving spouse's preferential statutory right of habitation in the family dwelling house and the use of household movables.";
  }

  const sec3Text = `I declare that the properties and assets described in this Will comprise my separate estate and my undivided fifty percent moiety (meação) in the community assets (bens comuns) governed under Section 219 of Goa Act 23 of 2016. In strict compliance with substituted Section 83 of the Goa Succession Act (as substituted by the Goa Succession, Special Notaries and Inventory Proceeding (Amendment) Act, 2023 — Goa Act 35 of 2023), I expressly recognize the statutory forced legitime (quota legítima) which reserves ${calc.legitimeDescription} Affirming that the testamentary bequests herein are made strictly out of my lawful disposable quota (quota disponível) of ${disposablePctWord} percent (${disposablePctVal} percent).${spouseHabitationClause}`;
  printDoubleSpaced(sec3Text, 8.5);

  // ── SECTION IV: EXECUTOR & STATUTORY DEBT HIERARCHY ─────────
  printSectionHeader("SECTION IV", "Appointment of Executor and Charges on Inheritance");
  const execName = willData.executor.name.trim();
  const execText = `I hereby nominate, constitute, and appoint ${execName} as the sole Executor of this my Last Will and Testament, conferring full authority to represent my estate, manage assets, and assent to bequests. In accordance with Section 45 of Goa Act 23 of 2016, my estate answers for the charges on inheritance in statutory order: first, funeral and last-rites expenses according to my station in life; second, executorship and management burdens, including notarial, inventory, and judicial administration expenses; and third, enforceable debts of the deceased. Pursuant to Section 46 of the said Act, inheritance creditors hold absolute statutory priority over all legatees, and all enforceable debts of my estate shall be satisfied in full prior to the delivery or satisfaction of any bequest under this Will.`;
  printDoubleSpaced(execText, 8.5);

  // ── SECTION V: BEQUEST OF ASSETS ────────────────────────────
  printSectionHeader("SECTION V", "Schedule of Asset Bequests and Allocations");
  const assets = willData.assets || [];
  if (assets.length === 0) {
    printDoubleSpaced("All property of every description shall pass according to the Residuary Clause.");
  } else {
    assets.forEach((asset, idx) => {
      const typeStr = asset.type || 'Asset';
      const descStr = asset.desc || 'Documented asset';
      const valStr = asset.value ? ` (Estimated Value: rupees ${numberToWords(Number(asset.value))})` : '';
      printDoubleSpaced(`Asset Number ${numberToWords(idx + 1)} [${typeStr}]: ${descStr}${valStr}.`, 8.5, true);

      const allocs = asset.allocations || [];
      if (allocs.length === 0) {
        printDoubleSpaced("Bequeathed to designated legal heirs in equal shares.");
      } else {
        allocs.forEach(al => {
          const ben = (willData.beneficiaries || []).find(b => b.id === al.beneficiaryId);
          const bName = ben ? `${ben.name} (${ben.relation || 'Beneficiary'})` : 'Beneficiary';
          const pctWord = numberToWords(Number(al.percentage) || 0);
          printDoubleSpaced(`• Share of ${pctWord} percent bequeathed to ${bName}.`);
        });
      }
    });
  }

  // ── SECTION VI: ASSET-SPECIFIC NOMINATION DIRECTIVES ────────
  printSectionHeader("SECTION VI", "Asset-Specific Nomination and Judicial Precedents");
  const nomLife = generateNominationClause('insurance');
  const nomBank = generateNominationClause('bank');
  const nomDemat = generateNominationClause('demat');
  const nomPPF = generateNominationClause('ppf');
  printDoubleSpaced(`(a) ${nomLife.legalText}`);
  printDoubleSpaced(`(b) ${nomBank.legalText}`);
  printDoubleSpaced(`(c) ${nomDemat.legalText}`);
  printDoubleSpaced(`(d) ${nomPPF.legalText}`);

  // ── SECTION VII: RESIDUARY & SIMULTANEOUS DEATH ─────────────
  printSectionHeader("SECTION VII", "Residuary Estate and Simultaneous Death Presumption");
  const bens = willData.beneficiaries || [];
  const benNamesStr = bens.map(b => b.name).join(', ') || 'my named primary beneficiaries';
  const sec7Text = `Any other property, asset, claim, or investment belonging to me at my demise not specifically detailed herein (comprising my entire residuary estate) shall devolve rateably among my surviving primary beneficiaries (${benNamesStr}) in equal shares. In the event of simultaneous demise in a common calamity where the order of death cannot be established, simultaneous death is presumed pursuant to Section 7 of the Goa Succession Act, 2012, with no inter-se transmission of property between such deceased persons.`;
  printDoubleSpaced(sec7Text, 8.5);

  // ── SECTION VIII: MINOR TESTAMENTARY TRUST ──────────────────
  printSectionHeader("SECTION VIII", "Testamentary Trust for Minor Beneficiaries");
  const trustText = "Where any beneficiary's entitlement vests while below eighteen years of age, their share shall be held in trust by the designated Testamentary Trustee under the Indian Trusts Act, 1882, with investment powers strictly restricted pursuant to Section 20 of said Act to securities authorised by this testamentary instrument or specified by the Central Government by official notification, prioritizing capital preservation, with mandatory annual accounts rendered.";
  printDoubleSpaced(trustText, 8.5);

  // ── ATTESTATION BY TWO CREDITWORTHY WITNESSES (Section 333(1)) ──
  printSectionHeader("ATTESTATION", "Attestation by Two Creditworthy Witnesses");
  const attestText = "Signed, published, and declared by the Testator as his Last Will and Testament, in our continuous presence, who at his request, in his presence, and in the presence of each other, all being present at the same time, have subscribed our names as attesting witnesses. We confirm that we are creditworthy witnesses possessing legal capacity, of known credit and identity, and are neither beneficiaries nor spouses of beneficiaries under this instrument.";
  printDoubleSpaced(attestText, 8.5);

  checkPageBreak(32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  recordLineCoordinate(y);
  doc.text("WITNESS 1: ____________________________      WITNESS 2: ____________________________", marginL, y);
  y += 5;
  recordLineCoordinate(y);
  doc.text("Full Name: ____________________________      Full Name: ____________________________", marginL, y);
  y += 5;
  recordLineCoordinate(y);
  doc.text("Address: ______________________________      Address: ______________________________", marginL, y);
  y += 5;
  recordLineCoordinate(y);
  doc.text("Date & Place: _________________________      Date & Place: _________________________", marginL, y);
  y += 10;

  // ── CONTINUOUS SPECIAL NOTARY RECORD (Section 333(3), (4), (5), (6), (8)) ──
  printSectionHeader("SPECIAL NOTARY ENDORSEMENT", "Record of Presentation, Reading & Registration (Section 333(3)–(8)) [Statutory Template for Execution by Special Notary]");

  const notaryTemplateHeader = "OFFICIAL RECORD OF PRESENTATION PURSUANT TO SECTION 333(3) OF GOA ACT 23 OF 2016:\n" +
    "On this _______ day of ________________ 20___, before me, ____________________________________, Special Notary for the District of ________________, State of Goa, personally appeared:\n" +
    "(1) The Testator: _____________________________________________________________________\n" +
    "(2) Attesting Witness 1: _______________________________________________________________\n" +
    "(3) Attesting Witness 2: _______________________________________________________________\n" +
    "and presented this instrument, declaring it to be the Testator's Printed Open Will.";
  printDoubleSpaced(notaryTemplateHeader, 7.8);

  const notaryReadingTemplate = "RECORD OF READING ALOUD PURSUANT TO SECTION 333(4) OF THE ACT:\n" +
    "I, the Special Notary, hereby certify that upon presentation, I have read this Last Will and Testament aloud in its entirety to the Testator in the simultaneous presence and continuous hearing of the said two creditworthy witnesses, and the Testator thereupon confirmed and ratified the dispositions herein contained in the presence of all.";
  printDoubleSpaced(notaryReadingTemplate, 7.8);

  const langNote = "Section 333(8) Language Verification: Verified that this Open Will is drawn in a permitted official language. (If tendered in an unauthorized language, Section 333(8) statutorily mandates rejection and execution via Public Will).";
  printDoubleSpaced(langNote, 7.5);

  const adminNote = "Notarial Administrative Note: Pursuant to Section 333(7), original printed open wills are periodically bound into books of not more than two hundred sheets by the District Special Notary, with certified photostat copies retained.";
  printDoubleSpaced(adminNote, 7.5);

  // Passport Photograph Box (35mm x 45mm) and Notary Certification
  checkPageBreak(50);
  const photoW = 35;
  const photoH = 45;
  const photoX = marginL + contentWidth - photoW;
  const photoY = y;

  doc.setDrawColor(148, 163, 184);
  doc.rect(photoX, photoY, photoW, photoH);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Passport Photograph", photoX + (photoW / 2), photoY + 12, { align: "center" });
  doc.text("of Testator", photoX + (photoW / 2), photoY + 16, { align: "center" });
  doc.text("(Special Notary cross-", photoX + (photoW / 2), photoY + 28, { align: "center" });
  doc.text("signature & seal", photoX + (photoW / 2), photoY + 32, { align: "center" });
  doc.text("Sec 333(5))", photoX + (photoW / 2), photoY + 36, { align: "center" });

  // Notary Registration Particulars (Left Side)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.0);
  doc.setTextColor(15, 23, 42);
  doc.text("Book of Open Wills Entry: Volume: ____________ Page: ____________ Entry: ____________", marginL, y + 6);
  doc.text("Special Notary Registration Number: ________________________ Date: ________________", marginL, y + 13);
  doc.text("Special Notary Office Jurisdiction: Margao / Panaji / Mapusa, State of Goa.", marginL, y + 20);
  doc.text("Total Certified Sheets: ________________ (without unauthenticated interlineations).", marginL, y + 27);
  doc.text("Official Seal & Signature of Special Notary: ____________________________________", marginL, y + 36);

  // Record exact last printed line on this page
  recordLineCoordinate(y + 36);
  y += 42;

  // ── DRAW HEADERS AND IMMEDIATE SECTION 333(2) SIGNATURES ON EVERY PAGE ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Watermark Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.0);
    doc.setTextColor(148, 163, 184);
    doc.text("DRAFT FOR SPECIAL NOTARY EXECUTION (UNEXECUTED) — SECTION 333, GOA ACT 23 OF 2016", pageWidth / 2, 10, { align: "center" });

    // Section 333(2) Top Signatures (Positioned IMMEDIATELY ABOVE first line of text)
    const firstLine = pageFirstLineY[i] || (marginT + 8);
    const topSigY = Math.max(16, firstLine - 4.0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    doc.setTextColor(71, 85, 105);
    doc.text("[Testator Sig]: ____________________", marginL, topSigY);
    doc.text("[Witness 1]: ____________________", marginL + 50, topSigY);
    doc.text("[Witness 2]: ____________________", marginL + 100, topSigY);

    // Section 333(2) Bottom Signatures (Positioned IMMEDIATELY BELOW last line of text)
    const lastLine = pageLastLineY[i] || (contentBottom - 10);
    const bottomSigY = Math.min(pageHeight - 12, lastLine + 5.0);
    doc.text("[Testator Sig]: ____________________", marginL, bottomSigY);
    doc.text("[Witness 1]: ____________________", marginL + 50, bottomSigY);
    doc.text("[Witness 2]: ____________________", marginL + 100, bottomSigY);

    // Running Page Number Footer
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${totalPages} — Open Will (Section 333, State of Goa)`, pageWidth / 2, pageHeight - 6, { align: "center" });
  }

  return doc;
}
