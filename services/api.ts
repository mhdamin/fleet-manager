import { Booking, BookingStatus, Customer, DepositStatus, Invoice, InvoiceLineItem, InvoiceStatus, Payment, PaymentMethod, PricingBreakdown, RatePlan, Refund, RentalContract, ReturnAssessment, ReturnOutcome, SettlementSummary, VehicleOperationalStatus } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
const ACCESS_TOKEN_KEY = 'fleet.accessToken';
const REFRESH_TOKEN_KEY = 'fleet.refreshToken';
const AUTH_USER_KEY = 'fleet.authUser';
const AUTH_UNAUTHORIZED_EVENT = 'fleet:auth-unauthorized';
const MOCK_STATE_KEY = 'fleet.phase2.mock-state';

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
interface ChecklistResponse { id: string; checklistNumber: string; rentalStartDate: string; rentalEndDate?: string; customerName: string; customerPhone: string; staffName: string; rentalType: string; createdAt?: string; vehicle?: { id: string; plateNumber: string; model: string; manufacturer: string; year: number; status: string; }; }
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
interface PaymentCreateRequest { invoiceId: string; customerName: string; amount: number; method: PaymentMethod; paymentType: Payment['paymentType']; }
interface RefundRequest { invoiceId?: string; settlementId?: string; customerName: string; amount: number; reason: string; }
interface MockState { customers: Customer[]; bookings: Booking[]; rentals: RentalContract[]; returns: ReturnAssessment[]; vehicleOptions: VehicleOption[]; ratePlans: RatePlan[]; invoices: Invoice[]; payments: Payment[]; refunds: Refund[]; settlements: SettlementSummary[]; }

const buildApiUrl = (path: string): string => /^https?:\/\//i.test(path) ? path : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
const getAccessToken = (): string => localStorage.getItem(ACCESS_TOKEN_KEY) || '';
const buildHeaders = (init?: RequestInit): HeadersInit => ({ Accept: 'application/json', ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}), ...(init?.headers || {}) });
const apiRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(buildApiUrl(path), { ...init, headers: buildHeaders(init) });
  if (response.status === 401) { window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT)); throw new Error('Unauthorized'); }
  if (!response.ok) throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
};
const apiGet = async <T>(path: string, init?: RequestInit): Promise<T> => apiRequest<T>(path, { ...init, method: 'GET' });
const apiPost = async <T>(path: string, body?: unknown, init?: RequestInit): Promise<T> => apiRequest<T>(path, { ...init, method: 'POST', headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }, body: body !== undefined ? JSON.stringify(body) : undefined });
const apiPut = async <T>(path: string, body?: unknown, init?: RequestInit): Promise<T> => apiRequest<T>(path, { ...init, method: 'PUT', headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }, body: body !== undefined ? JSON.stringify(body) : undefined });
const apiDelete = async (path: string, init?: RequestInit): Promise<void> => { await apiRequest<void>(path, { ...init, method: 'DELETE' }); };
const login = async (username: string, password: string): Promise<LoginResponse> => apiRequest<LoginResponse>('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password } as LoginRequest) });
const saveAuthSession = (auth: LoginResponse): void => { localStorage.setItem(ACCESS_TOKEN_KEY, auth.token); localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken || ''); localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ username: auth.username, roles: auth.roles || [] })); };
const clearAuthSession = (): void => { localStorage.removeItem(ACCESS_TOKEN_KEY); localStorage.removeItem(REFRESH_TOKEN_KEY); localStorage.removeItem(AUTH_USER_KEY); };
const getStoredAuthUser = (): { username: string; roles: string[] } | null => { const raw = localStorage.getItem(AUTH_USER_KEY); if (!raw) return null; try { const parsed = JSON.parse(raw) as { username?: string; roles?: string[] }; return parsed.username ? { username: parsed.username, roles: parsed.roles || [] } : null; } catch { return null; } };
const isAuthenticated = (): boolean => Boolean(getAccessToken());
const generateId = (prefix: string): string => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
const makeNumber = (prefix: string): string => `${prefix}-${Date.now()}`;
const nowIso = (): string => new Date().toISOString();
const sum = (items: number[]): number => items.reduce((total, item) => total + item, 0);
const round = (value: number): number => Math.round(value * 100) / 100;
const diffRentalDays = (startIso: string, endIso: string): number => Math.max(1, Math.ceil((new Date(endIso).getTime() - new Date(startIso).getTime()) / (24 * 60 * 60 * 1000)));
const fuelSurcharge = (fuelLevel: string): number => fuelLevel === 'Full' ? 0 : fuelLevel === '3/4' ? 20 : fuelLevel === '1/2' ? 45 : fuelLevel === '1/4' ? 75 : 100;
const findRatePlan = (state: MockState, vehicleClass: string): RatePlan | undefined => state.ratePlans.find((plan) => plan.vehicleClass === vehicleClass && plan.active);
const createInvoiceLine = (label: string, amount: number, category: InvoiceLineItem['category']): InvoiceLineItem => ({ id: generateId('line'), label, amount: round(amount), category });
const calculatePricingBreakdown = (ratePlan: RatePlan | undefined, vehicleClass: string, pickupDateTime: string, dropoffDateTime: string, addOnTotal = 0, overrideEstimatedTotal?: number): PricingBreakdown => {
  const rentalDays = diffRentalDays(pickupDateTime, dropoffDateTime);
  const baseRate = ratePlan?.dailyRate || (overrideEstimatedTotal ? overrideEstimatedTotal / rentalDays : vehicleClass === 'SUV' ? 120 : vehicleClass === 'Van' ? 150 : 90);
  const discountTotal = 0;
  const sub = baseRate * rentalDays + addOnTotal - discountTotal;
  const taxTotal = round(sub * (ratePlan?.taxRate ?? 0.09));
  const estimatedTotal = round(overrideEstimatedTotal ?? sub + taxTotal);
  return { ratePlanId: ratePlan?.id, baseRate: round(baseRate), rentalDays, addOnTotal: round(addOnTotal), discountTotal, taxTotal, estimatedTotal };
};
const buildInvoice = (params: { bookingId?: string; rentalId?: string; settlementId?: string; customerName: string; lineItems: InvoiceLineItem[]; status?: InvoiceStatus; }): Invoice => {
  const subtotal = round(sum(params.lineItems.filter((item) => item.category !== 'Tax').map((item) => item.amount)));
  const taxTotal = round(sum(params.lineItems.filter((item) => item.category === 'Tax').map((item) => item.amount)));
  const total = round(sum(params.lineItems.map((item) => item.amount)));
  return { id: generateId('inv'), invoiceNumber: makeNumber('INV'), bookingId: params.bookingId, rentalId: params.rentalId, settlementId: params.settlementId, customerName: params.customerName, status: params.status || 'Issued', lineItems: params.lineItems, subtotal, taxTotal, total, amountPaid: 0, balanceDue: total, issuedAt: nowIso() };
};
const applyPaymentToInvoice = (state: MockState, invoiceId: string, amount: number): void => { const invoice = state.invoices.find((item) => item.id === invoiceId); if (!invoice) return; invoice.amountPaid = round(invoice.amountPaid + amount); invoice.balanceDue = round(invoice.total - invoice.amountPaid); invoice.status = invoice.amountPaid >= invoice.total ? 'Paid' : invoice.amountPaid > 0 ? 'Partially Paid' : invoice.status; };
const applyRefundToInvoice = (state: MockState, invoiceId: string | undefined, amount: number): void => { if (!invoiceId) return; const invoice = state.invoices.find((item) => item.id === invoiceId); if (!invoice) return; invoice.amountPaid = round(Math.max(0, invoice.amountPaid - amount)); invoice.balanceDue = round(Math.max(0, invoice.total - invoice.amountPaid)); invoice.status = amount >= invoice.total ? 'Refunded' : invoice.amountPaid > 0 ? 'Partially Paid' : 'Refunded'; };
const calculateReturnOutcome = (payload: ReturnQuoteRequest): { baseCharges: number; totalCharges: number; outcome: ReturnOutcome } => { const lateCharge = payload.lateHours > 0 ? payload.lateHours * 15 : 0; const fuelCharge = fuelSurcharge(payload.fuelIn); const damageCharge = payload.damageFlag ? 250 : 0; const maintenanceCharge = payload.maintenanceFlag ? 120 : 0; const baseCharges = round(lateCharge + fuelCharge + damageCharge + maintenanceCharge); const totalCharges = round(baseCharges + payload.extraCharges); if (payload.damageFlag) return { baseCharges, totalCharges, outcome: 'Damage Review Required' }; if (payload.maintenanceFlag) return { baseCharges, totalCharges, outcome: 'Maintenance Hold' }; if (totalCharges > 0) return { baseCharges, totalCharges, outcome: 'Charges Applied' }; return { baseCharges, totalCharges, outcome: 'Clean Close' }; };
const updateVehicleStatus = (state: MockState, vehicleId: string, status: VehicleOperationalStatus): void => { state.vehicleOptions = state.vehicleOptions.map((vehicle) => vehicle.id === vehicleId ? { ...vehicle, operationalStatus: status } : vehicle); };
const seedMockState = (): MockState => {
  const now = nowIso();
  const customers: Customer[] = [
    { id: 'cust-1001', customerNumber: 'CUS-1001', fullName: 'Alicia Tan', email: 'alicia.tan@example.com', phone: '+65 9000 1200', licenseNumber: 'S1234567A', licenseExpiry: '2027-09-30', identityStatus: 'Verified', status: 'Active', notes: 'Frequent airport pickup customer.', createdAt: now },
    { id: 'cust-1002', customerNumber: 'CUS-1002', fullName: 'Marco Lim', email: 'marco.lim@example.com', phone: '+65 8123 4556', licenseNumber: 'F7654321K', licenseExpiry: '2026-12-31', identityStatus: 'Pending', status: 'Watchlist', notes: 'Requires manual ID verification before handover.', createdAt: now },
  ];
  const ratePlans: RatePlan[] = [
    { id: 'rate-001', name: 'Standard Sedan', vehicleClass: 'Sedan', dailyRate: 95, includedMileagePerDay: 250, depositAmount: 200, taxRate: 0.09, active: true, createdAt: now },
    { id: 'rate-002', name: 'Flex SUV', vehicleClass: 'SUV', dailyRate: 130, includedMileagePerDay: 250, depositAmount: 250, taxRate: 0.09, active: true, createdAt: now },
    { id: 'rate-003', name: 'Utility Van', vehicleClass: 'Van', dailyRate: 165, includedMileagePerDay: 300, depositAmount: 300, taxRate: 0.09, active: true, createdAt: now },
  ];
  const vehicleOptions: VehicleOption[] = [
    { id: 'veh-001', plateNumber: 'SGX1234A', label: 'Toyota Altis � SGX1234A', vehicleClass: 'Sedan', operationalStatus: 'available' },
    { id: 'veh-002', plateNumber: 'SMB9081T', label: 'Honda Vezel � SMB9081T', vehicleClass: 'SUV', operationalStatus: 'reserved' },
    { id: 'veh-003', plateNumber: 'SNK4567C', label: 'Toyota Hiace � SNK4567C', vehicleClass: 'Van', operationalStatus: 'rented' },
    { id: 'veh-004', plateNumber: 'SJQ7781P', label: 'Mazda 3 � SJQ7781P', vehicleClass: 'Sedan', operationalStatus: 'maintenance' },
  ];
  const bookingOnePricing = calculatePricingBreakdown(ratePlans[0], 'Sedan', new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(), new Date(Date.now() + 84 * 60 * 60 * 1000).toISOString(), 18);
  const bookingTwoPricing = calculatePricingBreakdown(ratePlans[1], 'SUV', new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString());
  const bookings: Booking[] = [
    { id: 'book-1001', bookingNumber: 'BK-1001', customerId: customers[0].id, customerName: customers[0].fullName, pickupLocation: 'Changi T3', dropoffLocation: 'City Branch', pickupDateTime: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(), dropoffDateTime: new Date(Date.now() + 84 * 60 * 60 * 1000).toISOString(), vehicleClass: 'Sedan', assignedVehicleId: 'veh-002', assignedVehiclePlate: 'SMB9081T', estimatedTotal: bookingOnePricing.estimatedTotal, depositAmount: ratePlans[0].depositAmount, pricingBreakdown: bookingOnePricing, depositStatus: 'Held', status: 'Assigned', createdAt: now, notes: 'Child seat requested.' },
    { id: 'book-1002', bookingNumber: 'BK-1002', customerId: customers[1].id, customerName: customers[1].fullName, pickupLocation: 'HQ', dropoffLocation: 'HQ', pickupDateTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), dropoffDateTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), vehicleClass: 'SUV', estimatedTotal: bookingTwoPricing.estimatedTotal, depositAmount: ratePlans[1].depositAmount, pricingBreakdown: bookingTwoPricing, depositStatus: 'Held', status: 'Confirmed', createdAt: now, notes: 'Late-night pickup window requested.' },
  ];
  const activeRentalPricing = calculatePricingBreakdown(ratePlans[2], 'Van', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), 25);
  const rentals: RentalContract[] = [
    { id: 'rent-1001', rentalNumber: 'RNT-1001', bookingId: 'book-0901', bookingNumber: 'BK-0901', customerId: customers[0].id, customerName: customers[0].fullName, vehicleId: 'veh-003', vehiclePlate: 'SNK4567C', vehicleClass: 'Van', pickupDateTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), expectedReturnDateTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), odometerOut: 45210, fuelOut: 'Full', depositAmount: ratePlans[2].depositAmount, depositStatus: 'Held', pricingBreakdown: activeRentalPricing, addOns: ['GPS'], status: 'Active', createdAt: now, notes: 'Corporate rental extension likely.' },
  ];
  const rentalInvoice = buildInvoice({ rentalId: rentals[0].id, customerName: rentals[0].customerName, lineItems: [createInvoiceLine('Rental charges', activeRentalPricing.baseRate * activeRentalPricing.rentalDays, 'Rental'), createInvoiceLine('Add-ons', activeRentalPricing.addOnTotal, 'Add-on'), createInvoiceLine('Tax', activeRentalPricing.taxTotal, 'Tax')], status: 'Issued' });
  rentalInvoice.amountPaid = rentalInvoice.total; rentalInvoice.balanceDue = 0; rentalInvoice.status = 'Paid';
  const payment: Payment = { id: 'pay-1001', paymentNumber: 'PAY-1001', invoiceId: rentalInvoice.id, customerName: customers[0].fullName, amount: rentalInvoice.total, method: 'Card', status: 'Captured', paymentType: 'Invoice', createdAt: now };
  return { customers, bookings, rentals, returns: [], vehicleOptions, ratePlans, invoices: [rentalInvoice], payments: [payment], refunds: [], settlements: [] };
};

const loadMockState = (): MockState => {
  const raw = localStorage.getItem(MOCK_STATE_KEY);
  if (!raw) { const seeded = seedMockState(); localStorage.setItem(MOCK_STATE_KEY, JSON.stringify(seeded)); return seeded; }
  try { return JSON.parse(raw) as MockState; } catch { const seeded = seedMockState(); localStorage.setItem(MOCK_STATE_KEY, JSON.stringify(seeded)); return seeded; }
};
const saveMockState = (state: MockState): void => { localStorage.setItem(MOCK_STATE_KEY, JSON.stringify(state)); };
const withMockState = async <T>(mutator: (state: MockState) => T): Promise<T> => { const state = loadMockState(); const result = mutator(state); saveMockState(state); return result; };

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
const listVehicleOptions = async (): Promise<VehicleOption[]> => withMockState((state) => state.vehicleOptions);
const getRatePlans = async (): Promise<RatePlan[]> => withMockState((state) => state.ratePlans);
const createRatePlan = async (payload: RatePlanRequest): Promise<RatePlan> => withMockState((state) => { const ratePlan: RatePlan = { id: generateId('rate'), createdAt: nowIso(), ...payload }; state.ratePlans = [ratePlan, ...state.ratePlans]; return ratePlan; });
const updateRatePlan = async (id: string, payload: Partial<RatePlanRequest>): Promise<RatePlan> => withMockState((state) => { const index = state.ratePlans.findIndex((item) => item.id === id); if (index === -1) throw new Error('Rate plan not found'); state.ratePlans[index] = { ...state.ratePlans[index], ...payload }; return state.ratePlans[index]; });
const getBookings = async (filter?: BookingFilter): Promise<Booking[]> => withMockState((state) => { const query = filter?.query?.trim().toLowerCase(); return state.bookings.filter((booking) => { const matchesStatus = !filter?.status || filter.status === 'All' || booking.status === filter.status; const matchesQuery = !query || [booking.bookingNumber, booking.customerName, booking.pickupLocation, booking.dropoffLocation].some((value) => value.toLowerCase().includes(query)); return matchesStatus && matchesQuery; }); });
const getBookingById = async (id: string): Promise<Booking | undefined> => withMockState((state) => state.bookings.find((booking) => booking.id === id));
const getBookingQuoteBreakdown = async (id: string): Promise<PricingBreakdown | undefined> => withMockState((state) => state.bookings.find((booking) => booking.id === id)?.pricingBreakdown);
const createBooking = async (payload: BookingRequest): Promise<Booking> => withMockState((state) => { const customer = state.customers.find((item) => item.id === payload.customerId); if (!customer) throw new Error('Customer not found'); const ratePlan = findRatePlan(state, payload.vehicleClass); const pricingBreakdown = calculatePricingBreakdown(ratePlan, payload.vehicleClass, payload.pickupDateTime, payload.dropoffDateTime, 0, payload.estimatedTotal || undefined); const booking: Booking = { id: generateId('book'), bookingNumber: makeNumber('BK'), customerId: customer.id, customerName: customer.fullName, pickupLocation: payload.pickupLocation, dropoffLocation: payload.dropoffLocation, pickupDateTime: payload.pickupDateTime, dropoffDateTime: payload.dropoffDateTime, vehicleClass: payload.vehicleClass, estimatedTotal: pricingBreakdown.estimatedTotal, depositAmount: ratePlan?.depositAmount || payload.depositAmount, pricingBreakdown, depositStatus: 'Held', status: 'Draft', createdAt: nowIso(), notes: payload.notes }; state.bookings = [booking, ...state.bookings]; return booking; });
const updateBooking = async (id: string, payload: Partial<BookingRequest>): Promise<Booking> => withMockState((state) => { const index = state.bookings.findIndex((booking) => booking.id === id); if (index === -1) throw new Error('Booking not found'); const current = state.bookings[index]; const nextVehicleClass = payload.vehicleClass || current.vehicleClass; const nextPickup = payload.pickupDateTime || current.pickupDateTime; const nextDropoff = payload.dropoffDateTime || current.dropoffDateTime; const ratePlan = findRatePlan(state, nextVehicleClass); const pricingBreakdown = calculatePricingBreakdown(ratePlan, nextVehicleClass, nextPickup, nextDropoff, current.pricingBreakdown.addOnTotal, payload.estimatedTotal); state.bookings[index] = { ...current, ...payload, vehicleClass: nextVehicleClass, pickupDateTime: nextPickup, dropoffDateTime: nextDropoff, pricingBreakdown, estimatedTotal: pricingBreakdown.estimatedTotal, depositAmount: payload.depositAmount ?? ratePlan?.depositAmount ?? current.depositAmount }; return state.bookings[index]; });
const confirmBooking = async (id: string): Promise<Booking> => withMockState((state) => { const booking = state.bookings.find((item) => item.id === id); if (!booking) throw new Error('Booking not found'); booking.status = booking.assignedVehicleId ? 'Assigned' : 'Confirmed'; return booking; });
const cancelBooking = async (id: string): Promise<Booking> => withMockState((state) => { const booking = state.bookings.find((item) => item.id === id); if (!booking) throw new Error('Booking not found'); booking.status = 'Cancelled'; if (booking.assignedVehicleId) updateVehicleStatus(state, booking.assignedVehicleId, 'available'); return booking; });
const assignVehicleToBooking = async (id: string, vehicleId: string): Promise<Booking> => withMockState((state) => { const booking = state.bookings.find((item) => item.id === id); const vehicle = state.vehicleOptions.find((item) => item.id === vehicleId); if (!booking || !vehicle) throw new Error('Booking or vehicle not found'); booking.assignedVehicleId = vehicle.id; booking.assignedVehiclePlate = vehicle.plateNumber; booking.status = 'Assigned'; updateVehicleStatus(state, vehicle.id, 'reserved'); return booking; });
const getCustomers = async (filter?: CustomerFilter): Promise<Customer[]> => withMockState((state) => { const query = filter?.query?.trim().toLowerCase(); return state.customers.filter((customer) => !query || [customer.fullName, customer.email, customer.phone, customer.licenseNumber].some((value) => value.toLowerCase().includes(query))); });
const getCustomerById = async (id: string): Promise<Customer | undefined> => withMockState((state) => state.customers.find((customer) => customer.id === id));
const createCustomer = async (payload: CustomerRequest): Promise<Customer> => withMockState((state) => { const customer: Customer = { id: generateId('cust'), customerNumber: makeNumber('CUS'), createdAt: nowIso(), ...payload }; state.customers = [customer, ...state.customers]; return customer; });
const updateCustomer = async (id: string, payload: Partial<CustomerRequest>): Promise<Customer> => withMockState((state) => { const index = state.customers.findIndex((customer) => customer.id === id); if (index === -1) throw new Error('Customer not found'); state.customers[index] = { ...state.customers[index], ...payload }; return state.customers[index]; });
const searchCustomers = async (query: string): Promise<Customer[]> => getCustomers({ query });
const getCustomerHistorySummary = async (customerId: string): Promise<CustomerHistorySummary> => withMockState((state) => { const bookings = state.bookings.filter((booking) => booking.customerId === customerId); const rentals = state.rentals.filter((rental) => rental.customerId === customerId); return { bookings: bookings.length, rentals: rentals.length, activeRentals: rentals.filter((rental) => rental.status === 'Active' || rental.status === 'Overdue').length, lastBookingDate: bookings[0]?.createdAt }; });
const getRentals = async (): Promise<RentalContract[]> => withMockState((state) => state.rentals);
const getRentalById = async (id: string): Promise<RentalContract | undefined> => withMockState((state) => state.rentals.find((rental) => rental.id === id));
const getRentalFinancialSummary = async (id: string): Promise<{ pricingBreakdown: PricingBreakdown; depositStatus: DepositStatus; depositAmount: number } | undefined> => withMockState((state) => { const rental = state.rentals.find((item) => item.id === id); return rental ? { pricingBreakdown: rental.pricingBreakdown, depositStatus: rental.depositStatus, depositAmount: rental.depositAmount } : undefined; });
const createRentalFromBooking = async (payload: RentalCreateRequest): Promise<RentalContract> => withMockState((state) => {
  const booking = state.bookings.find((item) => item.id === payload.bookingId);
  const vehicle = state.vehicleOptions.find((item) => item.id === payload.vehicleId);
  if (!booking || !vehicle) throw new Error('Booking or vehicle not found');
  const addOnTotal = payload.addOns.length * 15;
  const pricingBreakdown = calculatePricingBreakdown(findRatePlan(state, booking.vehicleClass), booking.vehicleClass, booking.pickupDateTime, booking.dropoffDateTime, addOnTotal);
  const rental: RentalContract = { id: generateId('rent'), rentalNumber: makeNumber('RNT'), bookingId: booking.id, bookingNumber: booking.bookingNumber, customerId: booking.customerId, customerName: booking.customerName, vehicleId: vehicle.id, vehiclePlate: vehicle.plateNumber, vehicleClass: booking.vehicleClass, pickupDateTime: booking.pickupDateTime, expectedReturnDateTime: booking.dropoffDateTime, odometerOut: payload.odometerOut, fuelOut: payload.fuelOut, depositAmount: payload.depositAmount || booking.depositAmount, depositStatus: booking.depositStatus, pricingBreakdown, addOns: payload.addOns, status: 'Reserved', createdAt: nowIso(), notes: payload.notes };
  booking.assignedVehicleId = vehicle.id; booking.assignedVehiclePlate = vehicle.plateNumber; booking.status = 'Assigned';
  updateVehicleStatus(state, vehicle.id, 'reserved');
  state.rentals = [rental, ...state.rentals];
  state.invoices = [buildInvoice({ bookingId: booking.id, rentalId: rental.id, customerName: rental.customerName, lineItems: [createInvoiceLine(`${rental.vehicleClass} rental`, pricingBreakdown.baseRate * pricingBreakdown.rentalDays, 'Rental'), createInvoiceLine('Add-ons', pricingBreakdown.addOnTotal, 'Add-on'), createInvoiceLine('Tax', pricingBreakdown.taxTotal, 'Tax')], status: 'Draft' }), ...state.invoices];
  return rental;
});
const startRental = async (id: string): Promise<RentalContract> => withMockState((state) => { const rental = state.rentals.find((item) => item.id === id); if (!rental) throw new Error('Rental not found'); rental.status = 'Active'; const booking = state.bookings.find((item) => item.id === rental.bookingId); if (booking) booking.status = 'Checked Out'; updateVehicleStatus(state, rental.vehicleId, 'rented'); const invoice = state.invoices.find((item) => item.rentalId === rental.id && item.status === 'Draft'); if (invoice) invoice.status = 'Issued'; return rental; });
const extendRental = async (id: string, payload: RentalExtendRequest): Promise<RentalContract> => withMockState((state) => { const rental = state.rentals.find((item) => item.id === id); if (!rental) throw new Error('Rental not found'); rental.expectedReturnDateTime = payload.expectedReturnDateTime; rental.notes = payload.notes || rental.notes; rental.pricingBreakdown = calculatePricingBreakdown(findRatePlan(state, rental.vehicleClass), rental.vehicleClass, rental.pickupDateTime, rental.expectedReturnDateTime, rental.pricingBreakdown.addOnTotal); return rental; });
const closeRental = async (id: string): Promise<RentalContract> => withMockState((state) => { const rental = state.rentals.find((item) => item.id === id); if (!rental) throw new Error('Rental not found'); rental.status = 'Closed'; rental.actualReturnDateTime = nowIso(); updateVehicleStatus(state, rental.vehicleId, 'available'); const booking = state.bookings.find((item) => item.id === rental.bookingId); if (booking) booking.status = 'Completed'; return rental; });
const quoteReturnCharges = async (payload: ReturnQuoteRequest): Promise<{ baseCharges: number; totalCharges: number; outcome: ReturnOutcome }> => calculateReturnOutcome(payload);
const getReturns = async (): Promise<ReturnAssessment[]> => withMockState((state) => state.returns);
const submitReturn = async (payload: ReturnSubmitRequest): Promise<ReturnAssessment> => withMockState((state) => {
  const rental = state.rentals.find((item) => item.id === payload.rentalId);
  if (!rental) throw new Error('Rental not found');
  const charges = calculateReturnOutcome(payload);
  const assessment: ReturnAssessment = { id: generateId('ret'), returnNumber: makeNumber('RET'), rentalId: rental.id, rentalNumber: rental.rentalNumber, bookingNumber: rental.bookingNumber, customerName: rental.customerName, vehiclePlate: rental.vehiclePlate, odometerIn: payload.odometerIn, fuelIn: payload.fuelIn, checklistId: payload.checklistId, damageFlag: payload.damageFlag, maintenanceFlag: payload.maintenanceFlag, lateHours: payload.lateHours, baseCharges: charges.baseCharges, extraCharges: payload.extraCharges, totalCharges: charges.totalCharges, outcome: charges.outcome, submittedAt: nowIso(), notes: payload.notes };
  const depositHeld = rental.depositAmount;
  const depositApplied = Math.min(depositHeld, assessment.totalCharges);
  const amountDue = round(Math.max(0, assessment.totalCharges - depositHeld));
  const amountRefundable = round(Math.max(0, depositHeld - assessment.totalCharges));
  const settlementInvoice = buildInvoice({ rentalId: rental.id, customerName: rental.customerName, lineItems: [createInvoiceLine('Return charges', assessment.totalCharges, 'Penalty')], status: amountDue > 0 ? 'Issued' : 'Paid' });
  if (amountDue === 0) { settlementInvoice.amountPaid = settlementInvoice.total; settlementInvoice.balanceDue = 0; }
  state.invoices = [settlementInvoice, ...state.invoices];
  let refundId: string | undefined;
  if (amountRefundable > 0) { const refund: Refund = { id: generateId('refund'), refundNumber: makeNumber('RFD'), settlementId: '', invoiceId: settlementInvoice.id, customerName: rental.customerName, amount: amountRefundable, reason: 'Unused deposit refund', status: 'Processed', createdAt: nowIso() }; refundId = refund.id; state.refunds = [refund, ...state.refunds]; }
  const settlement: SettlementSummary = { id: generateId('settle'), settlementNumber: makeNumber('SET'), rentalId: rental.id, returnId: assessment.id, customerName: rental.customerName, vehiclePlate: rental.vehiclePlate, depositHeld, depositApplied, depositRefunded: amountRefundable, returnCharges: assessment.totalCharges, invoiceId: settlementInvoice.id, refundId, amountDue, amountRefundable, status: amountRefundable > 0 ? 'Refunded' : amountDue > 0 ? 'Open' : 'Settled', createdAt: nowIso() };
  assessment.settlementId = settlement.id;
  if (refundId) { const refund = state.refunds.find((item) => item.id === refundId); if (refund) refund.settlementId = settlement.id; }
  state.settlements = [settlement, ...state.settlements];
  rental.odometerIn = payload.odometerIn; rental.fuelIn = payload.fuelIn; rental.actualReturnDateTime = assessment.submittedAt; rental.status = 'Closed'; rental.depositStatus = amountRefundable > 0 ? 'Refunded' : amountDue > 0 || depositApplied === depositHeld ? 'Applied' : 'Partially Refunded';
  const booking = state.bookings.find((item) => item.id === rental.bookingId); if (booking) { booking.status = 'Completed'; booking.depositStatus = rental.depositStatus; }
  updateVehicleStatus(state, rental.vehicleId, charges.outcome === 'Damage Review Required' ? 'inspection_hold' : charges.outcome === 'Maintenance Hold' ? 'maintenance' : 'available');
  state.returns = [assessment, ...state.returns];
  return assessment;
});
const finalizeReturn = async (id: string): Promise<ReturnAssessment> => withMockState((state) => { const assessment = state.returns.find((item) => item.id === id); if (!assessment) throw new Error('Return assessment not found'); return assessment; });
const getInvoices = async (): Promise<Invoice[]> => withMockState((state) => state.invoices);
const getInvoiceById = async (id: string): Promise<Invoice | undefined> => withMockState((state) => state.invoices.find((invoice) => invoice.id === id));
const createPayment = async (payload: PaymentCreateRequest): Promise<Payment> => withMockState((state) => {
  const invoice = state.invoices.find((item) => item.id === payload.invoiceId);
  if (!invoice) throw new Error('Invoice not found');
  const payment: Payment = { id: generateId('pay'), paymentNumber: makeNumber('PAY'), invoiceId: payload.invoiceId, customerName: payload.customerName, amount: round(payload.amount), method: payload.method, status: 'Captured', paymentType: payload.paymentType, createdAt: nowIso() };
  state.payments = [payment, ...state.payments];
  applyPaymentToInvoice(state, payload.invoiceId, payment.amount);
  const settlement = state.settlements.find((item) => item.invoiceId === payload.invoiceId); if (settlement && settlement.amountDue <= payment.amount) settlement.status = 'Settled';
  return payment;
});
const getPayments = async (): Promise<Payment[]> => withMockState((state) => state.payments);
const processRefund = async (payload: RefundRequest): Promise<Refund> => withMockState((state) => {
  const refund: Refund = { id: generateId('refund'), refundNumber: makeNumber('RFD'), invoiceId: payload.invoiceId, settlementId: payload.settlementId, customerName: payload.customerName, amount: round(payload.amount), reason: payload.reason, status: 'Processed', createdAt: nowIso() };
  state.refunds = [refund, ...state.refunds];
  applyRefundToInvoice(state, payload.invoiceId, refund.amount);
  const settlement = state.settlements.find((item) => item.id === payload.settlementId); if (settlement) { settlement.refundId = refund.id; settlement.amountRefundable = round(Math.max(0, settlement.amountRefundable - refund.amount)); settlement.depositRefunded = round(settlement.depositRefunded + refund.amount); settlement.status = 'Refunded'; }
  return refund;
});
const getRefunds = async (): Promise<Refund[]> => withMockState((state) => state.refunds);
const getSettlements = async (): Promise<SettlementSummary[]> => withMockState((state) => state.settlements);
const getSettlementById = async (id: string): Promise<SettlementSummary | undefined> => withMockState((state) => state.settlements.find((settlement) => settlement.id === id));

export {
  API_BASE_URL, AUTH_UNAUTHORIZED_EVENT, buildApiUrl, apiGet, apiPost, apiPut, apiDelete, login, saveAuthSession, clearAuthSession, getStoredAuthUser, isAuthenticated,
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
