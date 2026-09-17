/* Decoupled Cloud Draft Synchronization Service for SmartWill India */
import { getState, updateState } from '../state/store.js';
import { serializeDraft, hashDraft, migrateDraft } from './draftSerializer.js';
import { logger } from './logger.js';
import { showToast } from '../ui/toast.js';

let activeUser = null;
let firestoreDb = null;
let snapshotUnsubscribe = null;
let syncDebounceTimer = null;
let lastSyncedHash = '';
let isApplyingRemoteUpdate = false;
let syncStatus = 'local'; // 'synced' | 'syncing' | 'offline' | 'failed' | 'local'

const QUEUE_KEY = 'smartwill_sync_queue';

export function initCloudSync(db) {
  firestoreDb = db;

  // Listen to state changes from state/store.js
  window.addEventListener('smartwill_state_change', (e) => {
    if (isApplyingRemoteUpdate || (e.detail && e.detail.isRemoteUpdate)) {
      return; // Snapshot Loop Guard
    }
    onLocalStateChanged();
  });

  // Flush triggers on visibility change & unload
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushPendingSync();
    }
  });

  window.addEventListener('beforeunload', () => {
    flushPendingSync();
  });

  // Offline / Online reconnect auto-flush
  window.addEventListener('online', () => {
    logger.info('Network connection restored. Flushing offline sync queue...');
    flushOfflineQueue();
  });

  window.addEventListener('offline', () => {
    setSyncStatus('offline');
  });

  updateSyncBadge();
}

export function initUserSync(user) {
  activeUser = user;
  if (!user || !firestoreDb) {
    if (snapshotUnsubscribe) {
      snapshotUnsubscribe();
      snapshotUnsubscribe = null;
    }
    setSyncStatus('local');
    return;
  }

  // Attach realtime onSnapshot listener
  const docRef = firestoreDb.collection('users').doc(user.uid).collection('drafts').doc('latest');

  if (snapshotUnsubscribe) snapshotUnsubscribe();

  snapshotUnsubscribe = docRef.onSnapshot((doc) => {
    if (!doc.exists) return;
    const remoteData = doc.data() || {};
    const migratedRemote = migrateDraft(remoteData);

    const localState = getState();
    const localSerialized = serializeDraft(localState);

    const remoteTime = (remoteData.updatedAtServer && remoteData.updatedAtServer.toMillis) 
      ? remoteData.updatedAtServer.toMillis() 
      : (remoteData.updatedAtClient || 0);
    
    const localTime = localSerialized ? (localSerialized.updatedAtClient || 0) : 0;

    // Conflict Resolution: Newest Timestamp Wins
    if (remoteTime > localTime && remoteData.contentHash !== lastSyncedHash) {
      logger.info('Applying newer remote draft from cloud...');
      isApplyingRemoteUpdate = true;
      try {
        updateState({
          currentStep: migratedRemote.currentStep || 1,
          personal: migratedRemote.personal || {},
          assets: migratedRemote.assets || [],
          beneficiaries: migratedRemote.beneficiaries || [],
          executor: migratedRemote.executor || {}
        }, true);
        lastSyncedHash = migratedRemote.contentHash || hashDraft(migratedRemote);
        setSyncStatus('synced');
      } finally {
        isApplyingRemoteUpdate = false;
      }
    }
  }, (err) => {
    logger.warn('Cloud Firestore sync listener note:', err.message || err);
    if (err && (err.code === 'permission-denied' || err.code === 'unimplemented')) {
      setSyncStatus('local');
    }
  });

  // Flush any pending offline queue for this user
  flushOfflineQueue();
}

function onLocalStateChanged() {
  if (!activeUser || !firestoreDb) {
    setSyncStatus('local');
    return;
  }

  const state = getState();
  const serialized = serializeDraft(state);
  if (!serialized) return;

  if (serialized.contentHash === lastSyncedHash) {
    return; // Skip redundant upload if content hasn't changed
  }

  setSyncStatus('syncing');

  if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(() => {
    uploadDraftToCloud(serialized);
  }, 1000);
}

function flushPendingSync() {
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = null;
    const state = getState();
    const serialized = serializeDraft(state);
    if (serialized && serialized.contentHash !== lastSyncedHash) {
      uploadDraftToCloud(serialized);
    }
  }
}

async function uploadDraftToCloud(serialized) {
  if (!activeUser || !firestoreDb) return;

  if (!navigator.onLine) {
    queueOfflineSync(serialized);
    setSyncStatus('offline');
    return;
  }

  const docRef = firestoreDb.collection('users').doc(activeUser.uid).collection('drafts').doc('latest');

  const payload = {
    ...serialized,
    updatedAtServer: window.firebase.firestore.FieldValue.serverTimestamp()
  };

  const delays = [0, 1000, 2000, 4000];
  let success = false;

  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (delays[attempt] > 0) {
      await new Promise(r => setTimeout(r, delays[attempt]));
    }

    try {
      await docRef.set(payload, { merge: true });
      lastSyncedHash = serialized.contentHash;
      success = true;
      setSyncStatus('synced');
      break;
    } catch (err) {
      logger.warn(`Cloud draft upload attempt ${attempt + 1} failed`, err);
    }
  }

  if (!success) {
    queueOfflineSync(serialized);
    setSyncStatus('failed');
  }
}

function queueOfflineSync(serialized) {
  try {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    queue.push({
      uid: activeUser ? activeUser.uid : null,
      serialized: serialized,
      timestamp: Date.now()
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-5))); // Keep last 5 queued items
  } catch (e) {
    logger.warn('Failed to queue offline sync', e);
  }
}

async function flushOfflineQueue() {
  if (!navigator.onLine || !activeUser || !firestoreDb) return;

  try {
    const rawQueue = localStorage.getItem(QUEUE_KEY);
    if (!rawQueue) return;

    const queue = JSON.parse(rawQueue);
    if (!Array.isArray(queue) || queue.length === 0) return;

    setSyncStatus('syncing');

    const lastItem = queue[queue.length - 1];
    if (lastItem && lastItem.serialized) {
      await uploadDraftToCloud(lastItem.serialized);
    }

    localStorage.removeItem(QUEUE_KEY);
  } catch (e) {
    logger.warn('Error flushing offline queue', e);
  }
}

function setSyncStatus(status) {
  syncStatus = status;
  updateSyncBadge();
}

function updateSyncBadge() {
  const badges = document.querySelectorAll('.cloud-sync-badge');
  badges.forEach(badge => {
    switch (syncStatus) {
      case 'synced':
        badge.innerHTML = `<span style="color:#10b981; font-weight:600; font-size:0.75rem;">☁️ Synced</span>`;
        break;
      case 'syncing':
        badge.innerHTML = `<span style="color:#3b82f6; font-weight:600; font-size:0.75rem;">⏳ Syncing...</span>`;
        break;
      case 'offline':
        badge.innerHTML = `<span style="color:#f59e0b; font-weight:600; font-size:0.75rem;">⚠️ Offline (Queued)</span>`;
        break;
      case 'failed':
        badge.innerHTML = `<span style="color:#f43f5e; font-weight:600; font-size:0.75rem;">❌ Sync Failed</span>`;
        break;
      default:
        badge.innerHTML = `<span style="color:rgba(255,255,255,0.6); font-weight:500; font-size:0.75rem;">✓ Local Only</span>`;
    }
  });
}
