import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Car, CheckCircle2, ClipboardList, Eye, Plus, Search, XCircle } from 'lucide-react';
import { Button, FormField, ModalShell, SectionHeader, SelectInput, StatCard, StatusBadge, TableCard, TextArea, TextInput } from './AppUI';
import { apiPost, assignVehicleToBooking, cancelBooking, confirmBooking, createBooking, getBookings, getCustomers, listVehicleOptions, type BookingRequest, type VehicleOption } from '../services/api';
import { Booking, BookingStatus, Customer } from '../types';

const bookingStatuses: Array<BookingStatus | 'All'> = ['All', 'Draft', 'Confirmed', 'Assigned', 'Cancelled', 'Checked Out', 'Completed'];

const defaultForm = (customers: Customer[]): BookingRequest => ({
  customerId: customers[0]?.id || '',
  pickupLocation: 'HQ',
  dropoffLocation: 'HQ',
  pickupDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  dropoffDateTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString().slice(0, 16),
  vehicleClass: 'Sedan',
  estimatedTotal: 180,
  depositAmount: 150,
  notes: '',
});

const toneForStatus = (status: BookingStatus) => {
  switch (status) {
    case 'Confirmed':
      return 'success';
    case 'Assigned':
      return 'inverse';
    case 'Cancelled':
      return 'danger';
    case 'Checked Out':
      return 'warning';
    case 'Completed':
      return 'success';
    default:
      return 'neutral';
  }
};

const Bookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'All'>('All');
  const [warning, setWarning] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [form, setForm] = useState<BookingRequest>(defaultForm([]));
  const [submitting, setSubmitting] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [quote,setQuote]=useState<{pricing:{estimatedTotal:number;taxTotal:number;rentalDays:number};deposit:number;available:number;currency:string}|null>(null);
  useEffect(()=>{let cancelled=false;setQuote(null);if(!isCreateModalOpen||!form.customerId)return;const timer=window.setTimeout(()=>{apiPost<any>('/api/bookings/quote',form).then(q=>{if(!cancelled)setQuote(q);}).catch(e=>{if(!cancelled)setWarning(e.message);});},250);return()=>{cancelled=true;clearTimeout(timer);};},[isCreateModalOpen,form.customerId,form.pickupDateTime,form.dropoffDateTime,form.vehicleClass]);

  const loadData = async () => {
    try {
      const [bookingData, customerData, vehicleData] = await Promise.all([
        getBookings({ status: statusFilter, query: searchTerm }),
        getCustomers(),
        listVehicleOptions(),
      ]);
      setBookings(bookingData);
      setCustomers(customerData);
      setVehicles(vehicleData);
      setForm((current) => (current.customerId ? current : defaultForm(customerData)));
      setWarning(null);
    } catch (error) { setWarning(error instanceof Error ? error.message : 'Unable to load booking data.');
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadData();
    }, 150);
    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  const metrics = useMemo(() => ({
    total: bookings.length,
    upcoming: bookings.filter((booking) => ['Draft', 'Confirmed', 'Assigned'].includes(booking.status)).length,
    checkedOut: bookings.filter((booking) => booking.status === 'Checked Out').length,
    cancelled: bookings.filter((booking) => booking.status === 'Cancelled').length,
  }), [bookings]);

  const assignableVehicles = useMemo(
    () => vehicles.filter((vehicle) => !['maintenance','inspection_hold'].includes(vehicle.operationalStatus) && (!detailBooking || vehicle.vehicleClass === detailBooking.vehicleClass)),
    [vehicles, detailBooking]
  );

  const handleCreateBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await createBooking({
        ...form,
        estimatedTotal: 0,
        depositAmount: quote?.deposit || 0,
      });
      setIsCreateModalOpen(false);
      setForm(defaultForm(customers));
      await loadData();
    } catch (error) { setWarning(error instanceof Error ? error.message : 'Failed to create booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async (bookingId: string) => {
    try {
      await confirmBooking(bookingId);
      await loadData();
    } catch (error) { setWarning(error instanceof Error ? error.message : 'Failed to confirm booking.');
    }
  };

  const handleCancel = async (bookingId: string) => {
    try {
      await cancelBooking(bookingId);
      await loadData();
    } catch (error) { setWarning(error instanceof Error ? error.message : 'Failed to cancel booking.');
    }
  };

  const handleAssignVehicle = async (bookingId: string) => {
    if (!selectedVehicleId) {
      setWarning('Select a vehicle before assigning.');
      return;
    }

    try {
      setAssigningId(bookingId);
      const updated = await assignVehicleToBooking(bookingId, selectedVehicleId);
      setDetailBooking(updated);
      setSelectedVehicleId('');
      await loadData();
    } catch (error) { setWarning(error instanceof Error ? error.message : 'Failed to assign vehicle.');
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="app-grid" style={{ gap: 24 }}>
      <SectionHeader
        title="Bookings"
        description="Manage reservations, allocation readiness, and conversion into rentals."
        warning={warning}
        action={
          <Button type="button" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} /> Create Booking
          </Button>
        }
      />

      <div className="app-grid app-grid--stats">
        <StatCard label="Total Bookings" value={metrics.total} icon={<ClipboardList size={20} />} />
        <StatCard label="Upcoming" value={metrics.upcoming} icon={<CalendarDays size={20} />} />
        <StatCard label="Checked Out" value={metrics.checkedOut} icon={<Car size={20} />} />
        <StatCard label="Cancelled" value={metrics.cancelled} icon={<XCircle size={20} />} />
      </div>

      <div className="app-card" style={{ padding: 16 }}>
        <div className="app-split" style={{ flexWrap: 'wrap' }}>
          <div className="app-search" style={{ flex: '1 1 320px' }}>
            <Search size={16} />
            <TextInput value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search booking number, customer, or location" />
          </div>
          <div className="app-tab-row">
            {bookingStatuses.map((status) => (
              <button
                key={status}
                type="button"
                className={statusFilter === status ? 'app-tab app-tab--active' : 'app-tab'}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <TableCard>
        <div className="app-table-wrap">
          <table className="app-table">
            <thead>
              <tr>
                <th>Booking</th>
                <th>Customer</th>
                <th>Trip</th>
                <th>Vehicle</th>
                <th>Value</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="app-empty">No bookings found.</td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600 }}>{booking.bookingNumber}</div>
                        <div className="app-muted" style={{ fontSize: 12 }}>{new Date(booking.createdAt).toLocaleString()}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{booking.customerName}</div>
                      <div className="app-muted" style={{ fontSize: 12 }}>{booking.vehicleClass}</div>
                    </td>
                    <td>
                      <div>{booking.pickupLocation} to {booking.dropoffLocation}</div>
                      <div className="app-muted" style={{ fontSize: 12 }}>{new Date(booking.pickupDateTime).toLocaleString()}</div>
                    </td>
                    <td>{booking.assignedVehiclePlate || 'Unassigned'}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>${booking.estimatedTotal.toFixed(2)}</div>
                      <div className="app-muted" style={{ fontSize: 12 }}>Deposit ${booking.depositAmount.toFixed(2)}</div>
                    </td>
                    <td><StatusBadge tone={toneForStatus(booking.status)}>{booking.status}</StatusBadge></td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                        <Button variant="ghost" size="sm" type="button" onClick={() => setDetailBooking(booking)}><Eye size={14} /></Button>
                        {booking.status === 'Draft' ? <Button variant="secondary" size="sm" type="button" onClick={() => handleConfirm(booking.id)}><CheckCircle2 size={14} /> Confirm</Button> : null}
                        {['Draft', 'Confirmed'].includes(booking.status) ? (
                          <Button variant="danger" size="sm" type="button" onClick={() => handleCancel(booking.id)}>
                            <XCircle size={14} /> Cancel
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </TableCard>

      {isCreateModalOpen ? (
        <ModalShell
          title="Create Booking"
          onClose={() => setIsCreateModalOpen(false)}
          footer={
            <>
              <Button variant="secondary" type="button" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button type="submit" form="create-booking-form" disabled={submitting || !quote}>{submitting ? 'Creating...' : 'Create Booking'}</Button>
            </>
          }
        >
          <form id="create-booking-form" onSubmit={handleCreateBooking} className="app-grid">{warning && <p role="alert">{warning}</p>}{quote && <p>{quote.available} vehicles available · {quote.pricing.rentalDays} days · Tax {quote.currency} {quote.pricing.taxTotal.toFixed(2)}</p>}
            <FormField label="Customer">
              <SelectInput value={form.customerId} onChange={(event) => setForm((current) => ({ ...current, customerId: event.target.value }))}>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.fullName}</option>)}
              </SelectInput>
            </FormField>
            <div className="app-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <FormField label="Pickup Location"><TextInput value={form.pickupLocation} onChange={(event) => setForm((current) => ({ ...current, pickupLocation: event.target.value }))} /></FormField>
              <FormField label="Drop-off Location"><TextInput value={form.dropoffLocation} onChange={(event) => setForm((current) => ({ ...current, dropoffLocation: event.target.value }))} /></FormField>
            </div>
            <div className="app-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <FormField label="Pickup Date & Time"><TextInput type="datetime-local" value={form.pickupDateTime} onChange={(event) => setForm((current) => ({ ...current, pickupDateTime: event.target.value }))} /></FormField>
              <FormField label="Drop-off Date & Time"><TextInput type="datetime-local" value={form.dropoffDateTime} onChange={(event) => setForm((current) => ({ ...current, dropoffDateTime: event.target.value }))} /></FormField>
            </div>
            <div className="app-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              <FormField label="Vehicle Class">
                <SelectInput value={form.vehicleClass} onChange={(event) => setForm((current) => ({ ...current, vehicleClass: event.target.value }))}>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Van">Van</option>
                </SelectInput>
              </FormField>
              <FormField label="Rental total"><TextInput readOnly value={quote ? quote.currency + " " + quote.pricing.estimatedTotal.toFixed(2) : "Calculating…"} /></FormField>
              <FormField label="Refundable deposit"><TextInput readOnly value={quote ? quote.currency + " " + quote.deposit.toFixed(2) : "Calculating…"} /></FormField>
            </div>
            <FormField label="Notes">
              <TextArea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Pickup window, add-ons, special instructions" />
            </FormField>
          </form>
        </ModalShell>
      ) : null}

      {detailBooking ? (
        <ModalShell title={detailBooking.bookingNumber} onClose={() => setDetailBooking(null)} footer={<Button type="button" variant="secondary" onClick={() => setDetailBooking(null)}>Close</Button>}>
          <div className="app-grid">
            {warning && <p role="alert">{warning}</p>}
            {['Confirmed','Assigned'].includes(detailBooking.status) && <><FormField label="Vehicle candidates (availability checked on assignment)"><SelectInput value={selectedVehicleId} onChange={e=>setSelectedVehicleId(e.target.value)}><option value="">Choose vehicle</option>{assignableVehicles.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}</SelectInput></FormField><Button disabled={!selectedVehicleId || !!assigningId} onClick={()=>handleAssignVehicle(detailBooking.id)}>Assign vehicle</Button><a href={'#rentals?booking='+detailBooking.id}>Prepare rental</a></>}
            <div className="app-note-row"><span className="app-muted">Customer</span><strong>{detailBooking.customerName}</strong></div>
            <div className="app-note-row"><span className="app-muted">Trip</span><strong>{detailBooking.pickupLocation} to {detailBooking.dropoffLocation}</strong></div>
            <div className="app-note-row"><span className="app-muted">Window</span><strong>{new Date(detailBooking.pickupDateTime).toLocaleString()} to {new Date(detailBooking.dropoffDateTime).toLocaleString()}</strong></div>
            <div className="app-note-row"><span className="app-muted">Vehicle</span><strong>{detailBooking.assignedVehiclePlate || 'Pending allocation'}</strong></div>
            <div className="app-note-row"><span className="app-muted">Commercials</span><strong>${detailBooking.estimatedTotal.toFixed(2)} total / ${detailBooking.depositAmount.toFixed(2)} deposit</strong></div>
            {detailBooking.notes ? <div className="app-surface-muted" style={{ padding: 14 }}>{detailBooking.notes}</div> : null}
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
};

export default Bookings;
