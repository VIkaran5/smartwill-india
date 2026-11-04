/**
 * SmartWill India — Statutory Evidence Constants
 * 
 * Defines authorized statutory reviewer roles, Bar Council enrollment format,
 * and valid statutory document types under Indian succession laws.
 * 
 * Version: 2.1.3 (Revision 12 Forensic Standard)
 */

// Recognized statutory reviewer roles
export const AUTHORIZED_REVIEWER_ROLES = [
  'ADVOCATE',
  'HIGH_COURT_ADVOCATE',
  'SPECIAL_NOTARY',
  'CIVIL_REGISTRAR',
  'SUB_REGISTRAR',
  'GOVERNMENT_AUTHORITY'
];

// Bar Council Enrollment regex: e.g., MAH/123/2010, GOA/456/2005, D/789/2015, UP/112/1990
export const BAR_ENROLLMENT_REGEX = /^[A-Z]{1,6}\/\d{1,8}\/\d{4}$/;

// Statutory document types for land classification (strictly excludes generic civil records)
export const VALID_LAND_CLASSIFICATION_DOC_TYPES = [
  'REVENUE_SANAD_NON_AGRICULTURAL',
  'CONVERSION_CERTIFICATE',
  'TOWN_PLANNING_ZONE_CERTIFICATE',
  'NA_CONVERSION_ORDER'
];

// Statutory document types for historical territory (strictly excludes generic personal civil/domicile records)
export const VALID_PROPERTY_TERRITORY_DOC_TYPES = [
  'PROPERTY_SURVEY_RECORD',
  'TITLE_DEED_REGISTERED',
  'CTS_PROPERTY_CARD',
  'MUNICIPAL_ASSESSMENT_RECORD',
  'REVENUE_RECORD'
];

export const EMPTY_FILE_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
export const ALL_ZEROS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
