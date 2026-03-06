import React, { useEffect, useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import { Button, FormField, ModalShell, SectionHeader, SelectInput, StatCard, StatusBadge, TableCard, TextInput } from './AppUI';
import { getApprovalRequests, updateApprovalRequest } from '../services/enterprise';
import { ApprovalRequest } from '../types';

const Approvals: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [selected, setSelected] = useState<ApprovalRequest | null>(null);
  const [form, setForm] = useState({ approver: '', status: 'Pending' as ApprovalRequest['status'] });

  const loadData = async () => {
    try { setApprovals(await getApprovalRequests()); setWarning(null); } catch { setWarning('Unable to load approvals.'); }
  };
  useEffect(() => { loadData(); }, []);

  const openEditor = (approval: ApprovalRequest) => { setSelected(approval); setForm({ approver: approval.approver, status: approval.status }); };
  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    try { await updateApprovalRequest(selected.id, form); setSelected(null); await loadData(); } catch { setWarning('Failed to update approval request.'); }
  };

  return (
    <div className="app-grid" style={{ gap: 24 }}>
      <SectionHeader title="Approvals" description="Review sensitive operations that require managerial sign-off before execution." warning={warning} />
      <div className="app-grid app-grid--stats"><StatCard label="Approvals" value={approvals.length} icon={<BadgeCheck size={20} />} /><StatCard label="Pending" value={approvals.filter((item) => item.status === 'Pending').length} /><StatCard label="Approved" value={approvals.filter((item) => item.status === 'Approved').length} /><StatCard label="Rejected" value={approvals.filter((item) => item.status === 'Rejected').length} /></div>
      <TableCard><div className="app-table-wrap"><table className="app-table"><thead><tr><th>Approval</th><th>Category</th><th>Requester</th><th>Approver</th><th>Summary</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead><tbody>{approvals.map((approval) => <tr key={approval.id}><td style={{ fontWeight: 600 }}>{approval.approvalNumber}</td><td>{approval.category}</td><td>{approval.requester}</td><td>{approval.approver}</td><td className="app-muted">{approval.summary}</td><td><StatusBadge tone={approval.status === 'Approved' ? 'success' : approval.status === 'Rejected' ? 'danger' : 'warning'}>{approval.status}</StatusBadge></td><td><div style={{ display: 'flex', justifyContent: 'flex-end' }}><Button variant="secondary" size="sm" type="button" onClick={() => openEditor(approval)}>Review</Button></div></td></tr>)}</tbody></table></div></TableCard>
      {selected ? <ModalShell title={selected.approvalNumber} onClose={() => setSelected(null)} footer={<><Button variant="secondary" type="button" onClick={() => setSelected(null)}>Cancel</Button><Button type="submit" form="approval-form">Save Decision</Button></>}><form id="approval-form" className="app-grid" onSubmit={handleSave}><FormField label="Approver"><TextInput value={form.approver} onChange={(event) => setForm((current) => ({ ...current, approver: event.target.value }))} /></FormField><FormField label="Decision"><SelectInput value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ApprovalRequest['status'] }))}><option value="Pending">Pending</option><option value="Approved">Approved</option><option value="Rejected">Rejected</option></SelectInput></FormField></form></ModalShell> : null}
    </div>
  );
};

export default Approvals;
