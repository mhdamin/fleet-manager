import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Calculator, CheckCircle2, ClipboardCheck, Plus } from 'lucide-react';
import { Button, FormField, ModalShell, SectionHeader, SelectInput, StatCard, StatusBadge, TableCard, TextArea, TextInput } from './AppUI';
import { getChecklists, type ChecklistResponse, getReturns, getRentals, quoteReturnCharges, submitReturn, type ReturnSubmitRequest } from '../services/api';
import { RentalContract, ReturnAssessment } from '../types';

const emptyForm = (rentals: RentalContract[]): ReturnSubmitRequest => ({
  rentalId: new URLSearchParams(window.location.hash.split('?')[1]).get('rental') || rentals[0]?.id || '',
  odometerIn: 0,
  fuelIn: 'Full',
  damageFlag: false,
  maintenanceFlag: false,
  lateHours: 0,
  extraCharges: 0,
  checklistId: '',
  notes: '',
});

const Returns: React.FC = () => {
  const [returns, setReturns] = useState<ReturnAssessment[]>([]);
  const [rentals, setRentals] = useState<RentalContract[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(Boolean(new URLSearchParams(window.location.hash.split('?')[1]).get('rental')));
  const [inspections,setInspections]=useState<ChecklistResponse[]>([]);
  const [form, setForm] = useState<ReturnSubmitRequest>(emptyForm([]));
  const [quote, setQuote] = useState<{ baseCharges: number; totalCharges: number; outcome: ReturnAssessment['outcome'] } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [returnData, rentalData,checklistData] = await Promise.all([getReturns(), getRentals(),getChecklists()]);
      setInspections(checklistData.filter(c=>c.completed&&c.rentalType==='RETURN'));
      setReturns(returnData);
      const openRentals = rentalData.filter((rental) => rental.status === 'Active' || rental.status === 'Overdue');
      setRentals(openRentals);
      setForm((current) => (current.rentalId ? current : emptyForm(openRentals)));
      setWarning(null);
    } catch (error) { setWarning(error instanceof Error ? error.message : 'Unable to load returns.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!form.rentalId) {
      setQuote(null);
      return;
    }

    let cancelled = false;
    const loadQuote = async () => {
      try {
        const nextQuote = await quoteReturnCharges({
          rentalId: form.rentalId,
          fuelIn: form.fuelIn,
          damageFlag: form.damageFlag,
          maintenanceFlag: form.maintenanceFlag,
          lateHours: Number(form.lateHours),
          extraCharges: Number(form.extraCharges),
        });
        if (!cancelled) {
          setQuote(nextQuote);
        }
      } catch {
        if (!cancelled) {
          setQuote(null);
        }
      }
    };

    loadQuote();
    return () => {
      cancelled = true;
    };
  }, [form.rentalId, form.fuelIn, form.damageFlag, form.maintenanceFlag, form.lateHours, form.extraCharges]);

  useEffect(()=>{const c=inspections.filter(c=>c.rentalId===form.rentalId).at(-1);if(c?.evidence)setForm(f=>({...f,checklistId:c.id,odometerIn:c.evidence!.odometer,fuelIn:c.evidence!.fuelLevel}));},[form.rentalId,inspections]);
  const metrics = useMemo(() => ({
    total: returns.length,
    cleanClose: returns.filter((item) => item.outcome === 'Clean Close').length,
    chargeable: returns.filter((item) => item.outcome === 'Charges Applied').length,
    exceptions: returns.filter((item) => item.outcome === 'Damage Review Required' || item.outcome === 'Maintenance Hold').length,
  }), [returns]);

  const handleSubmitReturn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await submitReturn({
        ...form,
        odometerIn: Number(form.odometerIn),
        lateHours: Number(form.lateHours),
        extraCharges: Number(form.extraCharges),
      });
      setIsModalOpen(false);
      setForm(emptyForm(rentals));
      await loadData();
    } catch (error) { setWarning(error instanceof Error ? error.message : 'Failed to submit return.');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="app-grid" style={{ gap: 24 }}>
      <SectionHeader
        title="Returns"
        description="Capture return assessment, charges, and disposition of each vehicle."
        warning={warning}
        action={<Button type="button" onClick={() => setIsModalOpen(true)}><Plus size={16} /> New Return</Button>}
      />

      <div className="app-grid app-grid--stats">
        <StatCard label="Total Returns" value={metrics.total} icon={<ClipboardCheck size={20} />} />
        <StatCard label="Clean Close" value={metrics.cleanClose} icon={<CheckCircle2 size={20} />} />
        <StatCard label="Charges Applied" value={metrics.chargeable} icon={<Calculator size={20} />} />
        <StatCard label="Exceptions" value={metrics.exceptions} icon={<AlertTriangle size={20} />} />
      </div>

      <TableCard>
        <div className="app-table-wrap">
          <table className="app-table">
            <thead>
              <tr>
                <th>Return</th>
                <th>Rental</th>
                <th>Vehicle</th>
                <th>Charges</th>
                <th>Outcome</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {returns.length === 0 ? (
                <tr><td colSpan={6} className="app-empty">No returns submitted yet.</td></tr>
              ) : returns.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.returnNumber}</div>
                    <div className="app-muted" style={{ fontSize: 12 }}>{new Date(item.submittedAt).toLocaleString()}</div>
                  </td>
                  <td>
                    <div>{item.rentalNumber}</div>
                    <div className="app-muted" style={{ fontSize: 12 }}>{item.bookingNumber}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.vehiclePlate}</div>
                    <div className="app-muted" style={{ fontSize: 12 }}>{item.customerName}</div>
                  </td>
                  <td>
                    <div>${item.totalCharges.toFixed(2)}</div>
                    <div className="app-muted" style={{ fontSize: 12 }}>Base ${item.baseCharges.toFixed(2)} / Extra ${item.extraCharges.toFixed(2)}</div>
                  </td>
                  <td><StatusBadge tone={item.outcome === 'Clean Close' ? 'success' : item.outcome === 'Charges Applied' ? 'warning' : 'danger'}>{item.outcome}</StatusBadge></td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button variant="secondary" size="sm" type="button" onClick={() => { window.location.hash = "rentals?id=" + item.rentalId; }}>View rental</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableCard>

      {isModalOpen ? (
        <ModalShell
          title="Process Return"
          onClose={() => setIsModalOpen(false)}
          footer={
            <>
              <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" form="return-form" disabled={submitting || !form.checklistId || !quote}>{submitting ? 'Submitting...' : 'Submit Return'}</Button>
            </>
          }
        >
          <form id="return-form" className="app-grid" onSubmit={handleSubmitReturn}>{warning && <p role="alert">{warning}</p>}
            <FormField label="Rental">
              <SelectInput value={form.rentalId} onChange={(event) => setForm((current) => ({ ...current, rentalId: event.target.value }))}>
                {rentals.map((rental) => <option key={rental.id} value={rental.id}>{rental.rentalNumber} � {rental.customerName} � {rental.vehiclePlate}</option>)}
              </SelectInput>
            </FormField>
            <div className="app-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <FormField label="Odometer In"><TextInput type="number" value={form.odometerIn} onChange={(event) => setForm((current) => ({ ...current, odometerIn: Number(event.target.value) }))} /></FormField>
              <FormField label="Fuel In">
                <SelectInput value={form.fuelIn} onChange={(event) => setForm((current) => ({ ...current, fuelIn: event.target.value }))}>
                  <option value="Full">Full</option>
                  <option value="3/4">3/4</option>
                  <option value="1/2">1/2</option>
                  <option value="1/4">1/4</option>
                  <option value="Empty">Empty</option>
                </SelectInput>
              </FormField>
            </div>
            <div className="app-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              <FormField label="Late Hours"><TextInput type="number" value={form.lateHours} onChange={(event) => setForm((current) => ({ ...current, lateHours: Number(event.target.value) }))} /></FormField>
              <FormField label="Extra Charges"><TextInput type="number" value={form.extraCharges} onChange={(event) => setForm((current) => ({ ...current, extraCharges: Number(event.target.value) }))} /></FormField>
              <FormField label="Completed return inspection"><SelectInput required value={form.checklistId} onChange={e=>{const c=inspections.find(c=>c.id===e.target.value);setForm({...form,checklistId:e.target.value,odometerIn:c?.evidence?.odometer||0,fuelIn:c?.evidence?.fuelLevel||'Full'});}}><option value="">Choose inspection</option>{inspections.filter(c=>c.rentalId===form.rentalId).map(c=><option key={c.id} value={c.id}>{c.vehicle?.plateNumber} · {new Date(c.completedAt||'').toLocaleString()}</option>)}</SelectInput><a href={'#checklist?rental='+form.rentalId+'&type=RETURN'}>Complete return inspection</a></FormField>
            </div>
            <div className="app-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <label className="app-check-option">
                <input type="checkbox" checked={form.damageFlag} onChange={(event) => setForm((current) => ({ ...current, damageFlag: event.target.checked }))} />
                <span>Damage review required</span>
              </label>
              <label className="app-check-option">
                <input type="checkbox" checked={form.maintenanceFlag} onChange={(event) => setForm((current) => ({ ...current, maintenanceFlag: event.target.checked }))} />
                <span>Maintenance hold required</span>
              </label>
            </div>
            <FormField label="Notes"><TextArea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Damage notes, settlement remarks, or branch handling instructions" /></FormField>
            {quote ? (
              <div className="app-surface-muted" style={{ padding: 16 }}>
                <div className="app-kicker">Settlement Preview</div>
                <div className="app-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginTop: 12 }}>
                  <div><div className="app-muted">Base Charges</div><div style={{ fontWeight: 700, fontSize: 20 }}>${quote.baseCharges.toFixed(2)}</div></div>
                  <div><div className="app-muted">Total Charges</div><div style={{ fontWeight: 700, fontSize: 20 }}>${quote.totalCharges.toFixed(2)}</div></div>
                  <div><div className="app-muted">Outcome</div><StatusBadge tone={quote.outcome === 'Clean Close' ? 'success' : quote.outcome === 'Charges Applied' ? 'warning' : 'danger'}>{quote.outcome}</StatusBadge></div>
                </div>
              </div>
            ) : null}
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
};

export default Returns;
