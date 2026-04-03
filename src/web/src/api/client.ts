// API Client for backend integration
const API_BASE_URL = import.meta.env.VITE_API_URL || '/v1';

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface ApiError {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('authToken');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { requireAuth = true, headers, ...restOptions } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    };

    if (requireAuth && this.token) {
      requestHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: requestHeaders,
        ...restOptions,
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        const errorData = responseData as ApiError;
        throw new Error(
          errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const successData = responseData as ApiResponse<T>;
      return successData.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error');
    }
  }

  get<T>(endpoint: string, options: RequestOptions = {}) {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }

  post<T>(endpoint: string, data?: unknown, options: RequestOptions = {}) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  put<T>(endpoint: string, data?: unknown, options: RequestOptions = {}) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  patch<T>(endpoint: string, data?: unknown, options: RequestOptions = {}) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  delete<T>(endpoint: string, options: RequestOptions = {}) {
    return this.request<T>(endpoint, { method: 'DELETE', ...options });
  }
}

// Create singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
