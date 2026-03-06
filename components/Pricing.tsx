import React, { useEffect, useMemo, useState } from 'react';
import { BadgeDollarSign, Calculator, Plus } from 'lucide-react';
import { Button, FormField, ModalShell, SectionHeader, SelectInput, StatCard, StatusBadge, TableCard, TextInput } from './AppUI';
import { createRatePlan, getRatePlans, updateRatePlan, type RatePlanRequest } from '../services/api';
import { RatePlan } from '../types';

const emptyForm: RatePlanRequest = { name: '', vehicleClass: 'Sedan', dailyRate: 95, includedMileagePerDay: 250, depositAmount: 200, taxRate: 0.09, active: true };

const Pricing: React.FC = () => {
  const [ratePlans, setRatePlans] = useState<RatePlan[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<RatePlan | null>(null);
  const [form, setForm] = useState<RatePlanRequest>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try { setRatePlans(await getRatePlans()); setWarning(null); } catch { setWarning('Unable to load rate plans.'); }
  };
  useEffect(() => { loadData(); }, []);

  const metrics = useMemo(() => ({ total: ratePlans.length, active: ratePlans.filter((p) => p.active).length, avgDaily: ratePlans.length ? Math.round(ratePlans.reduce((sum, plan) => sum + plan.dailyRate, 0) / ratePlans.length) : 0, avgDeposit: ratePlans.length ? Math.round(ratePlans.reduce((sum, plan) => sum + plan.depositAmount, 0) / ratePlans.length) : 0 }), [ratePlans]);
  const previewSubtotal = form.dailyRate * 3;
  const previewTax = previewSubtotal * form.taxRate;
  const previewTotal = previewSubtotal + previewTax;

  const openCreate = () => { setEditing(null); setForm(emptyForm); setIsModalOpen(true); };
  const openEdit = (plan: RatePlan) => { setEditing(plan); setForm({ name: plan.name, vehicleClass: plan.vehicleClass, dailyRate: plan.dailyRate, includedMileagePerDay: plan.includedMileagePerDay, depositAmount: plan.depositAmount, taxRate: plan.taxRate, active: plan.active }); setIsModalOpen(true); };
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSubmitting(true);
    try { if (editing) await updateRatePlan(editing.id, form); else await createRatePlan(form); setIsModalOpen(false); await loadData(); } catch { setWarning('Failed to save rate plan.'); } finally { setSubmitting(false); }
  };

  return (
    <div className="app-grid" style={{ gap: 24 }}>
      <SectionHeader title="Pricing & Rate Cards" description="Manage commercial rate plans, deposits, and quote assumptions." warning={warning} action={<Button type="button" onClick={openCreate}><Plus size={16} /> Add Rate Plan</Button>} />
      <div className="app-grid app-grid--stats">
        <StatCard label="Rate Plans" value={metrics.total} icon={<BadgeDollarSign size={20} />} />
        <StatCard label="Active Plans" value={metrics.active} icon={<Calculator size={20} />} />
        <StatCard label="Avg Daily Rate" value={`$${metrics.avgDaily}`} />
        <StatCard label="Avg Deposit" value={`$${metrics.avgDeposit}`} />
      </div>
      <div className="app-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 20 }}>
        <TableCard>
          <div className="app-table-wrap"><table className="app-table"><thead><tr><th>Rate Plan</th><th>Class</th><th>Daily Rate</th><th>Deposit</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead><tbody>
            {ratePlans.map((plan) => <tr key={plan.id}><td><div style={{ fontWeight: 600 }}>{plan.name}</div><div className="app-muted" style={{ fontSize: 12 }}>{plan.includedMileagePerDay} km/day</div></td><td>{plan.vehicleClass}</td><td>${plan.dailyRate.toFixed(2)}</td><td>${plan.depositAmount.toFixed(2)}</td><td><StatusBadge tone={plan.active ? 'success' : 'neutral'}>{plan.active ? 'Active' : 'Inactive'}</StatusBadge></td><td><div style={{ display: 'flex', justifyContent: 'flex-end' }}><Button variant="secondary" size="sm" type="button" onClick={() => openEdit(plan)}>Edit</Button></div></td></tr>)}
          </tbody></table></div>
        </TableCard>
        <div className="app-card" style={{ padding: 20 }}>
          <div className="app-kicker">3-Day Quote Preview</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>${previewTotal.toFixed(2)}</div>
          <div className="app-grid" style={{ marginTop: 16 }}>
            <div className="app-note-row"><span className="app-muted">Base rental</span><strong>${previewSubtotal.toFixed(2)}</strong></div>
            <div className="app-note-row"><span className="app-muted">Tax</span><strong>${previewTax.toFixed(2)}</strong></div>
            <div className="app-note-row"><span className="app-muted">Deposit hold</span><strong>${form.depositAmount.toFixed(2)}</strong></div>
          </div>
        </div>
      </div>
      {isModalOpen ? <ModalShell title={editing ? 'Edit Rate Plan' : 'Add Rate Plan'} onClose={() => setIsModalOpen(false)} footer={<><Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button type="submit" form="rate-plan-form" disabled={submitting}>{submitting ? 'Saving...' : 'Save Rate Plan'}</Button></>}><form id="rate-plan-form" className="app-grid" onSubmit={handleSubmit}><FormField label="Plan Name"><TextInput value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></FormField><div className="app-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}><FormField label="Vehicle Class"><SelectInput value={form.vehicleClass} onChange={(event) => setForm((current) => ({ ...current, vehicleClass: event.target.value }))}><option value="Sedan">Sedan</option><option value="SUV">SUV</option><option value="Van">Van</option></SelectInput></FormField><FormField label="Daily Rate"><TextInput type="number" value={form.dailyRate} onChange={(event) => setForm((current) => ({ ...current, dailyRate: Number(event.target.value) }))} /></FormField></div><div className="app-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}><FormField label="Mileage / Day"><TextInput type="number" value={form.includedMileagePerDay} onChange={(event) => setForm((current) => ({ ...current, includedMileagePerDay: Number(event.target.value) }))} /></FormField><FormField label="Deposit"><TextInput type="number" value={form.depositAmount} onChange={(event) => setForm((current) => ({ ...current, depositAmount: Number(event.target.value) }))} /></FormField><FormField label="Tax Rate"><TextInput type="number" step="0.01" value={form.taxRate} onChange={(event) => setForm((current) => ({ ...current, taxRate: Number(event.target.value) }))} /></FormField></div><FormField label="Status"><SelectInput value={form.active ? 'active' : 'inactive'} onChange={(event) => setForm((current) => ({ ...current, active: event.target.value === 'active' }))}><option value="active">Active</option><option value="inactive">Inactive</option></SelectInput></FormField></form></ModalShell> : null}
    </div>
  );
};

export default Pricing;
