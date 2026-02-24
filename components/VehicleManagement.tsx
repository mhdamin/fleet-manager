import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Car, CheckCircle, Key, PenTool, Eye, Edit2, Trash2, X } from 'lucide-react';
import { Vehicle } from '../types';
import config, { auth } from '../config';
import api from '../api';

// Mock data removed - using actual backend data

const VehicleManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const isAdmin = auth.hasRole('ROLE_ADMIN');

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/api/vehicles`, {
          headers: {
            'Authorization': auth.getAuthHeader()
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setVehicles(data);
      } catch (error) {
        setError("Failed to fetch vehicles.");
        console.error("Error fetching vehicles:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicles();
  }, []); // Empty dependency array means this effect runs once on mount

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-700 border-green-200';
      case 'Rented': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Maintenance': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getIcon = (status: string) => {
     switch (status) {
      case 'Available': return <CheckCircle size={14} className="mr-1"/>;
      case 'Rented': return <Key size={14} className="mr-1"/>;
      case 'Maintenance': return <PenTool size={14} className="mr-1"/>;
      default: return null;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading vehicles...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  const filteredVehicles = vehicles.filter(v => {
    // Search filter
    const matchesSearch = v.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.id?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === 'All Status' || v.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Vehicle Management</h2>
          <p className="text-gray-500">Manage your fleet vehicles, add new vehicles, and edit existing records.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center shadow-md transition-colors"
          >
            <Plus size={18} className="mr-2" /> Add Vehicle
          </button>
        )}
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
             <div><p className="text-xs text-gray-500">Total Vehicles</p><p className="text-xl font-bold">{vehicles.length}</p></div>
             <Car className="text-gray-300" />
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
             <div><p className="text-xs text-gray-500">Available</p><p className="text-xl font-bold">{vehicles.filter(v => v.status === 'Available').length}</p></div>
             <CheckCircle className="text-gray-300" />
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
             <div><p className="text-xs text-gray-500">Rented Out</p><p className="text-xl font-bold">{vehicles.filter(v => v.status === 'Rented').length}</p></div>
             <Key className="text-gray-300" />
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
             <div><p className="text-xs text-gray-500">Maintenance</p><p className="text-xl font-bold">{vehicles.filter(v => v.status === 'Maintenance').length}</p></div>
             <PenTool className="text-gray-300" />
        </div>
      </div>

      {/* Search & Filter */}
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
           <select
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className="border border-gray-200 rounded-lg px-4 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
           >
             <option>All Status</option>
             <option>Available</option>
             <option>Rented</option>
             <option>Maintenance</option>
           </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="px-6 py-4">Vehicle ID</th>
                <th className="px-6 py-4">Manufacturer / Model</th>
                <th className="px-6 py-4">License Plate</th>
                <th className="px-6 py-4">Year</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800 text-xs">{vehicle.id}</td>
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">
                        {vehicle.manufacturer?.substring(0,3).toUpperCase() || 'N/A'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{vehicle.manufacturer} {vehicle.model}</div>
                      <div className="text-xs text-gray-500">Year: {vehicle.year}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono font-semibold">{vehicle.plateNumber}</td>
                  <td className="px-6 py-4 text-gray-600">{vehicle.year}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(vehicle.status)}`}>
                      {getIcon(vehicle.status)}
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setShowViewModal(true);
                          }}
                          className="text-gray-400 hover:text-blue-600"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedVehicle(vehicle);
                                setShowEditModal(true);
                              }}
                              className="text-gray-400 hover:text-amber-600"
                              title="Edit Vehicle"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedVehicle(vehicle);
                                setShowDeleteModal(true);
                              }}
                              className="text-gray-400 hover:text-red-600"
                              title="Delete Vehicle"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
           <span className="text-sm text-gray-500">Showing 1 to {filteredVehicles.length} of {vehicles.length} results</span>
           <div className="flex gap-1">
             <button className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-sm">Previous</button>
             <button className="px-3 py-1 rounded bg-gray-900 text-white text-sm">1</button>
             <button className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-sm">2</button>
             <button className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-sm">3</button>
             <button className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 text-sm">Next</button>
           </div>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <AddVehicleModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            // Refresh vehicle list
            const fetchVehicles = async () => {
              try {
                const data = await api.get('/api/vehicles');
                setVehicles(data);
              } catch (error) {
                console.error('Error fetching vehicles:', error);
              }
            };
            fetchVehicles();
          }}
        />
      )}

      {/* View Vehicle Modal */}
      {showViewModal && selectedVehicle && (
        <ViewVehicleModal
          vehicle={selectedVehicle}
          onClose={() => {
            setShowViewModal(false);
            setSelectedVehicle(null);
          }}
        />
      )}

      {/* Edit Vehicle Modal */}
      {showEditModal && selectedVehicle && (
        <EditVehicleModal
          vehicle={selectedVehicle}
          onClose={() => {
            setShowEditModal(false);
            setSelectedVehicle(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedVehicle(null);
            // Refresh vehicle list
            const fetchVehicles = async () => {
              try {
                const data = await api.get('/api/vehicles');
                setVehicles(data);
              } catch (error) {
                console.error('Error fetching vehicles:', error);
              }
            };
            fetchVehicles();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedVehicle && (
        <DeleteVehicleModal
          vehicle={selectedVehicle}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedVehicle(null);
          }}
          onSuccess={() => {
            setShowDeleteModal(false);
            setSelectedVehicle(null);
            // Refresh vehicle list
            const fetchVehicles = async () => {
              try {
                const data = await api.get('/api/vehicles');
                setVehicles(data);
              } catch (error) {
                console.error('Error fetching vehicles:', error);
              }
            };
            fetchVehicles();
          }}
        />
      )}
    </div>
  );
};

// Add Vehicle Modal Component
const AddVehicleModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    plateNumber: '',
    manufacturer: '',
    model: '',
    year: new Date().getFullYear(),
    status: 'Available'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await api.post('/api/vehicles', formData);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create vehicle');
      console.error('Error creating vehicle:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' ? parseInt(value) : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">Add New Vehicle</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              License Plate Number *
            </label>
            <input
              type="text"
              name="plateNumber"
              value={formData.plateNumber}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. ABC-1234"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manufacturer *
            </label>
            <input
              type="text"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. Toyota"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model *
            </label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. Camry"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year *
            </label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              required
              min="1900"
              max={new Date().getFullYear() + 1}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="Available">Available</option>
              <option value="Rented">Rented</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View Vehicle Modal Component
const ViewVehicleModal: React.FC<{ vehicle: Vehicle; onClose: () => void }> = ({ vehicle, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">Vehicle Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Vehicle ID</label>
            <p className="text-gray-900 font-medium">{vehicle.id}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">License Plate</label>
            <p className="text-gray-900 font-medium font-mono">{vehicle.plateNumber}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Manufacturer</label>
              <p className="text-gray-900 font-medium">{vehicle.manufacturer}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Model</label>
              <p className="text-gray-900 font-medium">{vehicle.model}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Year</label>
              <p className="text-gray-900 font-medium">{vehicle.year}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                vehicle.status === 'Available' ? 'bg-green-100 text-green-700 border-green-200' :
                vehicle.status === 'Rented' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                'bg-red-100 text-red-700 border-red-200'
              }`}>
                {vehicle.status}
              </span>
            </div>
          </div>

          {vehicle.createdAt && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Created At</label>
              <p className="text-gray-900 text-sm">{new Date(vehicle.createdAt).toLocaleString()}</p>
            </div>
          )}

          {vehicle.updatedAt && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Last Updated</label>
              <p className="text-gray-900 text-sm">{new Date(vehicle.updatedAt).toLocaleString()}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Edit Vehicle Modal Component
const EditVehicleModal: React.FC<{ vehicle: Vehicle; onClose: () => void; onSuccess: () => void }> = ({ vehicle, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    plateNumber: vehicle.plateNumber,
    manufacturer: vehicle.manufacturer,
    model: vehicle.model,
    year: vehicle.year,
    status: vehicle.status
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await api.put(`/api/vehicles/${vehicle.id}`, formData);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update vehicle');
      console.error('Error updating vehicle:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' ? parseInt(value) : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">Edit Vehicle</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              License Plate Number *
            </label>
            <input
              type="text"
              name="plateNumber"
              value={formData.plateNumber}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manufacturer *
            </label>
            <input
              type="text"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model *
            </label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year *
            </label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              required
              min="1900"
              max={new Date().getFullYear() + 1}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="Available">Available</option>
              <option value="Rented">Rented</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Vehicle Modal Component
const DeleteVehicleModal: React.FC<{ vehicle: Vehicle; onClose: () => void; onSuccess: () => void }> = ({ vehicle, onClose, onSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await api.delete(`/api/vehicles/${vehicle.id}`);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to delete vehicle');
      console.error('Error deleting vehicle:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">Delete Vehicle</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <p className="text-gray-700">
            Are you sure you want to delete this vehicle? This action cannot be undone.
          </p>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Vehicle ID:</span>
              <span className="text-sm font-bold text-gray-900">{vehicle.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">License Plate:</span>
              <span className="text-sm font-bold text-gray-900 font-mono">{vehicle.plateNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Manufacturer/Model:</span>
              <span className="text-sm font-bold text-gray-900">{vehicle.manufacturer} {vehicle.model}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-6 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Vehicle'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleManagement;