import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import App from './App';
import './index.css';
import { QUERY_CACHE_STORAGE_KEY, AUTH_CACHE_TTL_MS } from './core/authStorage';

// PWA automatic reload on new service worker version
import { registerSW } from 'virtual:pwa-register';
registerSW({ immediate: true });

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 5000,
      gcTime: AUTH_CACHE_TTL_MS, // 24時間保持 (v5)
      retry: 1,
    },
  },
});

// ブラウザ環境で localStorage へのキャッシュ永続化（Persister）を設定
if (typeof window !== 'undefined' && window.localStorage) {
  const localStoragePersister = createSyncStoragePersister({
    storage: window.localStorage,
    key: QUERY_CACHE_STORAGE_KEY,
  });

  persistQueryClient({
    queryClient,
    persister: localStoragePersister,
    maxAge: AUTH_CACHE_TTL_MS, // 24時間 TTL (ガードレール 2)
    buster: 'v1.0.0',
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
