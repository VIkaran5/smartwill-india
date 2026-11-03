/**
 * SmartWill India — Legal Engine 2.1
 * Statutory Source Registry & Verification Gate
 * Maintains consolidated statutory authorities, gazettes, and Supreme Court precedents.
 */

export const STATUTORY_SOURCES = {
  GOA_SUCCESSION_ACT: {
    actNumber: "Goa Act 23 of 2016",
    shortTitle: "Goa Succession, Special Notaries and Inventory Proceeding Act, 2012",
    effectiveDate: "2016-12-22",
    officialCitation: "Goa Act 23 of 2016, Official Gazette Series I No. 38",
    keySections: {
      JURISDICTION: "Section 1(4)(a)–(g)",
      COMMORIENTES: "Section 7",
      INDIVISIBLE_INHERITANCE: "Section 16",
      TRANSFER_SPECIFIC_ASSET: "Section 17",
      DEBT_PRIORITY: "Sections 45 & 46",
      SPOUSAL_RESIDENCE: "Section 82",
      LEGITIME: "Section 83 (as substituted by Goa Act 35 of 2023)",
      CALCULATION_BASE: "Section 89",
      COLLATION: "Sections 90 to 97",
      REDUCTION: "Sections 98 to 105",
      ACCRETION_AND_LAPSE: "Sections 170 to 175",
      TESTAMENTARY_SUBSTITUTION: "Sections 213 & 214",
      COMMUNITY_PROPERTY_DISPOSITION: "Section 219",
      SPECIFIC_INHERITANCE_DISPOSITION: "Section 220",
      PRINTED_OPEN_WILL: "Section 333(1)–(8)"
    }
  },
  GOA_AMENDMENT_ACT_2023: {
    actNumber: "Goa Act 35 of 2023",
    shortTitle: "Goa Succession, Special Notaries and Inventory Proceeding (Amendment) Act, 2023",
    effectiveDate: "2023-09-12",
    officialCitation: "Goa Act 35 of 2023, Official Gazette Series I No. 24",
    substitutedSection: "Section 83"
  },
  INDIAN_SUCCESSION_ACT: {
    actNumber: "Act 39 of 1925",
    shortTitle: "Indian Succession Act, 1925",
    keySections: {
      CAPACITY: "Section 59",
      ATTESTATION: "Section 63",
      SCHEDULE_III_HINDU: "Schedule III",
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
      TESTAMENTARY_DISPOSITION: "Section 30",
      SIMULTANEOUS_DEATH: "Section 21"
    }
  },
  INSURANCE_ACT: {
    actNumber: "Act 4 of 1938",
    shortTitle: "Insurance Act, 1938",
    amendment: "Insurance Laws (Amendment) Act, 2015 (Act 5 of 2015)",
    keySections: {
      BENEFICIAL_NOMINEE: "Section 39(7)",
      ASSIGNMENT: "Section 38",
      MWPA_OVERRIDE: "Section 39(12)"
    }
  },
  BANKING_REGULATION_ACT: {
    actNumber: "Act 10 of 1949",
    shortTitle: "Banking Regulation Act, 1949",
    keySections: {
      NOMINATION_DEPOSITS: "Section 45ZA"
    }
  },
  COMPANIES_ACT: {
    actNumber: "Act 18 of 2013",
    shortTitle: "Companies Act, 2013",
    keySections: {
      SECURITIES_NOMINATION: "Section 72"
    }
  },
  INDIAN_TRUSTS_ACT: {
    actNumber: "Act 2 of 1882",
    shortTitle: "Indian Trusts Act, 1882",
    keySections: {
      AUTHORIZED_INVESTMENTS: "Section 20"
    }
  },
  JUDICIAL_PRECEDENTS: {
    JOSE_PAULO_COUTINHO: {
      citation: "(2020) 17 SCC 159",
      bench: "Supreme Court of India (Deepak Gupta & Aniruddha Bose, JJ.)",
      principle: "The Portuguese Civil Code, 1867 / Goa Succession Act operates as a personal law for persons governed by it, with extraterritorial applicability in respect of their estate throughout India."
    },
    SARBATI_DEVI: {
      citation: "(1984) 1 SCC 424",
      bench: "Supreme Court of India",
      principle: "Nomination under Section 39 of Insurance Act does not confer beneficial title; nominee holds funds as trustee for legal heirs (baseline rule, modified for specified relatives by 2015 amendment adding Section 39(7))."
    },
    RAM_CHANDER_TALWAR: {
      citation: "(2010) 10 SCC 671",
      bench: "Supreme Court of India",
      principle: "Nomination under Section 45ZA of Banking Regulation Act, 1949 operates solely as a discharge mechanism for the bank and does not alter the laws of testamentary or intestate succession."
    },
    SHAKTI_YEZDANI: {
      citation: "2023 SCC OnLine SC 1679",
      bench: "Supreme Court of India (Hrishikesh Roy & Manoj Misra, JJ.)",
      principle: "Nomination under Section 72 of Companies Act, 2013 and Depositories Act, 1996 does not confer beneficial ownership or create a third line of succession; nominee holds shares purely as fiduciary custodian."
    },
    SURAJ_LAMP: {
      citation: "(2012) 1 SCC 656",
      bench: "Supreme Court of India",
      principle: "Revenue entries, mutations, and non-registered agreements do not convey marketable title; immovable property transfer requires registered instrument of conveyance."
    }
  }
};
