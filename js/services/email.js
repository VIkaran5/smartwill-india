/* EmailJS Service Module for SmartWill India */
import { showToast } from '../ui/toast.js';
import { logger } from './logger.js';

const EMAILJS_SERVICE_ID = 'service_0kllo5c';
const EMAILJS_TEMPLATE_ID = 'template_tuu3204';
const EMAILJS_PUBLIC_KEY = '8uss6lf18EqeuWT6D';

export function initEmailService() {
  try {
    if (typeof window.emailjs !== 'undefined') {
      window.emailjs.init(EMAILJS_PUBLIC_KEY);
      logger.info('EmailJS initialized successfully');
    }
  } catch (e) {
    logger.warn('EmailJS SDK not loaded', e);
  }
}

export async function sendWillToEmail(willData, pdfBase64, pdfFileName) {
  const p = willData.personal || {};
  const userEmail = p.email;
  const userName = p.fullName || 'User';

  if (!userEmail) {
    logger.warn('No email address provided. Skipping email send.');
    showToast('warning', 'No Email Address', 'You did not provide an email address in Step 1. PDF downloaded locally only.');
    return false;
  }

  showToast('loading', 'Sending Will to Email...', `Delivering your Will document to ${userEmail}`);

  const assetSummary = (willData.assets || []).map((a, i) => 
    `${i + 1}. ${a.type}: ${a.desc} (₹${Number(a.value || 0).toLocaleString('en-IN')})`
  ).join('\n');

  const benSummary = (willData.beneficiaries || []).map((b, i) => 
    `${i + 1}. ${b.name} (${b.relation})${b.idType ? ` [${b.idType}: XXXX-${b.idDigits}]` : ''}`
  ).join('\n');

  const templateParams = {
    to_email: userEmail,
    to_name: userName,
    testator_name: userName,
    testator_dob: p.dob || 'N/A',
    testator_id: (p.govtIdType && p.govtIdDigits) ? `${p.govtIdType} (XXXX-${p.govtIdDigits})` : 'Not provided',
    assets_count: String((willData.assets || []).length),
    beneficiaries_count: String((willData.beneficiaries || []).length),
    asset_summary: assetSummary,
    beneficiary_summary: benSummary,
    executor_name: (willData.executor && willData.executor.name) || 'Not specified',
    executor_relation: (willData.executor && willData.executor.relation) || 'Not specified',
    pdf_filename: pdfFileName,
    message: `Dear ${userName},\n\nYour SmartWill Legal Document has been successfully generated.\n\nPlease find the summary of your Will below:\n\n📦 Assets (${(willData.assets || []).length}):\n${assetSummary}\n\n👨‍👩‍👧‍👦 Beneficiaries (${(willData.beneficiaries || []).length}):\n${benSummary}\n\n📋 Executor: ${(willData.executor && willData.executor.name) || 'Not specified'} (${(willData.executor && willData.executor.relation) || 'N/A'})\n\n⚠️ IMPORTANT NEXT STEPS:\n1. Print the downloaded PDF on plain A4 paper.\n2. Sign at the bottom of EVERY page in front of 2 independent witnesses.\n3. Have both witnesses sign the attestation section.\n4. Store the signed document in a safe place or bank locker.\n\nThis Will was formatted under the Indian Succession Act, 1925.\n\nThank you for choosing SmartWill India!\n\n— SmartWill India Team`
  };

  try {
    if (typeof window.emailjs === 'undefined') {
      logger.warn('EmailJS SDK not available on this platform.');
      return false;
    }

    try { window.emailjs.init(EMAILJS_PUBLIC_KEY); } catch (_) {}

    const response = await window.emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );
    logger.info('Email sent successfully', response);
    showToast('success', 'Email Sent! ✉️', `A copy of your Will summary was sent to ${userEmail}`);
    return true;
  } catch (error) {
    logger.warn('Email delivery notice (non-fatal):', error);
    showToast('info', 'Email Delivery Notice', `Could not send email copy. Your PDF document was saved successfully to your device.`);
    return false;
  }
}

// Temporary compatibility fallback bindings
window.sendWillToEmail = sendWillToEmail;
