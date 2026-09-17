/* Shared API Middleware: CORS + Firebase Auth Verification */
const { admin } = require('./firebase');

// Bug #8 Note: This default list is used only when the ALLOWED_ORIGINS env var
// is NOT set on Vercel. If you set ALLOWED_ORIGINS in Vercel's dashboard,
// make sure it includes 'capacitor://localhost' (for Android APK requests)
// otherwise all API calls from the APK will be CORS-blocked.
const DEFAULT_ALLOWED_ORIGINS = 'https://smartwill-india.vercel.app,http://localhost:3000,http://127.0.0.1:5500,capacitor://localhost,http://localhost,https://localhost';

// Capacitor Android origins that are always trusted
// NOTE: Capacitor 6+ uses https://localhost (not capacitor://localhost) as the Android WebView scheme
const CAPACITOR_ORIGINS = new Set(['capacitor://localhost', 'http://localhost', 'https://localhost', 'ionic://localhost']);


/**
 * Sets CORS headers based on allowed origins.
 * Returns true if the request is a preflight OPTIONS request (caller should return early).
 */
function handleCORS(req, res) {
  const allowedOrigins = new Set(
    (process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS)
      .split(',')
      .map(s => s.trim())
  );

  const requestOrigin = req.headers.origin;

  if (!requestOrigin) {
    // Bug #10 Fix: Capacitor Android sometimes omits the Origin header on fetch.
    // In that case we still allow the request and reflect a safe default.
    // We do NOT send Access-Control-Allow-Origin: * because credentials are included.
    res.setHeader('Access-Control-Allow-Origin', 'https://smartwill-india.vercel.app');
  } else if (allowedOrigins.has(requestOrigin) || CAPACITOR_ORIGINS.has(requestOrigin)) {
    // Bug #10 Fix: CRITICAL — must reflect the EXACT requesting origin back,
    // not a hard-coded value. When origin is 'capacitor://localhost' and we
    // return 'https://smartwill-india.vercel.app', the browser rejects the
    // response with a CORS error, causing a network error in the app.
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  } else {
    // Unknown origin — deny CORS (no Access-Control-Allow-Origin set means blocked)
    res.setHeader('Access-Control-Allow-Origin', 'https://smartwill-india.vercel.app');
  }

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24h

  return req.method === 'OPTIONS';
}


/**
 * Enforces POST-only method. Returns true if method is not POST (caller should return early).
 */
function enforcePost(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return true;
  }
  return false;
}

/**
 * Validates Cashfree environment variables are configured.
 * Returns { appId, secretKey } or null (sends 500 response on failure).
 */
function getCashfreeCredentials(res) {
  const appId = process.env.CASHFREE_CLIENT_ID || process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;

  if (!appId || !secretKey) {
    res.status(500).json({ error: 'Server misconfiguration: Payment gateway secrets are not configured.' });
    return null;
  }
  return { appId, secretKey };
}

/**
 * Verifies Firebase ID token from Authorization header.
 * Returns { uid, email } or null (sends 401 response on failure).
 */
async function verifyAuth(req, res) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ') || !admin.apps.length) {
    res.status(401).json({ error: 'Unauthorized: Valid authentication token required.' });
    return null;
  }

  try {
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return { uid: decodedToken.uid, email: decodedToken.email };
  } catch (authError) {
    console.warn('[Auth Warning] ID Token verification failed:', authError.message);
    res.status(401).json({ error: 'Unauthorized: Invalid or expired authentication token.' });
    return null;
  }
}

/**
 * In-memory sliding window rate limiter store.
 * Map<key, Array<timestamp>>
 */
const rateLimitStore = new Map();
let lastPruneTime = Date.now();

function pruneRateLimitStore() {
  const now = Date.now();
  for (const [key, timestamps] of rateLimitStore.entries()) {
    const valid = timestamps.filter(t => now - t < 300000);
    if (valid.length === 0) {
      rateLimitStore.delete(key);
    } else if (valid.length !== timestamps.length) {
      rateLimitStore.set(key, valid);
    }
  }
}

/**
 * Checks and enforces sliding window rate limiting.
 * @param {Object} req
 * @param {Object} res
 * @param {Object} options
 * @param {number} [options.windowMs=60000] - Time window in milliseconds
 * @param {number} [options.max=10] - Maximum allowed requests in the window
 * @param {string} [options.keyPrefix='global'] - Differentiator prefix
 * @param {string} [options.identifier] - Custom identifier (UID or IP)
 * @param {string} [options.message] - Custom user-friendly message
 * @returns {boolean} true if rate limited (429 sent), false if allowed
 */
function checkRateLimit(req, res, options = {}) {
  const windowMs = options.windowMs || 60000;
  const max = options.max || 10;
  const keyPrefix = options.keyPrefix || 'global';

  let id = options.identifier;
  if (!id) {
    const forwarded = req.headers['x-forwarded-for'];
    id = (forwarded ? forwarded.split(',')[0].trim() : null) ||
         req.headers['x-real-ip'] ||
         (req.socket && req.socket.remoteAddress) ||
         'unknown-ip';
  }

  const key = `${keyPrefix}:${id}`;
  const now = Date.now();

  if (now - lastPruneTime > 120000) {
    lastPruneTime = now;
    pruneRateLimitStore();
  }

  let timestamps = rateLimitStore.get(key) || [];
  timestamps = timestamps.filter(t => now - t < windowMs);

  const currentCount = timestamps.length;
  const resetTimeMs = timestamps.length > 0 ? timestamps[0] + windowMs : now + windowMs;
  const retryAfterSec = Math.ceil(Math.max(1000, resetTimeMs - now) / 1000);

  if (currentCount >= max) {
    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetTimeMs / 1000).toString());
    res.setHeader('Retry-After', retryAfterSec.toString());
    res.status(429).json({
      error: 'Too Many Requests',
      message: options.message || 'You are making requests too quickly. Please wait a moment before trying again.',
      retryAfter: retryAfterSec
    });
    return true;
  }

  timestamps.push(now);
  rateLimitStore.set(key, timestamps);

  res.setHeader('X-RateLimit-Limit', max.toString());
  res.setHeader('X-RateLimit-Remaining', Math.max(0, max - timestamps.length).toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil(resetTimeMs / 1000).toString());

  return false;
}

/**
 * Generates a unique request ID for structured logging.
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

function _resetRateLimitStore() {
  rateLimitStore.clear();
  lastPruneTime = Date.now();
}

module.exports = {
  handleCORS,
  enforcePost,
  getCashfreeCredentials,
  verifyAuth,
  generateRequestId,
  checkRateLimit,
  _resetRateLimitStore
};
