import { Outlet } from 'react-router-dom';
import { SidebarLayout } from '../catalyst/sidebar-layout';
import { Sidebar } from './Sidebar';
import { Navbar, NavbarSpacer, NavbarItem } from '../catalyst/navbar';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Avatar } from '../catalyst/avatar';

export function AdminShell() {
  const { adminUser } = useAdminAuth();

  return (
    <SidebarLayout
      navbar={
        <Navbar>
          <NavbarSpacer />
          <NavbarItem href="/settings">
            <Avatar
              initials={adminUser?.name?.charAt(0) || 'A'}
              className="size-8 bg-primary-100 text-primary-700"
            />
          </NavbarItem>
        </Navbar>
      }
      sidebar={<Sidebar />}
    >
      <Outlet />
    </SidebarLayout>
  );
}
