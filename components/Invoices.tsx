import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, ReceiptText } from 'lucide-react';
import { Button, ModalShell, SectionHeader, StatCard, StatusBadge, TableCard } from './AppUI';
import { getInvoiceById, getInvoices } from '../services/api';
import { Invoice } from '../types';

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const loadData = async () => {
    try { setInvoices(await getInvoices()); setWarning(null); } catch { setWarning('Unable to load invoices.'); }
  };
  useEffect(() => { loadData(); }, []);

  return (
    <div className="app-grid" style={{ gap: 24 }}>
      <SectionHeader title="Invoices & Receipts" description="Track billing documents, balances, and invoice states across rentals and settlements." warning={warning} />
      <div className="app-grid app-grid--stats">
        <StatCard label="Invoices" value={invoices.length} icon={<ReceiptText size={20} />} />
        <StatCard label="Open Balance" value={`$${invoices.reduce((sum, invoice) => sum + invoice.balanceDue, 0).toFixed(2)}`} icon={<FileSpreadsheet size={20} />} />
        <StatCard label="Paid" value={invoices.filter((invoice) => invoice.status === 'Paid').length} />
        <StatCard label="Draft / Issued" value={invoices.filter((invoice) => invoice.status === 'Draft' || invoice.status === 'Issued').length} />
      </div>
      <TableCard>
        <div className="app-table-wrap"><table className="app-table"><thead><tr><th>Invoice</th><th>Customer</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead><tbody>
          {invoices.map((invoice) => <tr key={invoice.id}><td><div style={{ fontWeight: 600 }}>{invoice.invoiceNumber}</div><div className="app-muted" style={{ fontSize: 12 }}>{new Date(invoice.issuedAt).toLocaleString()}</div></td><td>{invoice.customerName}</td><td>${invoice.total.toFixed(2)}</td><td>${invoice.amountPaid.toFixed(2)}</td><td>${invoice.balanceDue.toFixed(2)}</td><td><StatusBadge tone={invoice.status === 'Paid' ? 'success' : invoice.status === 'Refunded' ? 'danger' : invoice.status === 'Partially Paid' ? 'warning' : 'neutral'}>{invoice.status}</StatusBadge></td><td><div style={{ display: 'flex', justifyContent: 'flex-end' }}><Button variant="secondary" size="sm" type="button" onClick={async () => setSelectedInvoice(await getInvoiceById(invoice.id) || invoice)}>View</Button></div></td></tr>)}
        </tbody></table></div>
      </TableCard>
      {selectedInvoice ? <ModalShell title={selectedInvoice.invoiceNumber} onClose={() => setSelectedInvoice(null)} footer={<Button variant="secondary" type="button" onClick={() => setSelectedInvoice(null)}>Close</Button>}><div className="app-grid"><div className="app-note-row"><span className="app-muted">Customer</span><strong>{selectedInvoice.customerName}</strong></div><div className="app-note-row"><span className="app-muted">Status</span><StatusBadge tone={selectedInvoice.status === 'Paid' ? 'success' : selectedInvoice.status === 'Refunded' ? 'danger' : selectedInvoice.status === 'Partially Paid' ? 'warning' : 'neutral'}>{selectedInvoice.status}</StatusBadge></div><div className="app-card" style={{ padding: 16 }}><div className="app-kicker">Line Items</div><div className="app-grid" style={{ marginTop: 12 }}>{selectedInvoice.lineItems.map((item) => <div key={item.id} className="app-note-row"><span>{item.label}</span><strong>${item.amount.toFixed(2)}</strong></div>)}</div></div><div className="app-note-row"><span className="app-muted">Subtotal</span><strong>${selectedInvoice.subtotal.toFixed(2)}</strong></div><div className="app-note-row"><span className="app-muted">Tax</span><strong>${selectedInvoice.taxTotal.toFixed(2)}</strong></div><div className="app-note-row"><span className="app-muted">Balance Due</span><strong>${selectedInvoice.balanceDue.toFixed(2)}</strong></div></div></ModalShell> : null}
    </div>
  );
};

export default Invoices;
