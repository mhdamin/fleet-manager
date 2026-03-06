import React, { useEffect, useMemo, useState } from 'react';
import { CalendarRange, CreditCard, Search, ShieldCheck } from 'lucide-react';
import { getBookings, getCustomers, getInvoices, getRatePlans, getRentals } from '../services/api';
import { Booking, Customer, Invoice, RatePlan, RentalContract } from '../types';

const CustomerPortal: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rentals, setRentals] = useState<RentalContract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [ratePlans, setRatePlans] = useState<RatePlan[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [customerData, bookingData, rentalData, invoiceData, ratePlanData] = await Promise.all([getCustomers(), getBookings(), getRentals(), getInvoices(), getRatePlans()]);
        setCustomers(customerData);
        setSelectedCustomerId(customerData[0]?.id || '');
        setBookings(bookingData);
        setRentals(rentalData);
        setInvoices(invoiceData);
        setRatePlans(ratePlanData.filter((plan) => plan.active));
        setWarning(null);
      } catch {
        setWarning('Unable to load customer portal data.');
      }
    };
    load();
  }, []);

  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId) || null;
  const myBookings = useMemo(() => bookings.filter((booking) => booking.customerId === selectedCustomerId), [bookings, selectedCustomerId]);
  const myRentals = useMemo(() => rentals.filter((rental) => rental.customerId === selectedCustomerId), [rentals, selectedCustomerId]);
  const myInvoices = useMemo(() => invoices.filter((invoice) => invoice.customerName === selectedCustomer?.fullName), [invoices, selectedCustomer]);
  const filteredRates = useMemo(() => ratePlans.filter((plan) => !search || `${plan.name} ${plan.vehicleClass}`.toLowerCase().includes(search.toLowerCase())), [ratePlans, search]);

  return (
    <div className="consumer-portal">
      <div className="consumer-hero">
        <div>
          <div className="consumer-kicker">Customer Self-Service Portal</div>
          <h1 style={{ margin: '10px 0 8px', fontSize: 36 }}>Search, book, review invoices, and manage upcoming trips.</h1>
          <p className="consumer-subtitle">This Phase 5 portal sits on the same data model as the operations console, so customers and staff see the same booking and billing records.</p>
        </div>
        <div className="consumer-panel">
          <label className="app-field">
            <span className="app-label">Preview as customer</span>
            <select className="app-input app-select" value={selectedCustomerId} onChange={(event) => setSelectedCustomerId(event.target.value)}>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.fullName}</option>)}
            </select>
          </label>
          {selectedCustomer ? <div className="consumer-chip"><ShieldCheck size={16} /> {selectedCustomer.identityStatus} identity • {selectedCustomer.status} account</div> : null}
        </div>
      </div>

      {warning ? <p className="app-warning-text">{warning}</p> : null}

      <div className="consumer-grid">
        <section className="consumer-card">
          <div className="consumer-card__header"><span>Find A Vehicle</span><Search size={16} /></div>
          <div className="app-search" style={{ marginBottom: 16 }}>
            <Search size={16} />
            <input className="app-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by vehicle class or rate plan" />
          </div>
          <div className="consumer-rate-list">
            {filteredRates.map((plan) => <div key={plan.id} className="consumer-rate-item"><div><div style={{ fontWeight: 700 }}>{plan.name}</div><div className="app-muted" style={{ fontSize: 13 }}>{plan.vehicleClass} • {plan.includedMileagePerDay} km/day included</div></div><div style={{ textAlign: 'right' }}><div style={{ fontWeight: 700 }}>${plan.dailyRate.toFixed(2)}/day</div><div className="app-muted" style={{ fontSize: 13 }}>Deposit ${plan.depositAmount.toFixed(2)}</div></div></div>)}
          </div>
        </section>

        <section className="consumer-card">
          <div className="consumer-card__header"><span>My Trips</span><CalendarRange size={16} /></div>
          <div className="consumer-stat-row">
            <div><div className="consumer-stat-label">Bookings</div><div className="consumer-stat-value">{myBookings.length}</div></div>
            <div><div className="consumer-stat-label">Active Rentals</div><div className="consumer-stat-value">{myRentals.filter((rental) => rental.status === 'Active').length}</div></div>
            <div><div className="consumer-stat-label">Open Invoices</div><div className="consumer-stat-value">{myInvoices.filter((invoice) => invoice.balanceDue > 0).length}</div></div>
          </div>
          <div className="consumer-list">
            {myBookings.map((booking) => <div key={booking.id} className="consumer-list-item"><div><div style={{ fontWeight: 700 }}>{booking.bookingNumber}</div><div className="app-muted" style={{ fontSize: 13 }}>{booking.pickupLocation} to {booking.dropoffLocation}</div></div><div style={{ textAlign: 'right' }}><div>{new Date(booking.pickupDateTime).toLocaleDateString()}</div><div className="app-muted" style={{ fontSize: 13 }}>{booking.status}</div></div></div>)}
            {myBookings.length === 0 ? <div className="app-muted">No bookings for this customer yet.</div> : null}
          </div>
        </section>

        <section className="consumer-card">
          <div className="consumer-card__header"><span>Billing</span><CreditCard size={16} /></div>
          <div className="consumer-list">
            {myInvoices.map((invoice) => <div key={invoice.id} className="consumer-list-item"><div><div style={{ fontWeight: 700 }}>{invoice.invoiceNumber}</div><div className="app-muted" style={{ fontSize: 13 }}>{invoice.status}</div></div><div style={{ textAlign: 'right' }}><div style={{ fontWeight: 700 }}>${invoice.total.toFixed(2)}</div><div className="app-muted" style={{ fontSize: 13 }}>Due ${invoice.balanceDue.toFixed(2)}</div></div></div>)}
            {myInvoices.length === 0 ? <div className="app-muted">No invoices for this customer yet.</div> : null}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CustomerPortal;
