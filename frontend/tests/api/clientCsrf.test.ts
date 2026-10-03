import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseCsrfToken, getCsrfToken, api } from '../../src/api/client';

describe('CSRF Token Handling in API Client', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Provide document mock in node environment
    (global as unknown as { document: { cookie: string } }).document = {
      cookie: '',
    };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete (global as unknown as { document?: unknown }).document;
    vi.restoreAllMocks();
  });

  describe('parseCsrfToken', () => {
    it('returns null when cookie string is empty or undefined', () => {
      expect(parseCsrfToken('')).toBeNull();
      expect(parseCsrfToken(undefined)).toBeNull();
      expect(parseCsrfToken(null)).toBeNull();
    });

    it('returns null when XSRF-TOKEN is absent', () => {
      expect(parseCsrfToken('other_cookie=value123; foo=bar')).toBeNull();
    });

    it('extracts XSRF-TOKEN correctly from cookie string', () => {
      const cookieStr = 'JSESSIONID=session-abc; XSRF-TOKEN=my-csrf-token-123; other=foo';
      expect(parseCsrfToken(cookieStr)).toBe('my-csrf-token-123');
    });

    it('decodes URI-encoded csrf token values', () => {
      const cookieStr = 'XSRF-TOKEN=hello%2Bworld%3D%3D';
      expect(parseCsrfToken(cookieStr)).toBe('hello+world==');
    });
  });

  describe('getCsrfToken with document.cookie', () => {
    it('returns token from document.cookie', () => {
      document.cookie = 'XSRF-TOKEN=doc-token-456';
      expect(getCsrfToken()).toBe('doc-token-456');
    });

    it('returns null if document is not defined', () => {
      delete (global as unknown as { document?: unknown }).document;
      expect(getCsrfToken()).toBeNull();
    });
  });

  describe('API requests with CSRF header', () => {
    it('attaches X-XSRF-TOKEN header on POST requests when cookie is present', async () => {
      document.cookie = 'XSRF-TOKEN=valid-token-777';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ id: 1, name: 'テスト' }),
      });
      global.fetch = mockFetch;

      await api.createStock({
        name: 'テスト品',
        category: '日用品',
        quantity: 1,
        minThreshold: 1,
        stockType: 'QUANTITY',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('/api/v1/stocks');
      expect(init.method).toBe('POST');
      expect(init.headers['X-XSRF-TOKEN']).toBe('valid-token-777');
    });

    it('attaches X-XSRF-TOKEN header on PUT requests', async () => {
      document.cookie = 'XSRF-TOKEN=put-token-888';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: 10, name: '更新品' }),
      });
      global.fetch = mockFetch;

      await api.updateStock(10, {
        name: '更新品',
        category: '食品',
        quantity: 2,
        minThreshold: 1,
        stockType: 'QUANTITY',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('/api/v1/stocks/10');
      expect(init.method).toBe('PUT');
      expect(init.headers['X-XSRF-TOKEN']).toBe('put-token-888');
    });

    it('attaches X-XSRF-TOKEN header on DELETE requests', async () => {
      document.cookie = 'XSRF-TOKEN=delete-token-999';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });
      global.fetch = mockFetch;

      await api.deleteStock(15);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('/api/v1/stocks/15');
      expect(init.method).toBe('DELETE');
      expect(init.headers['X-XSRF-TOKEN']).toBe('delete-token-999');
    });

    it('does NOT attach X-XSRF-TOKEN header on GET requests', async () => {
      document.cookie = 'XSRF-TOKEN=get-token-000';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      });
      global.fetch = mockFetch;

      await api.getStocks();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('/api/v1/stocks');
      expect(init.headers['X-XSRF-TOKEN']).toBeUndefined();
    });

    it('attaches X-XSRF-TOKEN header on logout', async () => {
      document.cookie = 'XSRF-TOKEN=logout-token-111';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });
      global.fetch = mockFetch;

      await api.logout();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('/api/v1/auth/logout');
      expect(init.method).toBe('POST');
      expect(init.headers['X-XSRF-TOKEN']).toBe('logout-token-111');
    });
  });
});
