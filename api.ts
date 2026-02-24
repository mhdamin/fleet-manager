// API utility with automatic JWT refresh and error handling
import { auth, config } from './config';

// Flag to track if we're currently refreshing the token
let isRefreshing = false;
// Queue of requests waiting for token refresh
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

// Enhanced fetch with automatic token refresh
export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // Add Authorization header if token exists
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (auth.isAuthenticated()) {
    headers['Authorization'] = auth.getAuthHeader();
  }

  const requestOptions: RequestInit = {
    ...options,
    headers,
  };

  try {
    let response = await fetch(url, requestOptions);

    // If 401 Unauthorized, try to refresh token
    if (response.status === 401) {
      if (isRefreshing) {
        // Wait for the current refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          // Retry original request with new token
          requestOptions.headers['Authorization'] = auth.getAuthHeader();
          return fetch(url, requestOptions);
        });
      }

      isRefreshing = true;

      try {
        const refreshed = await auth.refreshAccessToken();

        if (refreshed) {
          // Token refreshed successfully, retry original request
          processQueue();
          requestOptions.headers['Authorization'] = auth.getAuthHeader();
          response = await fetch(url, requestOptions);
        } else {
          // Refresh failed, redirect to login
          processQueue(new Error('Token refresh failed'));
          redirectToLogin();
          throw new Error('Authentication expired. Please login again.');
        }
      } catch (error) {
        processQueue(error);
        redirectToLogin();
        throw error;
      } finally {
        isRefreshing = false;
      }
    }

    // If still 401 after refresh attempt, or 403 Forbidden, handle appropriately
    if (response.status === 401 || response.status === 403) {
      if (response.status === 401) {
        redirectToLogin();
      }
      // Don't throw for 403, let the caller handle it
    }

    return response;
  } catch (error) {
    console.error('API Fetch Error:', error);
    throw error;
  }
};

// Redirect to login and clear authentication
const redirectToLogin = () => {
  auth.removeToken();
  // Dispatch custom event that App.tsx can listen to
  window.dispatchEvent(new CustomEvent('auth:expired'));
};

// API helper methods
export const api = {
  get: async (endpoint: string): Promise<any> => {
    const response = await apiFetch(`${config.apiUrl}${endpoint}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  post: async (endpoint: string, data: any): Promise<any> => {
    const response = await apiFetch(`${config.apiUrl}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    return response.json();
  },

  put: async (endpoint: string, data: any): Promise<any> => {
    const response = await apiFetch(`${config.apiUrl}${endpoint}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    return response.json();
  },

  delete: async (endpoint: string): Promise<void> => {
    const response = await apiFetch(`${config.apiUrl}${endpoint}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }
  },
};

export default api;
