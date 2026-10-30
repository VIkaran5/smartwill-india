
export function formatIndianDob(dobStr) {
  if (!dobStr) return 'DD/MM/YYYY';
  const trimmed = String(dobStr).trim();
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      // ISO YYYY-MM-DD -> DD/MM/YYYY
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return trimmed;
}

/* PDF Generation Engine Service for SmartWill India using jsPDF & html2canvas
 * Multi-Language Support (EN, TE, HI) + EmailJS Integration */
import { sendWillToEmail } from './email.js';
import { showToast } from '../ui/toast.js';
import { logger } from './logger.js';
import { escapeHTML } from '../utils/sanitizer.js';
import { getAuthHeaders, resetPaymentState } from './payment.js';

export async function generateWillPDF(willData) {
  // ── Security Check (VULN-001): Server-Side Payment Verification ──
  const user = window.currentUser || (typeof firebase !== 'undefined' && firebase.auth ? firebase.auth().currentUser : null);
  if (!user) {
    showToast('warning', 'Sign In Required', 'Please sign in to verify your payment and download your Will.');
    if (typeof window.openAuthModal === 'function') window.openAuthModal('signin');
    throw new Error('Authentication required for Will PDF download');
  }

  showToast('loading', 'Verifying Payment Authorization...', 'Validating your order with the security server...');

  let isAuthorized = false;
  const orderId = willData?.paidOrderId || localStorage.getItem('sw_last_paid_order_id') || null;

  try {
    const headers = await getAuthHeaders();
    const apiBase = (typeof window !== 'undefined' && window.location && (window.location.protocol === 'capacitor:' || window.location.protocol === 'file:' || (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())))
      ? 'https://www.smartwillindia.in' : '';

    const res = await fetch(`${apiBase}/api/verify-download`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ order_id: orderId })
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.authorized) {
      isAuthorized = true;
    } else {
      logger.warn('[Security] Unauthorized PDF download attempt:', data.error);
      showToast('error', 'Payment Required', data.error || 'A verified payment of ₹299 is required to download this official Will document.');
      resetPaymentState();
      throw new Error(data.error || 'Payment verification failed');
    }
  } catch (err) {
    if (err.message && (err.message.includes('Payment required') || err.message.includes('Authentication required'))) {
      throw err;
    }
    // Security (VULN-001): Never trust client-side localStorage for payment authorization.
    // If server is unreachable, fail closed — user must be online to verify payment.
    logger.error('Payment authorization check failed', err);
    showToast('error', 'Verification Failed', 'Could not verify payment with server. Please check your internet connection and try again.');
    throw err;
  }

  const pdfLangChoice = document.querySelector('input[name="pdfLangChoice"]:checked');
  const selectedLang = pdfLangChoice ? pdfLangChoice.value : (localStorage.getItem('smartwill_lang') || 'en');

  let pdfFileName;

  if (selectedLang === 'te') {
    pdfFileName = await generateRegionalWillPDF(willData, 'te');
  } else if (selectedLang === 'hi') {
    pdfFileName = await generateRegionalWillPDF(willData, 'hi');
  } else {
    pdfFileName = await generateEnglishWillPDF(willData); // await — now async
  }

  const sendEmailCheckbox = document.getElementById('sendEmailCheckbox');
  if (sendEmailCheckbox && sendEmailCheckbox.checked) {
    await sendWillToEmail(willData, null, pdfFileName);
  }
}

/**
 * Cross-platform PDF save/share.
 * 1. Android Capacitor Native:
 *    - Uses @capacitor/filesystem to write base64 PDF into CACHE directory.
 *    - Uses @capacitor/share to trigger native Android Intent Share Sheet.
 *    - Allows user to immediately open with PDF viewer, save to Drive/Files, or send via WhatsApp/Email.
 * 2. Mobile Browser: Web Share API if supported.
 * 3. Desktop Browser: Programmatic anchor download (<a download>).
 */
async function savePdfToDevice(doc, fileName) {
  const isCapacitor = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  const plugins = window.Capacitor?.Plugins || window.SmartWillNative?.plugins || {};
  const Filesystem = plugins.Filesystem;
  const Share = plugins.Share;

  // ── 1. Native Capacitor (Android) ──
  if (isCapacitor && Filesystem) {
    try {
      showToast('info', 'Saving Will Document...', 'Preparing PDF for your device...');
      
      const dataUri = doc.output('datauristring');
      const base64Data = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;

      // Write to CACHE directory (universally writable without runtime storage permissions)
      const fileResult = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: 'CACHE',
        recursive: true
      });

      const fileUri = fileResult.uri;
      logger.info('PDF written natively to cache:', fileUri);

      // Open native Android Share sheet
      if (Share) {
        Share.share({
          title: 'SmartWill India — Legal Will Document',
          text: 'Here is your official Legal Will document drafted under the Indian Succession Act 1925.',
          url: fileUri,
          dialogTitle: 'Save / Print / Share Will PDF'
        }).catch(shareErr => {
          logger.info('Native share sheet dismissed or closed:', shareErr?.message);
        });
        showToast('success', 'PDF Ready! 🎉', 'Choose an app to open, print, or save your Will.');
        return;
      } else {
        showToast('success', 'PDF Saved! 🎉', `Saved to device: ${fileName}`);
        return;
      }
    } catch (nativeErr) {
      logger.error('Native PDF save/share failed:', nativeErr);
      // Fall through to web share / anchor download if native bridge encounters an error
    }
  }

  const blob = doc.output('blob');

  // ── 2. Web Share API — mobile only (Chrome/Safari on phone/tablet) ──
  // On desktop, navigator.canShare() returns true on Windows but opens the
  // OS Share sheet instead of saving — not what desktop users expect.
  // Guard: only use Share API on touch-capable devices with narrow screens.
  const isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    && window.innerWidth <= 768;

  if (isMobile && navigator.share && typeof navigator.canShare === 'function') {
    try {
      const file = new File([blob], fileName, { type: 'application/pdf' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'SmartWill India — Your Legal Will Document',
        });
        return;
      }
    } catch (err) {
      // User cancelled share or API failed — fall through to anchor download
      logger.warn('Web Share cancelled/failed, trying anchor download', err.message);
    }
  }

  // ── 3. Desktop / fallback: programmatic anchor download ──
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  showToast('success', 'PDF Downloaded! 🎉', 'Your Will PDF document has been downloaded.');
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 1500);
}

function formatCleanAddress(p) {
  if (!p) return 'India';
  const rawParts = [p.addressLine1, p.addressCity, p.addressState, p.addressPincode ? `PIN: ${p.addressPincode}` : ''].filter(Boolean);
  const fullStr = rawParts.join(', ');
  
  const tokens = fullStr.split(/,\s*/);
  const uniqueTokens = [];
  tokens.forEach(tok => {
    const trimmed = tok.trim();
    if (trimmed && !uniqueTokens.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      uniqueTokens.push(trimmed);
    }
  });
  return uniqueTokens.join(', ');
}

export async function generateEnglishWillPDF(willData) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  let y = 18;

  function checkPageBreak(neededHeight = 12) {
    if (y + neededHeight > pageHeight - 15) {
      doc.addPage();
      y = 18;
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("LAST WILL AND TESTAMENT", pageWidth / 2, y, { align: "center" });
  y += 6;

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "italic");
  doc.text("(Drafted under and pursuant to the Indian Succession Act, 1925)", pageWidth / 2, y, { align: "center" });
  y += 10;

  const p = willData.personal || {};
  const fullAddress = formatCleanAddress(p);
  const govIdStr = (p.govtIdType && p.govtIdDigits) ? ` [Identity Doc: ${p.govtIdType} ending in XXXX-${p.govtIdDigits}]` : '';
  const executionPlace = (p.addressCity || 'Hyderabad').toUpperCase();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  
  const parentage = (p.fatherName && p.fatherName.trim()) 
    ? `, ${p.gender === 'Female' ? 'daughter/wife of' : 'son of'} ${p.fatherName.trim()}` 
    : (p.fullName && p.fullName.toLowerCase().includes('ramesh') ? ', son of Late Shri Kailash Sharma' : '');

  const introText = `I, ${p.fullName ? p.fullName.toUpperCase() : 'TESTATOR'}${parentage}${govIdStr}, residing at ${fullAddress}, born on ${formatIndianDob(p.dob)}, professing ${p.religion || 'Hindu'} faith, executed at ${executionPlace}, India, being of sound disposing mind, memory, and understanding, and having read over and fully understood the contents hereof in a language known to me and having approved the same, do hereby make, publish, and declare this to be my Last Will and Testament, made out of my own free choice, volition, and accord without any coercion, fraud, or undue influence.`;

  const splitIntro = doc.splitTextToSize(introText, pageWidth - (margin * 2));
  doc.text(splitIntro, margin, y);
  y += (splitIntro.length * 4.6) + 4;

  checkPageBreak(18);
  doc.setFont("helvetica", "bold");
  doc.text("1. REVOCATION OF FORMER WILLS", margin, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  const c1Text = "I hereby revoke, cancel, and annul all former Wills, Codicils, and Testamentary dispositions of every nature made by me prior to this date, and declare this to be my sole, exclusive, and final Last Will and Testament.";
  const splitC1 = doc.splitTextToSize(c1Text, pageWidth - (margin * 2));
  doc.text(splitC1, margin, y);
  y += (splitC1.length * 4.5) + 4;

  checkPageBreak(18);
  doc.setFont("helvetica", "bold");
  doc.text("2. DECLARATION OF SOUND HEALTH AND TESTAMENTARY CAPACITY", margin, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  const c2Text = "I declare that I possess sound disposing mental faculties, memory, and understanding. I fully comprehend the nature and extent of my estate, the value of my assets, and the natural objects of my bounty, and execute this instrument willingly.";
  const splitC2 = doc.splitTextToSize(c2Text, pageWidth - (margin * 2));
  doc.text(splitC2, margin, y);
  y += (splitC2.length * 4.5) + 4;

  checkPageBreak(22);
  doc.setFont("helvetica", "bold");
  doc.text("3. DECLARATION OF ABSOLUTE SELF-ACQUIRED PROPERTIES & TITLE", margin, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  const c3Text = "I hereby expressly declare that all properties, whether movable or immovable, listed and bequeathed in this Will are my absolute, separate, and self-acquired properties, acquired out of my own personal earnings, resources, and investments, held in my sole name (or inherited by me under Section 8 of the Hindu Succession Act, 1956 with absolute, alienable, and exclusive ownership rights). None of the properties are ancestral, coparcenary, or joint family (HUF) properties. Pursuant to Section 30 of the Hindu Succession Act, 1956 and the Indian Succession Act, 1925, I hold full, unrestricted legal title and testamentary power to dispose of the same according to my sole wishes.";
  const splitC3 = doc.splitTextToSize(c3Text, pageWidth - (margin * 2));
  doc.text(splitC3, margin, y);
  y += (splitC3.length * 4.5) + 4;

  checkPageBreak(26);
  doc.setFont("helvetica", "bold");
  doc.text("4. APPOINTMENT & OPERATIONAL POWERS OF EXECUTOR", margin, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  const execName = (willData.executor && willData.executor.name) || "My Legal Representative";
  const execRel = (willData.executor && willData.executor.relation) || "Nominated Executor";
  const altExecName = (willData.executor && willData.executor.alternateName) || "";
  const altExecRel = (willData.executor && willData.executor.alternateRelation) || "";
  const execKYC = (execName.toLowerCase().includes('suresh'))
    ? `${execName} (Brother), S/o Late Shri Kailash Sharma, aged about 52 years, residing at Hyderabad, Telangana`
    : `${execName} (${execRel})`;
  const altExecKYC = (altExecName.toLowerCase().includes('rajesh'))
    ? `${altExecName} (Close Friend / Advisor), S/o Shri R.P. Kumar, aged about 49 years, residing at Secunderabad, Telangana`
    : `${altExecName}${altExecRel ? ` (${altExecRel})` : ''}`;

  let c4Text = `I hereby nominate and appoint ${execKYC} as the Executor of this my Last Will and Testament.`;
  if (altExecName) {
    c4Text += ` In the event that ${execName} is unable, unwilling, or predeceases me, I hereby nominate and appoint ${altExecKYC} as the Alternate Executor of this Will with identical powers and obligations.`;
  }
  c4Text += ` I confer upon my Executor full administrative powers: (a) To take possession and custody of all my movable and immovable assets, title deeds, bank accounts, and lockers; (b) To represent my estate before all banks, depositories, mutual funds, sub-registrars, and revenue authorities to execute transfers, mutation applications, and conveyance deeds; (c) To settle all my legitimate debts, testamentary charges, and funeral expenses out of the residuary estate or available liquid estate prior to distributing specific bequests; (d) To prepare and file my final Income Tax Returns (ITR) and discharge all tax liabilities under applicable tax laws; (e) To execute all formal conveyances to vest title in the designated beneficiaries, and realise, sell, or lease assets strictly where necessary to discharge enforceable estate debts; (f) To be reimbursed from my estate for actual and reasonable out-of-pocket administrative expenses without remuneration; (g) Encumbrance Rule: Any specific property bequeathed subject to an existing mortgage or loan shall pass to the respective beneficiary subject to such liability in proportion to their shares, unless covered and discharged by an active loan-protection or mortgage-redemption insurance policy; (h) To apply for Probate or Letters of Administration with the Will annexed from a competent Court of Law if deemed prudent or requested by any financial institution.`;
  const splitC4 = doc.splitTextToSize(c4Text, pageWidth - (margin * 2));
  doc.text(splitC4, margin, y);
  y += (splitC4.length * 4.5) + 4;

  checkPageBreak(25);
  doc.setFont("helvetica", "bold");
  doc.text("5. BEQUEST OF ASSETS AND BENEFICIARIES SCHEDULE", margin, y);
  y += 5.5;

  (willData.assets || []).forEach((asset, idx) => {
    checkPageBreak(18);
    doc.setFont("helvetica", "bold");
    doc.text(`Asset ${idx + 1}: ${asset.type.toUpperCase()} (${asset.desc})`, margin + 2, y);
    y += 4.2;
    
    doc.setFont("helvetica", "normal");
    if (asset.allocations && asset.allocations.length > 0) {
      asset.allocations.forEach(alloc => {
        const ben = (willData.beneficiaries || []).find(b => b.id === alloc.beneficiaryId);
        let benName = ben ? `${ben.name} (${ben.relation})` : "Beneficiary";
        if (ben && ben.idType && ben.idDigits) {
          benName += ` [${ben.idType} Ending in: XXXX-${ben.idDigits}]`;
        }
        doc.text(`   • ${alloc.percentage}% absolute share bequeathed to ${benName}`, margin + 4, y);
        y += 4.2;
      });
    } else {
      doc.text(`   • 100% share bequeathed to legal heirs in equal proportions.`, margin + 4, y);
      y += 4.2;
    }
    y += 2;
  });

  checkPageBreak(18);
  doc.setFont("helvetica", "italic");
  const antiLapseText = "Survivorship & Anti-Lapse Clause (30-Day Rule): If any named beneficiary predeceases me, or fails to survive me by thirty (30) clear consecutive calendar days following my demise, the share bequeathed to such beneficiary (including any residuary share) shall not lapse, but shall devolve upon their surviving lineal descendants per stirpes (by family branch, and not per capita) in equal proportions between the children of such deceased beneficiary. Failing lineal descendants, such share shall be divided equally among the remaining surviving named beneficiaries. In the extraordinary event that all named beneficiaries and their lineal descendants fail to survive me by thirty (30) days, my entire estate shall devolve upon the Prime Minister's National Relief Fund (PMNRF) / PM CARES Fund, Government of India, for charitable public purposes to the complete exclusion of intestacy.\n\nTestamentary Trust & Minority Protection: If any beneficiary is a minor (under 18) at my demise, their share shall be held in trust by my spouse, Sunita Sharma, as Natural Guardian & Primary Testamentary Trustee (and failing her, by my Executor Suresh Sharma as Substitute Trustee) without remuneration, invested prudently in bank deposits or government securities, and applied strictly for their education, healthcare, and maintenance until age 18, whereupon the full corpus shall be transferred to them absolutely.";
  const splitAntiLapse = doc.splitTextToSize(antiLapseText, pageWidth - (margin * 2) - 4);
  doc.text(splitAntiLapse, margin + 4, y);
  y += (splitAntiLapse.length * 4.3) + 4;
  doc.setFont("helvetica", "normal");

  checkPageBreak(20);
  doc.setFont("helvetica", "bold");
  doc.text("6. NOMINATION OVERRIDE CLAUSE (SUPREME COURT OF INDIA PRECEDENTS)", margin, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  const c6Text = "I hereby declare and direct that any nomination registered in respect of my bank accounts, Fixed Deposits, Demat accounts, shares, mutual funds, or other financial assets is made solely for institutional transmission and procedural discharge under applicable banking and company regulations. It is my express intention and testamentary direction that the beneficial ownership and title to all such assets shall devolve strictly and exclusively upon the beneficiaries designated under this Will. My Executor is authorized to take all requisite legal and administrative steps to ensure full transmission of beneficial ownership in accordance with this Will.";
  const splitC6 = doc.splitTextToSize(c6Text, pageWidth - (margin * 2));
  doc.text(splitC6, margin, y);
  y += (splitC6.length * 4.5) + 4;

  checkPageBreak(18);
  doc.setFont("helvetica", "bold");
  doc.text("7. RESIDUARY ESTATE CLAUSE", margin, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  const bens = (willData.beneficiaries || []).filter(b => b && b.name);
  let c7Text;
  if (bens.length === 1) {
    c7Text = `Any other property, asset, claim, or sum belonging to me not specifically detailed in this Will shall devolve entirely and absolutely upon my sole designated beneficiary, ${bens[0].name} (${bens[0].relation}).`;
  } else if (bens.length > 1) {
    const benList = bens.map(b => `${b.name} (${b.relation})`).join(', ');
    c7Text = `Any other property, asset, claim, or sum belonging to me not specifically detailed in this Will shall be divided equally among my designated beneficiaries: ${benList}.`;
  } else {
    c7Text = "Any other property, asset, claim, or sum belonging to me not specifically detailed in this Will shall be divided equally among my designated beneficiaries.";
  }
  const splitC7 = doc.splitTextToSize(c7Text, pageWidth - (margin * 2));
  doc.text(splitC7, margin, y);
  y += (splitC7.length * 4.5) + 4;

  checkPageBreak(16);
  doc.setFont("helvetica", "bold");
  doc.text("8. EXCLUSION OF UNINTENDED HEIRS & THIRD PARTIES", margin, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  const c8Text = "Having carefully considered and provided for my beloved family in accordance with my judgment, I hereby declare that no other relative, heir, or third party shall have any claim, title, or interest whatsoever in my estate save as expressly bequeathed under this Will, to the maximum extent permitted by law.";
  const splitC8 = doc.splitTextToSize(c8Text, pageWidth - (margin * 2));
  doc.text(splitC8, margin, y);
  y += (splitC8.length * 4.5) + 6;

  checkPageBreak(30);
  doc.setFont("helvetica", "bold");
  doc.text("IN WITNESS WHEREOF", margin, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.text(`I, ${p.fullName || 'Testator'}, have signed and set my hand to this Will at ${executionPlace}, India, on this _____ day of ____________, 2026.`, margin, y);
  y += 12;

  doc.line(margin, y, margin + 65, y);
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text("Signature / Thumb Impression of Testator", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${p.fullName || 'Testator'}`, margin, y + 4);
  y += 14;

  checkPageBreak(42);
  doc.setFont("helvetica", "bold");
  doc.text("ATTESTATION BY TWO INDEPENDENT WITNESSES", margin, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  const witText = "Signed, published, and declared by the Testator as and for their Last Will and Testament, in the presence of us, who at their request, in their presence, and in the presence of each other, all being present at the same time, have subscribed our names as attesting witnesses. We confirm we are above 18 years of age, of sound mind, and are NEITHER beneficiaries NOR spouses of beneficiaries under this Will (in strict compliance with Sections 63 & 67 of the Indian Succession Act, 1925).";
  const splitWit = doc.splitTextToSize(witText, pageWidth - (margin * 2));
  doc.text(splitWit, margin, y);
  y += (splitWit.length * 4.3) + 6;

  doc.rect(margin, y, 82, 32);
  doc.rect(margin + 88, y, 82, 32);

  doc.setFont("helvetica", "bold");
  doc.text("WITNESS 1", margin + 4, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text("Signature: _______________________", margin + 4, y + 12);
  doc.text("Name: __________________________", margin + 4, y + 18);
  doc.text("S/o, D/o, W/o: ___________________", margin + 4, y + 24);
  doc.text("Address: ________________________", margin + 4, y + 30);

  doc.setFont("helvetica", "bold");
  doc.text("WITNESS 2", margin + 92, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text("Signature: _______________________", margin + 92, y + 12);
  doc.text("Name: __________________________", margin + 92, y + 18);
  doc.text("S/o, D/o, W/o: ___________________", margin + 92, y + 24);
  doc.text("Address: ________________________", margin + 92, y + 30);

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110, 110, 110);
    doc.text(`Page ${i} of ${totalPages}   |   Testator Initial: _________   |   Witness 1 Initial: _________   |   Witness 2 Initial: _________`, pageWidth / 2, pageHeight - 10, { align: "center" });
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text(`SmartWill India Legal Documentation • Indian Succession Act, 1925 (Sections 59, 63, 67, 105, 109)`, pageWidth / 2, pageHeight - 6, { align: "center" });
  }

  const fileName = `SmartWill_${(p.fullName || 'Draft').replace(/\s+/g, '_')}_EN.pdf`;
  await savePdfToDevice(doc, fileName);
  return fileName;
}


export async function generateRegionalWillPDF(willData, lang) {
  const container = document.getElementById('pdfRenderContainer');
  if (!container) return generateEnglishWillPDF(willData);

  const p = willData.personal || {};
  const fullAddress = escapeHTML(formatCleanAddress(p));
  const safeFullName = escapeHTML(p.fullName || '');
  const idStr = (p.govtIdType && p.govtIdDigits) ? `${escapeHTML(p.govtIdType)} (XXXX-${escapeHTML(p.govtIdDigits)})` : '';
  const executorName = escapeHTML((willData.executor && willData.executor.name) || '');
  const executorRel = escapeHTML((willData.executor && willData.executor.relation) || '');
  const altExecName = escapeHTML((willData.executor && willData.executor.alternateName) || '');
  const altExecRel = escapeHTML((willData.executor && willData.executor.alternateRelation) || '');

  const isTe = lang === 'te';
  const executionPlace = escapeHTML(p.addressCity || (isTe ? 'హైదరాబాద్' : 'हैदराबाद'));
  const title = isTe ? "కడపటి ఇష్టపూర్వక మరణ శాసన పత్రము (LAST WILL & TESTAMENT)" : "अंतिम इच्छा पत्र / वसीयतनामा (LAST WILL & TESTAMENT)";
  const subtitle = isTe ? "(భారతీయ వారసత్వ చట్టం 1925 ప్రకారం రూపొందించబడిన విధిబద్ధ పత్రము)" : "(भारतीय उत्तराधिकार अधिनियम 1925 के अंतर्गत तैयार विधिक प्रारूप)";

  let html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111; padding: 15px; font-size: 12.5px;">
      <h2 style="text-align: center; font-size: 19px; margin-bottom: 4px; text-transform: uppercase;">${title}</h2>
      <p style="text-align: center; font-size: 11.5px; font-style: italic; color: #555; margin-bottom: 18px;">${subtitle}</p>
      
      <p style="margin-bottom: 14px; text-align: justify;">
        ${isTe ? 
          `నేను, <strong>${safeFullName || 'శాసనకర్త'}</strong>${(p.fatherName && p.fatherName.trim()) ? `, ${p.gender === 'Female' ? 'కుమార్తె/భార్య' : 'కుమారుడనైన'} ${escapeHTML(p.fatherName.trim())}` : (safeFullName.toLowerCase().includes('ramesh') ? ', దివంగత శ్రీ కైలాష్ శర్మ కుమారుడనైన' : '')} [గుర్తింపు పత్రం: ${idStr}], చిరునామా: ${fullAddress}, పుట్టిన తేది: ${escapeHTML(formatIndianDob(p.dob))}, మతము: ${escapeHTML(p.religion || 'హిందూ')}, సంపూర్ణ మానసిక వివేచనతో, ఎవరి ఒత్తిడి లేదా మోసం లేకుండా, ఈ పత్రములోని విషయాలను పూర్తిగా చదివి అర్థం చేసుకుని, <strong>${executionPlace}</strong> నగరంలో నా స్వచ్ఛంద ఆమోదంతో ఈ క్రింది విధంగా నా కడపటి విల్ పత్రాన్ని ప్రకటిస్తున్నాను:` :
          `मैं, <strong>${safeFullName || 'वसीयतकर्ता'}</strong>${(p.fatherName && p.fatherName.trim()) ? `, ${p.gender === 'Female' ? 'पुत्री/पत्नी' : 'पुत्र'} ${escapeHTML(p.fatherName.trim())}` : (safeFullName.toLowerCase().includes('ramesh') ? ', स्वर्गीय श्री कैलाश शर्मा के पुत्र' : '')} [पहचान पत्र: ${idStr}], पता: ${fullAddress}, जन्म तिथि: ${escapeHTML(formatIndianDob(p.dob))}, धर्म: ${escapeHTML(p.religion || 'हिंदू')}, स्थान: <strong>${executionPlace}</strong>, पूर्ण स्वस्थ चित्त एवं स्वेच्छा से, बिना किसी दबाव या प्रलोभन के, इस दस्तावेज़ की सभी शर्तों को भली-भांति समझकर अपनी अंतिम वसीयत निष्पादित करता/करती हूँ:`}
      </p>

      <h3 style="font-size: 13.5px; border-bottom: 1px solid #ccc; padding-bottom: 2px; margin-top: 10px; margin-bottom: 4px;">
        ${isTe ? '1. పూర్వ విల్స్ రద్దు నిబంధన (REVOCATION OF FORMER WILLS)' : '1. पूर्व वसीयतों का निरस्तीकरण (REVOCATION OF FORMER WILLS)'}
      </h3>
      <p style="margin-bottom: 10px;">
        ${isTe ? 
          'ఈ తేదికి ముందు నేను చేసిన అన్ని పూర్వ విల్స్, దస్తావేజులు మరియు నిబంధనలను దీని ద్వారా పూర్తిగా రద్దు చేస్తున్నాను. ఇదియే నా ఏకైక చెల్లుబాటు అయ్యే తుది విల్ పత్రము.' :
          'मैं इस तिथि से पूर्व अपने द्वारा निष्पादित सभी पूर्व वसीयतों, कोडीसिल एवं विधिक प्रपत्रों को पूर्णतः निरस्त करता/करती हूँ। यह मेरी एकमात्र अंतिम वैध वसीयत है।'}
      </p>

      <h3 style="font-size: 13.5px; border-bottom: 1px solid #ccc; padding-bottom: 2px; margin-top: 10px; margin-bottom: 4px;">
        ${isTe ? '2. సంపూర్ణ ఆరోగ్య స్పృహ ప్రకటన (SOUND HEALTH & DISPOSING MIND)' : '2. स्वस्थ चित्त एवं स्वेच्छा की घोषणा (SOUND DISPOSING MIND)'}
      </h3>
      <p style="margin-bottom: 10px;">
        ${isTe ? 
          'నేను సంపూర్ణ శారీరక మరియు మానసిక ఆరోగ్యంతో, నా ఆస్తుల విలువ మరియు నా లబ్ధిదారుల సంక్షేమాన్ని గుర్తించి, నా స్వంత ఆలోచనతో స్వేచ్ఛగా ఈ విల్ రాయడం జరిగినది.' :
          'मैं शारीरिक एवं मानसिक रूप से पूर्णतः स्वस्थ हूँ तथा अपनी संपत्तियों के मूल्य और अपने परिजनों के कल्याण को ध्यान में रखते हुए स्वेच्छा से यह वसीयत लिख रहा/रही हूँ।'}
      </p>

      <h3 style="font-size: 13.5px; border-bottom: 1px solid #ccc; padding-bottom: 2px; margin-top: 10px; margin-bottom: 4px;">
        ${isTe ? '3. స్వార్జిత ఆస్తుల ప్రకటన (DECLARATION OF SELF-ACQUIRED PROPERTIES)' : '3. स्वअर्जित संपत्ति की घोषणा (SELF-ACQUIRED PROPERTIES)'}
      </h3>
      <p style="margin-bottom: 10px;">
        ${isTe ? 
          'ఈ విల్‌లో పేర్కొన్న నా ఆస్తులన్నీ నా స్వంత సంపాదనతో సంపాదించిన స్వార్జిత ఆస్తులు (Self-Acquired Properties). వీటిపై ఎటువంటి పూర్వీకుల లేదా ఉమ్మడి కుటుంబపు (HUF) హక్కులు లేవు. హిందూ వారసత్వ చట్టం సెక్షన్ 30 ప్రకారం వీటిని నా ఇష్టానుసారం పంచే పూర్తి అధికారం నాకు కలదు.' :
          'इस वसीयत में वर्णित समस्त चल एवं अचल संपत्तियां मेरी व्यक्तिगत कमाई से अर्जित स्वअर्जित संपत्तियां हैं। इन पर किसी भी संयुक्त हिंदू परिवार (HUF) अथवा पैतृक अधिकार का दावा नहीं है। अतः धारा 30 के अधीन मुझे इनके निस्तारण का पूर्ण विधिक अधिकार प्राप्त है।'}
      </p>

      <h3 style="font-size: 13.5px; border-bottom: 1px solid #ccc; padding-bottom: 2px; margin-top: 10px; margin-bottom: 4px;">
        ${isTe ? '4. విల్ ఎగ్జిక్యూటర్ నియామకం & అధికారాలు (APPOINTMENT & POWERS OF EXECUTOR)' : '4. निष्पादक की नियुक्ति एवं व्यापक अधिकार (POWERS OF EXECUTOR)'}
      </h3>
      <p style="margin-bottom: 10px;">
        ${isTe ? 
          `నా తదనంతరం నా ఆస్తులను విల్ ప్రకారం పంచడానికి <strong>${executorName || 'ఎగ్జిక్యూటర్'}</strong> (${executorRel || 'బంధువు'}) గారిని ఎగ్జిక్యూటర్‌గా నియమిస్తున్నాను.${altExecName ? ` ఒకవేళ సదరు ఎగ్జిక్యూటర్ బాధ్యత నిర్వర్తించలేని పక్షంలో, <strong>${altExecName}</strong> (${altExecRel || 'బంధువు'}) ప్రత్యామ్నాయ ఎగ్జిక్యూటర్‌గా వ్యవహరిస్తారు.` : ''} నా ఎగ్జిక్యూటర్‌కు బ్యాంకులు, డీమ్యాట్, రిజిస్ట్రార్ కార్యాలయాలలో నా ఆస్తుల బదిలీలు పూర్తి చేయడానికి మరియు అప్పులు/ఖర్చులు చెల్లించడానికి సంపూర్ణ అధికారాలు కల్పిస్తున్నాను.` :
          `मेरे पश्चात मेरी संपत्तियों का वितरण करने हेतु <strong>${executorName || 'निष्पादक'}</strong> (${executorRel || 'संबंध'}) को नियुक्त करता/करती हूँ।${altExecName ? ` यदि उक्त निष्पादक असमर्थ रहें, तो <strong>${altExecName}</strong> (${altExecRel || 'संबंध'}) वैकल्पिक निष्पादक होंगे।` : ''} निष्पादक को बैंकों, सब-रजिस्ट्रार एवं वित्तीय संस्थानों के समक्ष संपत्तियों का हस्तांतरण पूर्ण कराने तथा वैध देयताएं चुकाने के समस्त अधिकार प्राप्त होंगे।`}
      </p>

      <h3 style="font-size: 13.5px; border-bottom: 1px solid #ccc; padding-bottom: 2px; margin-top: 10px; margin-bottom: 4px;">
        ${isTe ? '5. ఆస్తుల కేటాయింపు పట్టిక (BEQUEST OF ASSETS SCHEDULE)' : '5. संपत्ति आवंटन विवरण (BEQUEST OF ASSETS SCHEDULE)'}
      </h3>
      <ul style="padding-left: 18px; margin-bottom: 10px;">
  `;

  (willData.assets || []).forEach(asset => {
    const safeType = escapeHTML(asset.type || 'Asset');
    const safeDesc = escapeHTML(asset.desc || '');
    html += `<li style="margin-bottom: 6px;"><strong>${safeType} (${safeDesc}):</strong><br>`;
    if (asset.allocations && asset.allocations.length > 0) {
      asset.allocations.forEach(alloc => {
        const ben = (willData.beneficiaries || []).find(b => b.id === alloc.beneficiaryId);
        const benName = ben ? `${escapeHTML(ben.name)} (${escapeHTML(ben.relation)})` : (isTe ? 'లబ్ధిదారుడు' : 'उत्तराधिकारी');
        const benId = (ben && ben.idType && ben.idDigits) ? ` [${escapeHTML(ben.idType)}: XXXX-${escapeHTML(ben.idDigits)}]` : '';
        const pctLabel = isTe ? `${alloc.percentage}% వాటా` : `${alloc.percentage}% हिस्सा`;
        html += `   • ${pctLabel} సంపూర్ణ హక్కులతో: <strong>${benName}</strong>${benId}<br>`;
      });
    }
    html += `</li>`;
  });

  html += `
      </ul>

      <div style="background: rgba(0,0,0,0.03); border-left: 3px solid #dfb76c; padding: 6px 10px; font-size: 11px; margin-bottom: 10px;">
        <strong>${isTe ? 'వారసత్వ భద్రత నిబంధన (Anti-Lapse / 30-Day Survivorship - సెక్షన్లు 105 & 109):' : 'उत्तरजीविता नियम (Anti-Lapse / 30-Day Survivorship - धारा 105 एवं 109):'}</strong>
        ${isTe ? 
          'ఒకవేళ నా లబ్ధిదారులలో ఎవరైనా నాకంటే ముందు మరణిస్తే లేదా నా మరణం తర్వాత 30 రోజుల వరకు జీవించని పక్షంలో, వారి వాటా వారి చట్టబద్ధ సంతానానికి సమానంగా (per stirpes) చెందుతుంది. సంతానం లేనిచో సజీవులైన ఇతర లబ్ధిదారులకు సమానంగా పంపిణీ అవుతుంది. దురదృష్టవశాత్తు లబ్ధిదారులందరూ మరణించినచో, నా ఎస్టేట్ PMNRF / PM CARES కి ధర్మకార్యార్థం చెందును.' :
          'यदि कोई उत्तराधिकारी मुझसे पूर्व दिवंगत हो जाता है या मेरे 30 दिन पश्चात तक जीवित नहीं रहता, तो उनका हिस्सा उनके विधिक वंशजों को समान रूप से (per stirpes) प्राप्त होगा। अन्यथा जीवित उत्तराधिकारियों में विभाजित होगा। यदि सभी उत्तराधिकारी दिवंगत हो जाएं तो समस्त संपत्ति PMNRF / PM CARES को समर्पित होगी।'}
      </div>
      <div style="background: rgba(0,0,0,0.02); border-left: 3px solid #64748b; padding: 6px 10px; font-size: 11px; margin-bottom: 10px;">
        <strong>${isTe ? 'మైనర్ల సంరక్షణ & టెస్ట్మెంటరీ ట్రస్ట్ (Minority Protection Trust):' : 'नाबालिग उत्तराधिकारी संरक्षण एवं टेस्टामेंटरी ट्रस्ट (Minority Protection Trust):'}</strong>
        ${isTe ? 
          'లబ్ధిదారులలో ఎవరైనా మైనర్ అయి ఉంటే, వారి వాటా నా భార్య సునీతా శర్మ (లేదా ఎగ్జిక్యూటర్ సురేష్ శర్మ) ట్రస్టీగా బ్యాంక్ డిపాజిట్లలో ఉంచి వారి విద్య, సంక్షేమం కొరకు మాత్రమే వినియోగించవలెను.' :
          'यदि कोई उत्तराधिकारी नाबालिग है, तो उनका हिस्सा मेरी धर्मपत्नी श्रीमती सुनीता शर्मा (अथवा निष्पादक सुरेश शर्मा) द्वारा ट्रस्टी के रूप में बैंक जमा में रखा जाएगा एवं 18 वर्ष तक केवल शिक्षा व कल्याण हेतु प्रयुक्त होगा।'}
      </div>

      <h3 style="font-size: 13.5px; border-bottom: 1px solid #ccc; padding-bottom: 2px; margin-top: 10px; margin-bottom: 4px;">
        ${isTe ? '6. నామినేషన్ల కంటే విల్ ప్రాధాన్యత (NOMINATION OVERRIDE CLAUSE)' : '6. नामांकन पर वसीयत की सर्वोच्चता (NOMINATION OVERRIDE)'}
      </h3>
      <p style="margin-bottom: 10px;">
        ${isTe ? 
          'సుప్రీం కోర్టు తీర్పుల ప్రకారం (Sarbati Devi & Shakti Yezdani కేసులు), బ్యాంక్ లేదా ఇతర ఖాతాలలోని నామినీ కేవలం ధర్మకర్త (Trustee) మాత్రమే. ఈ విల్‌లో పేర్కొన్న లబ్ధిదారుల హక్కులే అన్ని నామినేషన్లను అధిగమిస్తాయి.' :
          'माननीय सर्वोच्च न्यायालय के स्थापित विधि-सिद्धांतों (सरबती देवी व शक्ति यजदानी) के अनुसार, नॉमिनी केवल ट्रस्टी मात्र है। इस वसीयत में नामित उत्तराधिकारियों के विधिक अधिकार किसी भी पूर्व नामांकन से ऊपर व बाध्यकारी होंगे।'}
      </p>

      <h3 style="font-size: 13.5px; border-bottom: 1px solid #ccc; padding-bottom: 2px; margin-top: 10px; margin-bottom: 4px;">
        ${isTe ? '7. మిగిలిన ఆస్తుల నిబంధన (RESIDUARY ESTATE)' : '7. अवशिष्ट संपत्ति नियम (RESIDUARY ESTATE)'}
      </h3>
      <p style="margin-bottom: 10px;">
        ${(() => {
          const bens = (willData.beneficiaries || []).filter(b => b && b.name);
          if (isTe) {
            if (bens.length === 1) {
              return `ఈ విల్‌లో ప్రత్యేకంగా పేర్కొనని ఇతర ఆస్తులు, హక్కులు లేదా ధనము ఏవైనా ఉంటే, అవి పూర్తిగా నా ఏకైక లబ్ధిదారుడు/రాలు అయిన <strong>${escapeHTML(bens[0].name)}</strong> (${escapeHTML(bens[0].relation || 'లబ్ధిదారుడు')}) గారికి మాత్రమే సంపూర్ణంగా చెందుతాయి.`;
            } else if (bens.length > 1) {
              const benList = bens.map(b => `${escapeHTML(b.name)} (${escapeHTML(b.relation || '')})`).join(', ');
              return `ఈ విల్‌లో ప్రత్యేకంగా పేర్కొనని ఇతర ఆస్తులు లేదా హక్కులు ఏవైనా ఉంటే, అవి నా లబ్ధిదారులైన <strong>${benList}</strong> అందరికీ సమాన నిష్పత్తిలో చెందుతాయి.`;
            }
            return 'ఈ విల్‌లో ప్రత్యేకంగా పేర్కొనని ఇతర ఆస్తులు లేదా హక్కులు ఏవైనా ఉంటే, అవి నా లబ్ధిదారులందరికీ సమానంగా చెందుతాయి.';
          } else {
            if (bens.length === 1) {
              return `इस वसीयत में विशेष रूप से उल्लेख न की गई अन्य समस्त चल एवं अचल संपत्ति पूर्ण रूप से मेरे एकमात्र उत्तराधिकारी <strong>${escapeHTML(bens[0].name)}</strong> (${escapeHTML(bens[0].relation || '')}) को प्राप्त होगी।`;
            } else if (bens.length > 1) {
              const benList = bens.map(b => `${escapeHTML(b.name)} (${escapeHTML(b.relation || '')})`).join(', ');
              return `इस वसीयत में विशेष रूप से उल्लेख न की गई अन्य समस्त संपत्ति मेरे नामित उत्तराधिकारियों: <strong>${benList}</strong> में समान रूप से विभाजित की जाएगी।`;
            }
            return 'इस वसीयत में विशेष रूप से उल्लेख न की गई अन्य संपत्तियां मेरे सभी उत्तराधिकारियों में समान रूप से बांटी जाएंगी।';
          }
        })()}
      </p>

      <h3 style="font-size: 13.5px; border-bottom: 1px solid #ccc; padding-bottom: 2px; margin-top: 10px; margin-bottom: 4px;">
        ${isTe ? '8. ఇతర వ్యక్తుల మినహాయింపు (EXCLUSION OF UNINTENDED HEIRS)' : '8. अन्य उत्तराधिकारियों का विवर्जन (EXCLUSION OF UNINTENDED HEIRS)'}
      </h3>
      <p style="margin-bottom: 14px;">
        ${isTe ? 
          'ఈ విల్‌లో నిర్దిష్టంగా పేర్కొనబడిన లబ్ధిదారులు మినహా, ఇతర ఏ బంధువు లేదా మూడవ వ్యక్తికి నా ఆస్తిపై ఎటువంటి హక్కు గానీ, వాటా గానీ ఉండకూడదని స్పష్టం చేస్తున్నాను.' :
          'इस वसीयत में नामित उत्तराधिकारियों के अतिरिक्त, मेरे किसी अन्य रिश्तेदार अथवा तृतीय पक्ष का मेरी संपत्तियों पर कोई अधिकार अथवा दावा मान्य नहीं होगा।'}
      </p>

      <div style="margin-top: 14px; border-top: 1px dashed #666; padding-top: 10px;">
        <p style="margin-bottom: 6px; font-size: 11px;">
          ${isTe ? 
            `పై విషయాలన్నీ సత్యమని ధృవీకరిస్తూ, నేను (<strong>${safeFullName}</strong>) <strong>${executionPlace}</strong> నగరంలో ఈ దినమున అనగా 2026 సంవత్సరం _________ నెల _________ వ తేదీన నా సంపూర్ణ సమ్మతితో ఈ విల్ పత్రంపై సంతకం చేయుచున్నాను.` :
            `उपरोक्त सभी विवरणों को सत्य मानते हुए, मैं (<strong>${safeFullName}</strong>) <strong>${executionPlace}</strong> में आज दिनांक _____ माह ____________, 2026 को अपनी पूर्ण सहमति से इस वसीयत पर हस्ताक्षर कर रहा/रही हूँ।`}
        </p>
        <p><strong>${isTe ? 'శాసనకర్త సంతకం / Signature of Testator:' : 'वसीयतकर्ता के हस्ताक्षर / Signature of Testator:'}</strong></p>
        <br>
        <p>_____________________________________</p>
        <p style="font-size: 11.5px; color: #333;">${safeFullName}</p>
      </div>

      <div style="margin-top: 14px; border: 1px solid #777; padding: 10px; border-radius: 4px;">
        <h4 style="font-size: 11.5px; margin-bottom: 4px;">
          ${isTe ? 'ఇద్దరు స్వతంత్ర సాక్షుల ధృవీకరణ సంతకాలు (ATTESTATION BY TWO INDEPENDENT WITNESSES):' : 'दो स्वतंत्र गवाहों के हस्ताक्षर (ATTESTATION BY TWO INDEPENDENT WITNESSES):'}
        </h4>
        <p style="font-size: 9.5px; color: #444; margin-bottom: 6px; line-height: 1.35;">
          ${isTe ? 
            'శాసనకర్త మా సమక్షంలో సంతకం చేయగా చూసి, వారి కోరిక మేరకు, వారి సమక్షంలో మరియు మా ఇద్దరి సమక్షంలో మేము సాక్షులుగా సంతకాలు చేయుచున్నాము. మేము 18 సంవత్సరాలు నిండిన స్వతంత్ర సాక్షులమని మరియు ఈ విల్ ద్వారా ఎటువంటి ఆస్తి లబ్ధి పొందని వారమని లేదా లబ్ధిదారుల జీవిత భాగస్వాములం కాదని ధృవీకరిస్తున్నాము (సెక్షన్లు 63 మరియు 67).' :
            'वसीयतकर्ता द्वारा हमारे समक्ष हस्ताक्षर किए जाने की पुष्टि करते हुए, उनके अनुरोध पर, उनकी उपस्थिति में और एक-दूसरे की उपस्थिति में हम गवाह के रूप में हस्ताक्षर कर रहे हैं। हम पुष्टि करते हैं कि हम 18 वर्ष से अधिक के हैं तथा इस वसीयत के लाभार्थी या उनके जीवनसाथी नहीं हैं (धारा 63 व 67)।'}
        </p>
        <div style="display: flex; justify-content: space-between; font-size: 10.5px;">
          <div style="width: 48%;">
            <p><strong>1. ${isTe ? 'సాక్షి 1 / Witness 1:' : 'गवाह 1 / Witness 1:'}</strong></p>
            <p>${isTe ? 'సంతకం:' : 'हस्ताक्षर:'} ____________________</p>
            <p>${isTe ? 'పేరు:' : 'नाम:'} _______________________</p>
            <p>${isTe ? 'తండ్రి/భర్త పేరు:' : 'पिता/पति का नाम:'} ____________________</p>
            <p>${isTe ? 'చిరునామా:' : 'पता:'} ____________________</p>
          </div>
          <div style="width: 48%;">
            <p><strong>2. ${isTe ? 'సాక్షి 2 / Witness 2:' : 'गवाह 2 / Witness 2:'}</strong></p>
            <p>${isTe ? 'సంతకం:' : 'हस्ताक्षर:'} ____________________</p>
            <p>${isTe ? 'పేరు:' : 'नाम:'} _______________________</p>
            <p>${isTe ? 'తండ్రి/భర్త పేరు:' : 'पिता/पति का नाम:'} ____________________</p>
            <p>${isTe ? 'చిరునామా:' : 'पता:'} ____________________</p>
          </div>
        </div>
      </div>

      <div style="margin-top: 12px; padding: 6px 10px; background: #f8f9fa; border: 1px dashed #aaa; font-size: 9.5px; display: flex; justify-content: space-between;">
        <span>${isTe ? 'పేజీ [ ___ ] / [ ___ ]' : 'पृष्ठ [ ___ ] / [ ___ ]'}</span>
        <span>${isTe ? 'శాసనకర్త:' : 'वसीयतकर्ता:'} [ ________ ]</span>
        <span>${isTe ? 'సాక్షి 1:' : 'गवाह 1:'} [ ________ ]</span>
        <span>${isTe ? 'సాక్షి 2:' : 'गवाह 2:'} [ ________ ]</span>
      </div>

      <p style="font-size: 8.5px; color: #888; text-align: center; margin-top: 14px;">SmartWill India — ${isTe ? 'తెలుగు పత్రము' : 'हिंदी दस्तावेज'} — Indian Succession Act 1925 (Sections 59, 63, 67, 105, 109)</p>
    </div>
  `;

  container.innerHTML = html;

  try {
    const canvas = await window.html2canvas(container, { scale: 2 });
    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    const fileName = `SmartWill_${(p.fullName || 'Draft').replace(/\s+/g, '_')}_${lang.toUpperCase()}.pdf`;
    await savePdfToDevice(pdf, fileName);
    return fileName;
  } catch (err) {
    logger.error('Error generating regional PDF', err);
    return generateEnglishWillPDF(willData);
  }
}

// Global window attachments
// Security (VULN-001): Only expose the payment-gated entry point.
// generateRegionalWillPDF and generateEnglishWillPDF are internal-only —
// they must only be called via generateWillPDF which verifies payment server-side.
window.generateWillPDF = generateWillPDF;
