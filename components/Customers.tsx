import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, FileSearch, Plus, Search, UserRound } from 'lucide-react';
import { Button, FormField, ModalShell, SectionHeader, SelectInput, StatCard, StatusBadge, TableCard, TextArea, TextInput } from './AppUI';
import { createCustomer, getCustomerHistorySummary, getCustomers, searchCustomers, updateCustomer, type CustomerHistorySummary, type CustomerRequest } from '../services/api';
import { Customer } from '../types';

const emptyForm: CustomerRequest = {
  fullName: '',
  email: '',
  phone: '',
  licenseNumber: '',
  licenseExpiry: '',
  identityStatus: 'Pending',
  status: 'Active',
  notes: '',
};

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [history, setHistory] = useState<CustomerHistorySummary | null>(null);
  const [form, setForm] = useState<CustomerRequest>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const loadCustomers = async (query = '') => {
    try {
      const customerData = query ? await searchCustomers(query) : await getCustomers();
      setCustomers(customerData);
      setWarning(null);
    } catch {
      setWarning('Unable to load customers.');
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => loadCustomers(searchTerm), 150);
    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  const metrics = useMemo(() => ({
    total: customers.length,
    verified: customers.filter((customer) => customer.identityStatus === 'Verified').length,
    watchlist: customers.filter((customer) => customer.status === 'Watchlist').length,
    active: customers.filter((customer) => customer.status === 'Active').length,
  }), [customers]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      licenseNumber: customer.licenseNumber,
      licenseExpiry: customer.licenseExpiry,
      identityStatus: customer.identityStatus,
      status: customer.status,
      notes: customer.notes,
    });
    setIsModalOpen(true);
  };

  const openDetail = async (customer: Customer) => {
    setDetailCustomer(customer);
    try {
      const summary = await getCustomerHistorySummary(customer.id);
      setHistory(summary);
    } catch {
      setHistory(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, form);
      } else {
        await createCustomer(form);
      }
      setIsModalOpen(false);
      setForm(emptyForm);
      await loadCustomers(searchTerm);
    } catch {
      setWarning('Failed to save customer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-grid" style={{ gap: 24 }}>
      <SectionHeader
        title="Customers"
        description="Maintain renter identity, license readiness, and account risk visibility."
        warning={warning}
        action={<Button type="button" onClick={openCreateModal}><Plus size={16} /> Add Customer</Button>}
      />

      <div className="app-grid app-grid--stats">
        <StatCard label="Total Customers" value={metrics.total} icon={<UserRound size={20} />} />
        <StatCard label="Verified Identity" value={metrics.verified} icon={<FileSearch size={20} />} />
        <StatCard label="Watchlist" value={metrics.watchlist} icon={<AlertTriangle size={20} />} />
        <StatCard label="Active Accounts" value={metrics.active} icon={<UserRound size={20} />} />
      </div>

      <div className="app-card" style={{ padding: 16 }}>
        <div className="app-search">
          <Search size={16} />
          <TextInput value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search name, email, phone, or license" />
        </div>
      </div>

      <TableCard>
        <div className="app-table-wrap">
          <table className="app-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>License</th>
                <th>Identity</th>
                <th>Account</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={6} className="app-empty">No customers found.</td></tr>
              ) : customers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{customer.fullName}</div>
                    <div className="app-muted" style={{ fontSize: 12 }}>{customer.customerNumber}</div>
                  </td>
                  <td>
                    <div>{customer.email}</div>
                    <div className="app-muted" style={{ fontSize: 12 }}>{customer.phone}</div>
                  </td>
                  <td>
                    <div className="app-mono">{customer.licenseNumber}</div>
                    <div className="app-muted" style={{ fontSize: 12 }}>Exp {customer.licenseExpiry}</div>
                  </td>
                  <td><StatusBadge tone={customer.identityStatus === 'Verified' ? 'success' : customer.identityStatus === 'Flagged' ? 'danger' : 'warning'}>{customer.identityStatus}</StatusBadge></td>
                  <td><StatusBadge tone={customer.status === 'Active' ? 'success' : customer.status === 'Watchlist' ? 'warning' : 'neutral'}>{customer.status}</StatusBadge></td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <Button variant="ghost" size="sm" type="button" onClick={() => openDetail(customer)}>View</Button>
                      <Button variant="secondary" size="sm" type="button" onClick={() => openEditModal(customer)}>Edit</Button>
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
          title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
          onClose={() => setIsModalOpen(false)}
          footer={
            <>
              <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" form="customer-form" disabled={submitting}>{submitting ? 'Saving...' : 'Save Customer'}</Button>
            </>
          }
        >
          <form id="customer-form" className="app-grid" onSubmit={handleSubmit}>
            <div className="app-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <FormField label="Full Name"><TextInput value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} /></FormField>
              <FormField label="Email"><TextInput type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></FormField>
            </div>
            <div className="app-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <FormField label="Phone"><TextInput value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} /></FormField>
              <FormField label="License Number"><TextInput value={form.licenseNumber} onChange={(event) => setForm((current) => ({ ...current, licenseNumber: event.target.value }))} /></FormField>
            </div>
            <div className="app-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              <FormField label="License Expiry"><TextInput type="date" value={form.licenseExpiry} onChange={(event) => setForm((current) => ({ ...current, licenseExpiry: event.target.value }))} /></FormField>
              <FormField label="Identity Status">
                <SelectInput value={form.identityStatus} onChange={(event) => setForm((current) => ({ ...current, identityStatus: event.target.value as Customer['identityStatus'] }))}>
                  <option value="Verified">Verified</option>
                  <option value="Pending">Pending</option>
                  <option value="Flagged">Flagged</option>
                </SelectInput>
              </FormField>
              <FormField label="Account Status">
                <SelectInput value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as Customer['status'] }))}>
                  <option value="Active">Active</option>
                  <option value="Watchlist">Watchlist</option>
                  <option value="Inactive">Inactive</option>
                </SelectInput>
              </FormField>
            </div>
            <FormField label="Notes"><TextArea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Eligibility notes, special approval requirements, or risk remarks" /></FormField>
          </form>
        </ModalShell>
      ) : null}

      {detailCustomer ? (
        <ModalShell title={detailCustomer.fullName} onClose={() => setDetailCustomer(null)} footer={<Button type="button" variant="secondary" onClick={() => setDetailCustomer(null)}>Close</Button>}>
          <div className="app-grid">
            <div className="app-note-row"><span className="app-muted">Customer Number</span><strong>{detailCustomer.customerNumber}</strong></div>
            <div className="app-note-row"><span className="app-muted">Contact</span><strong>{detailCustomer.email} / {detailCustomer.phone}</strong></div>
            <div className="app-note-row"><span className="app-muted">License</span><strong>{detailCustomer.licenseNumber} (exp {detailCustomer.licenseExpiry})</strong></div>
            <div className="app-note-row"><span className="app-muted">Identity</span><StatusBadge tone={detailCustomer.identityStatus === 'Verified' ? 'success' : detailCustomer.identityStatus === 'Flagged' ? 'danger' : 'warning'}>{detailCustomer.identityStatus}</StatusBadge></div>
            <div className="app-note-row"><span className="app-muted">Account Status</span><StatusBadge tone={detailCustomer.status === 'Active' ? 'success' : detailCustomer.status === 'Watchlist' ? 'warning' : 'neutral'}>{detailCustomer.status}</StatusBadge></div>
            <div className="app-card" style={{ padding: 16 }}>
              <div className="app-kicker">History Summary</div>
              <div className="app-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginTop: 12 }}>
                <div><div className="app-muted">Bookings</div><div style={{ fontWeight: 700, fontSize: 20 }}>{history?.bookings ?? '-'}</div></div>
                <div><div className="app-muted">Rentals</div><div style={{ fontWeight: 700, fontSize: 20 }}>{history?.rentals ?? '-'}</div></div>
                <div><div className="app-muted">Active Rentals</div><div style={{ fontWeight: 700, fontSize: 20 }}>{history?.activeRentals ?? '-'}</div></div>
              </div>
            </div>
            {detailCustomer.notes ? <div className="app-surface-muted" style={{ padding: 14 }}>{detailCustomer.notes}</div> : null}
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
};

export default Customers;
