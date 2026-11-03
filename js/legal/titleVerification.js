/**
 * SmartWill India — Legal Engine 2.1
 * Property Title Verification & Partition Guard
 *
 * Implements evidentiary title verification for immovable assets:
 * 1. Form I & XIV, mutation extracts, and ECs are treated as corroborative records,
 *    not standalone proof of marketable title (Suraj Lamp (2012) 1 SCC 656).
 * 2. Standalone proof requires registered title deeds (Sale Deed, Partition Deed, Grant).
 * 3. Enforces Section 16, 17, and 220 of Goa Act 23 of 2016 for unpartitioned vs partitioned inheritances.
 */

export const TITLE_DOCUMENT_TYPES = {
  REGISTERED_SALE_DEED: "REGISTERED_SALE_DEED",
  REGISTERED_PARTITION_DEED: "REGISTERED_PARTITION_DEED",
  FINAL_INVENTORY_DECREE: "FINAL_INVENTORY_DECREE",
  GOVERNMENT_GRANT: "GOVERNMENT_GRANT",
  REGISTERED_GIFT_DEED: "REGISTERED_GIFT_DEED",
  DEED_OF_SUCCESSION_HABILITACAO: "DEED_OF_SUCCESSION_HABILITACAO",
  FORM_I_AND_XIV_ONLY: "FORM_I_AND_XIV_ONLY",
  MUTATION_EXTRACT_ONLY: "MUTATION_EXTRACT_ONLY",
  UNVERIFIED_DECLARATION: "UNVERIFIED_DECLARATION"
};

/**
 * Audits property title and determines whether a specific testamentary bequest is legally permissible.
 * @param {Object} asset - The immovable property asset
 * @param {Object} options - Jurisdiction & regime options
 * @returns {Object} { isValidTitle, isCorroborativeOnly, isPartitioned, canBequestSpecificAsset, statusText, blockers }
 */
export function verifyPropertyTitle(asset = {}, options = {}) {
  const isGoa = Boolean(options.isGoa);
  const rawDesc = `${asset.desc || ''} ${asset.type || ''}`.toLowerCase();
  const isImmovable = rawDesc.includes('property') || rawDesc.includes('plot') || rawDesc.includes('land') || rawDesc.includes('flat') || rawDesc.includes('house') || rawDesc.includes('orchard');

  if (!isImmovable) {
    return {
      isValidTitle: true,
      isImmovable: false,
      canBequestSpecificAsset: true,
      blockers: []
    };
  }

  const blockers = [];
  const details = asset.details || {};
  const docType = details.titleDocType || asset.titleDocType;
  const isInheritedOrAncestral = Boolean(asset.isInherited || rawDesc.includes('ancestral') || details.isInherited);
  const hasRegisteredPartition = Boolean(details.hasPartitionDeed || asset.hasRegisteredPartitionDeed || docType === TITLE_DOCUMENT_TYPES.REGISTERED_PARTITION_DEED || docType === TITLE_DOCUMENT_TYPES.FINAL_INVENTORY_DECREE);

  // Check 1: Explicit primary title deed required.
  // CRITICAL: A mere typed registration number string NEVER establishes title without a verified primary deed category.
  const hasRegisteredPrimaryDeed = docType === TITLE_DOCUMENT_TYPES.REGISTERED_SALE_DEED ||
    docType === TITLE_DOCUMENT_TYPES.REGISTERED_PARTITION_DEED ||
    docType === TITLE_DOCUMENT_TYPES.FINAL_INVENTORY_DECREE ||
    docType === TITLE_DOCUMENT_TYPES.GOVERNMENT_GRANT ||
    docType === TITLE_DOCUMENT_TYPES.REGISTERED_GIFT_DEED;

  // Check 1B: Deed of Succession / Habilitação de Herdeiros
  if (docType === TITLE_DOCUMENT_TYPES.DEED_OF_SUCCESSION_HABILITACAO) {
    if (!hasRegisteredPartition) {
      blockers.push("HABILITAÇÃO DE HERDEIROS VERIFICATION: A Deed of Succession (Habilitação de Herdeiros) establishes heirship only; it does not allot specific land parcels or flats to individual co-heirs. Under Section 220 of Goa Act 23 of 2016, disposition of a specific physical parcel of an unpartitioned inheritance is prohibited. An undivided hereditary share requires a distinct advocate title-review pathway.");
      return {
        isValidTitle: true,
        isCorroborativeOnly: false,
        isPartitioned: false,
        canBequestSpecificAsset: false,
        requiresLegalReviewForUndividedShare: true,
        statusText: "HEIRSHIP ESTABLISHED BUT SPECIFIC ALLOTMENT UNPARTITIONED",
        blockers
      };
    }
  }

  if (!hasRegisteredPrimaryDeed) {
    blockers.push("PROPERTY TITLE VERIFICATION REQUIRED: Form I & XIV extracts, mutation entries, and municipal tax receipts constitute corroborative fiscal records but do not establish standalone legal title (Suraj Lamp (2012) 1 SCC 656). A registered root title deed (Sale Deed, Partition Deed, or Grant) is mandatory.");
    return {
      isValidTitle: false,
      isCorroborativeOnly: true,
      isPartitioned: hasRegisteredPartition,
      canBequestSpecificAsset: false,
      statusText: "PROPERTY TITLE VERIFICATION REQUIRED",
      blockers
    };
  }

  // Check 1C: Document Verification Gate (ChatGPT Forensic Finding)
  // Selecting a deed type alone without documentary verification cannot establish marketable title.
  const isDocumentVerified = Boolean(
    asset.isDocumentVerified === true ||
    details.isDocumentVerified === true ||
    asset.titleVerificationRecord?.isVerified === true ||
    details.titleVerificationRecord?.isVerified === true ||
    (details.registrationNumber && (details.subRegistrarOffice || details.registrationYear || details.registrationDate)) ||
    (asset.registrationNumber && (asset.subRegistrarOffice || asset.registrationYear || asset.registrationDate))
  );

  if (!isDocumentVerified) {
    blockers.push(`UNVERIFIED ROOT TITLE RECORD: While primary deed type '${docType}' is designated, the document has not been verified against registered records or certified copy (isDocumentVerified is unconfirmed). A mere dropdown or text selection without documentary verification cannot establish marketable title.`);
    return {
      isValidTitle: false,
      isCorroborativeOnly: false,
      isPartitioned: hasRegisteredPartition,
      canBequestSpecificAsset: false,
      statusText: "ROOT TITLE DOCUMENT UNVERIFIED",
      blockers
    };
  }

  // Check 2: Inherited / Ancestral asset under Goa Act (Sections 16 & 220)
  if (isGoa && isInheritedOrAncestral) {
    if (!hasRegisteredPartition) {
      blockers.push("UNDER SECTION 16 & SECTION 220 OF GOA ACT 23 OF 2016: An unpartitioned inheritance remains indivisible until formal partition. Disposition of a specific physical parcel (e.g. specific orchard plot) prior to allotment in partition is prohibited by law. Only the testator's undivided hereditary fraction can be bequeathed after qualified legal review.");
      return {
        isValidTitle: true, // Root deed exists, but inheritance is unpartitioned
        isCorroborativeOnly: false,
        isPartitioned: false,
        canBequestSpecificAsset: false,
        statusText: "UNPARTITIONED INHERITANCE: SPECIFIC BEQUEST PROHIBITED",
        blockers
      };
    }
  }

  // Valid, partitioned or self-acquired title deed established
  return {
    isValidTitle: true,
    isCorroborativeOnly: false,
    isPartitioned: true,
    canBequestSpecificAsset: true,
    statusText: "TITLE VERIFIED",
    blockers: []
  };
}
