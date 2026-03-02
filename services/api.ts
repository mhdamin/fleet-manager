const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
const ACCESS_TOKEN_KEY = 'fleet.accessToken';
const REFRESH_TOKEN_KEY = 'fleet.refreshToken';
const AUTH_USER_KEY = 'fleet.authUser';
const AUTH_UNAUTHORIZED_EVENT = 'fleet:auth-unauthorized';

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  type: string;
  username: string;
  roles: string[];
  refreshToken: string;
}

const buildApiUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
};

const getAccessToken = (): string => localStorage.getItem(ACCESS_TOKEN_KEY) || '';

const buildHeaders = (init?: RequestInit): HeadersInit => {
  const token = getAccessToken();
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers || {}),
  };
};

const apiRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: buildHeaders(init),
  });

  if (response.status === 401) {
    window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

const apiGet = async <T>(path: string, init?: RequestInit): Promise<T> => {
  return apiRequest<T>(path, {
    ...init,
    method: 'GET',
  });
};

const login = async (username: string, password: string): Promise<LoginResponse> => {
  return apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password } as LoginRequest),
  });
};

const saveAuthSession = (auth: LoginResponse): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, auth.token);
  localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken || '');
  localStorage.setItem(
    AUTH_USER_KEY,
    JSON.stringify({
      username: auth.username,
      roles: auth.roles || [],
    })
  );
};

const clearAuthSession = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

const getStoredAuthUser = (): { username: string; roles: string[] } | null => {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { username?: string; roles?: string[] };
    if (!parsed.username) {
      return null;
    }
    return {
      username: parsed.username,
      roles: parsed.roles || [],
    };
  } catch {
    return null;
  }
};

const isAuthenticated = (): boolean => Boolean(getAccessToken());

export {
  API_BASE_URL,
  AUTH_UNAUTHORIZED_EVENT,
  buildApiUrl,
  apiGet,
  login,
  saveAuthSession,
  clearAuthSession,
  getStoredAuthUser,
  isAuthenticated,
};
