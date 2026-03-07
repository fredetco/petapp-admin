import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Brain,
  FileStack,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

const navItems = [
  { to: '/',          icon: LayoutDashboard, label: 'Overview' },
  { to: '/prompts',   icon: Brain,           label: 'AI Prompts' },
  { to: '/templates', icon: FileStack,       label: 'Templates' },
  { to: '/settings',  icon: Settings,        label: 'Settings' },
];

export function Sidebar() {
  const { adminUser, signOut } = useAdminAuth();
  const location = useLocation();

  return (
    <aside className="w-60 bg-admin-sidebar flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-admin-accent-500 flex items-center justify-center">
            <Shield size={18} className="text-admin-sidebar" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-admin-sidebar-text font-bold text-sm truncate">
              PetApp Admin
            </p>
            <p className="text-admin-sidebar-muted text-xs capitalize">
              {adminUser?.role?.replace('_', ' ') || 'Admin'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-admin-sidebar-active text-admin-accent-500'
                  : 'text-admin-sidebar-muted hover:bg-admin-sidebar-hover hover:text-admin-sidebar-text'
                }
              `}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* User info + sign out */}
      <div className="px-3 py-4 border-t border-white/10">
        {adminUser && (
          <div className="px-3 mb-3">
            <p className="text-admin-sidebar-text text-sm font-medium truncate">{adminUser.name}</p>
            <p className="text-admin-sidebar-muted text-xs truncate">{adminUser.email}</p>
          </div>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-admin-sidebar-muted hover:bg-admin-sidebar-hover hover:text-admin-sidebar-text transition-colors w-full"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
