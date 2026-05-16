import { AdminHeader } from '../layout/AdminHeader';
import { StatCards } from './StatCards';
import { SpeciesChart } from './SpeciesChart';
import { AuditLogTable } from './AuditLogTable';

export function DashboardPage() {
  return (
    <div>
      <AdminHeader
        title="Overview"
        description="Platform health and activity"
      />
      <div className="p-4 lg:p-8 space-y-6 max-w-6xl">
        <StatCards />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpeciesChart />
          <AuditLogTable />
        </div>
      </div>
    </div>
  );
}
