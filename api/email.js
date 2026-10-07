/**
 * SmartWill India - Automated Transaction & Document Delivery Email Engine
 * 
 * Dispatches official payment receipts & Indian Succession Act 1925 statutory
 * execution checklists to customers upon verified payment.
 * 
 * Delivery Providers:
 * 1. Resend REST API (if RESEND_API_KEY is configured)
 * 2. Fallback Logger (gracefully non-blocking so payment verification never fails)
 */

const SENDER_EMAIL = process.env.SENDER_EMAIL || 'SmartWill India <onboarding@resend.dev>';
const SUPPORT_EMAIL = 'smartwillindia.help@gmail.com';
const DASHBOARD_URL = 'https://smartwill-india.vercel.app/app';

/**
 * Builds responsive, branded HTML email template
 */
function buildReceiptHtml({ name, orderId, amount, dateStr }) {
  const safeName = name || 'Customer';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your SmartWill Document & Payment Receipt</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0c16; color: #f1f5f9; }
    .wrapper { width: 100%; max-width: 620px; margin: 0 auto; padding: 24px 16px; box-sizing: border-box; }
    .card { background-color: #151828; border: 1px solid #232942; border-radius: 12px; padding: 32px 24px; }
    .header { text-align: center; margin-bottom: 24px; }
    .brand-title { color: #f6c860; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
    .brand-sub { color: #94a3b8; font-size: 13px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
    .receipt-box { background-color: #1c2136; border: 1px solid #2d3553; border-radius: 8px; padding: 18px; margin: 20px 0; }
    .receipt-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; border-bottom: 1px solid #242a42; }
    .receipt-row:last-child { border-bottom: none; font-weight: 700; color: #4ade80; font-size: 16px; margin-top: 4px; }
    .guide-box { background-color: rgba(246, 200, 96, 0.08); border-left: 4px solid #f6c860; padding: 16px; border-radius: 4px; margin: 24px 0; }
    .guide-step { margin-bottom: 12px; font-size: 14px; line-height: 1.5; color: #e2e8f0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #f6c860, #d4a337); color: #0b0c16 !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 24px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1 class="brand-title">SmartWill India</h1>
        <div class="brand-sub">Order Confirmation & Legal Guide</div>
      </div>

      <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">
        Dear <strong>${safeName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
        Thank you for choosing SmartWill India. Your payment of <strong>₹${amount} INR</strong> has been verified successfully via Cashfree, and your legally structured Will document is finalized.
      </p>

      <div class="receipt-box">
        <div class="receipt-row">
          <span style="color: #94a3b8;">Order Reference:</span>
          <span style="font-family: monospace; color: #f1f5f9;">${orderId}</span>
        </div>
        <div class="receipt-row">
          <span style="color: #94a3b8;">Date &amp; Time:</span>
          <span>${dateStr}</span>
        </div>
        <div class="receipt-row">
          <span style="color: #94a3b8;">Status:</span>
          <span style="color: #4ade80;">PAID &amp; CONFIRMED</span>
        </div>
        <div class="receipt-row">
          <span>Amount Paid:</span>
          <span>₹${amount} INR</span>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${DASHBOARD_URL}" class="btn">Access / Re-Download Your Will</a>
      </div>

      <div class="guide-box">
        <h3 style="margin: 0 0 12px 0; color: #f6c860; font-size: 15px;">
          ⚠️ Next Steps: Making Your Will Legally Valid (Indian Succession Act 1925)
        </h3>
        <div class="guide-step">
          <strong>1. Plain Paper Printout:</strong> Print the downloaded PDF on standard A4 paper. (Under Indian law, non-testamentary stamp paper is NOT mandatory).
        </div>
        <div class="guide-step">
          <strong>2. Sign Each Page:</strong> Sign or place your thumb impression at the bottom of <em>every single page</em> in the designated area.
        </div>
        <div class="guide-step">
          <strong>3. Two Independent Witnesses:</strong> Two adult witnesses must physically watch you sign, and then sign the attestation section. <em>Important: Beneficiaries or their spouses cannot act as witnesses.</em>
        </div>
        <div class="guide-step">
          <strong>4. Safe Storage:</strong> Registration at the Sub-Registrar's office is optional. Keep the signed physical original in a secure locker or with a trusted family executor.
        </div>
      </div>

      <p style="font-size: 13px; color: #94a3b8; line-height: 1.6;">
        If you ever need to access or review your document again, simply log into <a href="${DASHBOARD_URL}" style="color: #f6c860;">SmartWill India</a> with your registered email.
      </p>

      <div class="footer">
        SmartWill Digital Technologies India &bull; Hyderabad, Telangana, India<br>
        For questions or assistance: <a href="mailto:${SUPPORT_EMAIL}" style="color: #94a3b8;">${SUPPORT_EMAIL}</a><br>
        <em>SmartWill India provides automated legal document technology under the Indian Succession Act 1925 and is not a law firm.</em>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Builds Plaintext version for maximum deliverability
 */
function buildReceiptText({ name, orderId, amount, dateStr }) {
  const safeName = name || 'Customer';
  return `SMARTWILL INDIA — ORDER CONFIRMATION & PAYMENT RECEIPT
============================================================

Dear ${safeName},

Thank you for choosing SmartWill India. Your payment has been received and verified.

RECEIPT DETAILS:
----------------
• Order ID: ${orderId}
• Date: ${dateStr}
• Status: PAID & VERIFIED
• Amount: ₹${amount} INR
• Payment Gateway: Cashfree Payments India

ACCESS YOUR WILL:
-----------------
You can download or re-access your finalized document anytime by visiting:
${DASHBOARD_URL}

HOW TO MAKE YOUR WILL LEGALLY VALID (Indian Succession Act 1925):
-----------------------------------------------------------------
1. PRINT: Print your PDF on plain A4 paper (stamp paper is not required).
2. SIGN: Sign or affix your thumb impression at the bottom of EVERY page.
3. ATTEST: Have TWO (2) adult independent witnesses physically observe you sign and attest the document. (Beneficiaries cannot be witnesses).
4. SAFEKEEPING: Keep the original signed document in a secure location or safe deposit box. (Registration is optional under Indian law).

Need help? Contact support at: ${SUPPORT_EMAIL}

Warm regards,
SmartWill India Team
https://smartwill-india.vercel.app
`;
}

/**
 * Main dispatcher function — safely non-blocking
 */
async function sendTransactionEmail({ to, name, orderId, amount, paidAt }) {
  if (!to || !to.includes('@')) {
    console.warn(`[Mailer Skipped] Invalid recipient email: "${to}" for order ${orderId}`);
    return { success: false, reason: 'Invalid recipient email' };
  }

  const dateStr = paidAt ? new Date(paidAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const html = buildReceiptHtml({ name, orderId, amount: amount || 299, dateStr });
  const text = buildReceiptText({ name, orderId, amount: amount || 299, dateStr });
  const subject = `Order Confirmed: Your Will Document (Order #${orderId}) — SmartWill India`;

  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: SENDER_EMAIL,
          to: [to],
          subject: subject,
          html: html,
          text: text
        })
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`[Mailer Success] Receipt email sent via Resend to ${to} for order ${orderId}. ResendId=${data.id}`);
        return { success: true, provider: 'resend', id: data.id };
      } else {
        console.error(`[Mailer Resend Error] Status=${response.status}:`, data);
        return { success: false, provider: 'resend', error: data.message || 'Resend API error' };
      }
    } catch (err) {
      console.error(`[Mailer Network Error] Failed to call Resend API: ${err.message}`);
      return { success: false, provider: 'resend', error: err.message };
    }
  }

  // Graceful fallback when API key is not yet set
  console.log(`[Mailer Prepared] Automated receipt prepared for ${to} (Order #${orderId}). To send live emails, set RESEND_API_KEY in Vercel environment variables.`);
  return { success: true, provider: 'mock_prepared', note: 'RESEND_API_KEY pending' };
}

module.exports = {
  sendTransactionEmail,
  buildReceiptHtml,
  buildReceiptText
};
