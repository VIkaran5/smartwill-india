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

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  
  const introText = `I, ${p.fullName ? p.fullName.toUpperCase() : 'TESTATOR'}${govIdStr}, residing at ${fullAddress}, born on ${p.dob || 'N/A'}, professing ${p.religion || 'Hindu'} faith, being of sound mind and disposing memory, do hereby make, publish, and declare this to be my Last Will and Testament.`;

  const splitIntro = doc.splitTextToSize(introText, pageWidth - (margin * 2));
  doc.text(splitIntro, margin, y);
  y += (splitIntro.length * 4.8) + 4;

  checkPageBreak(18);
  doc.setFont("helvetica", "bold");
  doc.text("1. REVOCATION OF FORMER WILLS", margin, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  const c1Text = "I hereby revoke all former Wills, Codicils, and Testamentary dispositions of every nature made by me prior to this date, and declare this to be my sole, exclusive, and final Last Will and Testament.";
  const splitC1 = doc.splitTextToSize(c1Text, pageWidth - (margin * 2));
  doc.text(splitC1, margin, y);
  y += (splitC1.length * 4.5) + 4;

  checkPageBreak(18);
  doc.setFont("helvetica", "bold");
  doc.text("2. DECLARATION OF SOUND HEALTH AND MIND", margin, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  const c2Text = "I declare that I am executing this Will out of my own free choice, volition, and sound disposing mind, without any coercion, force, fraud, misrepresentation, or undue influence from any person whatsoever.";
  const splitC2 = doc.splitTextToSize(c2Text, pageWidth - (margin * 2));
  doc.text(splitC2, margin, y);
  y += (splitC2.length * 4.5) + 4;

  checkPageBreak(18);
  doc.setFont("helvetica", "bold");
  doc.text("3. APPOINTMENT OF EXECUTOR", margin, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  const execName = (willData.executor && willData.executor.name) || "My Legal Representative";
  const execRel = (willData.executor && willData.executor.relation) || "Nominated Executor";
  const altExecName = (willData.executor && willData.executor.alternateName) || "";
  const altExecRel = (willData.executor && willData.executor.alternateRelation) || "";
  let c3Text = `I hereby nominate and appoint ${execName} (${execRel}) as the Executor of this my Last Will and Testament. My Executor shall pay all my just debts, funeral expenses, legal charges, and testamentary costs prior to distributing assets to beneficiaries.`;
  if (altExecName) {
    c3Text += ` In the event that ${execName} is unable, unwilling, or predeceases me, I hereby nominate and appoint ${altExecName}${altExecRel ? ` (${altExecRel})` : ''} as the Alternate Executor of this Will with the same powers and duties.`;
  }
  const splitC3 = doc.splitTextToSize(c3Text, pageWidth - (margin * 2));
  doc.text(splitC3, margin, y);
  y += (splitC3.length * 4.5) + 4;

  checkPageBreak(25);
  doc.setFont("helvetica", "bold");
  doc.text("4. BEQUEST OF ASSETS AND BENEFICIARIES SCHEDULE", margin, y);
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
        doc.text(`   • ${alloc.percentage}% share bequeathed to ${benName}`, margin + 4, y);
        y += 4.2;
      });
    } else {
      doc.text(`   • 100% share bequeathed to legal heirs in equal proportions.`, margin + 4, y);
      y += 4.2;
    }
    y += 2;
  });

  checkPageBreak(18);
  doc.setFont("helvetica", "bold");
  doc.text("5. RESIDUARY ESTATE", margin, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  const bens = (willData.beneficiaries || []).filter(b => b && b.name);
  let c5Text;
  if (bens.length === 1) {
    c5Text = `Any other property, asset, claim, or money belonging to me not specifically detailed in this Will shall devolve entirely and absolutely upon my sole designated beneficiary, ${bens[0].name} (${bens[0].relation}).`;
  } else if (bens.length > 1) {
    const benList = bens.map(b => `${b.name} (${b.relation})`).join(', ');
    c5Text = `Any other property, asset, claim, or money belonging to me not specifically detailed in this Will shall be divided equally among my designated beneficiaries: ${benList}.`;
  } else {
    c5Text = "Any other property, asset, claim, or money belonging to me not specifically detailed in this Will shall be divided equally among my designated beneficiaries.";
  }
  const splitC5 = doc.splitTextToSize(c5Text, pageWidth - (margin * 2));
  doc.text(splitC5, margin, y);
  y += (splitC5.length * 4.5) + 6;

  checkPageBreak(30);
  doc.setFont("helvetica", "bold");
  doc.text("IN WITNESS WHEREOF", margin, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.text(`I, ${p.fullName || 'Testator'}, have signed and set my hand to this Will on this _____ day of ____________, 2026.`, margin, y);
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
  const witText = "Signed, published, and declared by the Testator in our presence, and we, at his/her request, in his/her presence, and in the presence of each other, have subscribed our names as attesting witnesses. We confirm we are NOT beneficiaries under this Will.";
  const splitWit = doc.splitTextToSize(witText, pageWidth - (margin * 2));
  doc.text(splitWit, margin, y);
  y += (splitWit.length * 4.5) + 6;

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
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`SmartWill India — Formatted Legal Document under Indian Succession Act 1925 | Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: "center" });
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
  const title = isTe ? "కడపటి ఇష్టపూర్వక మరణ శాసన పత్రము (WILL)" : "अंतिम इच्छा पत्र / वसीयतनामा (LAST WILL)";
  const subtitle = isTe ? "(భారతీయ వారసత్వ చట్టం 1925 ప్రకారం రూపొందించబడినది)" : "(भारतीय उत्तराधिकार अधिनियम 1925 के अंतर्गत)";

  let html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111; padding: 15px; font-size: 13px;">
      <h2 style="text-align: center; font-size: 20px; margin-bottom: 4px; text-transform: uppercase;">${title}</h2>
      <p style="text-align: center; font-size: 12px; font-style: italic; color: #555; margin-bottom: 20px;">${subtitle}</p>
      <p style="margin-bottom: 16px; text-align: justify;">
        ${isTe ? 
          `నేను, <strong>${safeFullName || 'శాసనకర్త'}</strong> [గుర్తింపు పత్రం: ${idStr}], చిరునామా: ${fullAddress}, సంపూర్ణ ఆరోగ్య స్పృహతో మరియు స్వచ్ఛంద నిర్ణయంతో ఈ క్రింది విధంగా నా విల్ పత్రాన్ని ప్రకటిస్తున్నాను:` :
          `मैं, <strong>${safeFullName || 'वसीयतकर्ता'}</strong> [पहचान पत्र: ${idStr}], पता: ${fullAddress}, पूर्ण स्वस्थ चित्त एवं स्वेच्छा से अपनी अंतिम वसीयत घोषित करता/करती हूँ:`}
      </p>
      <h3 style="font-size: 14px; border-bottom: 1px solid #ccc; padding-bottom: 2px; margin-top: 12px; margin-bottom: 6px;">
        ${isTe ? '1. పూర్వ విల్స్ రద్దు నిబంధన (Revocation of Former Wills)' : '1. पूर्व वसीयत निरस्तीकरण (Revocation of Former Wills)'}
      </h3>
      <p style="margin-bottom: 12px;">
        ${isTe ? 
          'ఈ తేదికి ముందు నేను చేసిన అన్ని పూర్వ విల్స్ మరియు దస్తావేజులను రద్దు చేస్తున్నాను. ఇదియే నా ఏకైక చెల్లుబాటు అయ్యే విల్.' :
          'मैं इस तिथि से पूर्व बनाई गई अपनी सभी पूर्व वसीयतों को निरस्त करता/करती हूँ। यह मेरी अंतिम वैध वसीयत है।'}
      </p>
      <h3 style="font-size: 14px; border-bottom: 1px solid #ccc; padding-bottom: 2px; margin-top: 12px; margin-bottom: 6px;">
        ${isTe ? '2. సంపూర్ణ ఆరోగ్య స్పృహ ప్రకటన (Sound Health & Mind Declaration)' : '2. स्वस्थ दिमाग की घोषणा (Sound Mind Declaration)'}
      </h3>
      <p style="margin-bottom: 12px;">
        ${isTe ? 
          'నేను ఎవరి బలవంతం లేదా ఒత్తిడి లేకుండా, స్వచ్ఛందంగా నా స్వంత ఆలోచనతో ఈ విల్ రాయడం జరిగినది.' :
          'मैं बिना किसी दबाव या जबरदस्ती के, अपनी स्वेच्छा और स्वस्थ दिमाग से यह वसीयत लिख रहा/रही हूँ।'}
      </p>
      <h3 style="font-size: 14px; border-bottom: 1px solid #ccc; padding-bottom: 2px; margin-top: 12px; margin-bottom: 6px;">
        ${isTe ? '3. విల్ ఎగ్జిక్యూటర్ నియామకం (Appointment of Executor)' : '3. वसीयत निष्पादक नियुक्ति (Appointment of Executor)'}
      </h3>
      <p style="margin-bottom: 12px;">
        ${isTe ? 
          `నా తరువాత నా ఆస్తులను విల్ ప్రకారం పంచడానికి <strong>${executorName || 'ఎగ్జిక్యూటర్'}</strong> (${executorRel || 'బంధువు'}) ని ఎగ్జిక్యూటర్‌గా నియమిస్తున్నాను.${altExecName ? ` ఒకవేళ సదరు ఎగ్జిక్యూటర్ ఈ బాధ్యతను నిర్వర్తించలేని పక్షంలో, <strong>${altExecName}</strong> (${altExecRel || 'బంధువు'}) ప్రత్యామ్నాయ ఎగ్జిక్యూటర్ (Alternate Executor) గా వ్యవహరిస్తారు.` : ''}` :
          `मेरे पश्चात मेरी संपत्तियों का वितरण करने हेतु <strong>${executorName || 'निष्पादक'}</strong> (${executorRel || 'संबंध'}) को नियुक्त करता/करती हूँ।${altExecName ? ` यदि उक्त निष्पादक कार्य करने में असमर्थ रहें, तो <strong>${altExecName}</strong> (${altExecRel || 'संबंध'}) वैकल्पिक निष्पादक (Alternate Executor) के रूप में कार्य करेंगे।` : ''}`}
      </p>
      <h3 style="font-size: 14px; border-bottom: 1px solid #ccc; padding-bottom: 2px; margin-top: 12px; margin-bottom: 6px;">
        ${isTe ? '4. ఆస్తుల కేటాయింపు పట్టిక (Bequest of Assets Schedule)' : '4. संपत्ति आवंटन विवरण (Asset Allocation Schedule)'}
      </h3>
      <ul style="padding-left: 20px; margin-bottom: 16px;">
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
        const pctLabel = isTe ? `${alloc.percentage}% శాతం భాగం` : `${alloc.percentage}% प्रतिशत हिस्सा`;
        html += `   • ${pctLabel}: <strong>${benName}</strong>${benId}<br>`;
      });
    }
    html += `</li>`;
  });

  html += `
      </ul>
      <h3 style="font-size: 14px; border-bottom: 1px solid #ccc; padding-bottom: 2px; margin-top: 12px; margin-bottom: 6px;">
        ${isTe ? '5. మిగిలిన ఆస్తుల నిబంధన (Residuary Estate)' : '5. शेष संपत्ति नियम (Residuary Estate)'}
      </h3>
      <p style="margin-bottom: 20px;">
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
      <div style="margin-top: 20px; border-top: 1px dashed #666; padding-top: 10px;">
        <p style="margin-bottom: 8px; font-size: 11.5px;">
          ${isTe ? 
            `పై విషయాలన్నీ సత్యమని ధృవీకరిస్తూ, నేను (<strong>${safeFullName}</strong>) ఈ దినమున అనగా 2026 సంవత్సరం _________ నెల _________ వ తేదీన నా సంపూర్ణ సమ్మతితో ఈ విల్ పత్రంపై సంతకం చేయుచున్నాను.` :
            `उपरोक्त सभी विवरणों को सत्य मानते हुए, मैं (<strong>${safeFullName}</strong>) आज दिनांक _____ माह ____________, 2026 को अपनी पूर्ण सहमति से इस वसीयत पर हस्ताक्षर कर रहा/रही हूँ।`}
        </p>
        <p><strong>${isTe ? 'శాసనకర్త సంతకం / Signature of Testator:' : 'वसीयतकर्ता के हस्ताक्षर / Signature of Testator:'}</strong></p>
        <br>
        <p>_____________________________________</p>
        <p style="font-size: 12px; color: #333;">${safeFullName}</p>
      </div>
      <div style="margin-top: 18px; border: 1px solid #777; padding: 10px; border-radius: 4px;">
        <h4 style="font-size: 12px; margin-bottom: 4px;">
          ${isTe ? 'ఇద్దరు సాక్షుల ధృవీకరణ సంతకాలు (ATTESTATION BY TWO INDEPENDENT WITNESSES):' : 'दो स्वतंत्र गवाहों के हस्ताक्षर (ATTESTATION BY TWO INDEPENDENT WITNESSES):'}
        </h4>
        <p style="font-size: 10px; color: #444; margin-bottom: 8px; line-height: 1.35;">
          ${isTe ? 
            'శాసనకర్త మా సమక్షంలో సంతకం చేయగా చూసి, వారి కోరిక మేరకు, వారి సమక్షంలో మరియు మా ఇద్దరి సమక్షంలో మేము సాక్షులుగా సంతకాలు చేయుచున్నాము. మేము ఈ విల్ ద్వారా ఎటువంటి ఆస్తి లబ్ధి పొందని స్వతంత్ర సాక్షులమని ధృవీకరిస్తున్నాము.' :
            'वसीयतकर्ता द्वारा हमारे समक्ष हस्ताक्षर किए जाने की पुष्टि करते हुए, उनके अनुरोध पर, उनकी उपस्थिति में और एक-दूसरे की उपस्थिति में हम गवाह के रूप में हस्ताक्षर कर रहे हैं। हम पुष्टि करते हैं कि हम इस वसीयत के लाभार्थी नहीं हैं।'}
        </p>
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
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
      <p style="font-size: 9px; color: #888; text-align: center; margin-top: 20px;">SmartWill India — ${isTe ? 'తెలుగు పత్రము' : 'हिंदी दस्तावेज'} — Indian Succession Act 1925</p>
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
