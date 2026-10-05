import React, { useEffect, useMemo, useState } from 'react';
import { BanknoteArrowDown, CreditCard, Plus, RotateCcw } from 'lucide-react';
import { Button, FormField, ModalShell, SectionHeader, SelectInput, StatCard, StatusBadge, TableCard, TextInput } from './AppUI';
import { createPayment, getInvoices, getPayments, getSettlements, processRefund, type PaymentCreateRequest, type RefundRequest } from '../services/api';
import { Invoice, Payment, SettlementSummary } from '../types';

const emptyPayment = (invoice?: Invoice): PaymentCreateRequest => ({ reference: '', requestKey: crypto.randomUUID(), invoiceId: invoice?.id || '', customerName: invoice?.customerName || '', amount: invoice?.balanceDue || 0, method: 'Card', paymentType: 'Invoice' });
const emptyRefund = (settlement?: SettlementSummary): RefundRequest => ({ reference: '', requestKey: crypto.randomUUID(), settlementId: settlement?.id, invoiceId: settlement?.invoiceId, customerName: settlement?.customerName || '', amount: settlement?.amountRefundable || 0, reason: 'Deposit refund' });

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settlements, setSettlements] = useState<SettlementSummary[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentCreateRequest>(emptyPayment());
  const [refundForm, setRefundForm] = useState<RefundRequest>(emptyRefund());
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [paymentData, invoiceData, settlementData] = await Promise.all([getPayments(), getInvoices(), getSettlements()]);
      setPayments(paymentData); setInvoices(invoiceData); setSettlements(settlementData); setWarning(null);
    } catch (error) { setWarning(error instanceof Error ? error.message : 'Unable to load payments.'); }
  };
  useEffect(() => { loadData(); }, []);

  const openInvoices = useMemo(() => invoices.filter((invoice) => invoice.balanceDue > 0), [invoices]);
  const refundableSettlements = useMemo(() => settlements.filter((settlement) => settlement.amountRefundable > 0), [settlements]);

  const openPayment = (invoice: Invoice) => { setPaymentForm(emptyPayment(invoice)); setIsPaymentModalOpen(true); };
  const openRefund = (settlement: SettlementSummary) => { setRefundForm(emptyRefund(settlement)); setIsRefundModalOpen(true); };

  const handleCapturePayment = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); setSubmitting(true); try { await createPayment(paymentForm); setIsPaymentModalOpen(false); await loadData(); } catch (error) { setWarning(error instanceof Error ? error.message : 'Failed to capture payment.'); } finally { setSubmitting(false); } };
  const handleRefund = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); setSubmitting(true); try { await processRefund(refundForm); setIsRefundModalOpen(false); await loadData(); } catch (error) { setWarning(error instanceof Error ? error.message : 'Failed to process refund.'); } finally { setSubmitting(false); } };

  return (
    <div className="app-grid" style={{ gap: 24 }}>
      <SectionHeader title="Payments & Refunds" description="Record payments received and refunds already sent. Add a bank or receipt reference; this screen does not move money." warning={warning} />
      <div className="app-grid app-grid--stats">
        <StatCard label="Payments" value={payments.length} icon={<CreditCard size={20} />} />
        <StatCard label="Captured" value={`$${payments.filter((p) => p.status === 'Captured').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}`} icon={<BanknoteArrowDown size={20} />} />
        <StatCard label="Open Invoices" value={openInvoices.length} />
        <StatCard label="Refund Queue" value={refundableSettlements.length} icon={<RotateCcw size={20} />} />
      </div>
      <div className="app-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <div className="app-card" style={{ padding: 16 }}><div className="app-kicker">Outstanding Invoices</div><div className="app-grid" style={{ marginTop: 12 }}>{openInvoices.length === 0 ? <div className="app-muted">No outstanding invoices.</div> : openInvoices.map((invoice) => <div key={invoice.id} className="app-note-row"><div><div style={{ fontWeight: 600 }}>{invoice.invoiceNumber}</div><div className="app-muted" style={{ fontSize: 12 }}>{invoice.customerName}</div></div><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><StatusBadge tone="warning">${invoice.balanceDue.toFixed(2)}</StatusBadge><Button variant="secondary" size="sm" type="button" onClick={() => openPayment(invoice)}><Plus size={14} /> Capture</Button></div></div>)}</div></div>
        <div className="app-card" style={{ padding: 16 }}><div className="app-kicker">Refundable Settlements</div><div className="app-grid" style={{ marginTop: 12 }}>{refundableSettlements.length === 0 ? <div className="app-muted">No refundable settlements.</div> : refundableSettlements.map((settlement) => <div key={settlement.id} className="app-note-row"><div><div style={{ fontWeight: 600 }}>{settlement.settlementNumber}</div><div className="app-muted" style={{ fontSize: 12 }}>{settlement.customerName}</div></div><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><StatusBadge tone="success">${settlement.amountRefundable.toFixed(2)}</StatusBadge><Button variant="secondary" size="sm" type="button" onClick={() => openRefund(settlement)}><RotateCcw size={14} /> Refund</Button></div></div>)}</div></div>
      </div>
      <TableCard><div className="app-table-wrap"><table className="app-table"><thead><tr><th>Payment</th><th>Customer</th><th>Method</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.id}><td><div style={{ fontWeight: 600 }}>{payment.paymentNumber}</div><div className="app-muted" style={{ fontSize: 12 }}>{new Date(payment.createdAt).toLocaleString()}</div></td><td>{payment.customerName}</td><td>{payment.method}</td><td>{payment.paymentType}</td><td>${payment.amount.toFixed(2)}</td><td><StatusBadge tone={payment.status === 'Captured' ? 'success' : payment.status === 'Refunded' ? 'warning' : 'neutral'}>{payment.status}</StatusBadge></td></tr>)}</tbody></table></div></TableCard>
      {isPaymentModalOpen ? <ModalShell title="Record Payment" onClose={() => setIsPaymentModalOpen(false)} footer={<><Button variant="secondary" type="button" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button><Button type="submit" form="payment-form" disabled={submitting}>{submitting ? 'Capturing...' : 'Record Payment'}</Button></>}><form id="payment-form" className="app-grid" onSubmit={handleCapturePayment}>{warning && <p role="alert">{warning}</p>}<FormField label="Receipt or bank reference"><TextInput required value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference:e.target.value})} /></FormField><FormField label="Invoice"><SelectInput value={paymentForm.invoiceId} onChange={(event) => { const invoice = invoices.find((item) => item.id === event.target.value); setPaymentForm(emptyPayment(invoice)); }}>{openInvoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber} � {invoice.customerName}</option>)}</SelectInput></FormField><div className="app-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}><FormField label="Amount"><TextInput type="number" value={paymentForm.amount} onChange={(event) => setPaymentForm((current) => ({ ...current, amount: Number(event.target.value) }))} /></FormField><FormField label="Method"><SelectInput value={paymentForm.method} onChange={(event) => setPaymentForm((current) => ({ ...current, method: event.target.value as Payment['method'] }))}><option value="Card">Card</option><option value="Bank Transfer">Bank Transfer</option><option value="Cash">Cash</option><option value="Corporate Credit">Corporate Credit</option></SelectInput></FormField></div></form></ModalShell> : null}
      {isRefundModalOpen ? <ModalShell title="Record Refund" onClose={() => setIsRefundModalOpen(false)} footer={<><Button variant="secondary" type="button" onClick={() => setIsRefundModalOpen(false)}>Cancel</Button><Button type="submit" form="refund-form" disabled={submitting}>{submitting ? 'Processing...' : 'Record Refund'}</Button></>}><form id="refund-form" className="app-grid" onSubmit={handleRefund}>{warning && <p role="alert">{warning}</p>}<FormField label="Refund receipt or bank reference"><TextInput required value={refundForm.reference} onChange={e => setRefundForm({...refundForm, reference:e.target.value})} /></FormField><FormField label="Settlement"><SelectInput value={refundForm.settlementId} onChange={(event) => { const settlement = settlements.find((item) => item.id === event.target.value); setRefundForm(emptyRefund(settlement)); }}>{refundableSettlements.map((settlement) => <option key={settlement.id} value={settlement.id}>{settlement.settlementNumber} � {settlement.customerName}</option>)}</SelectInput></FormField><FormField label="Amount"><TextInput type="number" value={refundForm.amount} onChange={(event) => setRefundForm((current) => ({ ...current, amount: Number(event.target.value) }))} /></FormField><FormField label="Reason"><TextInput value={refundForm.reason} onChange={(event) => setRefundForm((current) => ({ ...current, reason: event.target.value }))} /></FormField></form></ModalShell> : null}
    </div>
  );
};

export default Payments;
