const fs = require('fs');
const cssPath = 'css/app.css';
const printRules = `

/* ═══════════════════════════════════════════════════════════════
   PRINT & A4 MULTI-PAGE STYLING (Zero Cut-Offs & Clean Page Breaks)
   ═══════════════════════════════════════════════════════════════ */
@media print {
  @page {
    size: A4 portrait;
    margin: 15mm 15mm 18mm 15mm;
  }
  body {
    background: #ffffff !important;
    color: #000000 !important;
  }
  .navbar, .footer, .btn, .wizard-header, .stepper-wrapper, .step-header, .draft-preview-modal-footer, .draft-preview-close-btn, .toast, #toastNotification, #floatingLegalBotBtn {
    display: none !important;
  }
  .clause-block, .draft-asset-split-card, .witness-grid, .witness-notarial-card, .execution-signature-grid, .testator-signature-block, .lti-box, .page-auth-safeguard, .legal-advisory-callout {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  h2, h3, h4, .clause-title, .section-number-tag {
    break-after: avoid !important;
    page-break-after: avoid !important;
  }
}
`;

fs.appendFileSync(cssPath, printRules, 'utf8');
console.log('Successfully appended print rules to css/app.css');
