import React from 'react';
import { Filter, Download, Printer } from 'lucide-react';
import { LogEntry } from '../types';

const MOCK_LOGS: LogEntry[] = [
  { id: '1', timestamp: '2025-01-16 14:32:15', user: 'Sarah Johnson', action: 'Vehicle Check-out', resource: 'RNT-2025-001', details: 'Customer: John Doe', ip: '192.168.1.45', status: 'Success' },
  { id: '2', timestamp: '2025-01-16 14:15:42', user: 'Mike Davis', action: 'Damage Report', resource: 'RNT-2025-045', details: 'Minor scratch on rear bumper', ip: '192.168.1.67', status: 'Critical' },
  { id: '3', timestamp: '2025-01-16 13:58:21', user: 'Alex Thompson', action: 'Vehicle Check-in', resource: 'RNT-2025-023', details: 'Checklist completed', ip: '192.168.1.23', status: 'Success' },
  { id: '4', timestamp: '2025-01-16 13:45:18', user: 'System', action: 'Maintenance Alert', resource: 'RNT-2025-067', details: 'Scheduled maintenance due', ip: 'System', status: 'Warning' },
  { id: '5', timestamp: '2025-01-16 12:30:00', user: 'Sarah Johnson', action: 'Login', resource: 'Auth', details: 'Successful login', ip: '192.168.1.45', status: 'Success' },
];

const AuditTrail: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Audit Trail</h2>
        <p className="text-gray-500">Complete log of all system activities for compliance and accountability.</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-2 flex-wrap">
             <div className="flex flex-col">
               <label className="text-xs text-gray-500 mb-1">Date Range</label>
               <input type="date" className="border rounded px-2 py-1 text-sm bg-gray-50" defaultValue="2025-01-01" />
             </div>
             <div className="flex flex-col">
               <label className="text-xs text-gray-500 mb-1">To</label>
               <input type="date" className="border rounded px-2 py-1 text-sm bg-gray-50" defaultValue="2025-01-16" />
             </div>
             <div className="flex flex-col">
               <label className="text-xs text-gray-500 mb-1">Action Type</label>
               <select className="border rounded px-2 py-1 text-sm bg-gray-50 min-w-[120px]">
                 <option>All Actions</option>
               </select>
             </div>
              <div className="flex flex-col justify-end">
                <button className="bg-gray-900 text-white px-4 py-1.5 rounded text-sm hover:bg-gray-800 transition-colors flex items-center">
                  <Filter size={14} className="mr-1" /> Apply
                </button>
              </div>
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

      {/* Table */}
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
              {MOCK_LOGS.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500">{log.timestamp}</td>
                  <td className="px-6 py-4 font-medium text-gray-800 flex items-center">
                    <div className="w-6 h-6 rounded-full bg-gray-200 mr-2 flex items-center justify-center text-xs">
                        {log.user.charAt(0)}
                    </div>
                    {log.user}
                  </td>
                  <td className="px-6 py-4 text-gray-800">{log.action}</td>
                  <td className="px-6 py-4 text-blue-600 font-mono text-xs">{log.resource}</td>
                  <td className="px-6 py-4 text-gray-600 truncate max-w-xs">{log.details}</td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">{log.ip}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                      ${log.status === 'Success' ? 'bg-green-100 text-green-700' : 
                        log.status === 'Warning' ? 'bg-amber-100 text-amber-700' : 
                        'bg-red-100 text-red-700'
                      }
                    `}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
         <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
           <div className="flex gap-1">
             <button className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-600 text-xs">Previous</button>
             <button className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-600 text-xs">Next</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AuditTrail;