/**
 * POLAR-X Admin-Only User Management & Security Clearance Provisioning Page
 * Real-time operator profile management, secure role assignments, approval workflows, and audit logging.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, usePolar } from '../context';
import { UserProfile, UserRole } from '../types/auth';
import { getRoleBadgeColor } from '../utils/permissions';
import {
  subscribeUsers,
  changeUserRole,
  approveRoleRequest,
  rejectRoleRequest
} from '../services/firebase/userService';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { Modal } from '../components/common/Modal';
import {
  Users,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Mail,
  ArrowRight,
  Shield,
  UserCheck,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Clock,
  XCircle,
  Check,
  X
} from 'lucide-react';

const OPERATIONAL_ROLES: { role: UserRole; title: string; description: string }[] = [
  {
    role: 'ADMIN',
    title: 'Polar Base Commander (ADMIN)',
    description: 'Full administrative access across all modules, fleet operations, user clearances, and cloud settings.'
  },
  {
    role: 'EXPEDITION_MANAGER',
    title: 'Expedition Operations Lead',
    description: 'Autonomous management of traverses, personnel assignments, routes, SAR deployments, and incident protocols.'
  },
  {
    role: 'LOGISTICS_OFFICER',
    title: 'Polar Logistics & Supply Officer',
    description: 'Authority over cargo manifests, inventory reserves, asset provisioning, fuel supply, and depot transfers.'
  },
  {
    role: 'SCIENTIST',
    title: 'Chief Glaciologist / Scientist',
    description: 'Operational access to satellite telemetry, UAV reconnaissance, 3D ice models, and scientific research logging.'
  },
  {
    role: 'MEDICAL_OFFICER',
    title: 'Station Medical Specialist',
    description: 'Direct authority over personnel health records, biometric monitoring, medical stock, and emergency SOS.'
  },
  {
    role: 'VIEWER',
    title: 'Scientific Observer / Viewer',
    description: 'Strictly read-only monitoring access to public mission telemetry, radar maps, and summary reports.'
  }
];

const DEMO_USERS: UserProfile[] = [
  {
    uid: 'demo-admin-01',
    email: 'admin.director@polar-x.ncpor.gov.in',
    displayName: 'Dr. Rajesh Sharma',
    role: 'ADMIN',
    requestedRole: 'ADMIN',
    approvalStatus: 'APPROVED',
    status: 'ACTIVE',
    badgeId: 'NCPOR-POLAR-001',
    station: 'Maitri Station (Antarctica)',
    department: 'Station Command & Executive Operations',
    createdAt: '2026-01-01T00:00:00.000Z',
    lastLoginAt: new Date().toISOString()
  },
  {
    uid: 'demo-exp-mgr-02',
    email: 'operations.traverse@polar-x.ncpor.gov.in',
    displayName: 'Cmdr. Vikram Sen',
    role: 'EXPEDITION_MANAGER',
    requestedRole: 'EXPEDITION_MANAGER',
    approvalStatus: 'APPROVED',
    status: 'ACTIVE',
    badgeId: 'NCPOR-OPS-042',
    station: 'Bharati Station (Larsemann Hills)',
    department: 'Overland Traverses & Field Operations',
    createdAt: '2026-01-10T00:00:00.000Z',
    lastLoginAt: new Date().toISOString()
  },
  {
    uid: 'demo-logistics-03',
    email: 'logistics.supply@polar-x.ncpor.gov.in',
    displayName: 'S. K. Nair',
    role: 'LOGISTICS_OFFICER',
    requestedRole: 'LOGISTICS_OFFICER',
    approvalStatus: 'APPROVED',
    status: 'ACTIVE',
    badgeId: 'NCPOR-LOG-108',
    station: 'Maitri Station (Antarctica)',
    department: 'Fuel Reserves & Cargo Resupply',
    createdAt: '2026-01-15T00:00:00.000Z',
    lastLoginAt: new Date().toISOString()
  },
  {
    uid: 'demo-scientist-04',
    email: 'glaciology.lead@polar-x.ncpor.gov.in',
    displayName: 'Dr. Ananya Mukherjee',
    role: 'VIEWER',
    requestedRole: 'SCIENTIST',
    approvalStatus: 'PENDING',
    status: 'ACTIVE',
    badgeId: 'NCPOR-SCI-204',
    station: 'Himadri Station (Ny-Ålesund, Arctic)',
    department: 'Paleoclimate & Ice Core Physics',
    createdAt: '2026-02-01T00:00:00.000Z',
    lastLoginAt: new Date().toISOString()
  },
  {
    uid: 'demo-medical-05',
    email: 'medical.bay@polar-x.ncpor.gov.in',
    displayName: 'Dr. Priyanshu Roy',
    role: 'MEDICAL_OFFICER',
    requestedRole: 'MEDICAL_OFFICER',
    approvalStatus: 'APPROVED',
    status: 'ACTIVE',
    badgeId: 'NCPOR-MED-099',
    station: 'Maitri Station (Antarctica)',
    department: 'Polar Emergency Medicine & Telemetry',
    createdAt: '2026-02-10T00:00:00.000Z',
    lastLoginAt: new Date().toISOString()
  },
  {
    uid: 'demo-viewer-06',
    email: 'liaison.observer@polar-x.ncpor.gov.in',
    displayName: 'Govt. Scientific Observer',
    role: 'VIEWER',
    requestedRole: 'VIEWER',
    approvalStatus: 'APPROVED',
    status: 'ACTIVE',
    badgeId: 'NCPOR-OBS-550',
    station: 'All Polar Stations (Global Feed)',
    department: 'External Ministry Liaison',
    createdAt: '2026-02-20T00:00:00.000Z',
    lastLoginAt: new Date().toISOString()
  }
];

export const UserManagementPage: React.FC = () => {
  const { currentUser, userProfile: adminProfile, isDemoMode } = useAuth();
  const { logActivity, addNotification } = usePolar();

  const [users, setUsers] = useState<UserProfile[]>(() => (isDemoMode ? DEMO_USERS : []));
  const [loading, setLoading] = useState<boolean>(!isDemoMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [stationFilter, setStationFilter] = useState<string>('ALL');

  // Role Change Confirmation Modal State
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [targetNewRole, setTargetNewRole] = useState<UserRole>('VIEWER');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Subscribe to real-time users collection in Firestore
  useEffect(() => {
    if (isDemoMode) {
      return;
    }

    const unsubscribe = subscribeUsers(
      (firestoreUsers) => {
        setUsers(firestoreUsers);
        setLoading(false);
      },
      (err) => {
        console.warn('[POLAR-X] Users subscription failed:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isDemoMode]);

  // Derived Metrics
  const metrics = useMemo(() => {
    const total = users.length;
    const pendingRequests = users.filter((u) => u.approvalStatus === 'PENDING' && u.requestedRole && u.requestedRole !== u.role).length;
    const admins = users.filter((u) => u.role === 'ADMIN').length;
    const operationalLeads = users.filter(
      (u) =>
        u.role === 'EXPEDITION_MANAGER' ||
        u.role === 'LOGISTICS_OFFICER' ||
        u.role === 'SCIENTIST' ||
        u.role === 'MEDICAL_OFFICER'
    ).length;
    const viewers = users.filter((u) => u.role === 'VIEWER').length;

    return { total, pendingRequests, admins, operationalLeads, viewers };
  }, [users]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (user.displayName && user.displayName.toLowerCase().includes(q)) ||
        (user.email && user.email.toLowerCase().includes(q)) ||
        (user.badgeId && user.badgeId.toLowerCase().includes(q)) ||
        (user.station && user.station.toLowerCase().includes(q));

      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PENDING' && user.approvalStatus === 'PENDING') ||
        (statusFilter === 'APPROVED' && user.approvalStatus === 'APPROVED') ||
        (statusFilter === 'REJECTED' && user.approvalStatus === 'REJECTED');
      const matchesStation = stationFilter === 'ALL' || (user.station && user.station.includes(stationFilter));

      return matchesSearch && matchesRole && matchesStatus && matchesStation;
    });
  }, [users, searchQuery, roleFilter, statusFilter, stationFilter]);

  const handleOpenRoleModal = (user: UserProfile) => {
    setSelectedUser(user);
    setTargetNewRole(user.role);
    setIsModalOpen(true);
    setStatusMessage(null);
  };

  const handleApproveRole = async (targetUser: UserProfile) => {
    if (!targetUser.requestedRole) return;
    const actorUid = currentUser?.uid || adminProfile?.uid || 'command-admin';
    const targetName = targetUser.displayName || targetUser.email;
    const requestedRole = targetUser.requestedRole;
    const previousRole = targetUser.role;

    setUpdating(true);
    setStatusMessage(null);
    try {
      if (isDemoMode) {
        setUsers((prev) =>
          prev.map((u) =>
            u.uid === targetUser.uid
              ? { ...u, role: requestedRole, approvalStatus: 'APPROVED', status: 'ACTIVE' }
              : u
          )
        );
      } else {
        await approveRoleRequest(
          actorUid,
          targetUser.uid,
          targetName,
          previousRole,
          requestedRole,
          targetUser.approvalStatus
        );
      }

      await logActivity(
        'personnel',
        'ROLE_REQUEST_APPROVED',
        `Role request approved: ${targetName} elevated to ${requestedRole}.`,
        'warning',
        adminProfile?.displayName || 'Station Commander (ADMIN)'
      );

      await addNotification({
        title: `Clearance Approved: ${targetName}`,
        description: `Operational role request for ${requestedRole} approved by Command.`,
        type: 'success',
        link: '/user-management'
      });

      setStatusMessage({
        type: 'success',
        text: `Approved role request: ${targetName} is now ${requestedRole}.`
      });
    } catch (err: any) {
      console.error('[POLAR-X] Role approval error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to approve role request in Firestore.'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectRole = async (targetUser: UserProfile) => {
    if (!targetUser.requestedRole) return;
    const actorUid = currentUser?.uid || adminProfile?.uid || 'command-admin';
    const targetName = targetUser.displayName || targetUser.email;
    const requestedRole = targetUser.requestedRole;
    const currentRole = targetUser.role;

    setUpdating(true);
    setStatusMessage(null);
    try {
      if (isDemoMode) {
        setUsers((prev) =>
          prev.map((u) =>
            u.uid === targetUser.uid
              ? { ...u, approvalStatus: 'REJECTED' }
              : u
          )
        );
      } else {
        await rejectRoleRequest(
          actorUid,
          targetUser.uid,
          targetName,
          currentRole,
          requestedRole
        );
      }

      await logActivity(
        'personnel',
        'ROLE_REQUEST_REJECTED',
        `Role request rejected: Request for ${requestedRole} by ${targetName} rejected. Clearance remains ${currentRole}.`,
        'info',
        adminProfile?.displayName || 'Station Commander (ADMIN)'
      );

      setStatusMessage({
        type: 'success',
        text: `Rejected ${targetName}'s request for ${requestedRole}. Role remains ${currentRole}.`
      });
    } catch (err: any) {
      console.error('[POLAR-X] Role rejection error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to reject role request in Firestore.'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmRoleChange = async () => {
    if (!selectedUser) return;
    if (selectedUser.role === targetNewRole) {
      setIsModalOpen(false);
      return;
    }

    setUpdating(true);
    setStatusMessage(null);

    const actorUid = currentUser?.uid || adminProfile?.uid || 'command-admin';
    const previousRole = selectedUser.role;

    try {
      if (isDemoMode) {
        setUsers((prev) =>
          prev.map((u) =>
            u.uid === selectedUser.uid
              ? { ...u, role: targetNewRole, approvalStatus: 'APPROVED', status: 'ACTIVE' }
              : u
          )
        );
      } else {
        await changeUserRole(
          actorUid,
          selectedUser.uid,
          targetNewRole,
          selectedUser.displayName || selectedUser.email,
          previousRole,
          selectedUser.approvalStatus
        );
      }

      await logActivity(
        'personnel',
        'ROLE_CHANGED',
        `Clearance for ${selectedUser.displayName} elevated from ${previousRole} to ${targetNewRole}.`,
        'warning',
        adminProfile?.displayName || 'Station Commander (ADMIN)'
      );

      await addNotification({
        title: `Security Clearance Modified: ${selectedUser.displayName}`,
        description: `Operational role transitioned to ${targetNewRole} by Station Command.`,
        type: 'warning',
        link: '/user-management'
      });

      setStatusMessage({
        type: 'success',
        text: `Successfully updated ${selectedUser.displayName}'s clearance to ${targetNewRole}.`
      });

      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      console.error('[POLAR-X] Role modification error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to modify role clearance in Firestore.'
      });
    } finally {
      setUpdating(false);
    }
  };

  const formatTimestamp = (dateStr?: string): string => {
    if (!dateStr) return 'Pending First Sync';
    try {
      const d = new Date(dateStr);
      return (
        d.toISOString().slice(0, 10) +
        ' ' +
        d.toTimeString().slice(0, 5) +
        ' UTC'
      );
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Page Header */}
      <PageHeader
        title="Personnel & Security Clearance Directory"
        subtitle="Central NCPOR Station Directory, Authoritative Role Provisioning & Clearance Approval Protocol"
        badge="ADMIN ONLY"
        icon={Users}
      />

      {/* Global Status / Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-mono animate-in slide-in-from-top-3 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Operators"
          value={metrics.total}
          subtitle="Provisioned in Cloud Directory"
          icon={Users}
          variant="cyan"
        />
        <StatCard
          title="Pending Role Requests"
          value={metrics.pendingRequests}
          subtitle="Awaiting Administrator Approval"
          icon={Clock}
          variant={metrics.pendingRequests > 0 ? 'amber' : 'blue'}
        />
        <StatCard
          title="Station Commanders (ADMIN)"
          value={metrics.admins}
          subtitle="Executive Clearance Active"
          icon={ShieldCheck}
          variant="purple"
        />
        <StatCard
          title="Operational Field Leads"
          value={metrics.operationalLeads}
          subtitle="Expedition, Logistics, Science & Medical"
          icon={UserCheck}
          variant="cyan"
        />
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by operator name, official email, badge ID, or station..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-center flex-wrap gap-3">
            {/* Role Filter */}
            <div className="relative flex items-center">
              <Filter className="absolute left-3 w-3.5 h-3.5 text-cyan-400 pointer-events-none" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="pl-8 pr-7 py-2 bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded-xl text-xs font-mono text-slate-200 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">ADMIN</option>
                <option value="EXPEDITION_MANAGER">EXPEDITION_MANAGER</option>
                <option value="LOGISTICS_OFFICER">LOGISTICS_OFFICER</option>
                <option value="SCIENTIST">SCIENTIST</option>
                <option value="MEDICAL_OFFICER">MEDICAL_OFFICER</option>
                <option value="VIEWER">VIEWER</option>
              </select>
              <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative flex items-center">
              <Shield className="absolute left-3 w-3.5 h-3.5 text-cyan-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-8 pr-7 py-2 bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded-xl text-xs font-mono text-slate-200 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="ALL">All Approval States</option>
                <option value="PENDING">Pending Requests</option>
                <option value="APPROVED">Approved Clearances</option>
                <option value="REJECTED">Rejected Requests</option>
              </select>
              <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>

            {/* Station Filter */}
            <div className="relative flex items-center">
              <Building2 className="absolute left-3 w-3.5 h-3.5 text-cyan-400 pointer-events-none" />
              <select
                value={stationFilter}
                onChange={(e) => setStationFilter(e.target.value)}
                className="pl-8 pr-7 py-2 bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded-xl text-xs font-mono text-slate-200 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="ALL">All Polar Stations</option>
                <option value="Maitri">Maitri Station</option>
                <option value="Bharati">Bharati Station</option>
                <option value="Himadri">Himadri Station</option>
                <option value="Dakshin Gangotri">Dakshin Gangotri</option>
              </select>
              <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Users Directory Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-sans">
              Authorized Personnel Records & Role Requests
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Showing {filteredUsers.length} of {users.length} registered profiles
            </p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Syncing with Cloud Directory...</span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Operator Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Current Role</th>
                <th className="py-3 px-4">Requested Role</th>
                <th className="py-3 px-4">Approval Status</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const roleColors = getRoleBadgeColor(u.role);
                  const reqRoleColors = u.requestedRole ? getRoleBadgeColor(u.requestedRole) : null;
                  const isCurrentAdmin = u.uid === currentUser?.uid;
                  const hasPendingRequest =
                    u.approvalStatus === 'PENDING' && u.requestedRole && u.requestedRole !== u.role;
                  const initials = u.displayName
                    ? u.displayName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    : 'PO';

                  return (
                    <tr
                      key={u.uid}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Name & Initials */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-700 to-sky-500 text-slate-950 font-bold text-[11px] flex items-center justify-center flex-shrink-0 shadow">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-100 font-sans flex items-center gap-1.5">
                              <span>{u.displayName || 'Unnamed Operator'}</span>
                              {isCurrentAdmin && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                                  YOU
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {u.badgeId || 'NCPOR-AUTO'} • {u.station?.split(' ')[0] || 'Maitri'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span className="truncate max-w-[180px]">{u.email}</span>
                        </div>
                      </td>

                      {/* Current Role */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${roleColors.bg} ${roleColors.text} ${roleColors.border}`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>{u.role}</span>
                        </span>
                      </td>

                      {/* Requested Role */}
                      <td className="py-3 px-4">
                        {u.requestedRole && reqRoleColors ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${reqRoleColors.bg} ${reqRoleColors.text} ${reqRoleColors.border}`}
                          >
                            <span>{u.requestedRole}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">None</span>
                        )}
                      </td>

                      {/* Approval Status */}
                      <td className="py-3 px-4">
                        {u.approvalStatus === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            APPROVED
                          </span>
                        ) : u.approvalStatus === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold text-[10px]">
                            <XCircle className="w-3 h-3" />
                            REJECTED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold text-[10px]">
                            <Clock className="w-3 h-3" />
                            PENDING
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-300 font-mono text-[10px]">
                          {u.status || 'ACTIVE'}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="py-3 px-4 text-slate-400 text-[10px]">
                        <span>{formatTimestamp(u.createdAt)}</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasPendingRequest ? (
                            <>
                              <button
                                type="button"
                                disabled={updating}
                                onClick={() => handleApproveRole(u)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all active:scale-95 shadow-sm shadow-emerald-950/60"
                                title={`Approve request for ${u.requestedRole}`}
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                disabled={updating}
                                onClick={() => handleRejectRole(u)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-300 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 transition-all active:scale-95"
                                title="Reject request"
                              >
                                <X className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenRoleModal(u)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all active:scale-95 shadow-sm shadow-cyan-950/60"
                            >
                              <SlidersHorizontal className="w-3 h-3" />
                              <span>Modify</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-slate-400 font-mono text-xs"
                  >
                    No personnel profiles match the specified filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Change Confirmation Modal */}
      {selectedUser && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            if (!updating) setIsModalOpen(false);
          }}
          title="Security Clearance Authorization & Role Assignment"
        >
          <div className="space-y-5 text-xs font-mono">
            {/* Target Operator Summary */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-700 to-sky-500 text-slate-950 font-black text-sm flex items-center justify-center flex-shrink-0">
                {selectedUser.displayName
                  ? selectedUser.displayName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                  : 'PO'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm font-sans truncate">
                  {selectedUser.displayName || 'Polar Operator'}
                </p>
                <p className="text-slate-400 text-[11px] truncate">
                  {selectedUser.email}
                </p>
                <p className="text-cyan-400 text-[10px] mt-0.5">
                  Badge: {selectedUser.badgeId || 'NCPOR-AUTO'} • Station:{' '}
                  {selectedUser.station || 'Maitri'}
                </p>
              </div>
            </div>

            {/* Role Transition Visualizer */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Clearance Transition Protocol:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                {/* Current Role */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 block">
                    Current Assigned Role:
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span>{selectedUser.role}</span>
                  </div>
                </div>

                {/* Target Role Selector */}
                <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500/40 space-y-1">
                  <span className="text-[10px] text-cyan-400 block font-bold">
                    Target Elevated Role:
                  </span>
                  <div className="relative">
                    <select
                      value={targetNewRole}
                      onChange={(e) => setTargetNewRole(e.target.value as UserRole)}
                      className="w-full py-1 pr-6 bg-transparent text-cyan-300 font-bold text-xs focus:outline-none appearance-none cursor-pointer"
                    >
                      {OPERATIONAL_ROLES.map((r) => (
                        <option
                          key={r.role}
                          value={r.role}
                          className="bg-slate-950 text-white"
                        >
                          {r.role}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-0 top-1 w-3.5 h-3.5 text-cyan-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Target Role Operational Description */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 space-y-1 leading-relaxed">
              <span className="text-cyan-400 font-bold block">
                {OPERATIONAL_ROLES.find((r) => r.role === targetNewRole)?.title}
              </span>
              <p className="text-slate-400">
                {OPERATIONAL_ROLES.find((r) => r.role === targetNewRole)?.description}
              </p>
            </div>

            {/* Audit Warning */}
            <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">Authoritative Action Notice:</span>
                <p className="text-amber-300/90 text-[10px]">
                  This security clearance modification is committed directly to
                  Firestore and creates an append-only audit trail in the polar
                  activity log. The target user’s real-time session will reflect
                  this clearance instantly.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={updating}
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updating || selectedUser.role === targetNewRole}
                onClick={handleConfirmRoleChange}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-cyan-950/60"
              >
                {updating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Committing Clearance...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Clearance Update</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserManagementPage;
