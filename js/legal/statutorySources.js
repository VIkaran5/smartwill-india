/**
 * SmartWill India — Legal Engine 2.1
 * Statutory Source Registry & Verification Gate
 * Maintains verified statutory authorities, gazette notifications, and Supreme Court precedents.
 */

export const STATUTORY_SOURCES = {
  GOA_SUCCESSION_ACT: {
    actNumber: "Goa Act 23 of 2016",
    shortTitle: "Goa Succession, Special Notaries and Inventory Proceeding Act, 2012",
    effectiveDate: "2016-12-22",
    gazetteNotification: "Official Gazette Series I No. 38 dated 22-12-2016",
    keySections: {
      JURISDICTION_CLAUSES: {
        CLAUSE_A: "Section 1(4)(a): Persons governed by Portuguese Civil Code of 1867 before 20 Dec 1961",
        CLAUSE_B: "Section 1(4)(b): Persons born in Goa to parents governed by the said Code",
        CLAUSE_C: "Section 1(4)(c): Persons born outside Goa to parents governed by the said Code, unless opting out within prescribed time",
        CLAUSE_D: "Section 1(4)(d): Persons born in Goa to parents governed by corresponding laws in rest of India, with permanent residence and statutory election",
        CLAUSE_E: "Section 1(4)(e): Persons born in Goa to foreign-citizen parents fulfilling Citizenship Act conditions and electing coverage",
        CLAUSE_F: "Section 1(4)(f): Persons born in Goa of unknown parents or unknown nationality",
        CLAUSE_G: "Section 1(4)(g): Persons adopted by parents governed by the said Code or Act"
      },
      COMMORIENTES: "Section 7: Presumption of simultaneous death with zero inter-se transmission in common calamity",
      INDIVISIBLE_INHERITANCE: "Section 16: Inheritance undivided until partition",
      TRANSFER_SPECIFIC_ASSET: "Section 17: Legal consequence of transfer of specific inheritance assets",
      CHARGES_ON_INHERITANCE: "Section 45: Funeral expenses, executorship and management burdens, and debts",
      CREDITOR_LEGATEE_PRIORITY: "Section 46: Priority of inheritance creditors over legatees, and legatees over personal creditors of heirs",
      SPOUSAL_RESIDENCE: "Section 82: Preferential right of habitation in family dwelling house and use of household movables",
      LEGITIME: "Section 83 (as substituted by Goa Act 35 of 2023)",
      CALCULATION_BASE: "Section 89: Net assets at death (Assets - Debts) + Value of ALL assets gifted during lifetime evaluated at opening of inheritance (Section 89(2))",
      COLLATION: "Sections 90 to 109: Collation of advancements by descendants into the legitime pool",
      REDUCTION: "Sections 110 to 121: Reduction of legacies and inter vivos gifts impairing the legitime (Section 111 legacies first; Section 113 inter vivos gifts reverse order; Section 114 pro-rata)",
      COMMUNITY_PROPERTY_DISPOSITION: "Section 219: Prohibition on disposing of specific community assets, with 4 statutory exceptions",
      SPECIFIC_INHERITANCE_DISPOSITION: "Section 220: Disposition of specific unpartitioned inheritance assets void",
      PRINTED_OPEN_WILL: "Section 333(1)–(8): Printed Open Will statutory formalities, margins, signatures, and Special Notary record"
    }
  },
  GOA_AMENDMENT_ACT_2023: {
    actNumber: "Goa Act 35 of 2023",
    shortTitle: "Goa Succession, Special Notaries and Inventory Proceeding (Amendment) Act, 2023",
    effectiveDate: "2023-09-12",
    gazetteNotification: "Official Gazette Series I No. 24 dated 14-09-2023",
    substitutedSection: "Section 83 (Forced shares: Descendants 50%, Spouse only 100%, Parents only 100%, Ascendants 33.33%)"
  },
  INDIAN_SUCCESSION_ACT: {
    actNumber: "Act 39 of 1925",
    shortTitle: "Indian Succession Act, 1925",
    keySections: {
      PART_VI_APPLICATION: "Sections 57 & 58: Scope and application of Part VI",
      CAPACITY: "Section 59",
      EXECUTION_ATTESTATION: "Section 63",
      PARSI_SUCCESSION: "Sections 50 to 56 (Intestate) & Part VI with specific Parsi provisions",
      SCHEDULE_III_HINDU: "Schedule III: Statutory restrictions for Hindu, Buddhist, Jain, Sikh wills",
      LAPSE: "Section 105",
      LINEAL_DESCENDANTS_ANTI_LAPSE: "Section 109",
      VESTING: "Section 119",
      DEBT_PRIORITY: "Sections 320 to 325"
    }
  },
  HINDU_SUCCESSION_ACT: {
    actNumber: "Act 30 of 1956",
    shortTitle: "Hindu Succession Act, 1956",
    keySections: {
      TESTAMENTARY_DISPOSITION: "Section 30: Testamentary power over self-acquired and coparcenary interest",
      SIMULTANEOUS_DEATH: "Section 21: Presumption of survivorship (younger survives elder)"
    }
  },
  MUSLIM_PERSONAL_LAW: {
    actNumber: "Act 26 of 1937",
    shortTitle: "Muslim Personal Law (Shariat) Application Act, 1937",
    principles: {
      HANAFI_SUNNI: "Bequest to non-heir valid up to 1/3 without consent; bequest to heir or exceeding 1/3 requires consent of all heirs post-demise",
      SHIA_ITHNA_ASHARI: "Bequest up to 1/3 valid whether to heir or non-heir; bequest exceeding 1/3 requires heir consent"
    }
  },
  INSURANCE_ACT: {
    actNumber: "Act 4 of 1938",
    shortTitle: "Insurance Act, 1938",
    amendment: "Insurance Laws (Amendment) Act, 2015 (Act 5 of 2015)",
    keySections: {
      BENEFICIAL_NOMINEE: "Section 39(7): Beneficial entitlement for spouse, parent, or children",
      MWPA_OVERRIDE: "Section 39(12): Preserves Married Women's Property Act, 1874 trust policies"
    }
  },
  BANKING_REGULATION_ACT: {
    actNumber: "Act 10 of 1949",
    shortTitle: "Banking Regulation Act, 1949",
    keySections: {
      NOMINATION: "Section 45ZA: Fiduciary discharge mechanism for banking companies"
    }
  },
  COMPANIES_ACT: {
    actNumber: "Act 18 of 2013",
    shortTitle: "Companies Act, 2013",
    keySections: {
      SECURITIES_NOMINATION: "Section 72: Transmission facilitation without conferring beneficial ownership"
    }
  },
  INDIAN_TRUSTS_ACT: {
    actNumber: "Act 2 of 1882",
    shortTitle: "Indian Trusts Act, 1882",
    keySections: {
      INVESTMENTS: "Section 20 (as amended): Investments authorized by the trust instrument or specified by Central Government notification"
    }
  },
  JUDICIAL_PRECEDENTS: {
    JOSE_PAULO_COUTINHO: {
      citation: "(2020) 17 SCC 159",
      principle: "The Portuguese Civil Code, 1867 / Goa Succession Act operates as personal law for persons governed by it, with extraterritorial applicability in respect of their estate throughout India."
    },
    SARBATI_DEVI: {
      citation: "(1984) 1 SCC 424",
      principle: "Nomination under Section 39 of Insurance Act does not confer beneficial title; nominee holds funds as trustee for legal heirs (baseline pre-2015 doctrine)."
    },
    RAM_CHANDER_TALWAR: {
      citation: "(2010) 10 SCC 671",
      principle: "Nomination under Section 45ZA of Banking Regulation Act, 1949 operates solely as a discharge mechanism for the bank and does not alter the laws of succession."
    },
    SHAKTI_YEZDANI: {
      citation: "2023 SCC OnLine SC 1679",
      principle: "Nomination under Section 72 of Companies Act, 2013 and Depositories Act does not confer beneficial title; nominee holds shares purely as fiduciary custodian."
    },
    SURAJ_LAMP: {
      citation: "(2012) 1 SCC 656",
      principle: "Revenue mutations, Form I & XIV, and agreements to sell do not convey title; immovable property conveyance requires registered deed."
    }
  }
};
