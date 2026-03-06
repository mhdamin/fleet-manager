import React, { useEffect, useMemo, useState } from 'react';
import { Building2, MapPin, Users } from 'lucide-react';
import { SectionHeader, StatCard, StatusBadge, TableCard } from './AppUI';
import { getBranches } from '../services/enterprise';
import { Branch } from '../types';

const Branches: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try { setBranches(await getBranches()); setWarning(null); } catch { setWarning('Unable to load branches.'); }
    };
    load();
  }, []);

  const totals = useMemo(() => ({ total: branches.length, active: branches.filter((branch) => branch.active).length, vehicles: branches.reduce((sum, branch) => sum + branch.vehicleCount, 0) }), [branches]);

  return (
    <div className="app-grid" style={{ gap: 24 }}>
      <SectionHeader title="Branches & Locations" description="Manage branch footprint, local managers, and distributed fleet capacity." warning={warning} />
      <div className="app-grid app-grid--stats">
        <StatCard label="Branches" value={totals.total} icon={<Building2 size={20} />} />
        <StatCard label="Active Locations" value={totals.active} icon={<MapPin size={20} />} />
        <StatCard label="Fleet Across Branches" value={totals.vehicles} icon={<Users size={20} />} />
        <StatCard label="Avg Vehicles / Branch" value={totals.total ? Math.round(totals.vehicles / totals.total) : 0} />
      </div>
      <TableCard>
        <div className="app-table-wrap"><table className="app-table"><thead><tr><th>Branch</th><th>Code</th><th>City</th><th>Manager</th><th>Vehicles</th><th>Status</th></tr></thead><tbody>{branches.map((branch) => <tr key={branch.id}><td style={{ fontWeight: 600 }}>{branch.name}</td><td className="app-mono">{branch.code}</td><td>{branch.city}</td><td>{branch.manager}</td><td>{branch.vehicleCount}</td><td><StatusBadge tone={branch.active ? 'success' : 'neutral'}>{branch.active ? 'Active' : 'Inactive'}</StatusBadge></td></tr>)}</tbody></table></div>
      </TableCard>
    </div>
  );
};

export default Branches;
