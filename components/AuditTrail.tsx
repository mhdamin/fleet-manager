import React, { useEffect, useMemo, useState } from 'react';
import { Download, Filter, Printer } from 'lucide-react';
import { Button, SectionHeader, StatusBadge, TableCard } from './AppUI';
import { getActivities, type ActivityResponse } from '../services/api';

const AuditTrail: React.FC = () => {
  const [logs, setLogs] = useState<ActivityResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getActivities();
      setLogs(data);
      setWarning(null);
    } catch {
      setWarning('Unable to load audit trail from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const mappedLogs = useMemo(
    () =>
      logs.map((log) => ({
        id: log.id,
        timestamp: log.timestamp,
        user: log.staffName || 'System',
        action: log.changeType,
        resource: log.newVehiclePlate || log.oldVehiclePlate || '-',
        details: log.reason || '-',
        ip: 'N/A',
        status: log.changeType === 'RETURN' ? 'Success' : 'Warning',
      })),
    [logs]
  );

  return (
    <div className="app-grid" style={{ gap: 24 }}>
      <SectionHeader
        title="Audit Trail"
        description="Complete system activity for accountability, compliance, and traceability."
        warning={warning}
      />

      <div className="app-card" style={{ padding: 16 }}>
        <div className="app-split" style={{ flexWrap: 'wrap' }}>
          <Button type="button" onClick={load}>
            <Filter size={14} /> Refresh
          </Button>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button type="button" variant="secondary"><Download size={14} /> Export CSV</Button>
            <Button type="button" variant="secondary"><Printer size={14} /> Print</Button>
          </div>
        </div>
      </div>

      <TableCard>
        <div className="app-table-wrap">
          <table className="app-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Details</th>
                <th>IP Address</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="app-empty">Loading audit logs...</td>
                </tr>
              ) : mappedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="app-empty">No audit logs available.</td>
                </tr>
              ) : (
                mappedLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="app-muted">{new Date(log.timestamp).toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>{log.user}</td>
                    <td>{log.action}</td>
                    <td className="app-mono">{log.resource}</td>
                    <td className="app-muted">{log.details}</td>
                    <td className="app-mono app-muted">{log.ip}</td>
                    <td>
                      <StatusBadge tone={log.status === 'Success' ? 'success' : 'warning'}>{log.status}</StatusBadge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </TableCard>
    </div>
  );
};

export default AuditTrail;
