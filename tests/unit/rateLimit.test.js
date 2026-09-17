import { describe, it, expect, beforeEach } from 'vitest';
import middleware from '../../api/middleware.js';
const { checkRateLimit, _resetRateLimitStore } = middleware;

function createMockReqRes(headers = {}) {
  const req = {
    headers: { ...headers },
    socket: { remoteAddress: '127.0.0.1' }
  };
  const resHeaders = {};
  const res = {
    statusCode: 200,
    headers: resHeaders,
    setHeader(k, v) {
      resHeaders[k] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return { req, res };
}

describe('checkRateLimit (Sliding Window)', () => {
  beforeEach(() => {
    _resetRateLimitStore();
  });

  it('allows requests within limit and sets RateLimit headers', () => {
    const { req, res } = createMockReqRes();
    const limited = checkRateLimit(req, res, { max: 3, windowMs: 60000, keyPrefix: 'test' });

    expect(limited).toBe(false);
    expect(res.statusCode).toBe(200);
    expect(res.headers['X-RateLimit-Limit']).toBe('3');
    expect(res.headers['X-RateLimit-Remaining']).toBe('2');
    expect(res.headers['X-RateLimit-Reset']).toBeDefined();
  });

  it('blocks request when exceeding max limit and returns HTTP 429', () => {
    const opts = { max: 2, windowMs: 60000, keyPrefix: 'test-block', identifier: 'user_123' };

    // Request 1
    const r1 = createMockReqRes();
    expect(checkRateLimit(r1.req, r1.res, opts)).toBe(false);

    // Request 2
    const r2 = createMockReqRes();
    expect(checkRateLimit(r2.req, r2.res, opts)).toBe(false);

    // Request 3 (exceeds max 2)
    const r3 = createMockReqRes();
    const limited = checkRateLimit(r3.req, r3.res, opts);
    expect(limited).toBe(true);
    expect(r3.res.statusCode).toBe(429);
    expect(r3.res.body.error).toBe('Too Many Requests');
    expect(r3.res.headers['X-RateLimit-Remaining']).toBe('0');
    expect(r3.res.headers['Retry-After']).toBeDefined();
  });

  it('isolates rate limits by user identifier', () => {
    const optsUser1 = { max: 1, windowMs: 60000, keyPrefix: 'iso', identifier: 'user_A' };
    const optsUser2 = { max: 1, windowMs: 60000, keyPrefix: 'iso', identifier: 'user_B' };

    const r1 = createMockReqRes();
    expect(checkRateLimit(r1.req, r1.res, optsUser1)).toBe(false);

    // User A exceeds
    const r2 = createMockReqRes();
    expect(checkRateLimit(r2.req, r2.res, optsUser1)).toBe(true);

    // User B is fresh, should be allowed
    const r3 = createMockReqRes();
    expect(checkRateLimit(r3.req, r3.res, optsUser2)).toBe(false);
  });

  it('falls back to IP address from x-forwarded-for header if identifier is omitted', () => {
    const opts = { max: 1, windowMs: 60000, keyPrefix: 'ip-test' };

    const r1 = createMockReqRes({ 'x-forwarded-for': '203.0.113.195, 10.0.0.1' });
    expect(checkRateLimit(r1.req, r1.res, opts)).toBe(false);

    const r2 = createMockReqRes({ 'x-forwarded-for': '203.0.113.195, 10.0.0.1' });
    expect(checkRateLimit(r2.req, r2.res, opts)).toBe(true);
  });
});
