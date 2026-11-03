/**
 * SmartWill India — Legal Engine 2.1
 * Testamentary Trustee, Minor Protection & Debt Settlement Rules
 *
 * Implements:
 * 1. Tripartite legal capacity separation: Executor vs Testamentary Trustee vs Guardian of Person.
 * 2. Grounded Trust Investments: Strictly pursuant to Section 20 of Indian Trusts Act, 1882 (removing any IBBI references).
 * 3. Goa Estate Liability Hierarchy: Sections 45 & 46 of Goa Act 23 of 2016 vs Sections 320 to 325 ISA 1925.
 */

export function generateMinorTrustClauses(minorBeneficiary = {}, trustee = {}, options = {}) {
  const minorName = minorBeneficiary.name || 'the minor beneficiary';
  const trusteeName = trustee.name || 'the Testamentary Trustee';
  const isGoa = Boolean(options.isGoa);

  return {
    trustTitle: "TESTAMENTARY TRUST FOR MINOR BENEFICIARY",
    statutoryBasis: isGoa
      ? "Governed by the terms of this Testamentary Instrument and the Indian Trusts Act, 1882 (operating in harmony with the Goa Succession Act, 2012)"
      : "Governed by the Indian Trusts Act, 1882 and applicable Guardianship legislation",
    authorizedInvestments: [
      "(i) Securities of the Central Government or any State Government under Section 20(a) of the Indian Trusts Act, 1882;",
      "(ii) Fixed term deposits in Scheduled Commercial Banks licensed by the Reserve Bank of India;",
      "(iii) Capital-preservation sovereign instruments, strictly excluding speculative or volatile trading equities."
    ],
    operationalDuties: [
      `Separate Trust Accounts: The Trustee (${trusteeName}) shall maintain separate trust bank accounts and render annual documented books of account for ${minorName}.`,
      `Application of Income: The Trustee is authorized to apply the net income and, if strictly necessary, reasonable portions of the corpus exclusively for the education, healthcare, maintenance, and welfare of ${minorName}.`,
      `Vesting at Majority: Upon ${minorName} attaining the age of eighteen (18) years, the entire remaining trust property, with all accumulated income, shall vest and be delivered to said beneficiary absolutely.`
    ]
  };
}

export function generateStatutoryDebtHierarchy(options = {}) {
  const isGoa = Boolean(options.isGoa);

  if (isGoa) {
    return {
      title: "Statutory Debt Settlement Priority (Sections 45 & 46, Goa Act 23 of 2016):",
      items: [
        "(i) Section 45: Funeral, death-bed, and medical expenses according to my station in life, settled in priority over all other estate debts.",
        "(ii) Judicial, inventory, notarial, and administration expenses incurred in registering, proving, and executing this testamentary instrument.",
        "(iii) Wages and compensation due to domestic staff, labourers, or employees within statutory limitation periods.",
        "(iv) Section 46: All remaining enforceable debts and taxes settled rateably out of estate assets prior to the satisfaction or delivery of any legacy or bequest."
      ]
    };
  }

  return {
    title: "Statutory Debt Settlement Priority (Sections 320 to 325, Indian Succession Act, 1925):",
    items: [
      "(i) Section 320: Funeral and death-bed expenses according to my station in life paid in priority to all debts.",
      "(ii) Section 321: Expenses of obtaining Probate or Letters of Administration, and costs of proper administration proceedings.",
      "(iii) Section 322: Wages of labourers, artisans, or domestic servants rendered within three months preceding demise, followed by other statutory priorities.",
      "(iv) Section 323: All other enforceable debts paid equally and rateably out of estate assets.",
      "(v) Section 325: Debts of every description settled before any legacy or bequest is paid or satisfied."
    ]
  };
}
