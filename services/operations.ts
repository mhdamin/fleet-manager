import { apiGet, apiPatch } from './api';
import { DamageCase, MaintenanceWorkOrder, OperationalException } from '../types';

const getMaintenanceWorkOrders = async (): Promise<MaintenanceWorkOrder[]> => apiGet<MaintenanceWorkOrder[]>('/api/operations/work-orders');
const getDamageCases = async (): Promise<DamageCase[]> => apiGet<DamageCase[]>('/api/operations/damage-cases');
const getOperationalExceptions = async (): Promise<OperationalException[]> => apiGet<OperationalException[]>('/api/operations/exceptions');

const updateWorkOrder = async (id: string, payload: Partial<MaintenanceWorkOrder>): Promise<MaintenanceWorkOrder> => apiPatch<MaintenanceWorkOrder>(`/api/operations/work-orders/${id}`, payload);
const updateDamageCase = async (id: string, payload: Partial<DamageCase>): Promise<DamageCase> => apiPatch<DamageCase>(`/api/operations/damage-cases/${id}`, payload);
const updateOperationalException = async (id: string, payload: Partial<OperationalException>): Promise<OperationalException> => apiPatch<OperationalException>(`/api/operations/exceptions/${id}`, payload);

export {
  getMaintenanceWorkOrders,
  getDamageCases,
  getOperationalExceptions,
  updateWorkOrder,
  updateDamageCase,
  updateOperationalException,
};
