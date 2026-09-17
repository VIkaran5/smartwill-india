/* Draft Serializer, Versioning & Migration Service for SmartWill India */

export const CURRENT_SCHEMA_VERSION = 4;

export function getDeviceId() {
  let devId = localStorage.getItem('smartwill_device_id');
  if (!devId) {
    devId = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    localStorage.setItem('smartwill_device_id', devId);
  }
  return devId;
}

export function serializeDraft(state) {
  if (!state) return null;

  const cleanPersonal = {
    fullName: state.personal?.fullName || '',
    dob: state.personal?.dob || '',
    gender: state.personal?.gender || 'Male',
    religion: state.personal?.religion || 'Hindu',
    govtIdType: state.personal?.govtIdType || 'PAN Card',
    govtIdDigits: state.personal?.govtIdDigits || '',
    phone: state.personal?.phone || '',
    email: state.personal?.email || '',
    addressLine1: state.personal?.addressLine1 || '',
    addressCity: state.personal?.addressCity || '',
    addressState: state.personal?.addressState || '',
    addressPincode: state.personal?.addressPincode || ''
  };

  const cleanAssets = Array.isArray(state.assets) ? state.assets.map(a => ({
    id: a.id,
    type: a.type || 'Bank Account / FD',
    desc: a.desc || '',
    value: a.value || ''
  })) : [];

  const cleanBeneficiaries = Array.isArray(state.beneficiaries) ? state.beneficiaries.map(b => ({
    id: b.id,
    name: b.name || '',
    relation: b.relation || 'Spouse',
    phone: b.phone || '',
    idType: b.idType || 'PAN Card',
    idDigits: b.idDigits || '',
    allocations: b.allocations || {}
  })) : [];

  const cleanExecutor = {
    name: state.executor?.name || '',
    relation: state.executor?.relation || ''
  };

  const payload = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    draftVersion: (state.draftVersion || 0) + 1,
    deviceId: getDeviceId(),
    updatedAtClient: Date.now(),
    currentStep: state.currentStep || 1,
    personal: cleanPersonal,
    assets: cleanAssets,
    beneficiaries: cleanBeneficiaries,
    executor: cleanExecutor
  };

  payload.contentHash = hashDraft(payload);
  return payload;
}

export function hashDraft(payload) {
  if (!payload) return '';
  const str = JSON.stringify({
    p: payload.personal,
    a: payload.assets,
    b: payload.beneficiaries,
    e: payload.executor
  });
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export function migrateDraft(rawDraft) {
  if (!rawDraft) return null;
  let draft = { ...rawDraft };
  const version = draft.schemaVersion || 1;

  if (version < 4) {
    draft.schemaVersion = CURRENT_SCHEMA_VERSION;
    if (!draft.personal) draft.personal = {};
    if (!draft.assets) draft.assets = [];
    if (!draft.beneficiaries) draft.beneficiaries = [];
    if (!draft.executor) draft.executor = {};
  }

  return draft;
}
