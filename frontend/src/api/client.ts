import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import WebApp from '@twa-dev/sdk';

/**
 * Enterprise Axios HTTP client for RuScholar TMA.
 * Automatically injects the cryptographic Telegram Mini App `initData`
 * into both Authorization and custom headers for backend verification.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Telegram WebApp initData
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    let initData = '';

    try {
      // 1. Attempt retrieval from @twa-dev/sdk
      if (typeof WebApp !== 'undefined' && WebApp.initData) {
        initData = WebApp.initData;
      }
    } catch {
      // Fallback check on window.Telegram
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initData) {
        initData = window.Telegram.WebApp.initData;
      }
    }

    // Attach authentication credentials if present
    if (initData) {
      config.headers.set('Authorization', `tma ${initData}`);
      config.headers.set('x-telegram-init-data', initData);
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Centralized error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ success?: boolean; error?: string }>) => {
    const status = error.response?.status;
    const serverMessage = error.response?.data?.error;

    if (status === 401) {
      console.warn('[API Client] Unauthorized request. Telegram session invalid or expired:', serverMessage);
    } else if (status === 500) {
      console.error('[API Client] Server encountered an internal error:', serverMessage);
    }

    return Promise.reject(error);
  }
);
