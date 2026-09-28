import React, { useState, useRef, useEffect } from 'react';
import { usePolar, useAuth } from '../../context';
import { UserRole } from '../../types/auth';
import { getRoleDisplayName, getRoleBadgeColor, canCreate } from '../../utils/permissions';
import {
  Menu,
  Bell,
  Clock,
  ShieldAlert,
  Building2,
  CheckCircle,
  AlertTriangle,
  Info,
  Radio,
  ExternalLink,
  ChevronDown,
  LogOut,
  Sparkles,
  Database,
  Cloud,
  ShieldCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface TopbarProps {
  onMobileMenuClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMobileMenuClick }) => {
  const {
    stations,
    selectedStation,
    setSelectedStation,
    polarTimeUTC,
    stationTimeMaitri,
    notifications,
    markNotificationRead,
    clearAllNotifications,
    setIsSOSModalOpen,
    isFirebaseActive,
    triggerDatabaseSeed
  } = usePolar();

  const { userProfile, role, logout, isDemoMode, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedToast, setSeedToast] = useState<string | null>(null);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const roleColors = getRoleBadgeColor(role);
  const canSendSOS = canCreate(userProfile, 'emergency');

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/login');
  };

  const handleSeedDatabase = async () => {
    setSeedLoading(true);
    try {
      const result = await triggerDatabaseSeed();
      setSeedToast(result.message);
      setTimeout(() => setSeedToast(null), 4500);
    } catch (err: any) {
      setSeedToast(`Seed error: ${err.message}`);
      setTimeout(() => setSeedToast(null), 4500);
    } finally {
      setSeedLoading(false);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'emergency':
        return <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />;
    }
  };

  const initials = userProfile?.displayName
    ? userProfile.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'PO';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-xl">
      {/* Left section: Mobile menu + Station Selector + Cloud Indicator */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuClick}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Station Filter Dropdown */}
        <div className="relative flex items-center">
          <Building2 className="absolute left-3 w-4 h-4 text-cyan-400 pointer-events-none" />
          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className="pl-9 pr-8 py-1.5 bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 focus:border-cyan-400 rounded-lg text-xs font-semibold text-slate-200 transition-all focus:outline-none appearance-none cursor-pointer"
          >
            <option value="All Stations">Global Polar Network (All Bases)</option>
            {stations.map((st) => (
              <option key={st.id} value={st.name}>
                {st.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Cloud Status Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-mono">
          {isFirebaseActive ? (
            <>
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 font-bold">LIVE BACKEND</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-cyan-300 font-bold">DEMO MODE</span>
            </>
          )}
        </div>
      </div>

      {/* Middle section: Polar Live Clocks & Role Clearance Badge */}
      <div className="hidden md:flex items-center gap-3 text-xs font-mono text-slate-300">
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-white font-semibold">{polarTimeUTC}</span>
        </div>

        <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800/80 text-slate-400">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>{stationTimeMaitri}</span>
        </div>

        {/* Prominent Active Role Badge */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] border ${roleColors.bg} ${roleColors.text} ${roleColors.border} shadow-sm`}>
          <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{role}</span>
        </div>
      </div>

      {/* Right section: SOS button + Notifications + Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Quick Emergency SOS button (Only for authorized roles) */}
        {canSendSOS ? (
          <button
            type="button"
            onClick={() => setIsSOSModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-950/60 transition-all active:scale-95 animate-pulse"
            title="Broadcast Emergency SOS Protocol"
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="hidden sm:inline font-mono">EMERGENCY SOS</span>
          </button>
        ) : (
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold text-slate-400 bg-slate-900 border border-slate-800" title="Viewer clearance: Operational controls locked to read-only">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>READ-ONLY VIEW</span>
          </div>
        )}

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors"
            title="Telemetry and Mission Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold font-mono text-slate-950 bg-cyan-400 rounded-full shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Panel */}
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden z-50 animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white font-sans">Mission Telemetry & Alerts</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                      {unreadCount} NEW
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllNotifications}
                    className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3.5 hover:bg-slate-800/50 transition-colors cursor-pointer flex gap-3 ${
                        !n.read ? 'bg-cyan-950/20' : ''
                      }`}
                    >
                      <div className="mt-0.5">{getNotifIcon(n.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-slate-100 truncate">{n.title}</p>
                          <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                            {n.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {n.description}
                        </p>
                        {n.link && (
                          <Link
                            to={n.link}
                            onClick={() => setNotifOpen(false)}
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:underline mt-1.5"
                          >
                            <span>Inspect Module</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No active telemetry notifications.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Badge & Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white leading-none">
                {userProfile?.displayName || 'Polar Operator'}
              </p>
              <span className="text-[10px] text-cyan-400 font-mono">
                {role}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-sky-400 text-slate-950 font-black text-xs flex items-center justify-center">
              {initials}
            </div>
          </button>

          {/* Profile Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-3 z-50 animate-in fade-in-50 duration-150 space-y-3">
              <div className="px-2 py-1.5 border-b border-slate-800">
                <p className="text-xs font-bold text-white">{userProfile?.displayName || 'Polar Operator'}</p>
                <p className="text-[11px] text-slate-400 font-mono truncate">{userProfile?.email}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    {getRoleDisplayName(role)}
                  </span>
                  {isFirebaseActive && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                      CLOUD AUTH
                    </span>
                  )}
                </div>
              </div>

              {/* Demo Mode Role Switcher */}
              {isDemoMode && (
                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Switch Active Role (Demo):
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                    {(['ADMIN', 'EXPEDITION_MANAGER', 'LOGISTICS_OFFICER', 'MEDICAL_OFFICER', 'SCIENTIST', 'VIEWER'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => switchDemoRole(r)}
                        className={`px-2 py-1 rounded text-left truncate transition-colors ${
                          role === r
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {r.split('_')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Cloud Database Seed Action for Admin */}
              {isFirebaseActive && role === 'ADMIN' && (
                <div className="p-2 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300">
                    <span className="font-bold">Firestore Initializer</span>
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <button
                    type="button"
                    onClick={handleSeedDatabase}
                    disabled={seedLoading}
                    className="w-full py-1 px-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-[10px] font-mono transition-colors disabled:opacity-50"
                  >
                    {seedLoading ? 'Seeding Collections...' : 'Import Mock Data to Firestore'}
                  </button>
                </div>
              )}

              {/* Links */}
              <div className="space-y-1 text-xs font-mono">
                <Link
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="block px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  System & Station Config
                </Link>
                <Link
                  to="/reports"
                  onClick={() => setProfileOpen(false)}
                  className="block px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Audit Logs & Telemetry
                </Link>
              </div>

              {/* Logout Button */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/40 border border-rose-500/30 transition-colors font-mono"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Terminate Session (Logout)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Seed Toast notification */}
      {seedToast && (
        <div className="fixed bottom-5 right-5 z-50 p-4 bg-slate-900 border border-cyan-500/50 rounded-2xl shadow-2xl flex items-center gap-3 text-xs text-cyan-200 font-mono animate-in slide-in-from-bottom-5">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
          <span>{seedToast}</span>
        </div>
      )}
    </header>
  );
};
