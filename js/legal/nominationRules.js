/**
 * SmartWill India — Legal Engine 2.1
 * Asset-Specific Nomination Engine
 *
 * Implements precise judicial precedent mapping:
 * - Life Insurance: Sarbati Devi (1984 1 SCC 424) baseline + Insurance Act Section 39(7) statutory beneficial nominee (2015 Amendment).
 * - Bank Deposits: Banking Regulation Act Section 45ZA + Ram Chander Talwar (2010 10 SCC 671).
 * - Demat & Corporate Securities: Companies Act Section 72 + Shakti Yezdani (2023 SCC OnLine SC 1679).
 * - EPF & Gratuity: Statutory family definitions under EPF Scheme 1952 and Payment of Gratuity Act 1972.
 */

export function generateNominationClause(assetType = '', options = {}) {
  const t = (assetType || '').toLowerCase();

  // 1. Life Insurance
  if (t.includes('insurance') || t.includes('lic') || t.includes('policy')) {
    return {
      category: "LIFE_INSURANCE",
      governingStatute: "Section 39(7), Insurance Act, 1938 (as amended by Act 5 of 2015)",
      precedent: "Sarbati Devi v. Usha Devi (1984 1 SCC 424)",
      legalText: "Statutory Beneficial Nominees in Life Insurance: In accordance with Section 39(7) of the Insurance Act, 1938 (as amended by the Insurance Laws (Amendment) Act, 2015), which modified the baseline rule laid down in Sarbati Devi v. Usha Devi (1984 1 SCC 424), where any life insurance policy taken on my life nominates my spouse, child, or parent, such nominees are recognized by statute as 'Beneficial Nominees' entitled to beneficially receive and own the policy proceeds. The bequests in this Will stand harmonized with and confirm said statutory beneficial entitlement. Policies under Section 6 of the Married Women's Property Act, 1874 remain preserved as statutory trusts for the benefit of the named wife and children to the exclusion of all other creditors."
    };
  }

  // 2. Bank Accounts & Term Deposits
  if (t.includes('bank') || t.includes('deposit') || t.includes('fd') || t.includes('savings') || t.includes('current')) {
    return {
      category: "BANK_DEPOSITS",
      governingStatute: "Section 45ZA, Banking Regulation Act, 1949",
      precedent: "Ram Chander Talwar v. Devender Kumar Talwar (2010 10 SCC 671)",
      legalText: "Custodial Nominees in Bank Deposits: Under Section 45ZA of the Banking Regulation Act, 1949 and binding Supreme Court precedent in Ram Chander Talwar v. Devender Kumar Talwar (2010 10 SCC 671), nomination in respect of my bank accounts and fixed deposits operates exclusively as a statutory discharge mechanism for the banking institution. Such nominees hold the funds purely as fiduciary custodians in trust for the testamentary beneficiaries named under this Will, and the beneficial ownership shall devolve strictly as directed herein."
    };
  }

  // 3. Demat Accounts, Shares & Mutual Funds
  if (t.includes('demat') || t.includes('share') || t.includes('stock') || t.includes('mutual') || t.includes('securities')) {
    return {
      category: "SECURITIES_DEMAT",
      governingStatute: "Section 72, Companies Act, 2013 & Depositories Act, 1996",
      precedent: "Shakti Yezdani v. Jayanand Jayant Salgaonkar (2023 SCC OnLine SC 1679)",
      legalText: "Fiduciary Custodians in Demat Securities & Corporate Holdings: Under Section 72 of the Companies Act, 2013, the Depositories Act, 1996, and the authoritative decision of the Supreme Court in Shakti Yezdani v. Jayanand Jayant Salgaonkar (2023 SCC OnLine SC 1679), nomination in respect of shares, Demat holdings, and mutual fund units does not confer beneficial ownership or create a third line of succession. Any nominee receiving such securities does so strictly as a fiduciary trustee and custodian for the beneficial legatees designated under this Will."
    };
  }

  // 4. Public Provident Fund (PPF) - Separate from EPF
  if (t.includes('ppf') || t.includes('public provident')) {
    return {
      category: "PUBLIC_PROVIDENT_FUND",
      governingStatute: "Government Savings Promotion Act, 1873 & Public Provident Fund Scheme, 2019",
      legalRule: "Paragraph 14 of Public Provident Fund Scheme, 2019",
      legalText: "Public Provident Fund (PPF): Governed by the Government Savings Promotion Act, 1873 and the Public Provident Fund Scheme, 2019. Under Paragraph 14 of the PPF Scheme, 2019, on the death of the account holder, the account shall be closed and the balance deposited paid to the nominee or legal heir in accordance with statutory procedures, and the beneficial rights under this Will shall govern the entitlement of such proceeds."
    };
  }

  // 5. Employees' Provident Fund (EPF)
  if (t.includes('epf') || (t.includes('provident') && !t.includes('public')) || t.includes('employees provident')) {
    return {
      category: "EMPLOYEES_PROVIDENT_FUND",
      governingStatute: "Employees' Provident Funds and Miscellaneous Provisions Act, 1952 & EPF Scheme, 1952",
      legalText: "Employees' Provident Fund (EPF): Nominations operate strictly subject to the definition of 'family' under the Employees' Provident Funds Scheme, 1952. Testamentary dispositions of EPF accumulations are valid only to the extent permitted by the statutory scheme."
    };
  }

  // 6. Gratuity
  if (t.includes('gratuity')) {
    return {
      category: "PAYMENT_OF_GRATUITY",
      governingStatute: "Payment of Gratuity Act, 1972 (Section 6)",
      legalText: "Gratuity Entitlements: Under Section 6 of the Payment of Gratuity Act, 1972, nomination must be in favour of one or more members of the employee's statutory 'family' where a family exists. Dispositions herein stand harmonized with said statutory mandate."
    };
  }

  // 7. Pensions
  if (t.includes('pension')) {
    return {
      category: "PENSION_AND_FAMILY_PENSION",
      governingStatute: "Central Civil Services (Pension) Rules / Applicable State Pension Rules",
      legalText: "Pensions and Family Pension: Statutory family pensions devolve by operation of governing statutory service pension rules, and any commuted pension arrears shall be received for the estate as provided under this Will."
    };
  }

  // General default fallback
  return {
    category: "GENERAL_FINANCIAL_ASSET",
    governingStatute: "Applicable Financial Sector Legislation",
    legalText: "Where the law treats a nominee as a recipient for transmission or procedural discharge without conferring beneficial ownership, the beneficial entitlement shall be determined strictly in accordance with this Will."
  };
}
