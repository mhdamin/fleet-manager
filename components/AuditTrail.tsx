import React, { useEffect, useMemo, useState } from 'react';
import { Filter, Download, Printer } from 'lucide-react';
import { getActivities, type ActivityResponse } from '../services/api';

const AuditTrail: React.FC = () => {
  const [logs, setLogs] = useState<ActivityResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getActivities();
        if (!cancelled) {
          setLogs(data);
          setWarning(null);
        }
      } catch {
        if (!cancelled) {
          setWarning('Unable to load audit trail from backend.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const mappedLogs = useMemo(() => logs.map((log) => ({
    id: log.id,
    timestamp: log.timestamp,
    user: log.staffName || 'System',
    action: log.changeType,
    resource: log.newVehiclePlate || log.oldVehiclePlate || '-',
    details: log.reason || '-',
    ip: 'N/A',
    status: log.changeType === 'RETURN' ? 'Success' : 'Warning',
  })), [logs]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Audit Trail</h2>
        <p className="text-gray-500">Complete log of all system activities for compliance and accountability.</p>
        {warning && <p className="text-xs text-amber-600 mt-1">{warning}</p>}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-2 flex-wrap">
            <button className="bg-gray-900 text-white px-4 py-1.5 rounded text-sm hover:bg-gray-800 transition-colors flex items-center">
              <Filter size={14} className="mr-1" /> Refresh
            </button>
          </div>
          <div className="flex gap-2 items-end">
            <button className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded text-sm hover:bg-gray-50 flex items-center">
              <Download size={14} className="mr-1" /> Export CSV
            </button>
            <button className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded text-sm hover:bg-gray-50 flex items-center">
              <Printer size={14} className="mr-1" /> Print
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Resource</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={7}>Loading audit logs...</td>
                </tr>
              ) : mappedLogs.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={7}>No audit logs available.</td>
                </tr>
              ) : (
                mappedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{log.user}</td>
                    <td className="px-6 py-4 text-gray-800">{log.action}</td>
                    <td className="px-6 py-4 text-blue-600 font-mono text-xs">{log.resource}</td>
                    <td className="px-6 py-4 text-gray-600 truncate max-w-xs">{log.details}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{log.ip}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          log.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditTrail;
