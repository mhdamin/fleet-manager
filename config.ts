// Application configuration
// This file centralizes all configuration values from environment variables

export const config = {
  // Keep backward compatibility with VITE_API_URL while preferring VITE_API_BASE_URL.
  apiUrl:
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    'http://localhost:8080',
};

// Authentication utility functions
export const auth = {
  // Get access token from localStorage
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  // Set access token in localStorage
  setToken: (token: string): void => {
    localStorage.setItem('token', token);
  },

  // Get refresh token from localStorage
  getRefreshToken: (): string | null => {
    return localStorage.getItem('refreshToken');
  },

  // Set refresh token in localStorage
  setRefreshToken: (refreshToken: string): void => {
    localStorage.setItem('refreshToken', refreshToken);
  },

  // Remove all tokens and user data from localStorage
  removeToken: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    localStorage.removeItem('roles');
  },

  // Get current username
  getUsername: (): string | null => {
    return localStorage.getItem('username');
  },

  // Get user roles
  getRoles: (): string[] => {
    const roles = localStorage.getItem('roles');
    return roles ? JSON.parse(roles) : [];
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!auth.getToken();
  },

  // Check if user has a specific role
  hasRole: (role: string): boolean => {
    return auth.getRoles().includes(role);
  },

  // Refresh access token using refresh token
  refreshAccessToken: async (): Promise<boolean> => {
    const refreshToken = auth.getRefreshToken();
    if (!refreshToken) {
      console.error('No refresh token available');
      return false;
    }

    try {
      const response = await fetch(`${config.apiUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        console.error('Token refresh failed:', response.status);
        // Refresh token is invalid or expired, logout user
        auth.logout();
        return false;
      }

      const data = await response.json();
      auth.setToken(data.accessToken);
      console.log('Access token refreshed successfully');
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      auth.logout();
      return false;
    }
  },

  // Get Authorization header with JWT token
  getAuthHeader: (): string => {
    const token = auth.getToken();
    return token ? `Bearer ${token}` : '';
  },

  // Logout user (revoke refresh token on backend)
  logout: async (): Promise<void> => {
    const refreshToken = auth.getRefreshToken();

    // Call backend logout endpoint to revoke refresh token
    if (refreshToken) {
      try {
        await fetch(`${config.apiUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (error) {
        console.error('Error during logout:', error);
      }
    }

    // Clear local storage regardless of backend response
    auth.removeToken();
  },
};

export default config;
