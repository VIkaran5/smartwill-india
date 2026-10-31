const fs = require('fs');

const filePath = 'c:/Users/dasar/OneDrive/Documents/New folder/smartwill-india/js/render/draftPreview.js';
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Fix Section IV(d) - remove "estate tax assessments"
content = content.replace(
  /Comply with applicable income-tax laws, prepare and file my final Income Tax Returns \(ITR\), handle estate tax assessments, and discharge all outstanding tax liabilities of the estate;/,
  'Comply with all applicable income-tax and other statutory tax laws (including under the Income-tax Act, 2025 in force from 1 April 2026), prepare and file my final Income Tax Returns (ITR), and discharge all outstanding and applicable tax liabilities and tax-compliance obligations of the deceased and estate (including capital gains liabilities arising from estate transactions);'
);

// Fix 2: Fix Section IV(e) - Add charitable liquidation exception
content = content.replace(
  /realise, sell, or lease assets strictly where necessary to discharge enforceable estate debts or statutory liabilities;<\/li>/,
  'realise, sell, or lease assets strictly where necessary to discharge enforceable estate debts or statutory liabilities; provided that, notwithstanding the foregoing general restriction, the Executor shall have express authority and is hereby directed to realise and liquidate the entire net estate including immovable property to the full extent required by the Ultimate Charitable Fallback provision of this Will (Section 307, Indian Succession Act, 1925);<\/li>'
);

// Fix 3: Fix Clause (v) - Remove the contradiction "or legal heirs under law"
content = content.replace(
  /their vested remainder interest shall devolve upon their surviving lineal descendants per stirpes \(to the exclusion of spouses or collateral heirs\); and in the event that such deceased child leaves no surviving lineal descendants, their share shall pass to their surviving sibling or legal heirs under law\./,
  'their vested remainder interest shall devolve upon their surviving lineal descendants per stirpes (to the absolute exclusion of spouses and collateral heirs). In the event that such deceased child leaves no surviving lineal descendants, their vested remainder share shall pass exclusively to the surviving sibling of such deceased child (i.e., the other child named under this Will), or if the surviving sibling has also predeceased, to the surviving sibling\'s own lineal descendants per stirpes. Spouses and collateral heirs of the deceased child are expressly excluded from any benefit under this clause in all circumstances.'
);

// Fix 4: Fix Clause (iii) outgoings - add shortfall fallback
content = content.replace(
  /routine society maintenance charges and municipal property taxes shall be paid out of my residuary estate during the first three \(3\) years following my demise, and thereafter shared by the co-owners in proportion to their ownership shares \(34:33:33\)/,
  'routine society maintenance charges and municipal property taxes shall be paid out of my residuary estate during the first three (3) years following my demise (provided that if the residuary estate is exhausted before the expiry of that three-year period, the co-owners shall contribute such charges proportionately in the ratio 34:33:33 from the date of exhaustion), and thereafter permanently shared by the co-owners in proportion to their ownership shares (34:33:33)'
);

// Fix 5: Fix Clause (iv) - add objective equivalence criteria for substitute accommodation
content = content.replace(
  /the net sale proceeds shall be applied first and foremost to acquire an equivalent substitute residential flat \(in which Sunita Sharma shall hold an identical lifelong right of residence, with remainder ownership vested in the co-owners in the proportions 34:33:33\)/,
  'the net sale proceeds shall be applied first and foremost to acquire a substitute residential flat of equivalent or better standard (defined as: located within the same city, of comparable or greater carpet area, in a structurally sound residential building with comparable amenities and accessibility, and valued at not less than the proportionate fair market value of Sunita Sharma\'s share in the sold flat) in which Sunita Sharma shall hold an identical lifelong right of residence, with remainder ownership vested in the co-owners in the proportions 34:33:33'
);

// Fix 6: Remove hardcoded "30 October 2026" date from the preamble for blank handwriting
// The currentDate variable is generated dynamically - check if it's in the IN WITNESS WHEREOF section which uses ${currentDate}
// The issue is the date in the legal preamble text block
// Find and fix the date in the opening recital - change to blank line for hand-signing
content = content.replace(
  /at <strong>\${currentDate}<\/strong> at <strong>\${executionPlace}<\/strong>/,
  'at <strong>__________________</strong> at <strong>${executionPlace}</strong>'
);

// Fix 7: Fix Ultimate Charitable Fallback last tier - add named charity + trustee details
content = content.replace(
  /to be applied by my Executor for the relief of poverty and education under a public charitable trust scheme, to the absolute exclusion of any intestate succession\./,
  'to be paid to the HelpAge India registered national charitable trust (Registered Office: C-14, Qutab Institutional Area, New Delhi 110016) for the relief of poverty, education, and eldercare; and failing which, to such other registered public charitable trust or institution as my Executor, acting honestly and with recorded reasons, shall select in consultation with a High Court of competent jurisdiction, in each case to the absolute exclusion of any intestate succession.'
);

// Fix 8: Fix Zerodha asset description - properly label DP ID vs BO ID vs Demat ID
// This is in the e2e test - fix the description pattern in draft rendering to show correct labels
content = content.replace(
  /BO ID: 12081600-04521892 \(Trading Client Code: ZR4521/,
  'Demat Account ID: 12081600-XXXXXXXX [DP ID: 12081600 (CDSL); BO Client ID: verify from CDSL statement; Full 16-digit Demat ID: verify from Zerodha Console]; Trading Client Code: [verify from Zerodha Console'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('All fixes applied successfully!');

// Verify changes
const updated = fs.readFileSync(filePath, 'utf8');
console.log('\n--- Verification ---');
console.log('Fix 1 (estate tax):', updated.includes('Income-tax Act, 2025') ? 'OK' : 'FAILED');
console.log('Fix 2 (charitable liquidation exception):', updated.includes('Section 307, Indian Succession Act') ? 'OK' : 'FAILED');
console.log('Fix 3 (clause v contradiction):', updated.includes('surviving sibling of such deceased child') ? 'OK' : 'FAILED');
console.log('Fix 4 (outgoings shortfall):', updated.includes('exhausted before the expiry of that three-year period') ? 'OK' : 'FAILED');
console.log('Fix 5 (substitute accommodation criteria):', updated.includes('comparable or greater carpet area') ? 'OK' : 'FAILED');
console.log('Fix 6 (date blank):', updated.includes('at <strong>__________________</strong>') ? 'OK' : 'FAILED');
console.log('Fix 7 (charitable trust named):', updated.includes('HelpAge India') ? 'OK' : 'FAILED');
