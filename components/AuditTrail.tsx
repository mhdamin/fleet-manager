import React, { useState, useEffect } from 'react';
import { Filter, Download, Printer, RefreshCw, Calendar, User, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import config, { auth } from '../config';

interface VehicleChangeLog {
  id: string;
  checklistId: string;
  changeType: 'TEMPORARY' | 'RETURN' | 'PERMANENT';
  oldVehiclePlate: string | null;
  newVehiclePlate: string | null;
  reason: string;
  timestamp: string;
  staffName: string;
}

const AuditTrail: React.FC = () => {
  const [logs, setLogs] = useState<VehicleChangeLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<VehicleChangeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedChangeType, setSelectedChangeType] = useState('');
  const [staffNameFilter, setStaffNameFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, startDate, endDate, selectedChangeType, staffNameFilter]);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${config.apiUrl}/api/activities/all`, {
        headers: {
          'Authorization': auth.getAuthHeader()
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Audit trail data:', data);
      setLogs(data);
      setFilteredLogs(data);
    } catch (error) {
      setError("Failed to fetch audit trail. Please check your connection.");
      console.error("Error fetching audit trail:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(endDate + 'T23:59:59'));
    }

    // Filter by change type
    if (selectedChangeType && selectedChangeType !== 'ALL') {
      filtered = filtered.filter(log => log.changeType === selectedChangeType);
    }

    // Filter by staff name
    if (staffNameFilter) {
      filtered = filtered.filter(log =>
        log.staffName.toLowerCase().includes(staffNameFilter.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedChangeType('');
    setStaffNameFilter('');
    setFilteredLogs(logs);
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Change Type', 'Old Vehicle', 'New Vehicle', 'Staff Name', 'Reason'];
    const csvData = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.changeType,
      log.oldVehiclePlate || 'N/A',
      log.newVehiclePlate || 'N/A',
      log.staffName,
      log.reason
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printTable = () => {
    window.print();
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'TEMPORARY': return 'bg-blue-100 text-blue-700';
      case 'RETURN': return 'bg-green-100 text-green-700';
      case 'PERMANENT': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'TEMPORARY': return <Clock size={14} />;
      case 'RETURN': return <CheckCircle size={14} />;
      case 'PERMANENT': return <AlertCircle size={14} />;
      default: return <FileText size={14} />;
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-gray-400" size={40} />
          <div className="text-gray-500">Loading audit trail...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
        <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Audit Trail</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Vehicle Change Audit Trail</h2>
          <p className="text-gray-500">Complete log of all vehicle changes for compliance and accountability.</p>
        </div>
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Total Changes</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{filteredLogs.length}</p>
            </div>
            <FileText className="text-gray-400" size={32} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-500 uppercase font-semibold">Temporary</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {filteredLogs.filter(l => l.changeType === 'TEMPORARY').length}
              </p>
            </div>
            <Clock className="text-blue-400" size={32} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-500 uppercase font-semibold">Returns</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {filteredLogs.filter(l => l.changeType === 'RETURN').length}
              </p>
            </div>
            <CheckCircle className="text-green-400" size={32} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-500 uppercase font-semibold">Permanent</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {filteredLogs.filter(l => l.changeType === 'PERMANENT').length}
              </p>
            </div>
            <AlertCircle className="text-purple-400" size={32} />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col flex-1 min-w-[150px]">
              <label className="text-xs text-gray-500 mb-1 font-medium flex items-center">
                <Calendar size={12} className="mr-1" /> Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-col flex-1 min-w-[150px]">
              <label className="text-xs text-gray-500 mb-1 font-medium flex items-center">
                <Calendar size={12} className="mr-1" /> End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-col flex-1 min-w-[150px]">
              <label className="text-xs text-gray-500 mb-1 font-medium">Change Type</label>
              <select
                value={selectedChangeType}
                onChange={e => setSelectedChangeType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">All Types</option>
                <option value="TEMPORARY">Temporary</option>
                <option value="RETURN">Return</option>
                <option value="PERMANENT">Permanent</option>
              </select>
            </div>
            <div className="flex flex-col flex-1 min-w-[150px]">
              <label className="text-xs text-gray-500 mb-1 font-medium flex items-center">
                <User size={12} className="mr-1" /> Staff Name
              </label>
              <input
                type="text"
                value={staffNameFilter}
                onChange={e => setStaffNameFilter(e.target.value)}
                placeholder="Search staff..."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Clear all filters
            </button>
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center transition-colors"
              >
                <Download size={14} className="mr-2" /> Export CSV
              </button>
              <button
                onClick={printTable}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center transition-colors"
              >
                <Printer size={14} className="mr-2" /> Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredLogs.length)} of {filteredLogs.length} entries
        {(startDate || endDate || selectedChangeType || staffNameFilter) && (
          <span className="ml-2 text-blue-600 font-medium">(filtered)</span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto mb-4 text-gray-300" size={48} />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No audit logs found</h3>
            <p className="text-gray-500">
              {(startDate || endDate || selectedChangeType || staffNameFilter)
                ? 'Try adjusting your filters to see more results.'
                : 'No vehicle change logs have been recorded yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-600 font-semibold">
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Change Type</th>
                    <th className="px-6 py-4">From Vehicle</th>
                    <th className="px-6 py-4">To Vehicle</th>
                    <th className="px-6 py-4">Staff Member</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">Checklist ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {currentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex flex-col">
                          <span className="font-medium">{new Date(log.timestamp).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getChangeTypeColor(log.changeType)}`}>
                          <span className="mr-1">{getChangeTypeIcon(log.changeType)}</span>
                          {log.changeType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {log.oldVehiclePlate || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {log.newVehiclePlate || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 mr-3 flex items-center justify-center text-white text-xs font-bold">
                            {log.staffName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-gray-800">{log.staffName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs">
                        <div className="truncate" title={log.reason}>
                          {log.reason}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-gray-400">
                          {log.checklistId.substring(0, 8)}...
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          table, table * {
            visibility: visible;
          }
          table {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AuditTrail;
