import React, { useState, useEffect } from 'react';
import { Car, CheckCircle, Key, PenTool, AlertTriangle, ArrowRight } from 'lucide-react';
import { VehicleStats, Activity } from '../types';
import config, { auth } from '../config';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<VehicleStats | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsResponse, activitiesResponse] = await Promise.all([
                    fetch(`${config.apiUrl}/api/vehicles/stats`, {
                        headers: {
                            'Authorization': auth.getAuthHeader()
                        }
                    }),
                    fetch(`${config.apiUrl}/api/activities`, {
                        headers: {
                            'Authorization': auth.getAuthHeader()
                        }
                    })
                ]);

                if (!statsResponse.ok || !activitiesResponse.ok) {
                    throw new Error('Failed to fetch data');
                }

                const statsData = await statsResponse.json();
                const activitiesData = await activitiesResponse.json();

                setStats(statsData);
                setActivities(activitiesData);
            } catch (error) {
                setError("Failed to fetch dashboard data.");
                console.error("Error fetching dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return <div className="text-center py-8">Loading dashboard...</div>;
    }

    if (error) {
        return <div className="text-center py-8 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
                <p className="text-gray-500">Welcome back! Here's what's happening with your fleet today.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Vehicles</p>
                        <h3 className="text-3xl font-bold text-gray-800">{stats?.totalVehicles}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                        <Car size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Available</p>
                        <h3 className="text-3xl font-bold text-gray-800">{stats?.availableVehicles}</h3>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-green-600">
                        <CheckCircle size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Rented Out</p>
                        <h3 className="text-3xl font-bold text-gray-800">{stats?.rentedVehicles}</h3>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                        <Key size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Maintenance</p>
                        <h3 className="text-3xl font-bold text-gray-800">{stats?.maintenanceVehicles}</h3>
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
                    {activities.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No recent activities</p>
                    ) : (
                        activities.map(activity => {
                            // Generate description from activity data
                            let description = '';
                            switch (activity.changeType) {
                                case 'TEMPORARY':
                                    description = `Temporary rental: ${activity.newVehiclePlate} - ${activity.reason}`;
                                    break;
                                case 'RETURN':
                                    description = `Vehicle returned: ${activity.newVehiclePlate} - ${activity.reason}`;
                                    break;
                                case 'PERMANENT':
                                    description = `Permanent change: ${activity.oldVehiclePlate || 'N/A'} to ${activity.newVehiclePlate || 'N/A'} - ${activity.reason}`;
                                    break;
                                default:
                                    description = `${activity.changeType}: ${activity.reason || 'No reason provided'}`;
                            }

                            return (
                                <div key={activity.id} className="flex gap-4">
                                    <div className="mt-1">
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                                            <Car size={16} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-gray-800 font-medium">{description}</p>
                                        <p className="text-sm text-gray-500">By {activity.staffName} • {new Date(activity.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                            );
                        })
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