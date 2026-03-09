import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Brain,
  FileStack,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  Sidebar as CatalystSidebar,
  SidebarHeader,
  SidebarBody,
  SidebarFooter,
  SidebarSection,
  SidebarItem,
  SidebarLabel,
  SidebarSpacer,
} from '../catalyst/sidebar';
import { Avatar } from '../catalyst/avatar';

const navItems = [
  { to: '/',          icon: LayoutDashboard, label: 'Overview' },
  { to: '/prompts',   icon: Brain,           label: 'AI Prompts' },
  { to: '/templates', icon: FileStack,       label: 'Templates' },
];

export function Sidebar() {
  const { adminUser, signOut } = useAdminAuth();
  const location = useLocation();

  function isCurrent(to: string) {
    return to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
  }

  return (
    <CatalystSidebar className="bg-sidebar text-sidebar-text">
      <SidebarHeader>
        <SidebarSection>
          <SidebarItem href="/">
            <Avatar
              square
              initials="PA"
              className="size-8 bg-primary-500 text-white text-sm"
            />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-sidebar-text truncate block">
                PetApp Admin
              </span>
              <span className="text-xs text-sidebar-muted capitalize">
                {adminUser?.role?.replace('_', ' ') || 'Admin'}
              </span>
            </div>
          </SidebarItem>
        </SidebarSection>
      </SidebarHeader>

      <SidebarBody>
        <SidebarSection>
          {navItems.map(({ to, icon: Icon, label }) => (
            <SidebarItem key={to} href={to} current={isCurrent(to)}>
              <Icon size={18} className={isCurrent(to) ? 'text-primary-400' : 'text-sidebar-muted'} />
              <SidebarLabel className={isCurrent(to) ? 'text-white' : 'text-sidebar-muted'}>{label}</SidebarLabel>
            </SidebarItem>
          ))}
        </SidebarSection>

        <SidebarSpacer />

        <SidebarSection>
          <SidebarItem href="/settings" current={isCurrent('/settings')}>
            <Settings size={18} className={isCurrent('/settings') ? 'text-primary-400' : 'text-sidebar-muted'} />
            <SidebarLabel className={isCurrent('/settings') ? 'text-white' : 'text-sidebar-muted'}>Settings</SidebarLabel>
          </SidebarItem>
        </SidebarSection>
      </SidebarBody>

      <SidebarFooter>
        <SidebarSection>
          {adminUser && (
            <div className="px-2 mb-2">
              <p className="text-sidebar-text text-sm font-medium truncate">{adminUser.name}</p>
              <p className="text-sidebar-muted text-xs truncate">{adminUser.email}</p>
            </div>
          )}
          <SidebarItem onClick={signOut}>
            <LogOut size={18} className="text-sidebar-muted" />
            <SidebarLabel className="text-sidebar-muted">Sign out</SidebarLabel>
          </SidebarItem>
        </SidebarSection>
      </SidebarFooter>
    </CatalystSidebar>
  );
}
