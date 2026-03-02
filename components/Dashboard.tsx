import React, { useEffect, useState } from 'react';
import { Car, CheckCircle, Key, PenTool, AlertTriangle, ArrowRight } from 'lucide-react';
import { getActivities, getVehicleStats, type ActivityResponse } from '../services/api';

interface DashboardSummary {
  totalVehicles: number;
  availableVehicles: number;
  rentedOutVehicles: number;
  maintenanceVehicles: number;
}

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'vehicle' | 'alert' | 'success' | 'default';
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
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const toActivityItem = (activity: ActivityResponse): ActivityItem => {
    const action = activity.changeType?.toString() || 'Activity';
    const plate = activity.newVehiclePlate || activity.oldVehiclePlate || 'Vehicle';
    const type = action === 'TEMPORARY' ? 'vehicle' : action === 'RETURN' ? 'success' : 'default';

    return {
      id: activity.id,
      title: `${action} - ${plate}`,
      subtitle: `${activity.staffName || 'System'} | ${new Date(activity.timestamp).toLocaleString()}`,
      type,
    };
  };

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      try {
        const data = await getVehicleStats();
        if (!cancelled) {
          setSummary({
            totalVehicles: data.totalVehicles,
            availableVehicles: data.availableVehicles,
            rentedOutVehicles: data.rentedVehicles,
            maintenanceVehicles: data.maintenanceVehicles,
          });
          setSummaryWarning(null);
        }
      } catch {
        if (!cancelled) {
          setSummaryWarning('Backend summary unavailable. Showing fallback values.');
        }
      }
    };

    const loadActivities = async () => {
      try {
        const data = await getActivities();
        if (!cancelled) {
          setActivities(data.slice(0, 4).map(toActivityItem));
        }
      } catch {
        if (!cancelled) {
          setActivities([]);
        }
      }
    };

    loadSummary();
    loadActivities();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
        <p className="text-gray-500">Welcome back! Here's what's happening with your fleet today.</p>
        {summaryWarning && <p className="text-xs text-amber-600 mt-1">{summaryWarning}</p>}
      </div>

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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Recent Activities</h3>
        </div>
        <div className="p-6 space-y-6">
          {activities.length === 0 ? (
            <p className="text-sm text-gray-500">No recent backend activity available.</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex gap-4">
                <div className="mt-1">
                  <div
                    className={`p-2 rounded-full ${
                      activity.type === 'vehicle'
                        ? 'bg-blue-100 text-blue-600'
                        : activity.type === 'alert'
                          ? 'bg-red-100 text-red-600'
                          : activity.type === 'success'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {activity.type === 'vehicle' && <Car size={16} />}
                    {activity.type === 'alert' && <AlertTriangle size={16} />}
                    {activity.type === 'success' && <CheckCircle size={16} />}
                    {activity.type === 'default' && <PenTool size={16} />}
                  </div>
                </div>
                <div>
                  <p className="text-gray-800 font-medium">{activity.title}</p>
                  <p className="text-sm text-gray-500">{activity.subtitle}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button className="text-sm font-medium text-blue-600 flex items-center hover:underline">
            View All Activity <ArrowRight size={16} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
