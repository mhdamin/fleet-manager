import { getBookings, getCustomers, getInvoices, getPayments, getRatePlans, getRentals } from './api';
import { ApprovalRequest, Branch, NotificationEvent, TransferRequest } from '../types';

const ENTERPRISE_STATE_KEY = 'fleet.phase4.enterprise-state';

type EnterpriseState = {
  branches: Branch[];
  transfers: TransferRequest[];
  approvals: ApprovalRequest[];
  notifications: NotificationEvent[];
};

const nowIso = (): string => new Date().toISOString();
const generateId = (prefix: string): string => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
const makeNumber = (prefix: string): string => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

const seedState = (): EnterpriseState => ({
  branches: [
    { id: 'br-001', code: 'HQ', name: 'Headquarters', city: 'Singapore', manager: 'Sarah Lee', vehicleCount: 42, active: true },
    { id: 'br-002', code: 'CTY', name: 'City Branch', city: 'Singapore', manager: 'Adam Ng', vehicleCount: 26, active: true },
    { id: 'br-003', code: 'AIR', name: 'Airport Branch', city: 'Singapore', manager: 'Maya Chen', vehicleCount: 18, active: true },
  ],
  transfers: [
    { id: 'tr-001', requestNumber: 'TRF-1001', vehiclePlate: 'SGX1234A', fromBranch: 'Headquarters', toBranch: 'Airport Branch', requestedBy: 'Sarah Lee', status: 'Requested', eta: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), createdAt: nowIso() },
  ],
  approvals: [
    { id: 'ap-001', approvalNumber: 'APR-1001', category: 'Refund', requester: 'Finance Desk', summary: 'Approve refund above $150 for settlement SET-1001.', approver: 'Regional Manager', status: 'Pending', createdAt: nowIso() },
    { id: 'ap-002', approvalNumber: 'APR-1002', category: 'Transfer', requester: 'Operations Desk', summary: 'Approve urgent branch transfer for airport demand.', approver: 'Fleet Director', status: 'Pending', createdAt: nowIso() },
  ],
  notifications: [
    { id: 'nt-001', title: 'Airport demand spike', body: 'Transfer review needed for additional sedan inventory at Airport Branch.', channel: 'Operations', status: 'Unread', createdAt: nowIso() },
    { id: 'nt-002', title: 'Refund approval pending', body: 'One refund request exceeds auto-approval threshold.', channel: 'Finance', status: 'Unread', createdAt: nowIso() },
  ],
});

const loadState = (): EnterpriseState => {
  const raw = localStorage.getItem(ENTERPRISE_STATE_KEY);
  if (!raw) {
    const seeded = seedState();
    localStorage.setItem(ENTERPRISE_STATE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try { return JSON.parse(raw) as EnterpriseState; } catch {
    const seeded = seedState();
    localStorage.setItem(ENTERPRISE_STATE_KEY, JSON.stringify(seeded));
    return seeded;
  }
};

const saveState = (state: EnterpriseState): void => {
  localStorage.setItem(ENTERPRISE_STATE_KEY, JSON.stringify(state));
};

const syncNotifications = async (): Promise<EnterpriseState> => {
  const state = loadState();
  const [bookings, rentals, invoices, payments, customers, ratePlans] = await Promise.all([
    getBookings(),
    getRentals(),
    getInvoices(),
    getPayments(),
    getCustomers(),
    getRatePlans(),
  ]);

  const derived = [
    { title: 'Customer portal ready', body: `${customers.length} customer accounts now have access to bookings and invoices.`, channel: 'Customer' as const },
    { title: 'Pricing catalog refreshed', body: `${ratePlans.filter((plan) => plan.active).length} active rate plans are available for quoting.`, channel: 'Finance' as const },
    { title: 'Production demand snapshot', body: `${bookings.length} bookings and ${rentals.length} rentals currently active in the system.`, channel: 'Operations' as const },
    { title: 'Collections snapshot', body: `${invoices.filter((invoice) => invoice.balanceDue > 0).length} invoices still have open balances; ${payments.length} payments captured.`, channel: 'Finance' as const },
  ];

  derived.forEach((item) => {
    const exists = state.notifications.find((notification) => notification.title === item.title);
    if (!exists) {
      state.notifications.unshift({ id: generateId('nt'), title: item.title, body: item.body, channel: item.channel, status: 'Unread', createdAt: nowIso() });
    }
  });

  saveState(state);
  return state;
};

const getBranches = async (): Promise<Branch[]> => (await syncNotifications()).branches;
const getTransferRequests = async (): Promise<TransferRequest[]> => (await syncNotifications()).transfers;
const getApprovalRequests = async (): Promise<ApprovalRequest[]> => (await syncNotifications()).approvals;
const getNotificationEvents = async (): Promise<NotificationEvent[]> => (await syncNotifications()).notifications;

const createTransferRequest = async (payload: Omit<TransferRequest, 'id' | 'requestNumber' | 'createdAt'>): Promise<TransferRequest> => {
  const state = await syncNotifications();
  const transfer: TransferRequest = { id: generateId('tr'), requestNumber: makeNumber('TRF'), createdAt: nowIso(), ...payload };
  state.transfers = [transfer, ...state.transfers];
  state.notifications.unshift({ id: generateId('nt'), title: 'Transfer request created', body: `${transfer.vehiclePlate} requested from ${transfer.fromBranch} to ${transfer.toBranch}.`, channel: 'Operations', status: 'Unread', createdAt: nowIso() });
  saveState(state);
  return transfer;
};

const updateTransferRequest = async (id: string, payload: Partial<TransferRequest>): Promise<TransferRequest> => {
  const state = await syncNotifications();
  const index = state.transfers.findIndex((item) => item.id === id);
  if (index === -1) throw new Error('Transfer request not found');
  state.transfers[index] = { ...state.transfers[index], ...payload };
  saveState(state);
  return state.transfers[index];
};

const updateApprovalRequest = async (id: string, payload: Partial<ApprovalRequest>): Promise<ApprovalRequest> => {
  const state = await syncNotifications();
  const index = state.approvals.findIndex((item) => item.id === id);
  if (index === -1) throw new Error('Approval request not found');
  state.approvals[index] = { ...state.approvals[index], ...payload };
  saveState(state);
  return state.approvals[index];
};

const markNotificationRead = async (id: string): Promise<NotificationEvent> => {
  const state = await syncNotifications();
  const index = state.notifications.findIndex((item) => item.id === id);
  if (index === -1) throw new Error('Notification not found');
  state.notifications[index] = { ...state.notifications[index], status: 'Read' };
  saveState(state);
  return state.notifications[index];
};

export {
  getBranches,
  getTransferRequests,
  getApprovalRequests,
  getNotificationEvents,
  createTransferRequest,
  updateTransferRequest,
  updateApprovalRequest,
  markNotificationRead,
};
