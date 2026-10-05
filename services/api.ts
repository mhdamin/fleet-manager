import type { InspectionEvidence } from '../components/Checklist/evidence';
import { Booking, BookingStatus, Customer, DepositStatus, Invoice, Payment, PaymentMethod, PricingBreakdown, RatePlan, Refund, RentalContract, ReturnAssessment, ReturnOutcome, SettlementSummary, VehicleOperationalStatus } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
const ACCESS_TOKEN_KEY = 'fleet.accessToken';
const REFRESH_TOKEN_KEY = 'fleet.refreshToken';
const AUTH_USER_KEY = 'fleet.authUser';
const AUTH_UNAUTHORIZED_EVENT = 'fleet:auth-unauthorized';

interface LoginRequest { username: string; password: string; }
interface LoginResponse { token: string; type: string; username: string; roles: string[]; refreshToken: string; }
interface VehicleStatsResponse { totalVehicles: number; availableVehicles: number; rentedVehicles: number; maintenanceVehicles: number; }
interface VehicleResponse { id: string; plateNumber: string; model: string; manufacturer: string; year: number; status: string; createdAt?: string; updatedAt?: string; }
interface VehicleRequest { plateNumber: string; model: string; manufacturer: string; year: number; status: string; }
interface UserResponse { id: number; username: string; roles: string[]; lastLogin?: string; status?: string; }
interface RegisterRequest { username: string; password: string; roles?: string[]; }
interface ActivityResponse { id: string; checklistId?: string; changeType: string; oldVehiclePlate?: string; newVehiclePlate?: string; reason?: string; timestamp: string; staffName?: string; }
interface InspectionSummaryResponse { totalInspections: number; preRentalInspections: number; postRentalInspections: number; periodicInspections: number; totalDefects: number; unresolvedDefects: number; averageDefectsPerInspection: number; }
interface InspectionTrendResponse { date: string; inspectionCount: number; defectCount: number; }
interface ChecklistResponse { rentalId?: string; completed: boolean; completedAt?: string; evidence?: InspectionEvidence; id: string; checklistNumber: string; rentalStartDate: string; rentalEndDate?: string; customerName: string; customerPhone: string; staffName: string; rentalType: string; createdAt?: string; vehicle?: { id: string; plateNumber: string; model: string; manufacturer: string; year: number; status: string; }; }
interface BookingRequest { customerId: string; pickupLocation: string; dropoffLocation: string; pickupDateTime: string; dropoffDateTime: string; vehicleClass: string; estimatedTotal: number; depositAmount: number; notes?: string; }
interface CustomerRequest { fullName: string; email: string; phone: string; licenseNumber: string; licenseExpiry: string; identityStatus: Customer['identityStatus']; status: Customer['status']; notes: string; }
interface RentalCreateRequest { bookingId: string; vehicleId: string; odometerOut: number; fuelOut: string; depositAmount: number; addOns: string[]; notes?: string; }
interface RentalExtendRequest { expectedReturnDateTime: string; notes?: string; }
interface ReturnQuoteRequest { rentalId: string; fuelIn: string; damageFlag: boolean; maintenanceFlag: boolean; lateHours: number; extraCharges: number; }
interface ReturnSubmitRequest extends ReturnQuoteRequest { odometerIn: number; checklistId?: string; notes?: string; }
interface CustomerHistorySummary { bookings: number; rentals: number; activeRentals: number; lastBookingDate?: string; }
interface VehicleOption { id: string; plateNumber: string; label: string; vehicleClass: string; operationalStatus: VehicleOperationalStatus; }
interface BookingFilter { status?: BookingStatus | 'All'; query?: string; }
interface CustomerFilter { query?: string; }
interface RatePlanRequest { name: string; vehicleClass: string; dailyRate: number; includedMileagePerDay: number; depositAmount: number; taxRate: number; active: boolean; }
interface PaymentCreateRequest { reference: string; requestKey: string; invoiceId: string; customerName: string; amount: number; method: PaymentMethod; paymentType: Payment['paymentType']; }
interface RefundRequest { reference: string; requestKey: string; invoiceId?: string; settlementId?: string; customerName: string; amount: number; reason: string; }

const buildApiUrl = (path: string): string => /^https?:\/\//i.test(path) ? path : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
const getAccessToken = (): string => localStorage.getItem(ACCESS_TOKEN_KEY) || '';
const buildHeaders = (init?: RequestInit): HeadersInit => ({ Accept: 'application/json', ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}), ...(init?.headers || {}) });
let refreshPromise: Promise<void> | null = null;
const refreshSession = (): Promise<void> => {
  if (!refreshPromise) refreshPromise = (async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) throw new Error('Please sign in again. Your draft is retained on this device.');
    const result = await fetch(buildApiUrl('/api/auth/refresh'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) });
    if (!result.ok) throw new Error('Please sign in again. Your draft is retained on this device.');
    const data = await result.json();
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    if (data.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  })().finally(() => { refreshPromise = null; });
  return refreshPromise;
};
const apiRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const token = getAccessToken();
  let response = await fetch(buildApiUrl(path), { ...init, headers: buildHeaders(init) });
  if (response.status === 401 && !path.startsWith('/api/auth/')) {
    try { if (token === getAccessToken()) await refreshSession(); }
    catch (error) { window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT)); throw error; }
    response = await fetch(buildApiUrl(path), { ...init, headers: buildHeaders(init) });
    if (response.status === 401) window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
  }
  if (!response.ok) {
    const body = await response.text();
    let message = response.status === 403 ? 'You do not have permission to perform this action.' : response.status === 401 ? 'Please check your sign-in details.' : 'The request could not be completed. Please try again.';
    try { const data = JSON.parse(body); if (data.message) message = data.message; } catch { /* Keep the safe fallback for non-JSON errors. */ }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  const body = await response.text();
  if (!body) return undefined as T;
  try { return JSON.parse(body) as T; } catch { return body as T; }
};
const apiGet = async <T>(path: string, init?: RequestInit): Promise<T> => apiRequest<T>(path, { ...init, method: 'GET' });
const apiPost = async <T>(path: string, body?: unknown, init?: RequestInit): Promise<T> => apiRequest<T>(path, { ...init, method: 'POST', headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }, body: body !== undefined ? JSON.stringify(body) : undefined });
const apiPut = async <T>(path: string, body?: unknown, init?: RequestInit): Promise<T> => apiRequest<T>(path, { ...init, method: 'PUT', headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }, body: body !== undefined ? JSON.stringify(body) : undefined });
const apiPatch = async <T>(path: string, body?: unknown, init?: RequestInit): Promise<T> => apiRequest<T>(path, { ...init, method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }, body: body !== undefined ? JSON.stringify(body) : undefined });
const apiDelete = async (path: string, init?: RequestInit): Promise<void> => { await apiRequest<void>(path, { ...init, method: 'DELETE' }); };

const login = async (username: string, password: string): Promise<LoginResponse> => apiRequest<LoginResponse>('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password } as LoginRequest) });
const saveAuthSession = (auth: LoginResponse): void => { localStorage.setItem(ACCESS_TOKEN_KEY, auth.token); localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken || ''); localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ username: auth.username, roles: auth.roles || [] })); };
const clearAuthSession = (): void => { localStorage.removeItem(ACCESS_TOKEN_KEY); localStorage.removeItem(REFRESH_TOKEN_KEY); localStorage.removeItem(AUTH_USER_KEY); };
const getStoredAuthUser = (): { username: string; roles: string[] } | null => { const raw = localStorage.getItem(AUTH_USER_KEY); if (!raw) return null; try { const parsed = JSON.parse(raw) as { username?: string; roles?: string[] }; return parsed.username ? { username: parsed.username, roles: parsed.roles || [] } : null; } catch { return null; } };
const isAuthenticated = (): boolean => Boolean(getAccessToken());

const withQuery = (path: string, params: Record<string, string | undefined>): string => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value && value.trim()) search.set(key, value); });
  const query = search.toString();
  return query ? `${path}?${query}` : path;
};

const getVehicleStats = async (): Promise<VehicleStatsResponse> => apiGet<VehicleStatsResponse>('/api/vehicles/stats');
const getVehicles = async (): Promise<VehicleResponse[]> => apiGet<VehicleResponse[]>('/api/vehicles');
const createVehicle = async (payload: VehicleRequest): Promise<string> => apiPost<string>('/api/vehicles', payload);
const deleteVehicleById = async (id: string): Promise<void> => apiDelete(`/api/vehicles/${id}`);
const getUsers = async (): Promise<UserResponse[]> => apiGet<UserResponse[]>('/api/users');
const getAssignableRoles = async (): Promise<string[]> => apiGet<string[]>('/api/users/assignable-roles');
const createUser = async (payload: RegisterRequest): Promise<UserResponse> => apiPost<UserResponse>('/api/auth/register', payload);
const updateUserById = async (id: number, payload: { username: string; roles?: string[] }): Promise<UserResponse> => apiPut<UserResponse>(`/api/users/${id}`, payload);
const deleteUserById = async (id: number): Promise<void> => apiDelete(`/api/users/${id}`);
const resetUserPassword = async (id: number, newPassword: string): Promise<string> => apiPost<string>(`/api/users/${id}/reset-password`, { newPassword, confirmPassword: newPassword });
const getActivities = async (): Promise<ActivityResponse[]> => apiGet<ActivityResponse[]>('/api/activities/all');
const getInspectionSummary = async (): Promise<InspectionSummaryResponse> => apiGet<InspectionSummaryResponse>('/api/reports/inspection-summary');
const getInspectionTrends = async (): Promise<InspectionTrendResponse[]> => apiGet<InspectionTrendResponse[]>('/api/reports/inspection-trends');
const getChecklists = async (): Promise<ChecklistResponse[]> => apiGet<ChecklistResponse[]>('/api/checklists');

const listVehicleOptions = async (): Promise<VehicleOption[]> => apiGet<VehicleOption[]>('/api/vehicle-options');
const getRatePlans = async (): Promise<RatePlan[]> => apiGet<RatePlan[]>('/api/rate-plans');
const createRatePlan = async (payload: RatePlanRequest): Promise<RatePlan> => apiPost<RatePlan>('/api/rate-plans', payload);
const updateRatePlan = async (id: string, payload: Partial<RatePlanRequest>): Promise<RatePlan> => {
  const current = await apiGet<RatePlan[]>(`/api/rate-plans`).then((plans) => plans.find((item) => item.id === id));
  if (!current) throw new Error('Rate plan not found');
  return apiPut<RatePlan>(`/api/rate-plans/${id}`, { ...current, ...payload });
};

const getBookings = async (filter?: BookingFilter): Promise<Booking[]> => apiGet<Booking[]>(withQuery('/api/bookings', { status: filter?.status, query: filter?.query }));
const getBookingById = async (id: string): Promise<Booking | undefined> => apiGet<Booking>(`/api/bookings/${id}`);
const getBookingQuoteBreakdown = async (id: string): Promise<PricingBreakdown | undefined> => apiGet<PricingBreakdown>(`/api/bookings/${id}/quote-breakdown`);
const createBooking = async (payload: BookingRequest): Promise<Booking> => apiPost<Booking>('/api/bookings', payload);
const updateBooking = async (id: string, payload: Partial<BookingRequest>): Promise<Booking> => {
  const current = await getBookingById(id);
  if (!current) throw new Error('Booking not found');
  return apiPut<Booking>(`/api/bookings/${id}`, {
    customerId: current.customerId,
    pickupLocation: current.pickupLocation,
    dropoffLocation: current.dropoffLocation,
    pickupDateTime: current.pickupDateTime,
    dropoffDateTime: current.dropoffDateTime,
    vehicleClass: current.vehicleClass,
    estimatedTotal: current.estimatedTotal,
    depositAmount: current.depositAmount,
    notes: current.notes || '',
    ...payload,
  });
};
const confirmBooking = async (id: string): Promise<Booking> => apiPost<Booking>(`/api/bookings/${id}/confirm`);
const cancelBooking = async (id: string): Promise<Booking> => apiPost<Booking>(`/api/bookings/${id}/cancel`);
const assignVehicleToBooking = async (id: string, vehicleId: string): Promise<Booking> => apiPost<Booking>(`/api/bookings/${id}/assign-vehicle`, { vehicleId });

const getCustomers = async (filter?: CustomerFilter): Promise<Customer[]> => apiGet<Customer[]>(withQuery('/api/customers', { query: filter?.query }));
const getCustomerById = async (id: string): Promise<Customer | undefined> => apiGet<Customer>(`/api/customers/${id}`);
const createCustomer = async (payload: CustomerRequest): Promise<Customer> => apiPost<Customer>('/api/customers', payload);
const updateCustomer = async (id: string, payload: Partial<CustomerRequest>): Promise<Customer> => {
  const current = await getCustomerById(id);
  if (!current) throw new Error('Customer not found');
  return apiPut<Customer>(`/api/customers/${id}`, {
    fullName: current.fullName,
    email: current.email,
    phone: current.phone,
    licenseNumber: current.licenseNumber,
    licenseExpiry: current.licenseExpiry,
    identityStatus: current.identityStatus,
    status: current.status,
    notes: current.notes,
    ...payload,
  });
};
const searchCustomers = async (query: string): Promise<Customer[]> => getCustomers({ query });
const getCustomerHistorySummary = async (customerId: string): Promise<CustomerHistorySummary> => apiGet<CustomerHistorySummary>(`/api/customers/${customerId}/history-summary`);

const getRentals = async (): Promise<RentalContract[]> => apiGet<RentalContract[]>('/api/rentals');
const getRentalById = async (id: string): Promise<RentalContract | undefined> => apiGet<RentalContract>(`/api/rentals/${id}`);
const getRentalFinancialSummary = async (id: string): Promise<{ pricingBreakdown: PricingBreakdown; depositStatus: DepositStatus; depositAmount: number } | undefined> => apiGet<{ pricingBreakdown: PricingBreakdown; depositStatus: DepositStatus; depositAmount: number }>(`/api/rentals/${id}/financial-summary`);
const createRentalFromBooking = async (payload: RentalCreateRequest): Promise<RentalContract> => apiPost<RentalContract>('/api/rentals/from-booking', payload);
const startRental = async (id: string): Promise<RentalContract> => apiPost<RentalContract>(`/api/rentals/${id}/start`);
const extendRental = async (id: string, payload: RentalExtendRequest): Promise<RentalContract> => apiPut<RentalContract>(`/api/rentals/${id}/extend`, payload);
const closeRental = async (id: string): Promise<RentalContract> => apiPost<RentalContract>(`/api/rentals/${id}/close`);

const quoteReturnCharges = async (payload: ReturnQuoteRequest): Promise<{ baseCharges: number; totalCharges: number; outcome: ReturnOutcome }> => apiPost<{ baseCharges: number; totalCharges: number; outcome: ReturnOutcome }>('/api/returns/quote', payload);
const getReturns = async (): Promise<ReturnAssessment[]> => apiGet<ReturnAssessment[]>('/api/returns');
const submitReturn = async (payload: ReturnSubmitRequest): Promise<ReturnAssessment> => apiPost<ReturnAssessment>('/api/returns', payload);
const finalizeReturn = async (id: string): Promise<ReturnAssessment> => apiPost<ReturnAssessment>(`/api/returns/${id}/finalize`);

const getInvoices = async (): Promise<Invoice[]> => apiGet<Invoice[]>('/api/invoices');
const getInvoiceById = async (id: string): Promise<Invoice | undefined> => apiGet<Invoice>(`/api/invoices/${id}`);
const createPayment = async (payload: PaymentCreateRequest): Promise<Payment> => apiPost<Payment>('/api/payments', payload);
const getPayments = async (): Promise<Payment[]> => apiGet<Payment[]>('/api/payments');
const processRefund = async (payload: RefundRequest): Promise<Refund> => apiPost<Refund>('/api/refunds', payload);
const getRefunds = async (): Promise<Refund[]> => apiGet<Refund[]>('/api/refunds');
const getSettlements = async (): Promise<SettlementSummary[]> => apiGet<SettlementSummary[]>('/api/settlements');
const getSettlementById = async (id: string): Promise<SettlementSummary | undefined> => apiGet<SettlementSummary>(`/api/settlements/${id}`);

export {
  API_BASE_URL, AUTH_UNAUTHORIZED_EVENT, buildApiUrl, apiGet, apiPost, apiPut, apiPatch, apiDelete, login, saveAuthSession, clearAuthSession, getStoredAuthUser, isAuthenticated,
  getVehicleStats, getVehicles, createVehicle, deleteVehicleById, getUsers, getAssignableRoles, createUser, updateUserById, deleteUserById, resetUserPassword,
  getActivities, getInspectionSummary, getInspectionTrends, getChecklists, listVehicleOptions,
  getRatePlans, createRatePlan, updateRatePlan,
  getBookings, getBookingById, getBookingQuoteBreakdown, createBooking, updateBooking, confirmBooking, cancelBooking, assignVehicleToBooking,
  getCustomers, getCustomerById, createCustomer, updateCustomer, searchCustomers, getCustomerHistorySummary,
  getRentals, getRentalById, getRentalFinancialSummary, createRentalFromBooking, startRental, extendRental, closeRental,
  quoteReturnCharges, getReturns, submitReturn, finalizeReturn,
  getInvoices, getInvoiceById, createPayment, getPayments, processRefund, getRefunds, getSettlements, getSettlementById,
};

export type {
  VehicleStatsResponse, VehicleResponse, VehicleRequest, UserResponse, ActivityResponse, InspectionSummaryResponse, InspectionTrendResponse, ChecklistResponse,
  BookingRequest, CustomerRequest, RentalCreateRequest, RentalExtendRequest, ReturnQuoteRequest, ReturnSubmitRequest, CustomerHistorySummary, VehicleOption,
  RatePlanRequest, PaymentCreateRequest, RefundRequest,
};

