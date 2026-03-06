import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, FormField, ModalShell, SectionHeader, SelectInput, StatCard, StatusBadge, TableCard, TextInput } from './AppUI';
import { getOperationalExceptions, updateOperationalException } from '../services/operations';
import { OperationalException } from '../types';

const Exceptions: React.FC = () => {
  const [exceptions, setExceptions] = useState<OperationalException[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [selected, setSelected] = useState<OperationalException | null>(null);
  const [form, setForm] = useState<{ owner: string; status: OperationalException['status'] }>({ owner: '', status: 'Open' });
  const [saving, setSaving] = useState(false);

  const loadData = async () => { try { setExceptions(await getOperationalExceptions()); setWarning(null); } catch { setWarning('Unable to load operational exceptions.'); } };
  useEffect(() => { loadData(); }, []);
  const metrics = useMemo(() => ({ total: exceptions.length, open: exceptions.filter((item) => item.status === 'Open').length, assigned: exceptions.filter((item) => item.status === 'Assigned').length, resolved: exceptions.filter((item) => item.status === 'Resolved').length }), [exceptions]);
  const openEditor = (item: OperationalException) => { setSelected(item); setForm({ owner: item.owner, status: item.status }); };
  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!selected) return; setSaving(true); try { await updateOperationalException(selected.id, form); setSelected(null); await loadData(); } catch { setWarning('Failed to update exception.'); } finally { setSaving(false); } };

  return (
    <div className="app-grid" style={{ gap: 24 }}>
      <SectionHeader title="Exception Queue" description="Track maintenance, damage, and settlement follow-up items across operations." warning={warning} />
      <div className="app-grid app-grid--stats"><StatCard label="Exceptions" value={metrics.total} icon={<AlertTriangle size={20} />} /><StatCard label="Open" value={metrics.open} /><StatCard label="Assigned" value={metrics.assigned} /><StatCard label="Resolved" value={metrics.resolved} /></div>
      <TableCard><div className="app-table-wrap"><table className="app-table"><thead><tr><th>Reference</th><th>Type</th><th>Vehicle</th><th>Owner</th><th>Summary</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead><tbody>{exceptions.length === 0 ? <tr><td colSpan={7} className="app-empty">No exceptions generated yet.</td></tr> : exceptions.map((item) => <tr key={item.id}><td><div style={{ fontWeight: 600 }}>{item.referenceNumber}</div><div className="app-muted" style={{ fontSize: 12 }}>{new Date(item.createdAt).toLocaleString()}</div></td><td><StatusBadge tone={item.type === 'Damage' ? 'danger' : item.type === 'Maintenance' ? 'warning' : 'neutral'}>{item.type}</StatusBadge></td><td>{item.vehiclePlate}</td><td>{item.owner}</td><td className="app-muted">{item.summary}</td><td><StatusBadge tone={item.status === 'Resolved' ? 'success' : item.status === 'Assigned' ? 'inverse' : 'warning'}>{item.status}</StatusBadge></td><td><div style={{ display: 'flex', justifyContent: 'flex-end' }}><Button variant="secondary" size="sm" type="button" onClick={() => openEditor(item)}>Assign</Button></div></td></tr>)}</tbody></table></div></TableCard>
      {selected ? <ModalShell title={selected.referenceNumber} onClose={() => setSelected(null)} footer={<><Button variant="secondary" type="button" onClick={() => setSelected(null)}>Cancel</Button><Button type="submit" form="exception-form" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></>}><form id="exception-form" className="app-grid" onSubmit={handleSave}><FormField label="Owner"><TextInput value={form.owner} onChange={(event) => setForm((current) => ({ ...current, owner: event.target.value }))} /></FormField><FormField label="Status"><SelectInput value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as OperationalException['status'] }))}><option value="Open">Open</option><option value="Assigned">Assigned</option><option value="Resolved">Resolved</option></SelectInput></FormField></form></ModalShell> : null}
    </div>
  );
};

export default Exceptions;
