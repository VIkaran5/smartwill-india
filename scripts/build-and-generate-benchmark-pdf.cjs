const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/dasar/.gemini/antigravity/brain/b1408bca-de71-4e67-91c9-ec8f70902b42';
const PROJECT_DIR = path.resolve(__dirname, '..');

async function main() {
  const { renderDraftContent } = await import('../js/render/draftPreview.js');

  const rameshData = {
    personal: {
      fullName: 'Ramesh Sharma',
      fatherName: 'Late Shri Kailash Sharma',
      dob: '1976-08-15',
      gender: 'Male',
      religion: 'Hindu',
      govtIdType: 'PAN Card',
      govtIdDigits: '521M',
      addressLine1: 'Flat 402, Sai Balaji Residency, Madhapur',
      addressCity: 'Hyderabad',
      addressState: 'Telangana',
      addressPincode: '500081'
    },
    beneficiaries: [
      { id: 1, name: 'Sunita Sharma', relation: 'Spouse', phone: '9876543210', idType: 'Aadhaar Card', idDigits: '9182' },
      { id: 2, name: 'Aarav Sharma', relation: 'Son', phone: '9876543211', idType: 'PAN Card', idDigits: '812B' },
      { id: 3, name: 'Ananya Sharma', relation: 'Daughter', phone: '9876543212', idType: 'Aadhaar Card', idDigits: '4567' }
    ],
    executor: {
      name: 'Suresh Sharma',
      relation: 'Brother',
      alternateName: 'Rajesh Kumar',
      alternateRelation: 'Close Friend / Advisor'
    },
    assets: [
      {
        id: 1,
        type: 'Bank Account / FD',
        desc: 'State Bank of India (SBI) Savings Account ending in 4521, Hitec City, Hyderabad (Savings A/c No. ending in 4521, along with all fixed deposits standing in my sole name with SBI, or any renewed/successor accounts)',
        value: '3500000',
        allocations: [{ beneficiaryId: 1, percentage: 34 }, { beneficiaryId: 2, percentage: 33 }, { beneficiaryId: 3, percentage: 33 }]
      },
      {
        id: 2,
        type: 'Property / Land',
        desc: 'Residential Flat / Apartment (Flat 402, 4th Floor, Sai Balaji Residency, Madhapur, Super Built-up Area: 1,450 sq ft (UDS: 42 sq yds), Regd. Sale Deed No. 4521/2018 dated 14/06/2018 at SRO Serilingampally, Bounded N: Open Driveway, S: Flat 401, E: Corridor, W: Compound Wall, Hyderabad)',
        value: '12000000',
        allocations: [{ beneficiaryId: 1, percentage: 34 }, { beneficiaryId: 2, percentage: 33 }, { beneficiaryId: 3, percentage: 33 }]
      },
      {
        id: 3,
        type: 'Mutual Funds / Stocks',
        desc: 'Zerodha Broking Ltd (CDSL DP ID: 12081600) Investment Holding (Account/Client: BO ID: 12081600-04521892 (Trading Client Code: ZR4521, covering all equity shares, ETF units, and mutual fund folios))',
        value: '4500000',
        allocations: [{ beneficiaryId: 1, percentage: 34 }, { beneficiaryId: 2, percentage: 33 }, { beneficiaryId: 3, percentage: 33 }]
      }
    ]
  };

  const html = renderDraftContent(rameshData, 'en');
  console.log('Rendered draft HTML length:', html.length);

  // Write to artifact dir and project dir
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'draft_preview_rendered.html'), html, 'utf8');
  console.log('Wrote draft_preview_rendered.html');

  // Now trigger generate-will-pdf.cjs
  console.log('Triggering generate-will-pdf.cjs...');
  require('./generate-will-pdf.cjs');
}

main().catch(console.error);
