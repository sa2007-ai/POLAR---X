import React, { useState } from 'react';
import { usePolar, useAuth } from '../context';
import { canCreate, canEdit, canDelete } from '../utils/permissions';
import { Personnel, PersonnelRole, PersonnelTeam, PersonnelStatus, MedicalClearance } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { SearchBar } from '../components/common/SearchBar';
import { FilterDropdown } from '../components/common/FilterDropdown';
import { Modal } from '../components/common/Modal';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import {
  Users,
  UserPlus,
  HeartPulse,
  Award,
  ShieldCheck,
  Phone,
  Mail,
  Eye,
  Activity,
  Edit2,
  Trash2,
  Save,
  Send
} from 'lucide-react';

export const PersonnelPage: React.FC = () => {
  const { personnel, addPersonnel, updatePersonnel, deletePersonnel, stations } = usePolar();
  const { userProfile } = useAuth();

  const canCreatePersonnel = canCreate(userProfile, 'personnel');
  const canEditPersonnel = canEdit(userProfile, 'personnel');
  const canDeletePersonnel = canDelete(userProfile, 'personnel');

  const [searchQuery, setSearchQuery] = useState('');
  const [stationFilter, setStationFilter] = useState('All Stations');
  const [roleFilter] = useState('All Roles');
  const [teamFilter, setTeamFilter] = useState('All Teams');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  // Modals
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Personnel Form State
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<PersonnelRole>('Glaciologist');
  const [newTeam, setNewTeam] = useState<PersonnelTeam>('Science');
  const [newStation, setNewStation] = useState(stations[0]?.name || 'Maitri Research Base');
  const [newExpeditionName] = useState('');
  const [newNationality] = useState('Indian');
  const [newBloodGroup, setNewBloodGroup] = useState('O+ Positive');
  const [newMedicalClearance] = useState<MedicalClearance>('Class-1 Polar Unrestricted');
  const [newWinterExperience] = useState<number>(1);
  const [newStatus, setNewStatus] = useState<PersonnelStatus>('Active');
  const [newEmail, setNewEmail] = useState('');
  const [newSatPhone, setNewSatPhone] = useState('');
  const [newEmergencyName, setNewEmergencyName] = useState('');
  const [newEmergencyRelation, setNewEmergencyRelation] = useState('');
  const [newEmergencyPhone, setNewEmergencyPhone] = useState('');

  const filteredData = personnel.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.badgeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.station.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStation = stationFilter === 'All Stations' || p.station.includes(stationFilter);
    const matchesRole = roleFilter === 'All Roles' || p.role === roleFilter;
    const matchesTeam = teamFilter === 'All Teams' || p.team === teamFilter;
    const matchesStatus = statusFilter === 'All Statuses' || p.status === statusFilter;
    return matchesSearch && matchesStation && matchesRole && matchesTeam && matchesStatus;
  });

  const handleCreatePersonnel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    addPersonnel({
      badgeId: `POLAR-IND-0${Math.floor(115 + Math.random() * 800)}`,
      name: newName,
      role: newRole,
      team: newTeam,
      station: newStation,
      expeditionName: newExpeditionName || undefined,
      nationality: newNationality,
      bloodGroup: newBloodGroup,
      medicalClearance: newMedicalClearance,
      winterOverExperience: Number(newWinterExperience) || 0,
      survivalCertExpiry: '2028-12-31',
      status: newStatus,
      email: newEmail,
      satPhone: newSatPhone || '+8816-3184-9999',
      emergencyContact: {
        name: newEmergencyName || 'Family Contact',
        relation: newEmergencyRelation || 'Spouse',
        phone: newEmergencyPhone || '+91-98765-00000'
      },
      vitalStatus: {
        heartRate: 72,
        bodyTemp: '36.8°C',
        lastChecked: 'Just now'
      }
    });

    // Reset and close
    setNewName('');
    setNewEmail('');
    setNewSatPhone('');
    setNewEmergencyName('');
    setNewEmergencyRelation('');
    setNewEmergencyPhone('');
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPersonnel) return;

    updatePersonnel(editingPersonnel.id, editingPersonnel);
    if (selectedPersonnel?.id === editingPersonnel.id) {
      setSelectedPersonnel(editingPersonnel);
    }
    setEditingPersonnel(null);
  };

  const columns: Column<Personnel>[] = [
    {
      key: 'badgeId',
      header: 'Badge ID',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-xs text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/20">
          {row.badgeId}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Name & Designation',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-cyan-500/30 flex items-center justify-center font-bold text-xs text-cyan-300 font-mono">
            {(row.name || 'Polar Officer').split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                {row.name || 'Unknown Operator'}
              </span>
              {(row as any)._isSeededDemo && (
                <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                  SEEDED DEMO
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
              <span>{row.role}</span>
              <span>•</span>
              <span className="text-cyan-300">{row.team || 'Science'}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'station',
      header: 'Station / Deployment',
      sortable: true,
      render: (row) => (
        <div className="text-xs font-mono">
          <div className="text-slate-200 font-semibold">{row.station}</div>
          {row.expeditionName && (
            <div className="text-cyan-400/80 truncate max-w-[180px]">{row.expeditionName}</div>
          )}
        </div>
      )
    },
    {
      key: 'medicalClearance',
      header: 'Medical Clearance',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-slate-950 text-emerald-400 border border-emerald-500/30">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>{(row.medicalClearance || 'Valid').split(' ')[0]}</span>
        </span>
      )
    },
    {
      key: 'status',
      header: 'Duty Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} size="sm" />
    },
    {
      key: 'vitals',
      header: 'Vitals (Simulated)',
      render: (row) => (
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <HeartPulse className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span>{row.vitalStatus.heartRate} BPM</span>
          <span className="text-slate-500">•</span>
          <span>{row.vitalStatus.bodyTemp}</span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setSelectedPersonnel(row)}
            className="p-1.5 rounded-lg text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/30 transition-colors"
            title="View Profile"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {canEditPersonnel && (
            <button
              type="button"
              onClick={() => setEditingPersonnel(row)}
              className="p-1.5 rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              title="Edit Personnel"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {canDeletePersonnel && (
            <button
              type="button"
              onClick={() => setDeletingId(row.id)}
              className="p-1.5 rounded-lg text-rose-400 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/30 transition-colors"
              title="Delete Record"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <PageHeader
        title="Polar Personnel & Crew Roster"
        subtitle="Medical clearance status, field vitals telemetry, and survival certifications"
        icon={Users}
        badge={`${personnel.length} ACTIVE PERSONNEL`}
      >
        {canCreatePersonnel && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-md shadow-cyan-950 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard Polar Personnel</span>
          </button>
        )}
      </PageHeader>

      {/* StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Personnel"
          value={personnel.filter((p) => p.status === 'Active' || p.status === 'In Field').length}
          subtitle="On active mission duty"
          icon={Users}
          variant="cyan"
        />
        <StatCard
          title="Available Standby"
          value={personnel.filter((p) => p.status === 'Available' || p.status === 'At Base Station').length}
          subtitle="Ready for sortie dispatch"
          icon={ShieldCheck}
          variant="blue"
        />
        <StatCard
          title="Winter-Over Veterans"
          value={personnel.filter((p) => p.winterOverExperience > 0).length}
          subtitle="Trained in polar darkness"
          icon={Award}
          variant="purple"
        />
        <StatCard
          title="Class-1 Unrestricted"
          value={personnel.filter((p) => p.medicalClearance.includes('Class-1')).length}
          subtitle="Extreme cold certified"
          icon={HeartPulse}
          variant="emerald"
        />
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name, role, badge ID or station..."
          className="flex-1 w-full"
        />
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <FilterDropdown
            value={teamFilter}
            options={['All Teams', 'Science', 'Operations', 'Logistics', 'Medical', 'Aviation', 'Engineering']}
            onChange={setTeamFilter}
            className="w-full sm:w-36"
          />
          <FilterDropdown
            value={stationFilter}
            options={['All Stations', ...stations.map((s) => s.name)]}
            onChange={setStationFilter}
            className="w-full sm:w-44"
          />
          <FilterDropdown
            value={statusFilter}
            options={[
              'All Statuses',
              'Active',
              'Available',
              'On Leave',
              'Emergency',
              'In Field',
              'At Base Station',
              'In Transit',
              'Medical Bay'
            ]}
            onChange={setStatusFilter}
            className="w-full sm:w-36"
          />
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredData}
        keyExtractor={(p) => p.id}
        onRowClick={(p) => setSelectedPersonnel(p)}
        pageSize={8}
      />

      {/* Personnel Profile Modal */}
      {selectedPersonnel && (
        <Modal
          isOpen={!!selectedPersonnel}
          onClose={() => setSelectedPersonnel(null)}
          title={selectedPersonnel.name}
          subtitle={`Badge: ${selectedPersonnel.badgeId} | ${selectedPersonnel.role}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Header info bar */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-400 flex items-center justify-center text-slate-950 font-black text-lg">
                  {(selectedPersonnel.name || 'PO').split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{selectedPersonnel.name}</h4>
                  <p className="text-xs text-cyan-400 font-mono">
                    {selectedPersonnel.role} • {selectedPersonnel.team || 'Science'} • {selectedPersonnel.nationality}
                  </p>
                </div>
              </div>
              <StatusBadge status={selectedPersonnel.status} size="md" />
            </div>

            {/* Vitals Telemetry Live Card */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/90 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span>Real-Time Biometric Sensor Telemetry</span>
                </span>
                <span className="text-slate-400">Checked: {selectedPersonnel.vitalStatus.lastChecked}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 font-mono">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">Heart Rate</span>
                  <span className="text-lg font-bold text-rose-400">{selectedPersonnel.vitalStatus.heartRate} BPM</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">Body Core Temp</span>
                  <span className="text-lg font-bold text-cyan-400">{selectedPersonnel.vitalStatus.bodyTemp}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">Blood Group</span>
                  <span className="text-lg font-bold text-white">{selectedPersonnel.bloodGroup}</span>
                </div>
              </div>
            </div>

            {/* Qualifications & Certification Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Medical Clearance</span>
                <span className="font-bold text-emerald-400">{selectedPersonnel.medicalClearance}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Winter-Over Experience</span>
                <span className="font-bold text-purple-300">{selectedPersonnel.winterOverExperience} Seasons Completed</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Survival Certification Expiry</span>
                <span className="font-bold text-white">{selectedPersonnel.survivalCertExpiry}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Assigned Station / Base</span>
                <span className="font-bold text-cyan-300">{selectedPersonnel.station}</span>
              </div>
            </div>

            {/* Contacts */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs font-mono">
              <span className="text-slate-300 font-bold block mb-1">Communication & Emergency Contacts</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{selectedPersonnel.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SatPhone: {selectedPersonnel.satPhone}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                Next-of-kin: <strong className="text-slate-200">{selectedPersonnel.emergencyContact.name}</strong> (
                {selectedPersonnel.emergencyContact.relation}) — {selectedPersonnel.emergencyContact.phone}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Personnel Modal */}
      {editingPersonnel && (
        <Modal
          isOpen={!!editingPersonnel}
          onClose={() => setEditingPersonnel(null)}
          title={`Edit Crew Profile: ${editingPersonnel.name}`}
          subtitle={`Badge ID: ${editingPersonnel.badgeId}`}
          maxWidth="2xl"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingPersonnel.name}
                  onChange={(e) => setEditingPersonnel({ ...editingPersonnel, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Role *</label>
                <select
                  value={editingPersonnel.role}
                  onChange={(e) =>
                    setEditingPersonnel({ ...editingPersonnel, role: e.target.value as PersonnelRole })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
                >
                  <option value="Chief Scientist">Chief Scientist</option>
                  <option value="Station Commander">Station Commander</option>
                  <option value="Glaciologist">Glaciologist</option>
                  <option value="Meteorologist">Meteorologist</option>
                  <option value="Medical Officer">Medical Officer</option>
                  <option value="Heavy Vehicle Mechanic">Heavy Vehicle Mechanic</option>
                  <option value="Comms & Radar Engineer">Comms & Radar Engineer</option>
                  <option value="Logistics Coordinator">Logistics Coordinator</option>
                  <option value="Polar Pilot">Polar Pilot</option>
                  <option value="Field Survival Guide">Field Survival Guide</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Department / Team *</label>
                <select
                  value={editingPersonnel.team || 'Science'}
                  onChange={(e) =>
                    setEditingPersonnel({ ...editingPersonnel, team: e.target.value as PersonnelTeam })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
                >
                  <option value="Science">Science</option>
                  <option value="Operations">Operations</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Medical">Medical</option>
                  <option value="Aviation">Aviation</option>
                  <option value="Engineering">Engineering</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Duty Status *</label>
                <select
                  value={editingPersonnel.status}
                  onChange={(e) =>
                    setEditingPersonnel({ ...editingPersonnel, status: e.target.value as PersonnelStatus })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
                >
                  <option value="Active">Active</option>
                  <option value="Available">Available</option>
                  <option value="In Field">In Field</option>
                  <option value="At Base Station">At Base Station</option>
                  <option value="In Transit">In Transit</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Medical Bay">Medical Bay</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Station *</label>
                <select
                  value={editingPersonnel.station}
                  onChange={(e) => setEditingPersonnel({ ...editingPersonnel, station: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
                >
                  {stations.map((st) => (
                    <option key={st.id} value={st.name}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Email *</label>
                <input
                  type="email"
                  value={editingPersonnel.email}
                  onChange={(e) => setEditingPersonnel({ ...editingPersonnel, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingPersonnel(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-md shadow-cyan-950 transition-all active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Onboard New Personnel Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Onboard Polar Expedition Personnel"
        subtitle="Register scientist, technician, pilot or medical officer to the station roster"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreatePersonnel} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Full Name *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Dr. Ramesh Kulkarni"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Polar Specialization Role *</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as PersonnelRole)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
              >
                <option value="Chief Scientist">Chief Scientist</option>
                <option value="Station Commander">Station Commander</option>
                <option value="Glaciologist">Glaciologist</option>
                <option value="Meteorologist">Meteorologist</option>
                <option value="Medical Officer">Medical Officer</option>
                <option value="Heavy Vehicle Mechanic">Heavy Vehicle Mechanic</option>
                <option value="Comms & Radar Engineer">Comms & Radar Engineer</option>
                <option value="Logistics Coordinator">Logistics Coordinator</option>
                <option value="Polar Pilot">Polar Pilot</option>
                <option value="Field Survival Guide">Field Survival Guide</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Department / Team *</label>
              <select
                value={newTeam}
                onChange={(e) => setNewTeam(e.target.value as PersonnelTeam)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
              >
                <option value="Science">Science</option>
                <option value="Operations">Operations</option>
                <option value="Logistics">Logistics</option>
                <option value="Medical">Medical</option>
                <option value="Aviation">Aviation</option>
                <option value="Engineering">Engineering</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Deploy Station *</label>
              <select
                value={newStation}
                onChange={(e) => setNewStation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
              >
                {stations.map((st) => (
                  <option key={st.id} value={st.name}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Initial Duty Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as PersonnelStatus)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
              >
                <option value="Active">Active</option>
                <option value="Available">Available</option>
                <option value="In Field">In Field</option>
                <option value="At Base Station">At Base Station</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Blood Group *</label>
              <select
                value={newBloodGroup}
                onChange={(e) => setNewBloodGroup(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
              >
                <option value="O+ Positive">O+ Positive</option>
                <option value="O- Negative">O- Negative</option>
                <option value="A+ Positive">A+ Positive</option>
                <option value="A- Negative">A- Negative</option>
                <option value="B+ Positive">B+ Positive</option>
                <option value="B- Negative">B- Negative</option>
                <option value="AB+ Positive">AB+ Positive</option>
                <option value="AB- Negative">AB- Negative</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Official Email *</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="r.kulkarni@ncpor.res.in"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Satellite Phone Number</label>
              <input
                type="text"
                value={newSatPhone}
                onChange={(e) => setNewSatPhone(e.target.value)}
                placeholder="+8816-3184-9099"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-md shadow-cyan-950 transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enroll In Polar Registry</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <ConfirmationDialog
          isOpen={!!deletingId}
          onClose={() => setDeletingId(null)}
          onConfirm={() => {
            deletePersonnel(deletingId);
            if (selectedPersonnel?.id === deletingId) setSelectedPersonnel(null);
            setDeletingId(null);
          }}
          title="Discharge / Remove Personnel Record"
          message="Are you sure you want to remove this personnel record from the active polar roster?"
          confirmLabel="Yes, Remove Personnel"
          type="danger"
        />
      )}
    </div>
  );
};
