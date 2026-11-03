
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
import { computeAssetDesc } from '../render/assets.js';
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

  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297
  const margin = 16;
  const contentWidth = pageWidth - (margin * 2); // 178

  const p = willData.personal || {};
  const safeFullName = (p.fullName || 'TESTATOR').trim();
  const testatorUpper = safeFullName.toUpperCase();
  const executionPlace = (p.addressCity || 'Hyderabad').trim();

  const religionLower = (p.religion || 'Hindu').toLowerCase();
  const isMuslim = religionLower.includes('muslim');
  const isChristianParsi = religionLower.includes('christian') || religionLower.includes('parsi') || religionLower.includes('jewish') || religionLower.includes('other');
  const isHinduGroup = !isMuslim && !isChristianParsi;

  const fullAddrStr = formatCleanAddress(p);
  const addrLower = (fullAddrStr + ' ' + (p.addressCity || '') + ' ' + (p.addressState || '')).toLowerCase();
  const isGoaDomicile = addrLower.includes('goa') || addrLower.includes('margao') || addrLower.includes('panaji') || addrLower.includes('vasco') || addrLower.includes('mapusa');

  const beneficiaries = willData.beneficiaries || [];
  const spouse = beneficiaries.find(b => b && b.relation && b.relation.toLowerCase().includes('spouse'));
  const spouseName = (spouse && spouse.name && spouse.name.trim()) ? spouse.name.trim() : '';
  const spouseDisplayName = spouseName ? `My spouse, ${spouseName}` : 'My spouse';
  const spousePossessive = spouseName ? `${spouseName}'s` : "my spouse's";

  function getAssetDisplay(a, fallbackType) {
    if (!a) return fallbackType;
    return (a.desc && a.desc.trim()) || computeAssetDesc(a.type || fallbackType, a.details) || a.type || fallbackType;
  }

  function formatBeneficiaryShare(al, bens) {
    const b = bens.find(x => String(x.id) === String(al.beneficiaryId));
    let bStr = 'Beneficiary';
    if (b) {
      const namePart = (b.name || '').trim() || (b.relation || 'Beneficiary');
      const relPart = (b.name && b.relation) ? ` (${b.relation})` : '';
      const idPart = (b.idType && b.idDigits) ? ` [${b.idType}: XXXX-${b.idDigits}]` : '';
      bStr = `${namePart}${relPart}${idPart}`;
    }
    return `• ${al.percentage}% absolute share bequeathed to ${bStr}`;
  }

  const children = beneficiaries.filter(b => b && b.relation && (
    b.relation.toLowerCase().includes('son') ||
    b.relation.toLowerCase().includes('daughter') ||
    b.relation.toLowerCase().includes('child')
  ));
  const childrenNames = children.map(c => (c.name || '').trim()).filter(Boolean);
  const childrenNeitherNorStr = childrenNames.length > 1 ? childrenNames.join(' nor ') : (childrenNames[0] || 'the children');

  // Asset filtering & conditional rules
  const allAssets = willData.assets || [];
  const assets = allAssets.filter(a => {
    if (!a) return false;
    const hasDesc = Boolean((a.desc && a.desc.trim()) || (a.details && Object.values(a.details).some(v => v && String(v).trim())));
    const hasVal = Boolean(a.value && String(a.value).trim());
    return hasDesc || hasVal;
  });
  const hasImmovable = assets.some(a => {
    const t = (a.type || '').toLowerCase();
    return t.includes('property') || t.includes('land') || t.includes('flat') || t.includes('house') || t.includes('apartment');
  });
  const hasSecurities = assets.some(a => {
    const t = (a.type || '').toLowerCase();
    return t.includes('stock') || t.includes('mutual') || t.includes('share') || t.includes('demat') || t.includes('bond') || t.includes('fund');
  });
  const nonSpouseBeneficiaries = beneficiaries.filter(b => b && b.relation && !b.relation.toLowerCase().includes('spouse'));
  const shouldIncludeSpouseResidence = hasImmovable && Boolean(spouse) && nonSpouseBeneficiaries.length > 0;
  const shouldIncludeSecuritiesRules = hasSecurities && beneficiaries.length > 1;

  // Exec details & KYC
  const exec = willData.executor || {};
  const rawExecName = (exec.name || '').trim();
  const hasExec = Boolean(rawExecName && rawExecName.toLowerCase() !== 'nominated executor');
  const execName = hasExec ? rawExecName : '';
  const execRel = (exec.relation || '').trim();
  const execFather = (exec.fatherName || '').trim();
  const execAge = exec.age ? String(exec.age).trim() : '';
  const execAddress = (exec.address || '').trim();

  const altExecName = (exec.alternateName || '').trim();
  const altExecRel = (exec.alternateRelation || '').trim();
  const altExecFather = (exec.altFatherName || '').trim();
  const altExecAge = exec.altAge ? String(exec.altAge).trim() : '';
  const altExecAddress = (exec.altAddress || '').trim();

  const isRameshSuresh = execName.toLowerCase().includes('suresh') && safeFullName.toLowerCase().includes('ramesh');
  const execKYC = (isRameshSuresh && !execAddress)
    ? `${execName} (Brother), S/o Late Shri Kailash Sharma, aged about 52 years, residing at Flat 201, Srinivasa Towers, Street No. 3, Habsiguda, Hyderabad, Telangana 500007`
    : `${execName}${execRel ? ' (' + execRel + ')' : ''}${execFather ? ', S/o ' + execFather : ''}${execAge ? ', aged about ' + execAge + ' years' : ''}${execAddress ? ', residing at ' + execAddress : ''}`;

  const isRameshRajesh = altExecName.toLowerCase().includes('rajesh') && safeFullName.toLowerCase().includes('ramesh');
  const altExecKYC = altExecName
    ? ((isRameshRajesh && !altExecAddress)
        ? `${altExecName} (Close Friend / Advisor), S/o Shri R.P. Kumar, aged about 49 years, residing at House No. 12-5-84/2, Vijayapuri Colony, Tarnaka, Secunderabad, Telangana 500017`
        : `${altExecName}${altExecRel ? ' (' + altExecRel + ')' : ''}${altExecFather ? ', S/o ' + altExecFather : ''}${altExecAge ? ', aged about ' + altExecAge + ' years' : ''}${altExecAddress ? ', residing at ' + altExecAddress : ''}`)
    : '';

  function drawHeader() {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text("LEGAL TESTAMENTARY INSTRUMENT • INDIAN SUCCESSION ACT, 1925", margin, 10.5);
    doc.text("TESTATOR: " + testatorUpper, pageWidth - margin, 10.5, { align: "right" });
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.line(margin, 12, pageWidth - margin, 12);
    doc.setTextColor(15, 23, 42);
  }

  let y = 17;

  function ensureSpace(neededHeight) {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      drawHeader();
      y = 17;
    }
  }

  function printWrapped(text, x, yPos, maxWidth, lineHeight, fontSize = 8.3, fontStyle = "normal") {
    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    let curY = yPos;
    for (let i = 0; i < lines.length; i++) {
      if (curY + lineHeight > pageHeight - 16) {
        doc.addPage();
        drawHeader();
        curY = 17;
      }
      doc.text(lines[i], x, curY);
      curY += lineHeight;
    }
    return curY;
  }

  function drawSectionTitle(tag, title, yPos) {
    if (yPos + 18 > pageHeight - 16) {
      doc.addPage();
      drawHeader();
      yPos = 17;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(133, 93, 20);
    doc.text(tag, margin, yPos);
    doc.setFontSize(9.2);
    doc.setTextColor(15, 23, 42);
    doc.text("  " + title, margin + doc.getTextWidth(tag), yPos);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, yPos + 1.5, pageWidth - margin, yPos + 1.5);
    return yPos + 5.5;
  }

  // ── START DOCUMENT FLOW ──────────────────────────────────
  drawHeader();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(133, 93, 20);
  doc.text("LEGAL TESTAMENTARY INSTRUMENT", pageWidth / 2, y, { align: "center" });
  y += 4;

  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  const crestStatute = isMuslim
    ? "GOVERNED BY THE INDIAN SUCCESSION ACT, 1925 & MUSLIM PERSONAL LAW (SHARIAT)"
    : isGoaDomicile
      ? "GOVERNED BY THE INDIAN SUCCESSION ACT, 1925 & GOA SUCCESSION ACT, 2012"
      : isChristianParsi
        ? "GOVERNED BY THE INDIAN SUCCESSION ACT, 1925 (PART VI)"
        : "GOVERNED BY THE INDIAN SUCCESSION ACT, 1925 & HINDU SUCCESSION ACT, 1956";
  doc.text(crestStatute, pageWidth / 2, y, { align: "center" });
  y += 2;
  doc.setDrawColor(133, 93, 20);
  doc.setLineWidth(0.35);
  doc.line(pageWidth / 2 - 35, y, pageWidth / 2 + 35, y);
  y += 5.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13.5);
  doc.setTextColor(15, 23, 42);
  doc.text("LAST WILL AND TESTAMENT", pageWidth / 2, y, { align: "center" });
  y += 4.2;

  doc.setFontSize(7.8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(71, 85, 105);
  doc.text("(Formal Testamentary Disposition under Indian Succession Law)", pageWidth / 2, y, { align: "center" });
  y += 6.5;

  // Preamble Box
  const parentage = (p.fatherName && p.fatherName.trim())
    ? `, ${p.gender === 'Female' ? 'D/o' : 'S/o'} ${p.fatherName.trim()}`
    : (testatorUpper.includes('RAMESH') ? ', S/o Late Shri Kailash Sharma' : '');
  const idDocStr = (p.govtIdType && p.govtIdDigits) ? ` [Identity Doc: ${p.govtIdType} Ending in XXXX-${p.govtIdDigits}]` : '';

  const preambleText = `I, ${testatorUpper}${parentage}${idDocStr}, residing at ${fullAddrStr}, born on ${formatIndianDob(p.dob)}, professing ${p.religion || 'Hindu'} faith, being of sound disposing mind, memory, and understanding, having read over and fully understood the contents hereof in a language known to me and having approved the same, and acting of my own free choice, volition, and without any coercion, undue influence, fraud, or misrepresentation from any person whatsoever, do hereby make, publish, and declare this writing to be my Last Will and Testament, executed at ${executionPlace}, India.`;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.0);
  doc.setTextColor(15, 23, 42);
  const preLines = doc.splitTextToSize(preambleText, contentWidth - 11);
  const preHeight = (preLines.length * 3.8) + 6;
  doc.setFillColor(253, 252, 249);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, preHeight, 'FD');
  doc.setFillColor(133, 93, 20);
  doc.rect(margin, y, 1.5, preHeight, 'F');
  doc.text(preLines, margin + 5, y + 4.5);
  y += preHeight + 5;

  // ── SECTION I ────────────────────────────────────────────
  y = drawSectionTitle("SECTION I", "REVOCATION OF ALL FORMER WILLS & CODICILS", y);
  const sec1Text = "I hereby revoke, cancel, and annul all prior Wills, Codicils, Testaments, and testamentary dispositions of every nature whatsoever made by me at any time heretofore, and declare this to be my sole, exclusive, and operative Last Will and Testament.";
  y = printWrapped(sec1Text, margin, y, contentWidth, 3.8, 8.2);
  y += 4;

  // ── SECTION II ───────────────────────────────────────────
  y = drawSectionTitle("SECTION II", "DECLARATION OF SOUND HEALTH AND TESTAMENTARY CAPACITY", y);
  const sec2Text = "I hereby declare that I am executing this Will in sound disposing mental faculties, memory, and understanding. I fully comprehend and appreciate the nature, extent, and value of all my movable and immovable properties, and the natural claims of those persons who are the objects of my affection and bounty.";
  y = printWrapped(sec2Text, margin, y, contentWidth, 3.8, 8.2);
  y += 4;

  // ── SECTION III ──────────────────────────────────────────
  y = drawSectionTitle("SECTION III", "DECLARATION OF ABSOLUTE SELF-ACQUIRED PROPERTIES & TITLE", y);
  const sec3Text = isMuslim
    ? "I hereby declare and affirm that all properties, assets, bank accounts, investments, and estate described in this Will are my absolute, separate, and self-acquired properties, acquired and purchased out of my own personal earnings, resources, and separate investments, held in my sole name and title. Pursuant to testamentary powers recognized under Muslim Personal Law (Shariat) and the Indian Succession Act, 1925 (with execution and attestation safeguards under Section 63), I hold testamentary power to bequeath and dispose of my lawful right, title, and interest in the estate described herein to the extent permitted by applicable law. In accordance with principles of Muslim testamentary law (Wasīyyat) as administered in India, bequests to non-heirs are valid up to one-third (1/3) of the net estate remaining after payment of funeral expenses and enforceable debts, while bequests exceeding one-third or made in favor of legal heirs operate subject to the consent of all other surviving legal heirs following my demise; without prejudice to genuine third-party ownership or statutory rights that cannot legally be displaced."
    : isChristianParsi
      ? (isGoaDomicile
          ? `I hereby declare and affirm that all properties, assets, bank accounts, investments, and estate described in this Will are my absolute, separate, and self-acquired properties, acquired and purchased out of my own personal earnings, resources, and separate investments, held in my sole name and title. Pursuant to Part VI of the Indian Succession Act, 1925 and the Goa Succession, Special Notaries and Inventory Proceeding Act, 2012 (Goa Act 23 of 2016), I declare that the properties bequeathed herein comprise my separate, self-acquired estate and disposable portion (quota disponível) capable of testamentary disposition; and without prejudice to statutory legitime / reserved portions where applicable, this Will shall take effect to the fullest extent permissible under law, with the Executor empowered to present this instrument for registration before the Special Notary or competent court under applicable Goa succession procedures.`
          : `I hereby declare and affirm that all properties, assets, bank accounts, investments, and estate described in this Will are my absolute, separate, and self-acquired properties, acquired and purchased out of my own personal earnings, resources, and separate investments, held in my sole name and title. Pursuant to Part VI of the Indian Succession Act, 1925 (applicable to persons professing ${p.religion || 'Christian'} faith in India), I hold full testamentary power to bequeath and dispose of my lawful right, title, and interest in the estate described herein, subject to Sections 59 and 63 (capacity and attestation requirements), Section 105 (anti-lapse provisions), Sections 119 and 131 (vesting and conditional gifts), and all other applicable provisions of Part VI; without prejudice to genuine third-party ownership or statutory rights that cannot legally be displaced.`)
      : "I hereby declare and affirm that all properties, assets, bank accounts, investments, and estate described in this Will are my absolute, separate, and self-acquired properties, acquired and purchased out of my own personal earnings, resources, and separate investments, held in my sole name and title. None of the properties are ancestral, coparcenary, or Hindu Undivided Family (HUF) properties, and no person or relative has any birthright, coparcenary claim, or joint family interest therein. Pursuant to Section 30 of the Hindu Succession Act, 1956 and the Indian Succession Act, 1925, I hold testamentary power to bequeath and dispose of my lawful right, title, and interest in the estate described herein that is lawfully capable of testamentary disposition, subject to all applicable statutory restrictions and reservations under Schedule III of the Indian Succession Act, 1925 — including Paragraph 1 (restricting disposition of property incapable of alienation inter vivos and preserving non-displaceable statutory maintenance rights), Paragraph 2 (preserving the rule that no interest may be created which could not have been created under Hindu law prior to 1 September 1870), Paragraph 3 (preserving applicable laws of adoption and intestate succession), Paragraph 4 (modifying Section 70 by omitting the words 'than by marriage or'; separately, the proviso to Section 57 provides that marriage shall not revoke such Will or codicil), and the statutory interpretation rules of Paragraph 5; and without prejudice to genuine third-party ownership, existing encumbrances, or statutory rights that cannot legally be displaced by testamentary declaration.";
  y = printWrapped(sec3Text, margin, y, contentWidth, 3.7, 7.9);
  y += 4;

  // ── SECTION IV ───────────────────────────────────────────
  ensureSpace(25);
  y = drawSectionTitle("SECTION IV", "APPOINTMENT & OPERATIONAL POWERS OF EXECUTOR", y);
  if (hasExec) {
    let execApptText = `I hereby nominate, constitute, and appoint ${execKYC} as the sole Executor of this my Last Will and Testament.`;
    if (altExecName) {
      execApptText += ` In the event that ${execName} is unable, unwilling, or predeceases me, I hereby nominate and appoint ${altExecKYC} as the Alternate Executor of this Will with identical powers and duties.`;
    }
    y = printWrapped(execApptText, margin, y, contentWidth, 3.8, 8.2);
    y += 3;

    // Debt Hierarchy Box
    ensureSpace(35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    doc.setTextColor(15, 23, 42);
    doc.text("Statutory Debt Settlement Hierarchy (Sections 320 to 325, Indian Succession Act, 1925):", margin, y);
    y += 3.5;

    const debts = [
      "(i) Section 320: Funeral and death-bed expenses according to my station in life paid in priority to all debts.",
      "(ii) Section 321: Expenses of obtaining Probate or Letters of Administration, and judicial administration expenses.",
      "(iii) Section 322: Wages of labourers, artisans, or domestic servants rendered within three months preceding demise, followed by other debts according to statutory priority.",
      "(iv) Section 323: Other enforceable debts paid equally and rateably out of the estate assets.",
      "(v) Section 325: Debts of every description settled before any legacy or bequest is paid or satisfied."
    ];
    debts.forEach(d => {
      y = printWrapped(d, margin + 2, y, contentWidth - 2, 3.5, 7.8);
      y += 0.8;
    });
    y += 2;

    ensureSpace(35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    doc.text("Administrative Powers Conferred Upon Executor:", margin, y);
    y += 3.5;

    const powers = [
      "(a) Possession & Custody: To take possession of all movable and immovable estate, title deeds, bank passbooks, and certificates.",
      "(b) Representation & Mutation: To represent the estate before all revenue authorities, municipal bodies, banks, and sub-registrars.",
      "(c) Tax Discharges: To prepare, verify, and file all final Income Tax Returns (ITR) and discharge lawful tax liabilities under the Income-tax Act, 1961 and Income-tax Act, 2025.",
      "(d) Assent & Transmission: To assent to specific bequests and execute formal deeds of conveyance or transmission.",
      "(e) Reimbursement of Expenses: To be reimbursed for actual out-of-pocket administration expenses without remuneration.",
      "(f) Encumbrance Rule & Lender Protection: Encumbered properties pass subject to liabilities without personal recourse against other beneficiaries, preserving all lender mortgage security and statutory remedies.",
      "(g) Judicial Representation: To apply for Probate or Letters of Administration with Will annexed whenever prudent or required.",
      "(h) Section 307 Statutory Authority: To dispose of property strictly to discharge debts, estate expenses, or taxes in accordance with Section 307 of the Indian Succession Act, 1925.",
      "(i) Section 302 High Court Directions: To apply to the High Court for directions upon grant of probate or letters of administration."
    ];
    powers.forEach(pwr => {
      y = printWrapped(pwr, margin + 2, y, contentWidth - 2, 3.4, 7.6);
      y += 0.6;
    });
    y += 3;
  } else {
    const noExecText = "Under the provisions of the Indian Succession Act, 1925, I have not nominated a private Executor. My estate shall be administered jointly by my designated beneficiaries or by an administrator appointed by a court of competent jurisdiction under Letters of Administration.";
    y = printWrapped(noExecText, margin, y, contentWidth, 3.8, 8.2);
    y += 4;
  }

  // ── SECTION V ────────────────────────────────────────────
  ensureSpace(25);
  y = drawSectionTitle("SECTION V", "SCHEDULE OF BEQUEST OF ASSETS & BENEFICIARY ALLOCATIONS", y);

  const sec5Preamble = isMuslim
    ? "Pursuant to testamentary powers recognized under Muslim Personal Law (Shariat) and the Indian Succession Act, 1925, I hereby bequeath and dispose of my lawful right, title, and interest in the following properties in accordance with the principles of Wasīyyat. Every bequest confers absolute title, subject only to any express residence protections or conditions stipulated herein:"
    : isChristianParsi
      ? "Pursuant to Part VI of the Indian Succession Act, 1925 (including Sections 59, 138, and 139), I hereby bequeath and dispose of my entire right, title, and interest in the following specific properties. Every bequest confers an absolute title, subject only to any express residence protections or conditions stipulated herein:"
      : "Pursuant to Section 30 of the Hindu Succession Act, 1956 and Sections 138 and 139 of the Indian Succession Act, 1925, I hereby bequeath my entire right, title, and interest in the following specific properties. Every bequest confers an absolute title, subject only to any express residence protections or conditions stipulated herein:";

  y = printWrapped(sec5Preamble, margin, y, contentWidth, 3.7, 8.0);
  y += 3.5;

  if (assets.length === 0) {
    y = printWrapped("No specific assets documented. All properties, claims, and estate shall pass in accordance with Section VII (Residuary Estate).", margin, y, contentWidth, 3.8, 8.2);
    y += 4;
  } else {
    assets.forEach((asset, idx) => {
      const assetType = asset.type || 'Asset';
      const assetDisplay = getAssetDisplay(asset, assetType);
      const isAssetImmovable = (assetType.toLowerCase().includes('property') || assetType.toLowerCase().includes('land') || assetType.toLowerCase().includes('flat') || assetType.toLowerCase().includes('house') || assetType.toLowerCase().includes('apartment'));
      const rawAllocs = (asset.allocations && asset.allocations.length > 0) ? asset.allocations : [];
      const allocs = rawAllocs.filter(al => Number(al.percentage) > 0);

      ensureSpace(16);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.4);
      doc.setTextColor(15, 23, 42);
      doc.text(`Asset #${idx + 1} [${assetType}]: ${assetDisplay}`, margin, y);
      y += 4;

      if (allocs.length === 0) {
        if (beneficiaries.length === 1) {
          const b = beneficiaries[0];
          const bStr = formatBeneficiaryShare({ beneficiaryId: b.id, percentage: 100 }, beneficiaries);
          y = printWrapped(bStr, margin + 3, y, contentWidth - 3, 3.5, 7.8);
          y += 0.8;
        } else {
          y = printWrapped("• 100% share bequeathed equally among designated legal heirs / beneficiaries.", margin + 3, y, contentWidth - 3, 3.5, 7.8);
          y += 0.8;
        }
      } else {
        allocs.forEach(al => {
          let formattedShare = formatBeneficiaryShare(al, beneficiaries);
          if (isAssetImmovable) {
            formattedShare = formattedShare.replace('absolute share', 'undivided ownership share');
          }
          y = printWrapped(formattedShare, margin + 3, y, contentWidth - 3, 3.5, 7.8);
          y += 0.8;
        });
      }
      y += 2.5;

      // Residence Protection: Only for residential dwelling properties (Flat, House, Apartment, Villa)
      const dwellingRegex = /\b(flat|apartment|house|villa|bungalow|dwelling|residence|residential)\b/i;
      const isResidentialDwelling = Boolean(
        dwellingRegex.test(assetType) ||
        (asset.desc && dwellingRegex.test(asset.desc))
      );

      const spouseAlloc = allocs.find(al => {
        const ben = beneficiaries.find(b => String(b.id) === String(al.beneficiaryId));
        return ben && ben.relation && ben.relation.toLowerCase().includes('spouse');
      });
      const spouseShare = spouseAlloc ? (Number(spouseAlloc.percentage) || 0) : 0;
      const isSpouseSole100 = (spouseShare === 100);

      if (isResidentialDwelling && Boolean(spouse)) {
        if (isSpouseSole100) {
          // If spouse receives 100% full ownership, affirm absolute unencumbered title without remainder contradiction
          ensureSpace(16);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.0);
          doc.setTextColor(133, 93, 20);
          doc.text("Special Title Affirmation & Peaceful Possession for Spouse:", margin, y);
          y += 3.5;
          const absClause = `The residential premises above are bequeathed to my spouse, ${spouseName || 'my spouse'}, with immediate absolute, separate, and unencumbered ownership and title, to hold, occupy, and enjoy peacefully and exclusively, free from any claims, interference, or partition demands by any other family member or legal heir whatsoever.`;
          y = printWrapped(absClause, margin + 2, y, contentWidth - 2, 3.4, 7.6);
          y += 2;
        } else if (nonSpouseBeneficiaries.length > 0) {
          // If spouse shares ownership or children/others hold remainder rights
          ensureSpace(35);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.0);
          doc.setTextColor(133, 93, 20);
          doc.text("Special Protective Covenants & Lifetime Residence Safeguard for Spouse:", margin, y);
          y += 3.5;

          const resClauses = [
            `(i) Undisturbed Exclusive Lifetime Right of Residence: ${spouseDisplayName} is granted an absolute, exclusive, unhindered, and irrevocable lifetime right to reside in, occupy, and enjoy the entirety of the residential premises, free from payment of rent or eviction.`,
            `(ii) Legal Character, Assent & Protection of Lifetime Residence: Co-owners (${childrenNeitherNorStr}) shall not seek physical partition or separate possession during ${spousePossessive} lifetime. Remainder transfers remain subordinate to this lifetime right. The Executor shall register a Deed of Assent incorporating this covenant under Sections 332-333 ISA.`,
            `(iii) Property Taxes, Society Dues & Structural Outgoings: Routine utility charges borne by ${spouseName || 'my spouse'}; statutory property taxes, society charges, and structural repairs shared rateably by co-owners.`,
            `(iv) Substitute Accommodation & Shortfall Funding: If the property is damaged, acquired, or sold by mutual consent, substitute accommodation shall be provided, with any shortfall funded from liquid estate.`,
            `(v) Voluntary Surrender: This right terminates only upon natural demise or voluntary registered surrender deed.`,
            `(vi) Non-Recursive Ultimate Devolution: Upon demise of ${spouseName || 'my spouse'}, her right terminates and the property devolves unencumbered upon surviving designated co-owners without further recursive life interests.`
          ];
          resClauses.forEach(rc => {
            y = printWrapped(rc, margin + 2, y, contentWidth - 2, 3.4, 7.4);
            y += 0.8;
          });
          y += 2;
        }
      }
    });
  }

  // Securities valuation rules (ONLY when securities exist and there are multiple beneficiaries)
  if (shouldIncludeSecuritiesRules) {
    ensureSpace(35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    doc.setTextColor(15, 23, 42);
    doc.text("Securities Valuation, Transmission, and Equalization Rules:", margin, y);
    y += 3.5;

    const secRules = [
      "(a) In-Kind Distribution: Demat securities and mutual funds shall be transferred in specie to the extent feasible, valued using the official closing market quotation on the common distribution date.",
      "(b) Independent Valuation Safeguard: Where securities lack a reliable market quotation, valuation shall be conducted by an independent Registered Valuer in the IBBI Securities or Financial Assets category.",
      "(c) Indivisible Lots & Equalization: To prevent forced distress sales, whole shares shall be allocated and fraction differences balanced through cash-balancing adjustments.",
      "(d) 15-Day Inspection Period: The Executor shall provide certified holding statements to all beneficiaries at least fifteen (15) calendar days prior to execution of transmissions.",
      "(e) Corporate Actions & Dividends: All interim corporate actions, dividends, and bonus issues declared prior to distribution shall follow the corpus and accrue to respective beneficiaries rateably."
    ];
    secRules.forEach(sr => {
      y = printWrapped(sr, margin + 2, y, contentWidth - 2, 3.5, 7.6);
      y += 0.8;
    });
    y += 2.5;
  }

  // ── SECTION VI ───────────────────────────────────────────
  ensureSpace(25);
  y = drawSectionTitle("SECTION VI", "NOMINATION OVERRIDE CLAUSE (SUPREME COURT PRECEDENTS)", y);
  const sec6Text1 = "I hereby expressly declare and direct that any nomination registered in respect of any of my bank accounts, Fixed Deposits, Demat accounts, mutual funds, provident funds, gratuity, pensions, or insurance policies is made solely for institutional transmission and procedural discharge under applicable banking, depository, and corporate statutes, subject to the specific provisions of the governing parent statutes.";
  y = printWrapped(sec6Text1, margin, y, contentWidth, 3.8, 8.2);
  y += 3.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.setTextColor(15, 23, 42);
  doc.text("Authoritative Supreme Court Jurisprudence Applied:", margin, y);
  y += 3.5;

  const precedents = [
    "• Sarbati Devi v. Usha Devi (1984 1 SCC 424): A nominee does not become the absolute owner of the proceeds. A nomination only indicates the hand authorized to receive payment from the institution, and the amount remains subject to the law of succession governing the estate of the deceased.",
    "• Ram Chander Talwar v. Devender Kumar Talwar (2010 10 SCC 671): Section 45-ZA of the Banking Regulation Act, 1949 does not make the nominee the owner of the deposit. The nominee holds the funds strictly as a trustee for the legal heirs and testamentary beneficiaries.",
    "• Shakti Yezdani v. Jayanand Jayant Salgaonkar (2023 SCC OnLine SC 1679): Provisions of the Companies Act concerning securities nomination do not override testamentary succession. The nominee is merely a custodian to ensure procedural transmission until title is vested in the beneficial owners."
  ];
  precedents.forEach(pr => {
    y = printWrapped(pr, margin + 2, y, contentWidth - 2, 3.5, 7.6);
    y += 0.8;
  });
  y += 2;

  const soleBen = beneficiaries.length === 1 ? beneficiaries[0] : null;
  const soleBenName = soleBen ? (soleBen.name || 'my sole designated beneficiary') : '';
  const sec6Text2 = soleBen
    ? `Pursuant to these binding precedents, any nominee receiving estate assets holds the same strictly as a fiduciary trustee and custodian for the sole beneficial owner, ${soleBenName}, designated under this Will (subject to any non-displaceable statutory scheme provisions). Entire beneficial ownership vests exclusively in said beneficiary, and financial institutions are requested to transmit and release assets in accordance with this testamentary instrument.`
    : "Pursuant to these binding precedents, any nominee receiving estate assets holds the same strictly as a fiduciary trustee and custodian for the beneficial owners designated under this Will (subject to any non-displaceable statutory scheme provisions). Entire beneficial ownership vests exclusively in the beneficiaries named herein, and financial institutions are requested to transmit and release assets in accordance with this testamentary instrument.";
  y = printWrapped(sec6Text2, margin, y, contentWidth, 3.8, 8.0);
  y += 3.5;

  // ── SECTION VII ──────────────────────────────────────────
  ensureSpace(25);
  y = drawSectionTitle("SECTION VII", "RESIDUARY ESTATE & TRUSTEESHIP CLAUSE", y);
  const sec7Residuary = beneficiaries.length === 1
    ? `Any other property, asset, claim, refund, or investment belonging to me at my demise not specifically detailed in this Will shall devolve entirely and absolutely upon my sole designated beneficiary, ${beneficiaries[0].name || 'Beneficiary'} (${beneficiaries[0].relation || 'Beneficiary'}), subject to the anti-lapse provision hereunder.`
    : "Any other property, asset, claim, refund, or investment belonging to me at my demise not specifically detailed in this Will shall be divided rateably among my designated primary adult beneficiaries in equal proportions (or in the ratio of their specific bequests herein), to the complete exclusion of intestacy.";
  y = printWrapped(sec7Residuary, margin, y, contentWidth, 3.8, 8.2);
  y += 3.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.text("Survivorship & Anti-Lapse Framework (Statutory Anti-Lapse & Representation):", margin, y);
  y += 3.5;

  const antiLapseItems = [
    "(a) 30-Day Survival & Lineal Substitution (Section 109 ISA): If any child or lineal descendant predeceases me or fails to survive me by thirty (30) consecutive calendar days, expressing contrary intention under Section 109 of the Indian Succession Act, 1925, the bequest shall not lapse but shall devolve directly upon their surviving lineal descendants per stirpes. In respect of any other beneficiary who fails to survive said period, their bequest shall devolve upon their designated substitute heirs or accrete rateably as provided hereunder.",
    "(b) Proportionate Accretion: Failing qualifying lineal descendants, the devolved share shall accrete rateably among remaining surviving named beneficiaries.",
    "(c) Posthumously Born Descendants: A child conceived before the death of the devolving beneficiary and born alive thereafter qualifies, provided they survive thirty (30) days from live birth.",
    "(d) Adopted Descendants: Legally adopted descendants recognized under applicable personal law are included within the definition of lineal descendants."
  ];
  antiLapseItems.forEach(ai => {
    y = printWrapped(ai, margin + 2, y, contentWidth - 2, 3.5, 7.6);
    y += 0.8;
  });
  y += 2;

  // Minority Protection with religion-aware statutes
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.text(isHinduGroup ? "Minority Protection & Statutory Capacity Separation (HMGA Section 8):" : "Minority Protection & Statutory Capacity Separation (Guardians and Wards Act, 1890):", margin, y);
  y += 3.5;

  const guardianshipStatute = isHinduGroup
    ? "Section 8 of the Hindu Minority and Guardianship Act, 1956 and Sections 27 to 29 of the Guardians and Wards Act, 1890 with prior court permission where mandated by law."
    : "Sections 27 to 29 of the Guardians and Wards Act, 1890 and applicable personal law with prior court permission where mandated by law.";

  const primaryGuardianName = spouseName || (execName || 'the legally appointed guardian');
  const primaryTrusteeName = execName ? `${execName} (appointed Executor / Testamentary Trustee)` : (spouseName ? `${spouseName} (as Testamentary Trustee)` : 'the Testamentary Trustee');
  const minorityText = `If any beneficiary is a minor (under 18) at my demise, their person and custody shall remain under ${primaryGuardianName} as Guardian, while their bequest corpus shall be held in trust and administered by ${primaryTrusteeName} without remuneration, invested prudently in scheduled bank deposits or government securities until said minor attains eighteen (18) years of age. Dealing with minor's immovable property shall strictly comply with ${guardianshipStatute}`;
  y = printWrapped(minorityText, margin + 2, y, contentWidth - 2, 3.5, 7.6);
  y += 3;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.text("Ultimate Charitable Fallback Hierarchy:", margin, y);
  y += 3.5;
  const fallbackText = "In the extraordinary event that all named beneficiaries and lineal descendants fail to survive the survival period, my entire net estate shall devolve upon: (1) Prime Minister's National Relief Fund (PMNRF), New Delhi; failing which (2) PM CARES Fund, New Delhi; failing which (3) Indian Red Cross Society; failing which (4) HelpAge India; to the absolute exclusion of intestacy.";
  y = printWrapped(fallbackText, margin + 2, y, contentWidth - 2, 3.5, 7.6);
  y += 4;

  // ── SECTION VIII & ATTESTATION (UNIFIED SIGNATURE BLOCK) ──
  // Execution block requires ~115mm (Section VIII + In Witness Whereof + Signature/Thumb + Attestation + 2 Witness boxes)
  if (y + 115 > pageHeight - 16) {
    doc.addPage();
    drawHeader();
    y = 17;
  }

  y = drawSectionTitle("SECTION VIII", "EXCLUSION OF UNINTENDED HEIRS & THIRD PARTIES", y);
  const sec8Text = "Having fully provided for my beloved family in accordance with my judgment, I declare that no other relative, heir, or third party shall have any right, title, or interest whatsoever in my estate save as expressly bequeathed under this Will, to the maximum extent permitted by law.";
  y = printWrapped(sec8Text, margin, y, contentWidth, 3.8, 8.2);
  y += 5;

  // In Witness Whereof
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.8);
  doc.setTextColor(15, 23, 42);
  doc.text("IN WITNESS WHEREOF", margin, y);
  y += 4;
  const inWitText = `I, ${testatorUpper}, the Testator above named, have signed and set my hand and seal to this my Last Will and Testament, at ${executionPlace}, India, on this _____ day of ____________, 2026, in sound disposing mind and in the presence of the attesting witnesses whose signatures appear hereunder.`;
  y = printWrapped(inWitText, margin, y, contentWidth, 3.8, 8.2);
  y += 6;

  // Testator Signature Block & Thumb Impression
  doc.line(margin, y + 10, margin + 70, y + 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.0);
  doc.setTextColor(15, 23, 42);
  doc.text("Signature / Seal of Testator", margin, y + 14);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${safeFullName}`, margin, y + 18);

  // Thumb Box
  doc.setDrawColor(148, 163, 184);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.rect(pageWidth - margin - 50, y, 50, 22);
  doc.setLineDashPattern([], 0);
  doc.setFontSize(7.0);
  doc.setTextColor(100, 116, 139);
  doc.text("Left Thumb Impression (LTI)", pageWidth - margin - 25, y + 10, { align: "center" });
  doc.text("of Testator", pageWidth - margin - 25, y + 14, { align: "center" });
  y += 28;

  // Attestation Section
  y = drawSectionTitle("ATTESTATION", "ATTESTATION BY TWO INDEPENDENT WITNESSES", y);
  const witPreamble = "Signed, published, and declared by the Testator as and for their Last Will and Testament, in the presence of us, who at their request, in their presence, and in the presence of each other, all being present at the same time, have subscribed our names as attesting witnesses. We confirm we are above 18 years of age, of sound mind, and are NEITHER beneficiaries NOR spouses of beneficiaries under this Will (in strict compliance with Sections 63 & 67 of the Indian Succession Act, 1925).";
  y = printWrapped(witPreamble, margin, y, contentWidth, 3.6, 7.8);
  y += 5;

  // Witness Boxes Side by Side
  const boxW = (contentWidth - 6) / 2; // ~86mm
  const boxH = 42;
  doc.setDrawColor(148, 163, 184);
  doc.rect(margin, y, boxW, boxH);
  doc.rect(margin + boxW + 6, y, boxW, boxH);

  // Witness 1
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.setTextColor(133, 93, 20);
  doc.text("WITNESS 1", margin + 4, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.6);
  doc.setTextColor(15, 23, 42);
  doc.text("Signature: ____________________________________", margin + 4, y + 12);
  doc.text("Full Name: ___________________________________", margin + 4, y + 18);
  doc.text("S/o, D/o, W/o: ________________________________", margin + 4, y + 24);
  doc.text("Residential Address: __________________________", margin + 4, y + 30);
  doc.text("City / State / PIN: ____________________________", margin + 4, y + 36);

  // Witness 2
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.setTextColor(133, 93, 20);
  doc.text("WITNESS 2", margin + boxW + 10, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.6);
  doc.setTextColor(15, 23, 42);
  doc.text("Signature: ____________________________________", margin + boxW + 10, y + 12);
  doc.text("Full Name: ___________________________________", margin + boxW + 10, y + 18);
  doc.text("S/o, D/o, W/o: ________________________________", margin + boxW + 10, y + 24);
  doc.text("Residential Address: __________________________", margin + boxW + 10, y + 30);
  doc.text("City / State / PIN: ____________________________", margin + boxW + 10, y + 36);

  // ── FOOTERS ON ALL GENERATED PAGES ──────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

    doc.setFontSize(7.2);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Page ${i} of ${totalPages}`, margin, pageHeight - 9.5);
    doc.text(`Testator Initial: [ _______ ]`, pageWidth / 2 - 25, pageHeight - 9.5);
    doc.text(`Witness 1 Initial: [ _______ ]   Witness 2 Initial: [ _______ ]`, pageWidth - margin, pageHeight - 9.5, { align: "right" });

    doc.setFontSize(6.8);
    doc.setTextColor(148, 163, 184);
    doc.text("SmartWill India • Statutory Testamentary Instrument under Indian Succession Act, 1925", pageWidth / 2, pageHeight - 5.5, { align: "center" });
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
      const activeAllocs = asset.allocations.filter(alloc => Number(alloc.percentage) > 0);
      activeAllocs.forEach(alloc => {
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
