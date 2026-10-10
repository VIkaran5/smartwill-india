/**
 * api/submit-review.js
 * SmartWill India — Serverless Customer Review & Feedback Endpoint
 */

const { db } = require('./firebase');
const { handleCORS, enforcePost, generateRequestId, checkRateLimit } = require('./middleware');

module.exports = async function handler(req, res) {
  // 1. CORS
  if (handleCORS(req, res)) return res.status(200).end();
  if (enforcePost(req, res)) return;

  // 2. Rate Limiting (10 requests per minute per IP)
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (checkRateLimit(req, res, {
    windowMs: 60000,
    max: 10,
    keyPrefix: 'submit-review',
    identifier: clientIp,
    message: 'Too many submissions. Please try again shortly.'
  })) return;

  try {
    const { rating, tags, comment, orderId, email } = req.body || {};
    const parsedRating = parseInt(rating, 10);

    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: 'Valid rating between 1 and 5 is required.' });
    }

    const reviewDoc = {
      rating: parsedRating,
      tags: Array.isArray(tags) ? tags.slice(0, 5) : [],
      comment: typeof comment === 'string' ? comment.trim().slice(0, 500) : '',
      orderId: typeof orderId === 'string' ? orderId.slice(0, 100) : 'DIRECT',
      email: typeof email === 'string' ? email.slice(0, 150) : null,
      createdAt: new Date().toISOString(),
      platform: 'web_post_payment'
    };

    if (db) {
      await db.collection('reviews').add(reviewDoc);
    }

    return res.status(200).json({ success: true, message: 'Review successfully recorded.' });
  } catch (error) {
    console.error('Submit review error:', error);
    return res.status(500).json({ error: 'Internal server error while saving review.' });
  }
};
