import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, SectionHeader, StatCard } from './AppUI';
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
    inspections: item.inspectionCount,
    defects: item.defectCount,
  }));

  return (
    <div className="app-grid" style={{ gap: 24 }}>
      <SectionHeader
        title="Reports & Analytics"
        description="Visual reporting for inspections, defects, and operational patterns."
        warning={warning}
      />

      <div className="app-grid app-grid--stats">
        <StatCard label="Total Inspections" value={summary.totalInspections} />
        <StatCard label="Total Defects" value={summary.totalDefects} />
        <StatCard label="Unresolved Defects" value={summary.unresolvedDefects} />
        <StatCard label="Avg Defects / Inspection" value={summary.averageDefectsPerInspection?.toFixed(2)} />
      </div>

      <div className="app-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <Card className="app-chart">
          <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Inspection Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="inspections" fill="#171717" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="app-chart">
          <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Defect Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="defects" stroke="#52525b" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
