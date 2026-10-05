import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Car, Play, Plus, Search } from 'lucide-react';
import { Button, FormField, ModalShell, SectionHeader, SelectInput, StatCard, StatusBadge, TableCard, TextArea, TextInput } from './AppUI';
import { createRentalFromBooking, extendRental, getBookings, getRentals, listVehicleOptions, startRental, type RentalCreateRequest, type RentalExtendRequest, type VehicleOption } from '../services/api';
import { Booking, RentalContract } from '../types';

const emptyForm = (bookings: Booking[], vehicles: VehicleOption[]): RentalCreateRequest => ({
  bookingId: new URLSearchParams(window.location.hash.split('?')[1]).get('booking') || bookings[0]?.id || '',
  vehicleId: vehicles.find((vehicle) => vehicle.operationalStatus === 'available' || vehicle.operationalStatus === 'reserved')?.id || '',
  odometerOut: 0,
  fuelOut: 'Full',
  depositAmount: 200,
  addOns: [],
  notes: '',
});

const Rentals: React.FC = () => {
  const [rentals, setRentals] = useState<RentalContract[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(Boolean(new URLSearchParams(window.location.hash.split('?')[1]).get('booking')));
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<RentalContract | null>(null);
  const [form, setForm] = useState<RentalCreateRequest>(emptyForm([], []));
  const [extendForm, setExtendForm] = useState<RentalExtendRequest>({ expectedReturnDateTime: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [rentalData, bookingData, vehicleData] = await Promise.all([getRentals(), getBookings(), listVehicleOptions()]);
      setRentals(rentalData);
      setBookings(bookingData.filter((booking) => booking.status === 'Confirmed' || booking.status === 'Assigned'));
      setVehicles(vehicleData);
      setForm(current => {
        const options=bookingData.filter(b=>['Confirmed','Assigned'].includes(b.status)&&!rentalData.some(r=>r.bookingId===b.id));
        const booking=options.find(b=>b.id===current.bookingId)||options[0];
        return {...current,bookingId:booking?.id||'',vehicleId:booking?.assignedVehicleId||'',depositAmount:booking?.depositAmount||0};
      });
      setWarning(null);
    } catch (error) { setWarning(error instanceof Error ? error.message : 'Unable to load rentals.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRentals = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return rentals;
    }
    return rentals.filter((rental) =>
      [rental.rentalNumber, rental.bookingNumber, rental.customerName, rental.vehiclePlate].some((value) => value.toLowerCase().includes(query))
    );
  }, [rentals, searchTerm]);

  const metrics = useMemo(() => ({
    total: rentals.length,
    active: rentals.filter((rental) => rental.status === 'Active').length,
    reserved: rentals.filter((rental) => rental.status === 'Reserved').length,
    overdue: rentals.filter((rental) => rental.status === 'Overdue').length,
  }), [rentals]);

  const bookingOptions = useMemo(() => bookings.filter(b=>!rentals.some(r=>r.bookingId===b.id)), [bookings,rentals]);
  const vehicleOptions = useMemo(() => vehicles.filter((vehicle) => vehicle.operationalStatus !== 'maintenance' && vehicle.operationalStatus !== 'inspection_hold'), [vehicles]);

  const handleCreateRental = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const created = await createRentalFromBooking({
        ...form,
        odometerOut: Number(form.odometerOut),
        depositAmount: Number(form.depositAmount),
        addOns: form.addOns,
      });
      setIsCreateModalOpen(false);
      window.location.hash = "rentals?id=" + created.id;
      setForm(emptyForm(bookings, vehicles));
      await loadData();
    } catch (error) { setWarning(error instanceof Error ? error.message : 'Failed to create rental.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartRental = async (rentalId: string) => {
    try {
      await startRental(rentalId);
      await loadData();
    } catch (error) { setWarning(error instanceof Error ? error.message : 'Failed to start rental.');
    }
  };

  const openExtendModal = (rental: RentalContract) => {
    setSelectedRental(rental);
    setExtendForm({
      expectedReturnDateTime: rental.expectedReturnDateTime.slice(0, 16),
      notes: rental.notes || '',
    });
    setIsExtendModalOpen(true);
  };

  const handleExtendRental = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRental) {
      return;
    }

    setSubmitting(true);
    try {
      await extendRental(selectedRental.id, extendForm);
      setIsExtendModalOpen(false);
      await loadData();
    } catch (error) { setWarning(error instanceof Error ? error.message : 'Failed to extend rental.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-grid" style={{ gap: 24 }}>
      <SectionHeader
        title="Rentals"
        description="Create rental contracts from bookings and manage active rental lifecycle."
        warning={warning}
        action={<Button type="button" onClick={() => setIsCreateModalOpen(true)}><Plus size={16} /> Create Rental</Button>}
      />

      <div className="app-grid app-grid--stats">
        <StatCard label="Total Rentals" value={metrics.total} icon={<Car size={20} />} />
        <StatCard label="Reserved" value={metrics.reserved} icon={<CalendarClock size={20} />} />
        <StatCard label="Active" value={metrics.active} icon={<Play size={20} />} />
        <StatCard label="Overdue" value={metrics.overdue} icon={<CalendarClock size={20} />} />
      </div>

      <div className="app-card" style={{ padding: 16 }}>
        <div className="app-search">
          <Search size={16} />
          <TextInput value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search rental, booking, customer, or vehicle" />
        </div>
      </div>

      <TableCard>
        <div className="app-table-wrap">
          <table className="app-table">
            <thead>
              <tr>
                <th>Rental</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Window</th>
                <th>Commercials</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRentals.length === 0 ? (
                <tr><td colSpan={7} className="app-empty">No rentals found.</td></tr>
              ) : filteredRentals.map((rental) => (
                <tr key={rental.id}>
                  <td>
                    <a href={"#rentals?id=" + rental.id} style={{ fontWeight: 600 }}>{rental.rentalNumber}</a>
                    <div className="app-muted" style={{ fontSize: 12 }}>{rental.bookingNumber}</div>
                  </td>
                  <td>{rental.customerName}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{rental.vehiclePlate}</div>
                    <div className="app-muted" style={{ fontSize: 12 }}>{rental.vehicleClass}</div>
                  </td>
                  <td>
                    <div>{new Date(rental.pickupDateTime).toLocaleString()}</div>
                    <div className="app-muted" style={{ fontSize: 12 }}>Due {new Date(rental.expectedReturnDateTime).toLocaleString()}</div>
                  </td>
                  <td>
                    <div>Deposit ${rental.depositAmount.toFixed(2)}</div>
                    <div className="app-muted" style={{ fontSize: 12 }}>{rental.addOns.join(', ') || 'No add-ons'}</div>
                  </td>
                  <td><StatusBadge tone={rental.status === 'Active' ? 'success' : rental.status === 'Reserved' ? 'neutral' : rental.status === 'Overdue' ? 'warning' : 'inverse'}>{rental.status}</StatusBadge></td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                      {rental.status === 'Reserved' ? <Button variant="secondary" size="sm" type="button" onClick={() => handleStartRental(rental.id)}><Play size={14} /> Start</Button> : null}
                      {rental.status !== 'Closed' ? <Button variant="ghost" size="sm" type="button" onClick={() => openExtendModal(rental)}>Extend</Button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableCard>

      {isCreateModalOpen ? (
        <ModalShell
          title="Create Rental"
          onClose={() => setIsCreateModalOpen(false)}
          footer={
            <>
              <Button variant="secondary" type="button" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button type="submit" form="rental-form" disabled={submitting}>{submitting ? 'Creating...' : 'Create Rental'}</Button>
            </>
          }
        >
          <form id="rental-form" className="app-grid" onSubmit={handleCreateRental}>{warning && <p role="alert">{warning}</p>}
            <FormField label="Booking">
              <SelectInput value={form.bookingId} onChange={event=>{const b=bookings.find(b=>b.id===event.target.value);setForm({...form,bookingId:event.target.value,vehicleId:b?.assignedVehicleId||'',depositAmount:b?.depositAmount||0});}}>
                {bookingOptions.map((booking) => <option key={booking.id} value={booking.id}>{booking.bookingNumber} � {booking.customerName}</option>)}
              </SelectInput>
            </FormField>
            <FormField label="Vehicle">
              <SelectInput value={form.vehicleId} onChange={(event) => setForm((current) => ({ ...current, vehicleId: event.target.value }))}>
                {vehicleOptions.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.label}</option>)}
              </SelectInput>
            </FormField>
            <div className="app-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              <FormField label="Odometer Out"><TextInput type="number" value={form.odometerOut} onChange={(event) => setForm((current) => ({ ...current, odometerOut: Number(event.target.value) }))} /></FormField>
              <FormField label="Fuel Out">
                <SelectInput value={form.fuelOut} onChange={(event) => setForm((current) => ({ ...current, fuelOut: event.target.value }))}>
                  <option value="Full">Full</option>
                  <option value="3/4">3/4</option>
                  <option value="1/2">1/2</option>
                  <option value="1/4">1/4</option>
                  <option value="Empty">Empty</option>
                </SelectInput>
              </FormField>
              <FormField label="Deposit due at pickup"><TextInput readOnly value={form.depositAmount} /></FormField>
            </div>
            <FormField label="Add-ons (comma separated)"><TextInput value={form.addOns.join(', ')} onChange={(event) => setForm((current) => ({ ...current, addOns: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) }))} placeholder="GPS, Child Seat" /></FormField>
            <FormField label="Notes"><TextArea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Delivery notes, driver remarks, approval notes" /></FormField>
          </form>
        </ModalShell>
      ) : null}

      {isExtendModalOpen && selectedRental ? (
        <ModalShell
          title={`Extend ${selectedRental.rentalNumber}`}
          onClose={() => setIsExtendModalOpen(false)}
          footer={
            <>
              <Button variant="secondary" type="button" onClick={() => setIsExtendModalOpen(false)}>Cancel</Button>
              <Button type="submit" form="extend-rental-form" disabled={submitting}>{submitting ? 'Saving...' : 'Save Extension'}</Button>
            </>
          }
        >
          <form id="extend-rental-form" className="app-grid" onSubmit={handleExtendRental}>{warning && <p role="alert">{warning}</p>}
            <FormField label="Expected Return">
              <TextInput type="datetime-local" value={extendForm.expectedReturnDateTime} onChange={(event) => setExtendForm((current) => ({ ...current, expectedReturnDateTime: event.target.value }))} />
            </FormField>
            <FormField label="Notes">
              <TextArea value={extendForm.notes} onChange={(event) => setExtendForm((current) => ({ ...current, notes: event.target.value }))} />
            </FormField>
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
};

export default Rentals;
