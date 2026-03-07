import { AdminHeader } from '../layout/AdminHeader';

export function DashboardPage() {
  return (
    <div>
      <AdminHeader
        title="Overview"
        description="Platform health and activity"
      />
      <div className="p-8">
        <p className="text-neutral-500">Dashboard analytics coming in Step 36.</p>
      </div>
    </div>
  );
}
