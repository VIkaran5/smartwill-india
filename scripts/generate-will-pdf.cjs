const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const ARTIFACT_DIR = 'C:/Users/dasar/.gemini/antigravity/brain/b1408bca-de71-4e67-91c9-ec8f70902b42';
const PROJECT_DIR = path.resolve(__dirname, '..');

async function generatePDF() {
  console.log('Generating Court-Admissible Last Will & Testament PDF...');
  
  // 1. Read rendered English draft HTML
  const draftHtmlPath = path.join(ARTIFACT_DIR, 'draft_preview_rendered.html');
  let draftBodyHtml = '';
  if (fs.existsSync(draftHtmlPath)) {
    draftBodyHtml = fs.readFileSync(draftHtmlPath, 'utf8');
  } else {
    throw new Error('draft_preview_rendered.html not found!');
  }

  // 2. Read CSS from app.css
  const appCssPath = path.join(PROJECT_DIR, 'css', 'app.css');
  const appCss = fs.existsSync(appCssPath) ? fs.readFileSync(appCssPath, 'utf8') : '';

  // 3. Construct Complete HTML Page with Legal Print Styling
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Last Will and Testament — Ramesh Sharma</title>
  <style>
    ${appCss}

    /* Print & Executive Legal Parchment Optimization */
    @page {
      size: A4 portrait;
      margin: 14mm 16mm 14mm 16mm;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      background: #ffffff !important;
      color: #0f172a !important;
      font-family: 'Times New Roman', Times, Georgia, serif !important;
      font-size: 9.8pt !important;
      line-height: 1.52 !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .legal-paper-preview {
      background: #ffffff !important;
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
      max-width: 100% !important;
      margin: 0 !important;
    }

    .legal-paper-crest {
      text-align: center;
      margin-bottom: 10pt;
      padding-bottom: 6pt;
      border-bottom: 1.5pt solid #855d14;
    }

    .crest-title {
      font-family: 'Times New Roman', Georgia, serif;
      font-size: 10.5pt;
      font-weight: bold;
      letter-spacing: 2px;
      color: #855d14;
      text-transform: uppercase;
    }

    .crest-statute {
      font-family: Arial, sans-serif;
      font-size: 7.5pt;
      letter-spacing: 0.5px;
      color: #64748b;
      text-transform: uppercase;
      margin-top: 2pt;
    }

    .doc-title {
      font-family: 'Times New Roman', Georgia, serif;
      font-size: 15pt;
      font-weight: bold;
      text-align: center;
      letter-spacing: 1.5px;
      margin-bottom: 3pt;
      color: #0f172a;
    }

    .doc-subtitle {
      font-family: 'Times New Roman', Georgia, serif;
      font-style: italic;
      font-size: 8.5pt;
      text-align: center;
      color: #475569;
      margin-bottom: 12pt;
    }

    .paper-preamble {
      background: #fdfcf9 !important;
      border: 1pt solid #e2e8f0;
      border-left: 3.5pt solid #855d14;
      padding: 8pt 10pt;
      margin-bottom: 12pt;
      text-align: justify;
      font-size: 9.5pt;
      line-height: 1.5;
    }

    .clause-block {
      margin-top: 10pt;
      margin-bottom: 8pt;
      break-inside: auto !important;
      page-break-inside: auto !important;
    }

    .clause-title {
      font-family: 'Times New Roman', Georgia, serif;
      font-size: 10.5pt;
      font-weight: bold;
      color: #0f172a;
      border-bottom: 0.75pt solid #cbd5e1;
      padding-bottom: 2pt;
      margin-bottom: 4pt;
      break-after: avoid !important;
      page-break-after: avoid !important;
    }

    .clause-tag {
      background: #1e293b;
      color: #ffffff !important;
      padding: 1pt 5pt;
      font-size: 7.5pt;
      font-family: Arial, sans-serif;
      border-radius: 2pt;
      margin-right: 4pt;
    }

    .executor-powers-list {
      list-style: none;
      padding-left: 0;
      margin-top: 4pt;
    }

    .executor-powers-list li {
      margin-bottom: 4pt;
      padding-left: 8pt;
      font-size: 9.2pt;
      line-height: 1.48;
    }

    .draft-asset-item {
      background: #f8fafc !important;
      border: 1pt solid #e2e8f0;
      border-left: 3pt solid #1e293b;
      padding: 6pt 8pt;
      margin-bottom: 6pt;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .draft-asset-header {
      font-weight: bold;
      font-size: 9.2pt;
      display: flex;
      justify-content: space-between;
      margin-bottom: 3pt;
      border-bottom: 0.5pt dashed #cbd5e1;
      padding-bottom: 2pt;
    }

    .draft-protective-proviso {
      background: #fffbeb !important;
      border-left: 3pt solid #d97706 !important;
      padding: 6pt 8pt;
      margin: 6pt 0;
      font-size: 8.8pt;
      line-height: 1.48;
      color: #1e293b;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .draft-alloc-list {
      list-style: none;
      padding-left: 0;
      margin: 0;
    }

    .draft-alloc-list li {
      font-size: 8.8pt;
      padding: 2pt 0;
      display: flex;
      align-items: center;
      gap: 5pt;
    }

    .alloc-badge {
      background: #e2e8f0;
      color: #0f172a;
      font-weight: bold;
      font-size: 7.5pt;
      padding: 1pt 4pt;
      border-radius: 2pt;
      font-family: Arial, sans-serif;
    }

    .draft-subclause-box {
      background: #f8fafc !important;
      border: 1pt solid #cbd5e1;
      border-left: 3pt solid #0284c7;
      padding: 6pt 8pt;
      margin: 6pt 0;
      font-size: 8.8pt;
      line-height: 1.48;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .closing-execution-container {
      break-inside: avoid;
      page-break-inside: avoid;
      margin-top: 8pt;
    }

    .testator-execution-deck {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 6pt;
      margin-bottom: 6pt;
    }

    .testator-sign-box {
      width: 58%;
    }

    .sign-line {
      border-bottom: 1pt solid #0f172a;
      margin-bottom: 3pt;
      width: 190pt;
    }

    .sign-label {
      font-weight: bold;
      font-size: 8pt;
      margin: 0;
    }

    .sign-name {
      font-size: 8.5pt;
      margin: 1pt 0;
    }

    .thumb-impression-box {
      width: 32%;
      border: 1pt dashed #94a3b8;
      height: 48pt;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 2pt;
      background: #fafaf9 !important;
    }

    .witness-grid {
      display: flex;
      justify-content: space-between;
      margin-top: 6pt;
    }

    .witness-card {
      width: 48%;
      border: 0.75pt solid #94a3b8;
      padding: 4pt 6pt;
      font-size: 7.5pt;
      line-height: 1.35;
      background: #fdfdfd !important;
    }

    .witness-card p {
      margin: 1.5pt 0 !important;
    }

    .witness-title {
      font-size: 8pt;
      font-weight: bold;
      margin-top: 0;
      margin-bottom: 2pt;
      border-bottom: 0.5pt solid #cbd5e1;
      padding-bottom: 1pt;
    }

    .witness-intro {
      font-size: 7.8pt;
      text-align: justify;
      color: #334155;
      margin-bottom: 4pt;
      line-height: 1.35;
    }

    .draft-page-initials-box {
      display: none !important;
    }
  </style>
</head>
<body>
  ${draftBodyHtml}
</body>
</html>`;

  // 4. Launch Chromium & Generate High-Precision PDF
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });

  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: 'networkidle' });

  // Paths
  const pdfArtifactPath = path.join(ARTIFACT_DIR, 'SmartWill_Ramesh_Sharma_Last_Will.pdf');
  const pdfProjectPath = path.join(PROJECT_DIR, 'SmartWill_Ramesh_Sharma_Last_Will.pdf');

  console.log('Rendering A4 PDF...');
  await page.pdf({
    path: pdfArtifactPath,
    format: 'A4',
    margin: {
      top: '16mm',
      bottom: '16mm',
      left: '16mm',
      right: '16mm'
    },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-family: 'Times New Roman', serif; font-size: 7.5pt; color: #64748b; width: 100%; display: flex; justify-content: space-between; padding: 0 16mm;">
        <span>LEGAL TESTAMENTARY INSTRUMENT • INDIAN SUCCESSION ACT, 1925</span>
        <span>TESTATOR: RAMESH SHARMA</span>
      </div>
    `,
    footerTemplate: `
      <div style="font-family: 'Times New Roman', serif; font-size: 7.5pt; color: #1e293b; width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 0 16mm; border-top: 0.5pt solid #cbd5e1; padding-top: 3pt;">
        <span style="font-weight: bold;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        <span>Testator Initial: [ ____________ ]</span>
        <span>Witness 1 Initial: [ ____________ ]</span>
        <span>Witness 2 Initial: [ ____________ ]</span>
      </div>
    `
  });

  // Also copy to project root for easy download access
  fs.copyFileSync(pdfArtifactPath, pdfProjectPath);

  console.log('PDF Successfully Generated!');
  console.log('Artifact Path:', pdfArtifactPath);
  console.log('Project Root Path:', pdfProjectPath);

  const stats = fs.statSync(pdfArtifactPath);
  console.log('PDF File Size:', stats.size, 'bytes');

  await browser.close();
}

generatePDF().catch(err => {
  console.error('PDF Generation Error:', err);
  process.exit(1);
});