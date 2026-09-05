import type { HealthResponse, StockItem, StockItemInput } from './schema';

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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
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
  getHealth: () => request<HealthResponse>('/health'),

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
