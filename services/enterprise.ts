import { apiGet, apiPatch, apiPost } from './api';
import { ApprovalRequest, Branch, NotificationEvent, TransferRequest } from '../types';

const getBranches = async (): Promise<Branch[]> => apiGet<Branch[]>('/api/branches');
const getTransferRequests = async (): Promise<TransferRequest[]> => apiGet<TransferRequest[]>('/api/transfers');
const getApprovalRequests = async (): Promise<ApprovalRequest[]> => apiGet<ApprovalRequest[]>('/api/approvals');
const getNotificationEvents = async (): Promise<NotificationEvent[]> => apiGet<NotificationEvent[]>('/api/notifications');

const createTransferRequest = async (payload: Omit<TransferRequest, 'id' | 'requestNumber' | 'createdAt'>): Promise<TransferRequest> => apiPost<TransferRequest>('/api/transfers', payload);
const updateTransferRequest = async (id: string, payload: Partial<TransferRequest>): Promise<TransferRequest> => apiPatch<TransferRequest>(`/api/transfers/${id}`, payload);
const updateApprovalRequest = async (id: string, payload: Partial<ApprovalRequest>): Promise<ApprovalRequest> => apiPatch<ApprovalRequest>(`/api/approvals/${id}`, payload);
const markNotificationRead = async (id: string): Promise<NotificationEvent> => apiPost<NotificationEvent>(`/api/notifications/${id}/read`);

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
