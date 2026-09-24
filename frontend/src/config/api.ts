/**
 * Centralized API and WebSocket Configuration
 * 
 * In development: defaults to local backend at http://localhost:5000
 * In production (Vercel): defaults to same-origin window.location.origin (or VITE_API_URL if set)
 */

const getInitialApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return (import.meta.env.VITE_API_URL as string).replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

export const API_BASE_URL: string = getInitialApiBaseUrl();

export const WS_BASE_URL: string = 
  (import.meta.env.VITE_WS_URL as string)?.replace(/\/$/, '') || 
  API_BASE_URL.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');

/**
 * Normalizes asset URLs (images/videos/uploads)
 * Handles both remote URLs (Cloudinary/HTTP) and backend-relative paths (/uploads/...)
 */
export const getAssetUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    if (url.includes('localhost:5000') && API_BASE_URL !== 'http://localhost:5000') {
      return url.replace(/https?:\/\/localhost:5000/g, API_BASE_URL);
    }
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${cleanPath}`;
};

/**
 * Global Network Interceptor
 * Automatically routes all http://localhost:5000 and ws://localhost:5000 calls
 * to the configured API_BASE_URL and WS_BASE_URL in production.
 */
export const initApiInterceptor = (): void => {
  if (typeof window === 'undefined') return;

  // Intercept window.fetch
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (typeof input === 'string') {
      if (input.includes('localhost:5000') && API_BASE_URL !== 'http://localhost:5000') {
        input = input.replace(/https?:\/\/localhost:5000/g, API_BASE_URL);
      }
    } else if (input instanceof URL) {
      if (input.origin.includes('localhost:5000') && API_BASE_URL !== 'http://localhost:5000') {
        input = new URL(input.pathname + input.search + input.hash, API_BASE_URL);
      }
    }
    return originalFetch.call(this, input, init);
  };

  // Intercept WebSocket constructor
  const OriginalWebSocket = window.WebSocket;
  window.WebSocket = class extends OriginalWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      let urlStr = url.toString();
      if (urlStr.includes('localhost:5000') && WS_BASE_URL !== 'ws://localhost:5000') {
        urlStr = urlStr.replace(/wss?:\/\/localhost:5000/g, WS_BASE_URL);
      }
      super(urlStr, protocols);
    }
  } as any;
};

export default {
  API_BASE_URL,
  WS_BASE_URL,
  getAssetUrl,
  initApiInterceptor,
};
