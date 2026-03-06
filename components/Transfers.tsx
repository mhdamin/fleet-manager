import React, { useEffect, useState } from 'react';
import { ArrowRightLeft, Plus } from 'lucide-react';
import { Button, FormField, ModalShell, SectionHeader, SelectInput, StatCard, StatusBadge, TableCard, TextInput } from './AppUI';
import { createTransferRequest, getBranches, getTransferRequests, updateTransferRequest } from '../services/enterprise';
import { Branch, TransferRequest } from '../types';

const Transfers: React.FC = () => {
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferRequest | null>(null);
  const [form, setForm] = useState({ vehiclePlate: '', fromBranch: '', toBranch: '', requestedBy: 'Operations Desk', status: 'Requested' as TransferRequest['status'], eta: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16) });

  const loadData = async () => {
    try {
      const [transferData, branchData] = await Promise.all([getTransferRequests(), getBranches()]);
      setTransfers(transferData); setBranches(branchData);
      setForm((current) => ({ ...current, fromBranch: current.fromBranch || branchData[0]?.name || '', toBranch: current.toBranch || branchData[1]?.name || '' }));
      setWarning(null);
    } catch { setWarning('Unable to load transfer requests.'); }
  };
  useEffect(() => { loadData(); }, []);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try { await createTransferRequest({ ...form, eta: new Date(form.eta).toISOString() }); setIsModalOpen(false); await loadData(); } catch { setWarning('Failed to create transfer request.'); }
  };

  const handleStatusChange = async (transfer: TransferRequest, status: TransferRequest['status']) => {
    try { await updateTransferRequest(transfer.id, { status }); await loadData(); } catch { setWarning('Failed to update transfer.'); }
  };

  return (
    <div className="app-grid" style={{ gap: 24 }}>
      <SectionHeader title="Vehicle Transfers" description="Coordinate inter-branch fleet movement and fulfillment planning." warning={warning} action={<Button type="button" onClick={() => setIsModalOpen(true)}><Plus size={16} /> New Transfer</Button>} />
      <div className="app-grid app-grid--stats"><StatCard label="Transfers" value={transfers.length} icon={<ArrowRightLeft size={20} />} /><StatCard label="Requested" value={transfers.filter((item) => item.status === 'Requested').length} /><StatCard label="In Transit" value={transfers.filter((item) => item.status === 'In Transit').length} /><StatCard label="Completed" value={transfers.filter((item) => item.status === 'Completed').length} /></div>
      <TableCard><div className="app-table-wrap"><table className="app-table"><thead><tr><th>Transfer</th><th>Vehicle</th><th>Route</th><th>Requested By</th><th>ETA</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead><tbody>{transfers.map((transfer) => <tr key={transfer.id}><td style={{ fontWeight: 600 }}>{transfer.requestNumber}</td><td>{transfer.vehiclePlate}</td><td>{transfer.fromBranch} to {transfer.toBranch}</td><td>{transfer.requestedBy}</td><td>{new Date(transfer.eta).toLocaleString()}</td><td><StatusBadge tone={transfer.status === 'Completed' ? 'success' : transfer.status === 'In Transit' ? 'warning' : 'neutral'}>{transfer.status}</StatusBadge></td><td><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>{transfer.status === 'Requested' ? <Button variant="secondary" size="sm" type="button" onClick={() => handleStatusChange(transfer, 'In Transit')}>Dispatch</Button> : null}{transfer.status === 'In Transit' ? <Button variant="secondary" size="sm" type="button" onClick={() => handleStatusChange(transfer, 'Completed')}>Complete</Button> : null}</div></td></tr>)}</tbody></table></div></TableCard>
      {isModalOpen ? <ModalShell title="Create Transfer Request" onClose={() => setIsModalOpen(false)} footer={<><Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button type="submit" form="transfer-form">Create Transfer</Button></>}><form id="transfer-form" className="app-grid" onSubmit={handleCreate}><FormField label="Vehicle Plate"><TextInput value={form.vehiclePlate} onChange={(event) => setForm((current) => ({ ...current, vehiclePlate: event.target.value }))} /></FormField><div className="app-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}><FormField label="From"><SelectInput value={form.fromBranch} onChange={(event) => setForm((current) => ({ ...current, fromBranch: event.target.value }))}>{branches.map((branch) => <option key={branch.id} value={branch.name}>{branch.name}</option>)}</SelectInput></FormField><FormField label="To"><SelectInput value={form.toBranch} onChange={(event) => setForm((current) => ({ ...current, toBranch: event.target.value }))}>{branches.map((branch) => <option key={branch.id} value={branch.name}>{branch.name}</option>)}</SelectInput></FormField></div><FormField label="ETA"><TextInput type="datetime-local" value={form.eta} onChange={(event) => setForm((current) => ({ ...current, eta: event.target.value }))} /></FormField></form></ModalShell> : null}
    </div>
  );
};

export default Transfers;
