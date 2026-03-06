import { getReturns, getSettlements } from './api';
import { DamageCase, MaintenanceWorkOrder, OperationalException } from '../types';

const OPS_STATE_KEY = 'fleet.phase3.ops-state';

type OpsState = {
  workOrders: MaintenanceWorkOrder[];
  damageCases: DamageCase[];
  exceptions: OperationalException[];
};

const nowIso = (): string => new Date().toISOString();
const generateId = (prefix: string): string => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
const makeNumber = (prefix: string): string => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

const loadState = (): OpsState => {
  const raw = localStorage.getItem(OPS_STATE_KEY);
  if (!raw) return { workOrders: [], damageCases: [], exceptions: [] };
  try { return JSON.parse(raw) as OpsState; } catch { return { workOrders: [], damageCases: [], exceptions: [] }; }
};

const saveState = (state: OpsState): void => {
  localStorage.setItem(OPS_STATE_KEY, JSON.stringify(state));
};

const syncDerivedState = async (): Promise<OpsState> => {
  const state = loadState();
  const [returns, settlements] = await Promise.all([getReturns(), getSettlements()]);

  returns.filter((item) => item.outcome === 'Maintenance Hold').forEach((item) => {
    const existing = state.workOrders.find((workOrder) => workOrder.returnId === item.id);
    if (!existing) {
      state.workOrders.unshift({
        id: generateId('wo'),
        workOrderNumber: makeNumber('WO'),
        rentalId: item.rentalId,
        returnId: item.id,
        vehiclePlate: item.vehiclePlate,
        issueSummary: item.notes || 'Vehicle flagged for maintenance after return assessment.',
        priority: item.totalCharges > 150 ? 'High' : 'Medium',
        assignee: 'Workshop Desk',
        estimatedCost: item.totalCharges,
        status: 'Open',
        createdAt: nowIso(),
      });
    }
  });

  returns.filter((item) => item.outcome === 'Damage Review Required').forEach((item) => {
    const existing = state.damageCases.find((damageCase) => damageCase.returnId === item.id);
    if (!existing) {
      state.damageCases.unshift({
        id: generateId('dc'),
        caseNumber: makeNumber('DMG'),
        rentalId: item.rentalId,
        returnId: item.id,
        vehiclePlate: item.vehiclePlate,
        customerName: item.customerName,
        description: item.notes || 'Damage review triggered from return inspection.',
        severity: item.totalCharges > 250 ? 'Major' : item.totalCharges > 100 ? 'Moderate' : 'Minor',
        estimatedRepairCost: item.totalCharges,
        insuranceStatus: 'Unsubmitted',
        status: 'Open',
        createdAt: nowIso(),
      });
    }
  });

  state.workOrders.forEach((workOrder) => {
    const existing = state.exceptions.find((item) => item.type === 'Maintenance' && item.linkedId === workOrder.id);
    if (!existing) {
      state.exceptions.unshift({
        id: generateId('exc'),
        referenceNumber: makeNumber('EXP'),
        type: 'Maintenance',
        linkedId: workOrder.id,
        vehiclePlate: workOrder.vehiclePlate,
        summary: workOrder.issueSummary,
        owner: workOrder.assignee,
        status: workOrder.status === 'Completed' ? 'Resolved' : 'Open',
        createdAt: workOrder.createdAt,
      });
    }
  });

  state.damageCases.forEach((damageCase) => {
    const existing = state.exceptions.find((item) => item.type === 'Damage' && item.linkedId === damageCase.id);
    if (!existing) {
      state.exceptions.unshift({
        id: generateId('exc'),
        referenceNumber: makeNumber('EXP'),
        type: 'Damage',
        linkedId: damageCase.id,
        vehiclePlate: damageCase.vehiclePlate,
        customerName: damageCase.customerName,
        summary: damageCase.description,
        owner: 'Claims Desk',
        status: damageCase.status === 'Resolved' ? 'Resolved' : 'Open',
        createdAt: damageCase.createdAt,
      });
    }
  });

  settlements.filter((settlement) => settlement.amountDue > 0).forEach((settlement) => {
    const existing = state.exceptions.find((item) => item.type === 'Settlement' && item.linkedId === settlement.id);
    if (!existing) {
      state.exceptions.unshift({
        id: generateId('exc'),
        referenceNumber: makeNumber('EXP'),
        type: 'Settlement',
        linkedId: settlement.id,
        vehiclePlate: settlement.vehiclePlate,
        customerName: settlement.customerName,
        summary: `Outstanding settlement balance of $${settlement.amountDue.toFixed(2)} requires follow-up.`,
        owner: 'Finance Desk',
        status: settlement.status === 'Settled' ? 'Resolved' : 'Open',
        createdAt: settlement.createdAt,
      });
    }
  });

  saveState(state);
  return state;
};

const getMaintenanceWorkOrders = async (): Promise<MaintenanceWorkOrder[]> => (await syncDerivedState()).workOrders;
const getDamageCases = async (): Promise<DamageCase[]> => (await syncDerivedState()).damageCases;
const getOperationalExceptions = async (): Promise<OperationalException[]> => (await syncDerivedState()).exceptions;

const updateWorkOrder = async (id: string, payload: Partial<MaintenanceWorkOrder>): Promise<MaintenanceWorkOrder> => {
  const state = await syncDerivedState();
  const index = state.workOrders.findIndex((item) => item.id === id);
  if (index === -1) throw new Error('Work order not found');
  state.workOrders[index] = { ...state.workOrders[index], ...payload };
  state.exceptions = state.exceptions.map((item) =>
    item.type === 'Maintenance' && item.linkedId === id
      ? { ...item, owner: state.workOrders[index].assignee, summary: state.workOrders[index].issueSummary, status: state.workOrders[index].status === 'Completed' ? 'Resolved' : item.status }
      : item
  );
  saveState(state);
  return state.workOrders[index];
};

const updateDamageCase = async (id: string, payload: Partial<DamageCase>): Promise<DamageCase> => {
  const state = await syncDerivedState();
  const index = state.damageCases.findIndex((item) => item.id === id);
  if (index === -1) throw new Error('Damage case not found');
  state.damageCases[index] = { ...state.damageCases[index], ...payload };
  state.exceptions = state.exceptions.map((item) =>
    item.type === 'Damage' && item.linkedId === id
      ? { ...item, summary: state.damageCases[index].description, status: state.damageCases[index].status === 'Resolved' ? 'Resolved' : item.status }
      : item
  );
  saveState(state);
  return state.damageCases[index];
};

const updateOperationalException = async (id: string, payload: Partial<OperationalException>): Promise<OperationalException> => {
  const state = await syncDerivedState();
  const index = state.exceptions.findIndex((item) => item.id === id);
  if (index === -1) throw new Error('Exception not found');
  state.exceptions[index] = { ...state.exceptions[index], ...payload };
  saveState(state);
  return state.exceptions[index];
};

export {
  getMaintenanceWorkOrders,
  getDamageCases,
  getOperationalExceptions,
  updateWorkOrder,
  updateDamageCase,
  updateOperationalException,
};
