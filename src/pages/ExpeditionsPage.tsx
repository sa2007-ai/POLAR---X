import React, { useState } from 'react';
import { usePolar, useAuth } from '../context';
import { canCreate, canEdit, canDelete } from '../utils/permissions';
import { Expedition, ExpeditionStatus, ExpeditionType, ExpeditionPriority } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { SearchBar } from '../components/common/SearchBar';
import { FilterDropdown } from '../components/common/FilterDropdown';
import { Modal } from '../components/common/Modal';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import {
  Compass,
  Plus,
  Eye,
  Calendar,
  DollarSign,
  CheckSquare,
  Truck,
  ThermometerSnowflake,
  Edit2,
  Trash2,
  Save,
  Send
} from 'lucide-react';

export const ExpeditionsPage: React.FC = () => {
  const { expeditions, addExpedition, updateExpedition, deleteExpedition, updateExpeditionStatus, stations } = usePolar();
  const { userProfile } = useAuth();

  const canCreateExpedition = canCreate(userProfile, 'expeditions');
  const canEditExpedition = canEdit(userProfile, 'expeditions');
  const canDeleteExpedition = canDelete(userProfile, 'expeditions');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [stationFilter, setStationFilter] = useState('All Stations');
  const [typeFilter, setTypeFilter] = useState('All Types');

  // Modals
  const [selectedExpedition, setSelectedExpedition] = useState<Expedition | null>(null);
  const [editingExpedition, setEditingExpedition] = useState<Expedition | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New Expedition Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<ExpeditionType>('Glaciology & Ice Core');
  const [newLeader, setNewLeader] = useState('');
  const [newStation, setNewStation] = useState(stations[0]?.name || 'Maitri Research Base');
  const [newRegion, setNewRegion] = useState('');
  const [newStartDate] = useState('');
  const [newEndDate] = useState('');
  const [newStatus, setNewStatus] = useState<ExpeditionStatus>('Planning');
  const [newPriority] = useState<ExpeditionPriority>('Normal');
  const [newPersonnelCount, setNewPersonnelCount] = useState<number>(10);
  const [newVehiclesText, setNewVehiclesText] = useState('');
  const [newBudget] = useState<number>(25000000);
  const [newObjectivesText, setNewObjectivesText] = useState('');

  // Filtering
  const filteredData = expeditions.filter((exp) => {
    const matchesSearch =
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.leader.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.station.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All Statuses' || exp.status === statusFilter;
    const matchesStation = stationFilter === 'All Stations' || exp.station.includes(stationFilter);
    const matchesType = typeFilter === 'All Types' || exp.type === typeFilter;
    return matchesSearch && matchesStatus && matchesStation && matchesType;
  });

  const handleCreateExpedition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newLeader.trim()) return;

    const vehicles = newVehiclesText
      ? newVehiclesText.split(',').map((v) => v.trim()).filter(Boolean)
      : ['Hagglunds Bv206 #01', 'Polaris Snowmobile #03'];

    const objectives = newObjectivesText
      ? newObjectivesText.split('\n').map((o) => o.trim()).filter(Boolean)
      : ['Deploy autonomous glaciology sensor array', 'Extract 200m ice core'];

    addExpedition({
      code: newCode || `IND-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`,
      title: newTitle,
      type: newType,
      leader: newLeader,
      leaderId: `pers-${Date.now()}`,
      station: newStation,
      region: newRegion || 'East Antarctic Polar Plateau',
      startDate: newStartDate || '2026-11-01',
      endDate: newEndDate || '2027-03-31',
      status: newStatus,
      priority: newPriority,
      personnelCount: Number(newPersonnelCount) || 8,
      assignedVehicles: vehicles,
      progressPercent: newStatus === 'Active' ? 30 : newStatus === 'Completed' ? 100 : 0,
      budgetAllocated: Number(newBudget) || 20000000,
      budgetUsed: 0,
      coordinates: {
        lat: -70.767,
        lng: 11.733,
        altitude: '150 m'
      },
      objectives
    });

    // Reset and close
    setNewTitle('');
    setNewCode('');
    setNewLeader('');
    setNewRegion('');
    setNewVehiclesText('');
    setNewObjectivesText('');
    setIsNewModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpedition) return;

    updateExpedition(editingExpedition.id, editingExpedition);
    if (selectedExpedition?.id === editingExpedition.id) {
      setSelectedExpedition(editingExpedition);
    }
    setEditingExpedition(null);
  };

  const columns: Column<Expedition>[] = [
    {
      key: 'code',
      header: 'Code / Identifier',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-1 rounded text-xs border border-cyan-500/20">
          {row.code}
        </span>
      )
    },
    {
      key: 'title',
      header: 'Expedition Mission Title',
      sortable: true,
      render: (row) => (
        <div className="max-w-md">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white group-hover:text-cyan-300 transition-colors">
              {row.title}
            </span>
            {(row as any)._isSeededDemo && (
              <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                SEEDED DEMO
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
            <span>{row.type}</span>
            <span>•</span>
            <span className="text-slate-300">{row.station}</span>
          </div>
        </div>
      )
    },
    {
      key: 'leader',
      header: 'Mission Lead',
      sortable: true,
      render: (row) => (
        <div className="text-xs font-mono">
          <div className="font-semibold text-slate-200">{row.leader}</div>
          <div className="text-slate-400">{row.personnelCount} Crew Members</div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} size="sm" />
    },
    {
      key: 'progressPercent',
      header: 'Progress',
      sortable: true,
      render: (row) => (
        <div className="w-28 space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Phase</span>
            <span className="font-bold text-cyan-400">{row.progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 rounded-full"
              style={{ width: `${row.progressPercent}%` }}
            />
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setSelectedExpedition(row)}
            className="p-1.5 rounded-lg text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/30 transition-colors"
            title="Inspect Expedition"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {canEditExpedition && (
            <button
              type="button"
              onClick={() => setEditingExpedition(row)}
              className="p-1.5 rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              title="Edit Expedition"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {canDeleteExpedition && (
            <button
              type="button"
              onClick={() => setDeletingId(row.id)}
              className="p-1.5 rounded-lg text-rose-400 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/30 transition-colors"
              title="Delete Expedition"
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
        title="Expedition & Field Mission Registry"
        subtitle="Logistical coordination, sortie scheduling, and lifecycle tracking"
        icon={Compass}
        badge={`${expeditions.length} REGISTERED MISSIONS`}
      >
        {canCreateExpedition && (
          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-md shadow-cyan-950 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Stage New Expedition</span>
          </button>
        )}
      </PageHeader>

      {/* Summary StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Sorties"
          value={expeditions.filter((e) => e.status === 'Active').length}
          subtitle="Deployments in field"
          icon={Compass}
          variant="cyan"
        />
        <StatCard
          title="Scheduled / Planning"
          value={expeditions.filter((e) => e.status === 'Planning' || e.status === 'Scheduled').length}
          subtitle="Staging next sorties"
          icon={Calendar}
          variant="blue"
        />
        <StatCard
          title="Completed Missions"
          value={expeditions.filter((e) => e.status === 'Completed').length}
          subtitle="Data collected & logged"
          icon={CheckSquare}
          variant="emerald"
        />
        <StatCard
          title="Total Budget Allocated"
          value={`₹${(expeditions.reduce((acc, e) => acc + (e.budgetAllocated || 0), 0) / 10000000).toFixed(1)} Cr`}
          subtitle="Total Polar Operations Fund"
          icon={DollarSign}
          variant="purple"
        />
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by mission name, leader, code or station..."
          className="flex-1 w-full"
        />
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <FilterDropdown
            value={statusFilter}
            options={[
              'All Statuses',
              'Planning',
              'Scheduled',
              'Active',
              'Completed',
              'Cancelled'
            ]}
            onChange={setStatusFilter}
            className="w-full sm:w-40"
          />
          <FilterDropdown
            value={stationFilter}
            options={['All Stations', ...stations.map((s) => s.name)]}
            onChange={setStationFilter}
            className="w-full sm:w-44"
          />
          <FilterDropdown
            value={typeFilter}
            options={[
              'All Types',
              'Glaciology & Ice Core',
              'Atmospheric Physics',
              'Marine Biology',
              'Geological Survey',
              'Logistics Resupply',
              'Search & Rescue'
            ]}
            onChange={setTypeFilter}
            className="w-full sm:w-48"
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        keyExtractor={(item) => item.id}
        onRowClick={(item) => setSelectedExpedition(item)}
        pageSize={8}
      />

      {/* Detailed Inspection Modal */}
      {selectedExpedition && (
        <Modal
          isOpen={!!selectedExpedition}
          onClose={() => setSelectedExpedition(null)}
          title={selectedExpedition.title}
          subtitle={`Mission Code: ${selectedExpedition.code} | Station: ${selectedExpedition.station}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Status update bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Current Status:</span>
                <StatusBadge status={selectedExpedition.status} />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Quick Status Shift:</span>
                <select
                  value={selectedExpedition.status}
                  onChange={(e) => {
                    const newSt = e.target.value as ExpeditionStatus;
                    updateExpeditionStatus(selectedExpedition.id, newSt);
                    setSelectedExpedition({ ...selectedExpedition, status: newSt });
                  }}
                  className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-cyan-300 font-semibold focus:outline-none"
                >
                  <option value="Planning">Planning</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Weather Alert if any */}
            {selectedExpedition.weatherAlert && (
              <div className="p-3 bg-amber-950/50 border border-amber-500/30 rounded-xl flex items-center gap-2.5 text-xs text-amber-300 font-mono">
                <ThermometerSnowflake className="w-4 h-4 flex-shrink-0" />
                <span>{selectedExpedition.weatherAlert}</span>
              </div>
            )}

            {/* Key Mission Attributes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Expedition Type</span>
                <span className="font-bold text-white">{selectedExpedition.type}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Mission Lead</span>
                <span className="font-bold text-cyan-400">{selectedExpedition.leader}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Crew Size</span>
                <span className="font-bold text-white">{selectedExpedition.personnelCount} Personnel</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Deployment Duration</span>
                <span className="font-bold text-white">
                  {selectedExpedition.startDate} → {selectedExpedition.endDate}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Coordinates / Region</span>
                <span className="font-bold text-slate-200">
                  {selectedExpedition.region} ({selectedExpedition.coordinates.altitude})
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Budget Allocated</span>
                <span className="font-bold text-emerald-400">
                  ₹{(selectedExpedition.budgetAllocated / 100000).toFixed(0)} Lakhs
                </span>
              </div>
            </div>

            {/* Objectives */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-cyan-400" />
                <span>Primary Scientific & Logistics Objectives</span>
              </h4>
              <div className="space-y-1.5">
                {selectedExpedition.objectives.map((obj, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs text-slate-300 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80"
                  >
                    <span className="text-cyan-400 font-mono font-bold">{i + 1}.</span>
                    <span>{obj}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assigned Vehicles */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-sky-400" />
                <span>Assigned Heavy Vehicles & Aviation Assets</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedExpedition.assignedVehicles.map((veh, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 text-xs font-mono text-cyan-300 border border-cyan-500/20"
                  >
                    {veh}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Expedition Modal */}
      {editingExpedition && (
        <Modal
          isOpen={!!editingExpedition}
          onClose={() => setEditingExpedition(null)}
          title={`Edit Expedition: ${editingExpedition.code}`}
          subtitle="Modify mission parameters, timeline, and resource allocation"
          maxWidth="2xl"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Expedition Title *</label>
                <input
                  type="text"
                  required
                  value={editingExpedition.title}
                  onChange={(e) => setEditingExpedition({ ...editingExpedition, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Mission Status *</label>
                <select
                  value={editingExpedition.status}
                  onChange={(e) =>
                    setEditingExpedition({ ...editingExpedition, status: e.target.value as ExpeditionStatus })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
                >
                  <option value="Planning">Planning</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Mission Lead *</label>
                <input
                  type="text"
                  required
                  value={editingExpedition.leader}
                  onChange={(e) => setEditingExpedition({ ...editingExpedition, leader: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Base Research Station *</label>
                <select
                  value={editingExpedition.station}
                  onChange={(e) => setEditingExpedition({ ...editingExpedition, station: e.target.value })}
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
                <label className="text-xs font-mono font-semibold text-slate-300">Crew Size (Personnel)</label>
                <input
                  type="number"
                  value={editingExpedition.personnelCount}
                  onChange={(e) =>
                    setEditingExpedition({ ...editingExpedition, personnelCount: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Progress Percentage (0-100%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editingExpedition.progressPercent}
                  onChange={(e) =>
                    setEditingExpedition({ ...editingExpedition, progressPercent: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingExpedition(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-md shadow-cyan-950 transition-all active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* New Expedition Registration Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Stage New Polar Expedition"
        subtitle="Create a new scientific sortie, traverse, or base resupply mission"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateExpedition} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Expedition Title *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Queen Maud Land Subglacial Lake Drilling"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Mission Code</label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="e.g. IND-45-QML"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Expedition Type *</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as ExpeditionType)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
              >
                <option value="Glaciology & Ice Core">Glaciology & Ice Core</option>
                <option value="Atmospheric Physics">Atmospheric Physics</option>
                <option value="Marine Biology">Marine Biology</option>
                <option value="Geological Survey">Geological Survey</option>
                <option value="Logistics Resupply">Logistics Resupply</option>
                <option value="Search & Rescue">Search & Rescue</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Base Research Station *</label>
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
              <label className="text-xs font-mono font-semibold text-slate-300">Mission Lead Scientist / Commander *</label>
              <input
                type="text"
                required
                value={newLeader}
                onChange={(e) => setNewLeader(e.target.value)}
                placeholder="e.g. Dr. Harish Chandra"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Initial Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ExpeditionStatus)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
              >
                <option value="Planning">Planning</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Active">Active</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Target Polar Region</label>
              <input
                type="text"
                value={newRegion}
                onChange={(e) => setNewRegion(e.target.value)}
                placeholder="e.g. Princess Astrid Coast"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Personnel Count</label>
              <input
                type="number"
                min={1}
                max={50}
                value={newPersonnelCount}
                onChange={(e) => setNewPersonnelCount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold text-slate-300">Assigned Vehicles (comma separated)</label>
            <input
              type="text"
              value={newVehiclesText}
              onChange={(e) => setNewVehiclesText(e.target.value)}
              placeholder="e.g. Hagglunds Bv206 #03, Polaris Titan Snowmobile #05"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold text-slate-300">Scientific Objectives (one per line)</label>
            <textarea
              rows={3}
              value={newObjectivesText}
              onChange={(e) => setNewObjectivesText(e.target.value)}
              placeholder="1. Extract 200m ice core samples&#10;2. Calibrate ground radar stations"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-md shadow-cyan-950 transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit & Staging</span>
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
            deleteExpedition(deletingId);
            if (selectedExpedition?.id === deletingId) setSelectedExpedition(null);
            setDeletingId(null);
          }}
          title="Delete Expedition"
          message="Are you sure you want to remove this expedition from the polar registry? This action will archive all associated telemetry logs."
          confirmLabel="Yes, Delete Expedition"
          type="danger"
        />
      )}
    </div>
  );
};
