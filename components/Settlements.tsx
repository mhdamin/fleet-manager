import React, { useEffect, useState } from 'react';
import { Landmark, Wallet } from 'lucide-react';
import { Button, ModalShell, SectionHeader, StatCard, StatusBadge, TableCard } from './AppUI';
import { getSettlementById, getSettlements } from '../services/api';
import { SettlementSummary } from '../types';

const Settlements: React.FC = () => {
  const [settlements, setSettlements] = useState<SettlementSummary[]>([]);
  const [selected, setSelected] = useState<SettlementSummary | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const loadData = async () => { try { setSettlements(await getSettlements()); setWarning(null); } catch { setWarning('Unable to load settlements.'); } };
  useEffect(() => { loadData(); }, []);

  return (
    <div className="app-grid" style={{ gap: 24 }}>
      <SectionHeader title="Settlement Ledger" description="Review return-linked settlement outcomes, deposit application, and refund balances." warning={warning} />
      <div className="app-grid app-grid--stats">
        <StatCard label="Settlements" value={settlements.length} icon={<Landmark size={20} />} />
        <StatCard label="Amount Due" value={`$${settlements.reduce((sum, item) => sum + item.amountDue, 0).toFixed(2)}`} />
        <StatCard label="Refundable" value={`$${settlements.reduce((sum, item) => sum + item.amountRefundable, 0).toFixed(2)}`} icon={<Wallet size={20} />} />
        <StatCard label="Settled / Refunded" value={settlements.filter((item) => item.status === 'Settled' || item.status === 'Refunded').length} />
      </div>
      <TableCard><div className="app-table-wrap"><table className="app-table"><thead><tr><th>Settlement</th><th>Customer</th><th>Vehicle</th><th>Deposit</th><th>Charges</th><th>Outcome</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead><tbody>{settlements.length === 0 ? <tr><td colSpan={7} className="app-empty">No settlements yet.</td></tr> : settlements.map((settlement) => <tr key={settlement.id}><td><div style={{ fontWeight: 600 }}>{settlement.settlementNumber}</div><div className="app-muted" style={{ fontSize: 12 }}>{new Date(settlement.createdAt).toLocaleString()}</div></td><td>{settlement.customerName}</td><td>{settlement.vehiclePlate}</td><td><div>${settlement.depositHeld.toFixed(2)}</div><div className="app-muted" style={{ fontSize: 12 }}>Applied ${settlement.depositApplied.toFixed(2)}</div></td><td><div>${settlement.returnCharges.toFixed(2)}</div><div className="app-muted" style={{ fontSize: 12 }}>Due ${settlement.amountDue.toFixed(2)}</div></td><td><StatusBadge tone={settlement.status === 'Refunded' ? 'success' : settlement.status === 'Settled' ? 'inverse' : 'warning'}>{settlement.status}</StatusBadge></td><td><div style={{ display: 'flex', justifyContent: 'flex-end' }}><Button variant="secondary" size="sm" type="button" onClick={async () => setSelected(await getSettlementById(settlement.id) || settlement)}>View</Button></div></td></tr>)}</tbody></table></div></TableCard>
      {selected ? <ModalShell title={selected.settlementNumber} onClose={() => setSelected(null)} footer={<Button variant="secondary" type="button" onClick={() => setSelected(null)}>Close</Button>}><div className="app-grid"><div className="app-note-row"><span className="app-muted">Customer</span><strong>{selected.customerName}</strong></div><div className="app-note-row"><span className="app-muted">Vehicle</span><strong>{selected.vehiclePlate}</strong></div><div className="app-note-row"><span className="app-muted">Deposit Held</span><strong>${selected.depositHeld.toFixed(2)}</strong></div><div className="app-note-row"><span className="app-muted">Deposit Applied</span><strong>${selected.depositApplied.toFixed(2)}</strong></div><div className="app-note-row"><span className="app-muted">Refunded</span><strong>${selected.depositRefunded.toFixed(2)}</strong></div><div className="app-note-row"><span className="app-muted">Return Charges</span><strong>${selected.returnCharges.toFixed(2)}</strong></div><div className="app-note-row"><span className="app-muted">Amount Due</span><strong>${selected.amountDue.toFixed(2)}</strong></div><div className="app-note-row"><span className="app-muted">Amount Refundable</span><strong>${selected.amountRefundable.toFixed(2)}</strong></div></div></ModalShell> : null}
    </div>
  );
};

export default Settlements;
