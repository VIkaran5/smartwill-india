/**
 * SmartWill India — Legal Engine 2.1
 * Testamentary Trustee, Minor Protection & Debt Settlement Rules
 *
 * Implements:
 * 1. Tripartite legal capacity separation: Executor vs Testamentary Trustee vs Guardian of Person.
 * 2. Trust Investments: Grounded strictly in Section 20 of Indian Trusts Act, 1882 (as amended),
 *    authorising investments specified by the instrument or notified by Central Government.
 * 3. Authentic Goa Act 23 of 2016 Section 45 & Section 46 Priority Structure:
 *    - Section 45: Three-part statutory charges (Funeral/Last Rites, Executorship/Management, Debts).
 *    - Section 46: Exact priority: Inheritance Creditors > Legatees > Personal Creditors of Heirs.
 *    (Zero imported ISA wage limits or rateable settlement in the Goa branch).
 */

export function generateMinorTrustClauses(minorBeneficiary = {}, trustee = {}, options = {}) {
  const minorName = minorBeneficiary.name || 'the minor beneficiary';
  const trusteeName = trustee.name || 'the Testamentary Trustee';
  const isGoa = Boolean(options.isGoa);

  return {
    trustTitle: "TESTAMENTARY TRUST FOR MINOR BENEFICIARY",
    statutoryBasis: isGoa
      ? "Governed by this Testamentary Instrument and the Indian Trusts Act, 1882 (operating in harmony with the civil provisions of Goa Act 23 of 2016)"
      : "Governed by the Indian Trusts Act, 1882 and applicable personal guardianship legislation",
    authorizedInvestments: [
      "(i) Investments specifically authorised by this testamentary trust instrument pursuant to Section 20 of the Indian Trusts Act, 1882;",
      "(ii) Securities specified and notified by the Central Government in the Official Gazette under Section 20 of said Act;",
      "(iii) Fixed-income sovereign and scheduled commercial banking deposits expressly authorised by the instrument for capital preservation."
    ],
    operationalDuties: [
      `Separate Trust Accounts: The Trustee (${trusteeName}) shall maintain separate trust bank accounts and render annual documented books of account for ${minorName}.`,
      `Application of Income: The Trustee is authorised to apply the net income and, if strictly necessary, reasonable portions of the corpus exclusively for the education, healthcare, maintenance, and welfare of ${minorName}.`,
      `Vesting at Majority: Upon ${minorName} attaining the age of eighteen (18) years, the entire remaining trust property, with all accumulated income, shall vest and be delivered to said beneficiary absolutely.`
    ]
  };
}

/**
 * Generates statutory debt priority rules strictly adhering to jurisdiction statutes.
 */
export function generateStatutoryDebtHierarchy(options = {}) {
  const isGoa = Boolean(options.isGoa);

  if (isGoa) {
    return {
      title: "Charges on the Inheritance & Creditor Priority (Sections 45 & 46, Goa Act 23 of 2016):",
      section45Charges: [
        "(1) Funeral and last-rites expenses of the deceased according to their station in life;",
        "(2) Executorship and management burdens, including costs of inventory, registration, and administration of the inheritance;",
        "(3) Enforceable debts of the deceased."
      ],
      section46Priority: [
        "First Priority: Inheritance Creditors — debts of the deceased are settled in full before any legacies are satisfied;",
        "Second Priority: Legatees — bequests under this Will are delivered following discharge of inheritance debts;",
        "Third Priority: Personal Creditors of Heirs — may claim only against the net surplus or share allotted to the debtor heir."
      ],
      items: [
        "• Section 45(1): Funeral and last-rites expenses of the deceased according to station in life.",
        "• Section 45(2): Executorship and management burdens, including notarial, inventory, and administration costs.",
        "• Section 45(3): Enforceable debts of the deceased.",
        "• Section 46 Priority: Inheritance Creditors are satisfied first; Legatees second; Personal Creditors of Heirs third."
      ]
    };
  }

  return {
    title: "Statutory Debt Settlement Priority (Sections 320 to 325, Indian Succession Act, 1925):",
    items: [
      "(i) Section 320: Funeral and death-bed expenses according to station in life paid in priority to all debts.",
      "(ii) Section 321: Expenses of obtaining Probate or Letters of Administration, and costs of proper administration proceedings.",
      "(iii) Section 322: Wages of labourers, artisans, or domestic servants rendered within three months preceding demise, followed by other statutory priorities.",
      "(iv) Section 323: All other enforceable debts paid equally and rateably out of estate assets.",
      "(v) Section 325: Debts of every description settled before any legacy or bequest is paid or satisfied."
    ]
  };
}
