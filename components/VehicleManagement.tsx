import React, { useEffect, useMemo, useState } from 'react';
import { Car, CheckCircle, Edit2, Eye, Filter, Key, PenTool, Plus, Search, Trash2 } from 'lucide-react';
import {
  Button,
  FormField,
  ModalShell,
  SectionHeader,
  SelectInput,
  StatCard,
  StatusBadge,
  TableCard,
  TextInput,
} from './AppUI';
import {
  createVehicle,
  deleteVehicleById,
  getVehicles,
  getVehicleStats,
  type VehicleResponse,
  type VehicleStatsResponse,
} from '../services/api';

const FALLBACK_STATS: VehicleStatsResponse = {
  totalVehicles: 0,
  availableVehicles: 0,
  rentedVehicles: 0,
  maintenanceVehicles: 0,
};

interface NewVehicleForm {
  plateNumber: string;
  model: string;
  manufacturer: string;
  year: string;
  status: string;
}

const DEFAULT_VEHICLE_FORM: NewVehicleForm = {
  plateNumber: '',
  model: '',
  manufacturer: '',
  year: String(new Date().getFullYear()),
  status: 'Available',
};

const statusTone = (status: string): 'success' | 'neutral' | 'danger' => {
  switch (status) {
    case 'Available':
      return 'success';
    case 'Maintenance':
      return 'danger';
    default:
      return 'neutral';
  }
};

const statusIcon = (status: string) => {
  switch (status) {
    case 'Available':
      return <CheckCircle size={14} />;
    case 'Rented':
      return <Key size={14} />;
    case 'Maintenance':
      return <PenTool size={14} />;
    default:
      return <Car size={14} />;
  }
};

const VehicleManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [stats, setStats] = useState<VehicleStatsResponse>(FALLBACK_STATS);
  const [warning, setWarning] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form, setForm] = useState<NewVehicleForm>(DEFAULT_VEHICLE_FORM);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [vehicleList, statData] = await Promise.all([getVehicles(), getVehicleStats()]);
      setVehicles(vehicleList);
      setStats(statData);
      setWarning(null);
    } catch {
      setWarning('Unable to load vehicle data from backend.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredVehicles = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return vehicles;
    }

    return vehicles.filter((vehicle) => {
      const matchPlate = vehicle.plateNumber?.toLowerCase().includes(query);
      const matchModel = vehicle.model?.toLowerCase().includes(query);
      const matchManufacturer = vehicle.manufacturer?.toLowerCase().includes(query);
      return Boolean(matchPlate || matchModel || matchManufacturer);
    });
  }, [vehicles, searchTerm]);

  const handleCreateVehicle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.plateNumber.trim() || !form.model.trim() || !form.manufacturer.trim() || !form.year.trim()) {
      setWarning('All vehicle fields are required.');
      return;
    }

    setSubmitting(true);
    try {
      await createVehicle({
        plateNumber: form.plateNumber.trim(),
        model: form.model.trim(),
        manufacturer: form.manufacturer.trim(),
        year: Number(form.year),
        status: form.status,
      });
      setIsCreateModalOpen(false);
      setForm(DEFAULT_VEHICLE_FORM);
      await loadData();
    } catch {
      setWarning('Failed to create vehicle. Ensure you have admin access and valid values.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm('Delete this vehicle?')) {
      return;
    }

    try {
      await deleteVehicleById(vehicleId);
      await loadData();
    } catch {
      setWarning('Failed to delete vehicle.');
    }
  };

  return (
    <div className="app-grid" style={{ gap: 24 }}>
      <SectionHeader
        title="Vehicle Management"
        description="Manage fleet vehicles, statuses, and operational readiness."
        warning={warning}
        action={
          <Button type="button" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} /> Add Vehicle
          </Button>
        }
      />

      <div className="app-grid app-grid--stats">
        <StatCard label="Total Vehicles" value={stats.totalVehicles} icon={<Car size={20} />} />
        <StatCard label="Available" value={stats.availableVehicles} icon={<CheckCircle size={20} />} />
        <StatCard label="Rented Out" value={stats.rentedVehicles} icon={<Key size={20} />} />
        <StatCard label="Maintenance" value={stats.maintenanceVehicles} icon={<PenTool size={20} />} />
      </div>

      <div className="app-card" style={{ padding: 16 }}>
        <div className="app-split" style={{ flexWrap: 'wrap' }}>
          <div className="app-search" style={{ flex: '1 1 320px' }}>
            <Search size={16} />
            <TextInput
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="secondary" type="button">
            <Filter size={16} /> Filter
          </Button>
        </div>
      </div>

      <TableCard>
        <div className="app-table-wrap">
          <table className="app-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Make / Model</th>
                <th>License Plate</th>
                <th>Status</th>
                <th>Year</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td className="app-mono" style={{ fontSize: 12 }}>{vehicle.id}</td>
                  <td>
                    <div className="app-user-chip">
                      <div className="app-avatar">{(vehicle.manufacturer || 'CAR').slice(0, 3).toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{vehicle.manufacturer} {vehicle.model}</div>
                        <div className="app-muted" style={{ fontSize: 12 }}>{vehicle.year}</div>
                      </div>
                    </div>
                  </td>
                  <td className="app-mono">{vehicle.plateNumber}</td>
                  <td>
                    <StatusBadge tone={statusTone(vehicle.status)}>
                      {statusIcon(vehicle.status)} {vehicle.status}
                    </StatusBadge>
                  </td>
                  <td className="app-muted">{vehicle.year}</td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <Button variant="ghost" size="sm" type="button"><Eye size={14} /></Button>
                      <Button variant="ghost" size="sm" type="button"><Edit2 size={14} /></Button>
                      <Button variant="danger" size="sm" type="button" onClick={() => handleDeleteVehicle(vehicle.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan={6} className="app-empty">No vehicles found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </TableCard>

      {isCreateModalOpen ? (
        <ModalShell
          title="Create Vehicle"
          onClose={() => setIsCreateModalOpen(false)}
          footer={
            <>
              <Button variant="secondary" type="button" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="create-vehicle-form" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Vehicle'}
              </Button>
            </>
          }
        >
          <form id="create-vehicle-form" onSubmit={handleCreateVehicle} className="app-grid">
            <FormField label="Plate Number">
              <TextInput value={form.plateNumber} onChange={(e) => setForm((p) => ({ ...p, plateNumber: e.target.value }))} />
            </FormField>
            <FormField label="Manufacturer">
              <TextInput value={form.manufacturer} onChange={(e) => setForm((p) => ({ ...p, manufacturer: e.target.value }))} />
            </FormField>
            <FormField label="Model">
              <TextInput value={form.model} onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))} />
            </FormField>
            <div className="app-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <FormField label="Year">
                <TextInput value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))} />
              </FormField>
              <FormField label="Status">
                <SelectInput value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                  <option value="Available">Available</option>
                  <option value="Rented">Rented</option>
                  <option value="Maintenance">Maintenance</option>
                </SelectInput>
              </FormField>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
};

export default VehicleManagement;
