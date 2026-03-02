import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Plus, Car, CheckCircle, Key, PenTool, Eye, Edit2, Trash2, X } from 'lucide-react';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Rented':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Maintenance':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getIcon = (status: string) => {
    switch (status) {
      case 'Available':
        return <CheckCircle size={14} className="mr-1" />;
      case 'Rented':
        return <Key size={14} className="mr-1" />;
      case 'Maintenance':
        return <PenTool size={14} className="mr-1" />;
      default:
        return null;
    }
  };

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
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Vehicle Management</h2>
          <p className="text-gray-500">Manage your fleet vehicles and vehicle records.</p>
          {warning && <p className="text-xs text-amber-600 mt-1">{warning}</p>}
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center shadow-md transition-colors"
        >
          <Plus size={18} className="mr-2" /> Add Vehicle
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">Total Vehicles</p>
            <p className="text-xl font-bold">{stats.totalVehicles}</p>
          </div>
          <Car className="text-gray-300" />
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">Available</p>
            <p className="text-xl font-bold">{stats.availableVehicles}</p>
          </div>
          <CheckCircle className="text-gray-300" />
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">Rented Out</p>
            <p className="text-xl font-bold">{stats.rentedVehicles}</p>
          </div>
          <Key className="text-gray-300" />
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">Maintenance</p>
            <p className="text-xl font-bold">{stats.maintenanceVehicles}</p>
          </div>
          <PenTool className="text-gray-300" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search vehicles..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <Filter size={18} className="mr-2" /> Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Make / Model</th>
                <th className="px-6 py-4">License Plate</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Year</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800 font-mono text-xs">{vehicle.id}</td>
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">
                      {(vehicle.manufacturer || 'CAR').substring(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{vehicle.manufacturer} {vehicle.model}</div>
                      <div className="text-xs text-gray-500">{vehicle.year}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono">{vehicle.plateNumber}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(vehicle.status)}`}>
                      {getIcon(vehicle.status)}
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{vehicle.year}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="text-gray-400 hover:text-blue-600" aria-label="View vehicle"><Eye size={18} /></button>
                      <button className="text-gray-400 hover:text-amber-600" aria-label="Edit vehicle"><Edit2 size={18} /></button>
                      <button onClick={() => handleDeleteVehicle(vehicle.id)} className="text-gray-400 hover:text-red-600" aria-label="Delete vehicle"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No vehicles found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateVehicle} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Create Vehicle</h3>
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <input value={form.plateNumber} onChange={(e) => setForm((p) => ({ ...p, plateNumber: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Plate Number" />
            <input value={form.manufacturer} onChange={(e) => setForm((p) => ({ ...p, manufacturer: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Manufacturer" />
            <input value={form.model} onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Model" />
            <input value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Year" />
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white">
              <option value="Available">Available</option>
              <option value="Rented">Rented</option>
              <option value="Maintenance">Maintenance</option>
            </select>

            <button type="submit" disabled={submitting} className="w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-800 disabled:opacity-60">
              {submitting ? 'Creating...' : 'Create Vehicle'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default VehicleManagement;
