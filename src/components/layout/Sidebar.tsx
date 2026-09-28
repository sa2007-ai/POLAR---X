import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePolar, useAuth } from '../../context';
import { getRoleDisplayName, canView, getRoleBadgeColor } from '../../utils/permissions';
import { AppModule } from '../../types/auth';
import {
  LayoutDashboard,
  Compass,
  Users,
  Boxes,
  Package,
  Wrench,
  AlertOctagon,
  FileText,
  Settings,
  Radio,
  Navigation,
  Plane,
  Truck,
  HardDrive,
  ChevronLeft,
  ChevronRight,
  Snowflake,
  Cloud,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

interface NavItemDef {
  name: string;
  path: string;
  module: AppModule;
  icon: any;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen
}) => {
  const { emergencies, cargo, inventory, expeditions, isFirebaseActive, geofenceBreaches } = usePolar();
  const { userProfile, role } = useAuth();

  // Dynamic Reactive Badges
  const activeEmergencies = emergencies.filter(
    (e) => e.status !== 'RESOLVED' && e.status !== 'Resolved' && e.status !== 'CLOSED'
  ).length;
  const inTransitCargo = cargo.filter(
    (c) => c.status === 'In Transit' || c.status === 'Loaded' || c.status === 'Air-Dropped'
  ).length;
  const lowStockCount = inventory.filter(
    (i) => i.status === 'LOW STOCK' || i.status === 'CRITICAL' || i.status === 'Low Stock' || i.status === 'Critical Shortage'
  ).length;
  const activeExpeditionsCount = expeditions.filter((e) => e.status === 'Active').length;
  const breachCount = geofenceBreaches.length;

  const navItems: NavItemDef[] = [
    { name: 'Dashboard', path: '/dashboard', module: 'dashboard', icon: LayoutDashboard },
    { name: 'Map Operations', path: '/map', module: 'map', icon: Compass, badge: breachCount > 0 ? `${breachCount} HAZ` : undefined, badgeColor: 'bg-rose-950 text-rose-300 border-rose-500/40 animate-pulse' },
    { name: 'GNSS Telemetry', path: '/telemetry', module: 'telemetry', icon: Radio, badge: 'SIMULATED', badgeColor: 'bg-amber-950 text-amber-300 border-amber-500/30' },
    { name: 'Convoy Mesh', path: '/convoy', module: 'convoy', icon: Truck },
    { name: 'UAV Recon', path: '/uav', module: 'uav', icon: Plane },
    { name: '3D Reconstruction', path: '/reconstruction', module: 'reconstruction', icon: Boxes, badge: '3D/IR', badgeColor: 'bg-purple-950 text-purple-300 border-purple-500/30' },
    { name: 'Traverse Routes', path: '/routes', module: 'routes', icon: Navigation },
    { name: 'Offline Maps', path: '/offline-maps', module: 'offline-maps', icon: HardDrive },
    { name: 'Field Safety', path: '/field-safety', module: 'field-safety', icon: ShieldAlert, badge: 'BLE/LoRa', badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-500/30' },
    { name: 'Expeditions', path: '/expeditions', module: 'expeditions', icon: Compass, badge: activeExpeditionsCount > 0 ? `${activeExpeditionsCount}` : undefined, badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-500/30' },
    { name: 'Personnel', path: '/personnel', module: 'personnel', icon: Users },
    { name: 'Cargo Tracking', path: '/cargo', module: 'cargo', icon: Boxes, badge: inTransitCargo > 0 ? `${inTransitCargo}` : undefined, badgeColor: 'bg-sky-950 text-sky-300 border-sky-500/30' },
    { name: 'Inventory', path: '/inventory', module: 'inventory', icon: Package, badge: lowStockCount > 0 ? `${lowStockCount}` : undefined, badgeColor: 'bg-amber-950 text-amber-300 border-amber-500/30' },
    { name: 'Assets', path: '/assets', module: 'assets', icon: Wrench },
    { name: 'Emergency', path: '/emergency', module: 'emergency', icon: AlertOctagon, badge: activeEmergencies > 0 ? `${activeEmergencies}` : undefined, badgeColor: 'bg-rose-600 text-white animate-pulse' },
    { name: 'Reports', path: '/reports', module: 'reports', icon: FileText },
    { name: 'User Management', path: '/user-management', module: 'users', icon: ShieldCheck, badge: 'ADMIN', badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-500/40' },
    { name: 'Settings', path: '/settings', module: 'settings', icon: Settings }
  ];

  // Role-filtered navigation items
  const visibleNavItems = navItems.filter((item) => canView(userProfile, item.module));

  const roleColors = getRoleBadgeColor(role);

  const initials = userProfile?.displayName
    ? userProfile.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'PO';

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-slate-950/95 border-r border-slate-800/90 transition-all duration-300 ease-in-out lg:static ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-700 text-slate-950 font-black shadow-lg shadow-cyan-950/50 flex-shrink-0">
              <Snowflake className="w-6 h-6 text-slate-950" />
            </div>
            {!collapsed && (
              <div className="transition-opacity duration-200">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black tracking-wider text-white font-sans">
                    POLAR<span className="text-cyan-400">-X</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    {isFirebaseActive ? 'CLOUD' : 'DEMO'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono tracking-tight uppercase truncate">
                  Logistics & Asset Ops
                </p>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors border border-slate-800"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
                title={collapsed ? item.name : undefined}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    item.name === 'Emergency' && activeEmergencies > 0
                      ? 'text-rose-400 animate-pulse'
                      : 'group-hover:text-cyan-400'
                  }`}
                />

                {!collapsed && <span className="flex-1 truncate">{item.name}</span>}

                {!collapsed && item.badge && (
                  <span
                    className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-full border ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Cloud / Mesh Status Card */}
        {!collapsed ? (
          <div className="p-3 m-3 rounded-xl bg-slate-900/90 border border-slate-800/90 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                {isFirebaseActive ? (
                  <Cloud className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                ) : (
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                )}
                <span>{isFirebaseActive ? 'Firestore Cloud' : 'SatMesh Demo'}</span>
              </span>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                isFirebaseActive
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/30'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
              }`}>
                {isFirebaseActive ? 'SYNCED' : 'ONLINE'}
              </span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-400 font-mono">
              <div className="flex justify-between">
                <span>Persistence:</span>
                <span className="text-white">{isFirebaseActive ? 'Cloud Database' : 'Mock Memory'}</span>
              </div>
              <div className="flex justify-between">
                <span>Clearance:</span>
                <span className="text-cyan-400 font-bold">{role}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2 flex justify-center border-t border-slate-800">
            <div
              className={`w-3 h-3 rounded-full shadow-lg ${
                isFirebaseActive ? 'bg-cyan-400 shadow-cyan-500/50' : 'bg-emerald-400 shadow-emerald-500/50'
              } animate-pulse`}
              title={isFirebaseActive ? 'Firestore Synchronized' : 'SatMesh Link Online'}
            />
          </div>
        )}

        {/* User Mini Bar */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-700 to-sky-500 flex items-center justify-center text-slate-950 font-bold text-xs shadow flex-shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate font-sans">
                {userProfile?.displayName || 'Polar Operator'}
              </p>
              <div className="mt-0.5">
                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold truncate max-w-full border ${roleColors.bg} ${roleColors.text} ${roleColors.border}`}>
                  {getRoleDisplayName(role)}
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
