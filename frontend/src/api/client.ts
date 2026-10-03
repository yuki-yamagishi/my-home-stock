import type {
  HealthResponse,
  StockItem,
  StockItemInput,
  AuthUser,
  HouseholdMember,
  HouseholdMemberInput,
} from './schema';

const API_BASE = '/api/v1';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function parseCsrfToken(cookieHeader?: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  return parseCsrfToken(document.cookie);
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = (options?.method || 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers['X-XSRF-TOKEN'] = csrfToken;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorData: unknown;
    try {
      errorData = await res.json();
    } catch {
      errorData = await res.text();
    }
    const message =
      typeof errorData === 'object' && errorData !== null && 'message' in errorData
        ? String((errorData as { message: unknown }).message)
        : `API request failed with status ${res.status}`;
    throw new ApiError(message, res.status, errorData);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const api = {
  // Auth API
  getCurrentUser: () => request<AuthUser>('/auth/me'),
  logout: async () => {
    const headers: Record<string, string> = {};
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers['X-XSRF-TOKEN'] = csrfToken;
    }
    await fetch('/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers,
    });
  },

  // Household API
  getHouseholdMembers: () => request<HouseholdMember[]>('/households/members'),
  inviteHouseholdMember: (data: HouseholdMemberInput) =>
    request<HouseholdMember>('/households/members', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Health API
  getHealth: () => request<HealthResponse>('/health'),

  // Stocks API
  getStocks: (category?: string) => {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return request<StockItem[]>(`/stocks${query}`);
  },

  getShoppingList: () => request<StockItem[]>('/stocks/shopping-list'),

  getExpiringItems: (daysAhead: number = 7) =>
    request<StockItem[]>(`/stocks/expiring?daysAhead=${daysAhead}`),

  getStockById: (id: number) => request<StockItem>(`/stocks/${id}`),

  createStock: (data: StockItemInput) =>
    request<StockItem>('/stocks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStock: (id: number, data: StockItemInput) =>
    request<StockItem>(`/stocks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  consumeStock: (id: number, amount: number = 1) =>
    request<StockItem>(`/stocks/${id}/consume?amount=${amount}`, {
      method: 'POST',
    }),

  deleteStock: (id: number) =>
    request<void>(`/stocks/${id}`, {
      method: 'DELETE',
    }),
};
