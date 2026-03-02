import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getInspectionSummary, getInspectionTrends, type InspectionSummaryResponse, type InspectionTrendResponse } from '../services/api';

const FALLBACK_SUMMARY: InspectionSummaryResponse = {
  totalInspections: 0,
  preRentalInspections: 0,
  postRentalInspections: 0,
  periodicInspections: 0,
  totalDefects: 0,
  unresolvedDefects: 0,
  averageDefectsPerInspection: 0,
};

const Reports: React.FC = () => {
  const [summary, setSummary] = useState<InspectionSummaryResponse>(FALLBACK_SUMMARY);
  const [trends, setTrends] = useState<InspectionTrendResponse[]>([]);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [summaryData, trendData] = await Promise.all([getInspectionSummary(), getInspectionTrends()]);
        if (!cancelled) {
          setSummary(summaryData);
          setTrends(trendData);
          setWarning(null);
        }
      } catch {
        if (!cancelled) {
          setWarning('Unable to load reporting data from backend.');
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const chartData = trends.map((item) => ({
    name: item.date,
    usage: item.inspectionCount,
    cost: item.defectCount,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
        <p className="text-gray-500">Visual insights into fleet inspection and defect trends.</p>
        {warning && <p className="text-xs text-amber-600 mt-1">{warning}</p>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500">Total Inspections</p>
          <p className="text-2xl font-bold text-gray-900">{summary.totalInspections}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500">Total Defects</p>
          <p className="text-2xl font-bold text-gray-900">{summary.totalDefects}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500">Unresolved Defects</p>
          <p className="text-2xl font-bold text-gray-900">{summary.unresolvedDefects}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500">Avg Defects / Inspection</p>
          <p className="text-2xl font-bold text-gray-900">{summary.averageDefectsPerInspection?.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Inspection Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="usage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Defect Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;
