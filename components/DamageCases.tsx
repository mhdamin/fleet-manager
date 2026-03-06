import React, { useEffect, useMemo, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button, FormField, ModalShell, SectionHeader, SelectInput, StatCard, StatusBadge, TableCard, TextArea } from './AppUI';
import { getDamageCases, updateDamageCase } from '../services/operations';
import { DamageCase } from '../types';

const DamageCases: React.FC = () => {
  const [cases, setCases] = useState<DamageCase[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [selected, setSelected] = useState<DamageCase | null>(null);
  const [form, setForm] = useState<{ status: DamageCase['status']; insuranceStatus: DamageCase['insuranceStatus']; description: string }>({ status: 'Open', insuranceStatus: 'Unsubmitted', description: '' });
  const [saving, setSaving] = useState(false);

  const loadData = async () => { try { setCases(await getDamageCases()); setWarning(null); } catch { setWarning('Unable to load damage cases.'); } };
  useEffect(() => { loadData(); }, []);
  const metrics = useMemo(() => ({ total: cases.length, open: cases.filter((item) => item.status === 'Open' || item.status === 'Review').length, repairing: cases.filter((item) => item.status === 'Repairing').length, resolved: cases.filter((item) => item.status === 'Resolved').length }), [cases]);
  const openEditor = (item: DamageCase) => { setSelected(item); setForm({ status: item.status, insuranceStatus: item.insuranceStatus, description: item.description }); };
  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!selected) return; setSaving(true); try { await updateDamageCase(selected.id, form); setSelected(null); await loadData(); } catch { setWarning('Failed to update damage case.'); } finally { setSaving(false); } };

  return (
    <div className="app-grid" style={{ gap: 24 }}>
      <SectionHeader title="Damage Cases" description="Manage post-return damage review, repair progression, and claim readiness." warning={warning} />
      <div className="app-grid app-grid--stats"><StatCard label="Damage Cases" value={metrics.total} icon={<ShieldAlert size={20} />} /><StatCard label="Open / Review" value={metrics.open} /><StatCard label="Repairing" value={metrics.repairing} /><StatCard label="Resolved" value={metrics.resolved} /></div>
      <TableCard><div className="app-table-wrap"><table className="app-table"><thead><tr><th>Case</th><th>Vehicle</th><th>Severity</th><th>Estimate</th><th>Insurance</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead><tbody>{cases.length === 0 ? <tr><td colSpan={7} className="app-empty">No damage cases yet.</td></tr> : cases.map((item) => <tr key={item.id}><td><div style={{ fontWeight: 600 }}>{item.caseNumber}</div><div className="app-muted" style={{ fontSize: 12 }}>{item.customerName}</div></td><td>{item.vehiclePlate}</td><td><StatusBadge tone={item.severity === 'Major' ? 'danger' : item.severity === 'Moderate' ? 'warning' : 'neutral'}>{item.severity}</StatusBadge></td><td>${item.estimatedRepairCost.toFixed(2)}</td><td><StatusBadge tone={item.insuranceStatus === 'Approved' ? 'success' : item.insuranceStatus === 'Submitted' ? 'warning' : 'neutral'}>{item.insuranceStatus}</StatusBadge></td><td><StatusBadge tone={item.status === 'Resolved' ? 'success' : item.status === 'Repairing' ? 'warning' : 'neutral'}>{item.status}</StatusBadge></td><td><div style={{ display: 'flex', justifyContent: 'flex-end' }}><Button variant="secondary" size="sm" type="button" onClick={() => openEditor(item)}>Update</Button></div></td></tr>)}</tbody></table></div></TableCard>
      {selected ? <ModalShell title={selected.caseNumber} onClose={() => setSelected(null)} footer={<><Button variant="secondary" type="button" onClick={() => setSelected(null)}>Cancel</Button><Button type="submit" form="damage-case-form" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></>}><form id="damage-case-form" className="app-grid" onSubmit={handleSave}><FormField label="Case Status"><SelectInput value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as DamageCase['status'] }))}><option value="Open">Open</option><option value="Review">Review</option><option value="Repairing">Repairing</option><option value="Resolved">Resolved</option></SelectInput></FormField><FormField label="Insurance Status"><SelectInput value={form.insuranceStatus} onChange={(event) => setForm((current) => ({ ...current, insuranceStatus: event.target.value as DamageCase['insuranceStatus'] }))}><option value="Unsubmitted">Unsubmitted</option><option value="Submitted">Submitted</option><option value="Approved">Approved</option></SelectInput></FormField><FormField label="Damage Description"><TextArea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></FormField></form></ModalShell> : null}
    </div>
  );
};

export default DamageCases;
