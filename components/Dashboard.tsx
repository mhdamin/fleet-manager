import React, { useEffect, useState } from 'react';
import { Car, CheckCircle, Key, PenTool, AlertTriangle, ArrowRight } from 'lucide-react';
import { apiGet } from '../services/api';

interface DashboardSummary {
  totalVehicles: number;
  availableVehicles: number;
  rentedOutVehicles: number;
  maintenanceVehicles: number;
}

const FALLBACK_SUMMARY: DashboardSummary = {
  totalVehicles: 247,
  availableVehicles: 189,
  rentedOutVehicles: 42,
  maintenanceVehicles: 16,
};

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary>(FALLBACK_SUMMARY);
  const [summaryWarning, setSummaryWarning] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      try {
        const data = await apiGet<DashboardSummary>('/api/dashboard/summary');
        if (!cancelled) {
          setSummary(data);
          setSummaryWarning(null);
        }
      } catch {
        if (!cancelled) {
          setSummaryWarning('Backend summary unavailable. Showing fallback values.');
        }
      }
    };

    loadSummary();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
        <p className="text-gray-500">Welcome back! Here's what's happening with your fleet today.</p>
        {summaryWarning && <p className="text-xs text-amber-600 mt-1">{summaryWarning}</p>}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Vehicles</p>
            <h3 className="text-3xl font-bold text-gray-800">{summary.totalVehicles}</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Car size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Available</p>
            <h3 className="text-3xl font-bold text-gray-800">{summary.availableVehicles}</h3>
          </div>
          <div className="p-3 bg-green-50 rounded-lg text-green-600">
            <CheckCircle size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Rented Out</p>
            <h3 className="text-3xl font-bold text-gray-800">{summary.rentedOutVehicles}</h3>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Key size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Maintenance</p>
            <h3 className="text-3xl font-bold text-gray-800">{summary.maintenanceVehicles}</h3>
          </div>
          <div className="p-3 bg-red-50 rounded-lg text-red-600">
            <PenTool size={24} />
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Recent Activities</h3>
        </div>
        <div className="p-6 space-y-6">
          
          <div className="flex gap-4">
            <div className="mt-1">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                <Car size={16} />
              </div>
            </div>
            <div>
              <p className="text-gray-800 font-medium">Vehicle RNT-2025-001 checked out</p>
              <p className="text-sm text-gray-500">By Sarah Johnson • 2 hours ago</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="mt-1">
              <div className="p-2 bg-red-100 text-red-600 rounded-full">
                <AlertTriangle size={16} />
              </div>
            </div>
            <div>
              <p className="text-gray-800 font-medium">Damage reported on RNT-2025-045</p>
              <p className="text-sm text-gray-500">By Mike Davis • 4 hours ago</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="mt-1">
              <div className="p-2 bg-green-100 text-green-600 rounded-full">
                <CheckCircle size={16} />
              </div>
            </div>
            <div>
              <p className="text-gray-800 font-medium">Vehicle RNT-2025-023 returned</p>
              <p className="text-sm text-gray-500">By Alex Thompson • 6 hours ago</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="mt-1">
              <div className="p-2 bg-gray-100 text-gray-600 rounded-full">
                <PenTool size={16} />
              </div>
            </div>
            <div>
              <p className="text-gray-800 font-medium">Maintenance scheduled for RNT-2025-067</p>
              <p className="text-sm text-gray-500">By System • 8 hours ago</p>
            </div>
          </div>

        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button className="text-sm font-medium text-blue-600 flex items-center hover:underline">
            View All Activity <ArrowRight size={16} className="ml-1"/>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
