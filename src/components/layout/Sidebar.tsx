import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/contexts/FeatureFlagContext';
import { ModuleKey } from '@/types';
import {
  LayoutDashboard,
  FileText,
  Search,
  Users,
  Settings,
  ClipboardList,
  Calendar,
  FileSpreadsheet,
  Shield,
  ChevronLeft,
  ChevronRight,
  Building2
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  moduleKey?: ModuleKey;
  roles?: string[];
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user, isDealer, isManufacturer, isSuperAdmin } = useAuth();
  const { isModuleEnabled } = useFeatureFlags();

  const navItems: NavItem[] = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    // PCC Module (always available)
    {
      path: '/pcc/submit',
      label: 'Submit PCC',
      icon: <FileText className="h-5 w-5" />,
      moduleKey: 'dealer_pcc',
      roles: ['master_technician', 'service_manager', 'service_head', 'warranty_manager']
    },
    {
      path: '/pcc/track',
      label: 'Track Status',
      icon: <Search className="h-5 w-5" />,
      moduleKey: 'dealer_pcc'
    },
    {
      path: '/pcc/manage',
      label: 'Manage PCC',
      icon: <ClipboardList className="h-5 w-5" />,
      moduleKey: 'dealer_pcc',
      roles: ['admin', 'super_admin']
    },
    // API Registration Module
    {
      path: '/api-registration',
      label: 'API Registration',
      icon: <Calendar className="h-5 w-5" />,
      moduleKey: 'api_registration'
    },
    // MT Meet Module
    {
      path: '/mt-meet',
      label: 'MT Meet',
      icon: <Users className="h-5 w-5" />,
      moduleKey: 'mt_meet'
    },
    // Surveys
    {
      path: '/workshop-survey',
      label: 'Workshop Survey',
      icon: <FileSpreadsheet className="h-5 w-5" />,
      moduleKey: 'workshop_survey',
      roles: ['master_technician', 'service_manager', 'service_head', 'warranty_manager', 'admin', 'super_admin']
    },
    {
      path: '/warranty-survey',
      label: 'Warranty Survey',
      icon: <FileSpreadsheet className="h-5 w-5" />,
      moduleKey: 'warranty_survey'
    },
    {
      path: '/technical-survey',
      label: 'Technical Survey',
      icon: <FileSpreadsheet className="h-5 w-5" />,
      moduleKey: 'technical_awareness_survey'
    }
  ];

  const adminItems: NavItem[] = [
    {
      path: '/users',
      label: 'User Management',
      icon: <Users className="h-5 w-5" />,
      roles: ['admin', 'super_admin']
    },
    {
      path: '/access-requests',
      label: 'Access Requests',
      icon: <Shield className="h-5 w-5" />,
      roles: ['admin', 'super_admin']
    },
    {
      path: '/modules',
      label: 'Module Management',
      icon: <Settings className="h-5 w-5" />,
      roles: ['super_admin']
    },
    {
      path: '/audit-logs',
      label: 'Audit Logs',
      icon: <ClipboardList className="h-5 w-5" />,
      roles: ['admin', 'super_admin']
    }
  ];

  const filterItems = (items: NavItem[]) => {
    return items.filter(item => {
      // Check module flag
      if (item.moduleKey && !isModuleEnabled(item.moduleKey)) {
        // Super admin can see disabled modules (with indicator)
        if (!isSuperAdmin()) return false;
      }
      
      // Check role
      if (item.roles && user) {
        return item.roles.includes(user.role);
      }
      
      return true;
    });
  };

  const visibleNavItems = filterItems(navItems);
  const visibleAdminItems = filterItems(adminItems);

  return (
    <aside
      className={cn(
        'flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[280px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-sidebar-primary" />
            <div>
              <h1 className="text-sm font-semibold">VW India Portal</h1>
              <p className="text-xs text-sidebar-foreground/60">Dealer PCC System</p>
            </div>
          </div>
        )}
        {collapsed && <Building2 className="h-8 w-8 text-sidebar-primary mx-auto" />}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {visibleNavItems.map(item => {
            const isDisabled = item.moduleKey && !isModuleEnabled(item.moduleKey);
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'nav-item',
                    isActive && 'nav-item-active',
                    isDisabled && 'opacity-50',
                    collapsed && 'justify-center px-0'
                  )
                }
              >
                {item.icon}
                {!collapsed && (
                  <span className="flex-1">{item.label}</span>
                )}
                {!collapsed && isDisabled && (
                  <span className="text-xs bg-warning/20 text-warning px-1.5 py-0.5 rounded">OFF</span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Admin Section */}
        {visibleAdminItems.length > 0 && (
          <>
            {!collapsed && (
              <div className="mt-6 mb-2 px-3">
                <p className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
                  Administration
                </p>
              </div>
            )}
            {collapsed && <div className="my-4 border-t border-sidebar-border" />}
            <div className="space-y-1">
              {visibleAdminItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'nav-item',
                      isActive && 'nav-item-active',
                      collapsed && 'justify-center px-0'
                    )
                  }
                >
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </>
        )}
      </nav>

      {/* User Info */}
      {user && (
        <div className={cn(
          'border-t border-sidebar-border p-4',
          collapsed && 'px-2'
        )}>
          <div className={cn(
            'flex items-center gap-3',
            collapsed && 'justify-center'
          )}>
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-medium">
              {user.name.charAt(0)}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-sidebar-foreground/60 capitalize">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
