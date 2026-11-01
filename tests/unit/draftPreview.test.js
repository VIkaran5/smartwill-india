import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  renderDraftContent,
  openDraftPreviewModal,
  closeDraftPreviewModal,
  activeDraftLang
} from '../../js/render/draftPreview.js';

describe('Draft Will Document Preview Service', () => {
  const mockWillData = {
    personal: {
      fullName: 'Dasari Ganesh',
      dob: '2002-09-18',
      gender: 'Male',
      religion: 'Hindu',
      govtIdType: 'PAN Card',
      govtIdDigits: '232F',
      addressLine1: 'ESI, near metro',
      addressCity: 'Hyderabad',
      addressState: 'Telangana',
      addressPincode: '500001'
    },
    assets: [
      {
        id: 1,
        type: 'Bank Account / FD',
        desc: 'IOB Fixed Deposit 6543, Bitragunta Branch',
        value: '4999999',
        allocations: [
          { beneficiaryId: 1, percentage: 50 },
          { beneficiaryId: 2, percentage: 50 }
        ]
      }
    ],
    beneficiaries: [
      { id: 1, name: 'Haritha Dasari', relation: 'Sister', idType: 'Aadhaar Card', idDigits: '4334' },
      { id: 2, name: 'Jayamma Dasari', relation: 'Mother', idType: 'PAN Card', idDigits: '342F' }
    ],
    executor: {
      name: 'Suresh Sharma',
      relation: 'Trusted Friend'
    }
  };

  it('renders complete English legal draft with all required clauses', () => {
    const html = renderDraftContent(mockWillData, 'en');

    expect(html).toContain('LAST WILL AND TESTAMENT');
    expect(html).toContain('INDIAN SUCCESSION ACT, 1925');
    expect(html).toContain('DASARI GANESH');
    expect(html).toContain('PAN Card Ending in XXXX-232F');
    expect(html).toContain('Hyderabad, Telangana, PIN: 500001');
    expect(html).toContain('SECTION I');
    expect(html).toContain('REVOCATION OF ALL FORMER WILLS');
    expect(html).toContain('SECTION II');
    expect(html).toContain('DECLARATION OF SOUND HEALTH AND TESTAMENTARY CAPACITY');
    expect(html).toContain('SECTION IV');
    expect(html).toContain('APPOINTMENT &amp; OPERATIONAL POWERS OF EXECUTOR');
    expect(html).toContain('Suresh Sharma');
    expect(html).toContain('Trusted Friend');
    expect(html).toContain('SECTION V');
    expect(html).toContain('SCHEDULE OF BEQUEST OF ASSETS');
    expect(html).toContain('Haritha Dasari');
    expect(html).toContain('SECTION VII');
    expect(html).toContain('RESIDUARY ESTATE CLAUSE');
    expect(html).toContain('IN WITNESS WHEREOF');
    expect(html).toContain('ATTESTATION BY TWO INDEPENDENT WITNESSES');
  });

  it('renders Telugu legal draft with authentic Telugu phrasing', () => {
    const html = renderDraftContent(mockWillData, 'te');

    expect(html).toContain('కడపటి ఇష్టపూర్వక మరణ శాసన పత్రము');
    expect(html).toContain('భారతీయ వారసత్వ చట్టం 1925');
    expect(html).toContain('Dasari Ganesh');
    expect(html).toContain('పూర్వ విల్స్ రద్దు నిబంధన');
    expect(html).toContain('సంపూర్ణ ఆరోగ్య స్పృహ ప్రకటన');
    expect(html).toContain('Suresh Sharma');
    expect(html).toContain('ఆస్తుల కేటాయింపు పట్టిక');
    expect(html).toContain('మిగిలిన ఆస్తుల నిబంధన');
    expect(html).toContain('ఇద్దరు సాక్షుల సంతకాలు');
  });

  it('renders Hindi legal draft with authentic Hindi phrasing', () => {
    const html = renderDraftContent(mockWillData, 'hi');

    expect(html).toContain('अंतिम इच्छा पत्र / वसीयतनामा');
    expect(html).toContain('भारतीय उत्तराधिकार अधिनियम 1925');
    expect(html).toContain('Dasari Ganesh');
    expect(html).toContain('पूर्व वसीयतों का निरस्तीकरण');
    expect(html).toContain('स्वस्थ चित्त एवं स्वेच्छा की घोषणा');
    expect(html).toContain('Suresh Sharma');
    expect(html).toContain('संपत्ति आवंटन अनुसूची');
    expect(html).toContain('अवशिष्ट संपत्ति नियम');
    expect(html).toContain('दो स्वतंत्र गवाहों द्वारा सत्यापन');
  });

  it('handles empty executor gracefully with statutory court administration fallback', () => {
    const dataWithoutExec = {
      ...mockWillData,
      executor: { name: '', relation: '' }
    };

    const htmlEn = renderDraftContent(dataWithoutExec, 'en');
    expect(htmlEn).toContain('Letters of Administration');

    const htmlTe = renderDraftContent(dataWithoutExec, 'te');
    expect(htmlTe).toContain('ప్రత్యేక ఎగ్జిక్యూటర్‌ను నియమించలేదు');

    const htmlHi = renderDraftContent(dataWithoutExec, 'hi');
    expect(htmlHi).toContain('कोई निजी निष्पादक नियुक्त नहीं किया है');
  });

  it('handles empty or missing assets gracefully without throwing', () => {
    const dataEmpty = {
      personal: {},
      assets: [],
      beneficiaries: [],
      executor: {}
    };

    expect(() => renderDraftContent(dataEmpty, 'en')).not.toThrow();
    expect(() => renderDraftContent(dataEmpty, 'te')).not.toThrow();
    expect(() => renderDraftContent(dataEmpty, 'hi')).not.toThrow();

    const html = renderDraftContent(dataEmpty, 'en');
    expect(html).toContain('LAST WILL AND TESTAMENT');
    expect(html).toContain('No specific assets recorded');
  });

  it('opens and closes draft preview modal cleanly', () => {
    document.body.innerHTML = `
      <div id="draftPreviewModal" class="payment-modal-overlay hidden">
        <div id="draftDocumentContainer"></div>
      </div>
      <button id="previewDraftBtn"></button>
    `;

    openDraftPreviewModal('en');
    const modal = document.getElementById('draftPreviewModal');
    expect(modal.classList.contains('hidden')).toBe(false);
    expect(document.body.style.overflow).toBe('hidden');

    closeDraftPreviewModal();
    expect(modal.classList.contains('hidden')).toBe(true);
    expect(document.body.style.overflow).toBe('');
  });

  it('renders alternate executor in EN, TE, and HI drafts when provided', () => {
    const dataWithAltExec = {
      ...mockWillData,
      executor: {
        name: 'Haritha Dasari',
        relation: 'Sister',
        alternateName: 'Kavitha Dasari',
        alternateRelation: 'Cousin'
      }
    };

    const htmlEn = renderDraftContent(dataWithAltExec, 'en');
    expect(htmlEn).toContain('Haritha Dasari');
    expect(htmlEn).toContain('Alternate Executor');
    expect(htmlEn).toContain('Kavitha Dasari');
    expect(htmlEn).toContain('(Cousin)');

    const htmlTe = renderDraftContent(dataWithAltExec, 'te');
    expect(htmlTe).toContain('Haritha Dasari');
    expect(htmlTe).toContain('ప్రత్యామ్నాయ ఎగ్జిక్యూటర్ (Alternate Executor)');
    expect(htmlTe).toContain('Kavitha Dasari');

    const htmlHi = renderDraftContent(dataWithAltExec, 'hi');
    expect(htmlHi).toContain('Haritha Dasari');
    expect(htmlHi).toContain('वैकल्पिक निष्पादक (Alternate Executor)');
    expect(htmlHi).toContain('Kavitha Dasari');
  });

  it('renders dynamic residuary clause for sole beneficiary across EN, TE, and HI', () => {
    const singleBenData = {
      ...mockWillData,
      beneficiaries: [
        { id: 1, name: 'Ganesh Dasari', relation: 'Brother' }
      ]
    };

    const htmlEn = renderDraftContent(singleBenData, 'en');
    expect(htmlEn).toContain('sole designated beneficiary');
    expect(htmlEn).toContain('Ganesh Dasari (Brother)');

    const htmlTe = renderDraftContent(singleBenData, 'te');
    expect(htmlTe).toContain('ఏకైక లబ్ధిదారుడు/రాలు అయిన');
    expect(htmlTe).toContain('Ganesh Dasari');

    const htmlHi = renderDraftContent(singleBenData, 'hi');
    expect(htmlHi).toContain('एकमात्र उत्तराधिकारी');
    expect(htmlHi).toContain('Ganesh Dasari');
  });

  it('renders dynamic residuary clause for multiple beneficiaries across EN, TE, and HI', () => {
    const htmlEn = renderDraftContent(mockWillData, 'en');
    expect(htmlEn).toContain('divided among my designated beneficiaries in the specified proportions:');
    expect(htmlEn).toContain('Haritha Dasari');
    expect(htmlEn).toContain('Jayamma Dasari');

    const htmlTe = renderDraftContent(mockWillData, 'te');
    expect(htmlTe).toContain('మిగిలిన ఆస్తుల నిబంధన');
    expect(htmlTe).toContain('Haritha Dasari');

    const htmlHi = renderDraftContent(mockWillData, 'hi');
    expect(htmlHi).toContain('अवशिष्ट संपत्ति नियम');
    expect(htmlHi).toContain('Haritha Dasari');
  });
});

