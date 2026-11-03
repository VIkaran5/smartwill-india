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

  // 4. Statutory Retirement & Social Security (EPF, PPF, Gratuity)
  if (t.includes('epf') || t.includes('pf') || t.includes('provident') || t.includes('gratuity') || t.includes('pension')) {
    return {
      category: "STATUTORY_BENEFITS",
      governingStatute: "Employees' Provident Funds Scheme, 1952 & Payment of Gratuity Act, 1972",
      legalText: "Statutory Retirement Benefits & Social Security: In respect of my Provident Fund (EPF/PPF), Gratuity, and statutory retirement entitlements, nominations shall operate in accordance with the mandatory statutory definitions of 'family' under the Employees' Provident Funds Scheme, 1952 and the Payment of Gratuity Act, 1972, with surplus or unencumbered testamentary dispositions harmonized with this Will to the extent legally permissible."
    };
  }

  // General default fallback
  return {
    category: "GENERAL_FINANCIAL_ASSET",
    governingStatute: "Applicable Financial Sector Legislation",
    legalText: "Where the law treats a nominee as a recipient for transmission or procedural discharge without conferring beneficial ownership, the beneficial entitlement shall be determined strictly in accordance with this Will."
  };
}
