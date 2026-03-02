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

interface VehicleStatsResponse {
  totalVehicles: number;
  availableVehicles: number;
  rentedVehicles: number;
  maintenanceVehicles: number;
}

interface VehicleResponse {
  id: string;
  plateNumber: string;
  model: string;
  manufacturer: string;
  year: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

interface VehicleRequest {
  plateNumber: string;
  model: string;
  manufacturer: string;
  year: number;
  status: string;
}

interface UserResponse {
  id: number;
  username: string;
  roles: string[];
  lastLogin?: string;
  status?: string;
}

interface RegisterRequest {
  username: string;
  password: string;
  roles?: string[];
}

interface ActivityResponse {
  id: string;
  checklistId?: string;
  changeType: string;
  oldVehiclePlate?: string;
  newVehiclePlate?: string;
  reason?: string;
  timestamp: string;
  staffName?: string;
}

interface InspectionSummaryResponse {
  totalInspections: number;
  preRentalInspections: number;
  postRentalInspections: number;
  periodicInspections: number;
  totalDefects: number;
  unresolvedDefects: number;
  averageDefectsPerInspection: number;
}

interface InspectionTrendResponse {
  date: string;
  inspectionCount: number;
  defectCount: number;
}

interface ChecklistResponse {
  id: string;
  checklistNumber: string;
  rentalStartDate: string;
  rentalEndDate?: string;
  customerName: string;
  customerPhone: string;
  staffName: string;
  rentalType: string;
  createdAt?: string;
  vehicle?: {
    id: string;
    plateNumber: string;
    model: string;
    manufacturer: string;
    year: number;
    status: string;
  };
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

const apiPost = async <T>(path: string, body?: unknown, init?: RequestInit): Promise<T> => {
  return apiRequest<T>(path, {
    ...init,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
};

const apiPut = async <T>(path: string, body?: unknown, init?: RequestInit): Promise<T> => {
  return apiRequest<T>(path, {
    ...init,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
};

const apiDelete = async (path: string, init?: RequestInit): Promise<void> => {
  await apiRequest<void>(path, {
    ...init,
    method: 'DELETE',
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

const getVehicleStats = async (): Promise<VehicleStatsResponse> => apiGet<VehicleStatsResponse>('/api/vehicles/stats');
const getVehicles = async (): Promise<VehicleResponse[]> => apiGet<VehicleResponse[]>('/api/vehicles');
const createVehicle = async (payload: VehicleRequest): Promise<string> => apiPost<string>('/api/vehicles', payload);
const deleteVehicleById = async (id: string): Promise<void> => apiDelete(`/api/vehicles/${id}`);
const getUsers = async (): Promise<UserResponse[]> => apiGet<UserResponse[]>('/api/users');
const getAssignableRoles = async (): Promise<string[]> => apiGet<string[]>('/api/users/assignable-roles');
const createUser = async (payload: RegisterRequest): Promise<UserResponse> => apiPost<UserResponse>('/api/auth/register', payload);
const updateUserById = async (id: number, payload: { username: string; roles?: string[] }): Promise<UserResponse> =>
  apiPut<UserResponse>(`/api/users/${id}`, payload);
const deleteUserById = async (id: number): Promise<void> => apiDelete(`/api/users/${id}`);
const resetUserPassword = async (id: number, newPassword: string): Promise<string> =>
  apiPost<string>(`/api/users/${id}/reset-password`, {
    newPassword,
    confirmPassword: newPassword,
  });
const getActivities = async (): Promise<ActivityResponse[]> => apiGet<ActivityResponse[]>('/api/activities/all');
const getInspectionSummary = async (): Promise<InspectionSummaryResponse> => apiGet<InspectionSummaryResponse>('/api/reports/inspection-summary');
const getInspectionTrends = async (): Promise<InspectionTrendResponse[]> => apiGet<InspectionTrendResponse[]>('/api/reports/inspection-trends');
const getChecklists = async (): Promise<ChecklistResponse[]> => apiGet<ChecklistResponse[]>('/api/checklists');

export {
  API_BASE_URL,
  AUTH_UNAUTHORIZED_EVENT,
  buildApiUrl,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  login,
  saveAuthSession,
  clearAuthSession,
  getStoredAuthUser,
  isAuthenticated,
  getVehicleStats,
  getVehicles,
  createVehicle,
  deleteVehicleById,
  getUsers,
  getAssignableRoles,
  createUser,
  updateUserById,
  deleteUserById,
  resetUserPassword,
  getActivities,
  getInspectionSummary,
  getInspectionTrends,
  getChecklists,
};

export type {
  VehicleStatsResponse,
  VehicleResponse,
  VehicleRequest,
  UserResponse,
  ActivityResponse,
  InspectionSummaryResponse,
  InspectionTrendResponse,
  ChecklistResponse,
};
