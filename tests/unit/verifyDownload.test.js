import { describe, it, expect, vi, beforeEach } from 'vitest';
import verifyDownloadHandler from '../../api/verify-download.js';
import middleware from '../../api/middleware.js';

const { _resetRateLimitStore } = middleware;

function createMockReqRes(method = 'POST', headers = {}, body = {}) {
  const req = {
    method,
    headers: { ...headers },
    body,
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
    },
    end() {
      this.ended = true;
      return this;
    }
  };
  return { req, res };
}

describe('api/verify-download (Server-Side Payment Gate)', () => {
  beforeEach(() => {
    _resetRateLimitStore();
  });

  it('rejects GET requests with 405 Method Not Allowed', async () => {
    const { req, res } = createMockReqRes('GET');
    await verifyDownloadHandler(req, res);
    expect(res.statusCode).toBe(405);
    expect(res.body.error).toContain('Method not allowed');
  });

  it('rejects unauthenticated requests with 401 Unauthorized', async () => {
    const { req, res } = createMockReqRes('POST', {}, { order_id: 'SW_12345' });
    await verifyDownloadHandler(req, res);
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toContain('Unauthorized');
  });

  it('handles CORS preflight OPTIONS request with 200 OK', async () => {
    const { req, res } = createMockReqRes('OPTIONS', {
      origin: 'https://smartwill-india.vercel.app'
    });
    await verifyDownloadHandler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.ended).toBe(true);
  });
});
