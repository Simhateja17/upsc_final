// Default aligns with `.env.example` and backend `upsc_backend` dev port.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

interface RequestConfig extends RequestInit {
  token?: string;
  timeout?: number; // milliseconds
}

export class ApiRequestError extends Error {
  statusCode: number;
  payload: any;

  constructor(message: string, statusCode: number, payload: any) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
    this.payload = payload;
  }
}

async function request<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  const { token, timeout = 15000, ...fetchConfig } = config;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...config.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchConfig,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiRequestError(data.message || `Error: ${response.status} ${response.statusText}`, response.status, data);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout – backend server may be unavailable');
      }
      throw error;
    }
    throw new Error('Request failed');
  }
}

export const api = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'GET' }),

  post: <T>(endpoint: string, body: unknown, config?: RequestConfig) =>
    request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body: unknown, config?: RequestConfig) =>
    request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  patch: <T>(endpoint: string, body: unknown, config?: RequestConfig) =>
    request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'DELETE' }),
};

export default api;
