import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { auth, config } from '../../config';

describe('Auth Utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Token Management', () => {
    it('should set and get access token', () => {
      const testToken = 'test-access-token';
      auth.setToken(testToken);
      expect(auth.getToken()).toBe(testToken);
      expect(localStorage.getItem('token')).toBe(testToken);
    });

    it('should set and get refresh token', () => {
      const testRefreshToken = 'test-refresh-token';
      auth.setRefreshToken(testRefreshToken);
      expect(auth.getRefreshToken()).toBe(testRefreshToken);
      expect(localStorage.getItem('refreshToken')).toBe(testRefreshToken);
    });

    it('should return null when no token exists', () => {
      expect(auth.getToken()).toBeNull();
      expect(auth.getRefreshToken()).toBeNull();
    });

    it('should remove all tokens and user data', () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('refreshToken', 'test-refresh');
      localStorage.setItem('username', 'testuser');
      localStorage.setItem('roles', '["ROLE_USER"]');

      auth.removeToken();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('username')).toBeNull();
      expect(localStorage.getItem('roles')).toBeNull();
    });
  });

  describe('User Information', () => {
    it('should get username from localStorage', () => {
      localStorage.setItem('username', 'admin');
      expect(auth.getUsername()).toBe('admin');
    });

    it('should return null when no username exists', () => {
      expect(auth.getUsername()).toBeNull();
    });

    it('should get user roles as array', () => {
      localStorage.setItem('roles', JSON.stringify(['ROLE_ADMIN', 'ROLE_USER']));
      const roles = auth.getRoles();
      expect(roles).toEqual(['ROLE_ADMIN', 'ROLE_USER']);
      expect(roles).toHaveLength(2);
    });

    it('should return empty array when no roles exist', () => {
      expect(auth.getRoles()).toEqual([]);
    });

    it('should handle invalid JSON in roles', () => {
      localStorage.setItem('roles', 'invalid-json');
      expect(() => auth.getRoles()).toThrow();
    });
  });

  describe('Authentication Status', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('token', 'test-token');
      expect(auth.isAuthenticated()).toBe(true);
    });

    it('should return false when no token exists', () => {
      expect(auth.isAuthenticated()).toBe(false);
    });

    it('should return false when token is empty string', () => {
      localStorage.setItem('token', '');
      expect(auth.isAuthenticated()).toBe(false);
    });
  });

  describe('Role Checking', () => {
    it('should return true when user has the specified role', () => {
      localStorage.setItem('roles', JSON.stringify(['ROLE_ADMIN', 'ROLE_USER']));
      expect(auth.hasRole('ROLE_ADMIN')).toBe(true);
    });

    it('should return false when user does not have the specified role', () => {
      localStorage.setItem('roles', JSON.stringify(['ROLE_USER']));
      expect(auth.hasRole('ROLE_ADMIN')).toBe(false);
    });

    it('should return false when no roles exist', () => {
      expect(auth.hasRole('ROLE_ADMIN')).toBe(false);
    });

    it('should be case sensitive', () => {
      localStorage.setItem('roles', JSON.stringify(['ROLE_ADMIN']));
      expect(auth.hasRole('role_admin')).toBe(false);
      expect(auth.hasRole('ROLE_ADMIN')).toBe(true);
    });
  });

  describe('Authorization Header', () => {
    it('should return Bearer token when token exists', () => {
      const testToken = 'test-token-123';
      localStorage.setItem('token', testToken);
      expect(auth.getAuthHeader()).toBe(`Bearer ${testToken}`);
    });

    it('should return empty string when no token exists', () => {
      expect(auth.getAuthHeader()).toBe('');
    });
  });

  describe('Token Refresh', () => {
    it('should refresh access token successfully', async () => {
      const mockRefreshToken = 'mock-refresh-token';
      const mockNewAccessToken = 'new-access-token';

      localStorage.setItem('refreshToken', mockRefreshToken);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ accessToken: mockNewAccessToken }),
      } as Response);

      const result = await auth.refreshAccessToken();

      expect(result).toBe(true);
      expect(auth.getToken()).toBe(mockNewAccessToken);
      expect(fetch).toHaveBeenCalledWith(
        `${config.apiUrl}/api/auth/refresh`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: mockRefreshToken }),
        })
      );
    });

    it('should return false when no refresh token exists', async () => {
      const result = await auth.refreshAccessToken();
      expect(result).toBe(false);
    });

    it('should logout when refresh fails', async () => {
      localStorage.setItem('refreshToken', 'invalid-refresh-token');
      localStorage.setItem('token', 'old-token');

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      } as Response);

      const result = await auth.refreshAccessToken();

      expect(result).toBe(false);
      expect(auth.getToken()).toBeNull();
      expect(auth.getRefreshToken()).toBeNull();
    });

    it('should handle network errors during refresh', async () => {
      localStorage.setItem('refreshToken', 'refresh-token');
      localStorage.setItem('token', 'old-token');

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await auth.refreshAccessToken();

      expect(result).toBe(false);
      expect(auth.getToken()).toBeNull();
    });
  });

  describe('Logout', () => {
    it('should call logout endpoint and clear localStorage', async () => {
      const mockRefreshToken = 'mock-refresh-token';
      localStorage.setItem('refreshToken', mockRefreshToken);
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('username', 'testuser');
      localStorage.setItem('roles', '["ROLE_USER"]');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
      } as Response);

      await auth.logout();

      expect(fetch).toHaveBeenCalledWith(
        `${config.apiUrl}/api/auth/logout`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ refreshToken: mockRefreshToken }),
        })
      );

      expect(auth.getToken()).toBeNull();
      expect(auth.getRefreshToken()).toBeNull();
      expect(auth.getUsername()).toBeNull();
    });

    it('should clear localStorage even if logout endpoint fails', async () => {
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      localStorage.setItem('token', 'mock-token');

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await auth.logout();

      expect(auth.getToken()).toBeNull();
      expect(auth.getRefreshToken()).toBeNull();
    });

    it('should clear localStorage when no refresh token exists', async () => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('username', 'testuser');

      await auth.logout();

      expect(auth.getToken()).toBeNull();
      expect(auth.getUsername()).toBeNull();
    });
  });
});

describe('Config', () => {
  it('should have default API URL', () => {
    expect(config.apiUrl).toBeDefined();
    expect(typeof config.apiUrl).toBe('string');
  });

  it('should use localhost:8080 as default', () => {
    expect(config.apiUrl).toBe('http://localhost:8080');
  });
});
