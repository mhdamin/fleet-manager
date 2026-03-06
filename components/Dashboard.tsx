import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, Car, CheckCircle, Key, PenTool } from 'lucide-react';
import { Card, SectionHeader, StatCard, Button } from './AppUI';
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

const iconForType = (type: ActivityItem['type']) => {
  switch (type) {
    case 'vehicle':
      return <Car size={16} />;
    case 'alert':
      return <AlertTriangle size={16} />;
    case 'success':
      return <CheckCircle size={16} />;
    default:
      return <PenTool size={16} />;
  }
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
    <div className="app-grid" style={{ gap: 24 }}>
      <SectionHeader
        title="Dashboard Overview"
        description="Welcome back. Here's what is happening across the fleet today."
        warning={summaryWarning}
      />

      <div className="app-grid app-grid--stats">
        <StatCard label="Total Vehicles" value={summary.totalVehicles} icon={<Car size={20} />} />
        <StatCard label="Available" value={summary.availableVehicles} icon={<CheckCircle size={20} />} />
        <StatCard label="Rented Out" value={summary.rentedOutVehicles} icon={<Key size={20} />} />
        <StatCard label="Maintenance" value={summary.maintenanceVehicles} icon={<PenTool size={20} />} />
      </div>

      <Card>
        <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Recent Activities</h3>
        </div>
        <div style={{ padding: 20 }} className="app-note-list">
          {activities.length === 0 ? (
            <p className="app-muted" style={{ margin: 0 }}>No recent backend activity available.</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="app-user-chip" style={{ alignItems: 'flex-start' }}>
                <div className="app-avatar">{iconForType(activity.type)}</div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{activity.title}</p>
                  <p className="app-muted" style={{ margin: '4px 0 0', fontSize: 13 }}>{activity.subtitle}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="sm" type="button">
            View All Activity <ArrowRight size={14} />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
