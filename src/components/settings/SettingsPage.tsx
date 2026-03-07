import { AdminHeader } from '../layout/AdminHeader';
import { ComplexitySettings } from './ComplexitySettings';
import { UserDistributionChart } from './UserDistributionChart';

export function SettingsPage() {
  return (
    <div>
      <AdminHeader
        title="Settings"
        description="Platform configuration and complexity levels"
      />
      <div className="p-8 space-y-6 max-w-4xl">
        <ComplexitySettings />
        <UserDistributionChart />
      </div>
    </div>
  );
}
