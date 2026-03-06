import React, { useEffect, useMemo, useState } from 'react';
import { Wrench, PlusCircle } from 'lucide-react';
import { Button, FormField, ModalShell, SectionHeader, SelectInput, StatCard, StatusBadge, TableCard, TextArea, TextInput } from './AppUI';
import { getMaintenanceWorkOrders, updateWorkOrder } from '../services/operations';
import { MaintenanceWorkOrder } from '../types';

const Maintenance: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<MaintenanceWorkOrder[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [selected, setSelected] = useState<MaintenanceWorkOrder | null>(null);
  const [form, setForm] = useState<{ status: MaintenanceWorkOrder['status']; assignee: string; vendor: string; issueSummary: string }>({ status: 'Open', assignee: '', vendor: '', issueSummary: '' });
  const [saving, setSaving] = useState(false);

  const loadData = async () => { try { setWorkOrders(await getMaintenanceWorkOrders()); setWarning(null); } catch { setWarning('Unable to load maintenance work orders.'); } };
  useEffect(() => { loadData(); }, []);
  const metrics = useMemo(() => ({ total: workOrders.length, open: workOrders.filter((item) => item.status === 'Open').length, inProgress: workOrders.filter((item) => item.status === 'In Progress' || item.status === 'Waiting Parts').length, completed: workOrders.filter((item) => item.status === 'Completed').length }), [workOrders]);
  const openEditor = (workOrder: MaintenanceWorkOrder) => { setSelected(workOrder); setForm({ status: workOrder.status, assignee: workOrder.assignee, vendor: workOrder.vendor || '', issueSummary: workOrder.issueSummary }); };
  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!selected) return; setSaving(true); try { await updateWorkOrder(selected.id, form); setSelected(null); await loadData(); } catch { setWarning('Failed to update work order.'); } finally { setSaving(false); } };

  return (
    <div className="app-grid" style={{ gap: 24 }}>
      <SectionHeader title="Maintenance Work Orders" description="Track post-return maintenance holds, workshop progress, and repair ownership." warning={warning} />
      <div className="app-grid app-grid--stats">
        <StatCard label="Work Orders" value={metrics.total} icon={<Wrench size={20} />} />
        <StatCard label="Open" value={metrics.open} />
        <StatCard label="In Progress" value={metrics.inProgress} />
        <StatCard label="Completed" value={metrics.completed} />
      </div>
      <TableCard><div className="app-table-wrap"><table className="app-table"><thead><tr><th>Work Order</th><th>Vehicle</th><th>Priority</th><th>Owner</th><th>Estimate</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead><tbody>{workOrders.length === 0 ? <tr><td colSpan={7} className="app-empty">No maintenance holds yet.</td></tr> : workOrders.map((workOrder) => <tr key={workOrder.id}><td><div style={{ fontWeight: 600 }}>{workOrder.workOrderNumber}</div><div className="app-muted" style={{ fontSize: 12 }}>{workOrder.issueSummary}</div></td><td>{workOrder.vehiclePlate}</td><td><StatusBadge tone={workOrder.priority === 'High' ? 'danger' : workOrder.priority === 'Medium' ? 'warning' : 'neutral'}>{workOrder.priority}</StatusBadge></td><td>{workOrder.assignee}</td><td>${workOrder.estimatedCost.toFixed(2)}</td><td><StatusBadge tone={workOrder.status === 'Completed' ? 'success' : workOrder.status === 'Waiting Parts' ? 'warning' : 'neutral'}>{workOrder.status}</StatusBadge></td><td><div style={{ display: 'flex', justifyContent: 'flex-end' }}><Button variant="secondary" size="sm" type="button" onClick={() => openEditor(workOrder)}><PlusCircle size={14} /> Update</Button></div></td></tr>)}</tbody></table></div></TableCard>
      {selected ? <ModalShell title={selected.workOrderNumber} onClose={() => setSelected(null)} footer={<><Button variant="secondary" type="button" onClick={() => setSelected(null)}>Cancel</Button><Button type="submit" form="work-order-form" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></>}><form id="work-order-form" className="app-grid" onSubmit={handleSave}><FormField label="Status"><SelectInput value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as MaintenanceWorkOrder['status'] }))}><option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Waiting Parts">Waiting Parts</option><option value="Completed">Completed</option></SelectInput></FormField><div className="app-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}><FormField label="Assignee"><TextInput value={form.assignee} onChange={(event) => setForm((current) => ({ ...current, assignee: event.target.value }))} /></FormField><FormField label="Vendor"><TextInput value={form.vendor} onChange={(event) => setForm((current) => ({ ...current, vendor: event.target.value }))} /></FormField></div><FormField label="Issue Summary"><TextArea value={form.issueSummary} onChange={(event) => setForm((current) => ({ ...current, issueSummary: event.target.value }))} /></FormField></form></ModalShell> : null}
    </div>
  );
};

export default Maintenance;
