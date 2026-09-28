import React, { useState } from 'react';
import { usePolar, useAuth } from '../context';
import { canCreate, canEdit, canDelete } from '../utils/permissions';
import { PolarAsset, AssetCategory, AssetOperationalStatus } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { SearchBar } from '../components/common/SearchBar';
import { FilterDropdown } from '../components/common/FilterDropdown';
import { Modal } from '../components/common/Modal';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import {
  Wrench,
  Truck,
  Plane,
  Zap,
  Radio,
  Eye,
  ThermometerSnowflake,
  AlertTriangle,
  Activity,
  Plus,
  Edit2,
  Trash2,
  Save,
  Send
} from 'lucide-react';

export const AssetsPage: React.FC = () => {
  const { assets, addAsset, updateAsset, deleteAsset, updateAssetStatus, stations } = usePolar();
  const { userProfile } = useAuth();

  const canCreateAssets = canCreate(userProfile, 'assets');
  const canEditAssets = canEdit(userProfile, 'assets');
  const canDeleteAssets = canDelete(userProfile, 'assets');

  const [searchQuery, setSearchQuery] = useState('');
  const [stationFilter, setStationFilter] = useState('All Stations');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  // Modals
  const [selectedAsset, setSelectedAsset] = useState<PolarAsset | null>(null);
  const [editingAsset, setEditingAsset] = useState<PolarAsset | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isNewAssetModalOpen, setIsNewAssetModalOpen] = useState(false);

  // New Asset Form
  const [newName, setNewName] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newCategory, setNewCategory] = useState<AssetCategory>('Overland Vehicles');
  const [newModel, setNewModel] = useState('');
  const [newStation, setNewStation] = useState(stations[0]?.name || 'Maitri Research Base');
  const [newStatus] = useState<AssetOperationalStatus>('Operational');
  const [newHealthScore] = useState<number>(95);
  const [newFuelLevel] = useState<number>(85);
  const [newOperatingHours] = useState<number>(1200);
  const [newSubZeroRating, setNewSubZeroRating] = useState('-55°C');
  const [newLastServiceDate] = useState('2026-09-01');
  const [newNextServiceDue] = useState('2026-11-01');

  // Check if asset maintenance is overdue or due soon
  const isMaintenanceDue = (asset: PolarAsset): boolean => {
    if (!asset.nextServiceDue) return false;
    if (asset.nextServiceDue.toLowerCase().includes('overdue')) return true;
    const dueTime = new Date((asset.nextServiceDue || '').split(' ')[0]).getTime();
    if (isNaN(dueTime)) return false;
    const now = new Date().getTime();
    return dueTime <= now + 14 * 24 * 60 * 60 * 1000; // Due within 14 days
  };

  const filteredData = assets.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.currentStation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStation = stationFilter === 'All Stations' || item.currentStation.includes(stationFilter);
    const matchesCategory = categoryFilter === 'All Categories' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'All Statuses' || item.status === statusFilter;
    const matchesOverdue = !onlyOverdue || isMaintenanceDue(item);
    return matchesSearch && matchesStation && matchesCategory && matchesStatus && matchesOverdue;
  });

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    addAsset({
      assetTag: newTag || `PLX-AST-0${Math.floor(10 + Math.random() * 90)}`,
      name: newName,
      category: newCategory,
      model: newModel || 'Polar Standard Spec Mark II',
      currentStation: newStation,
      status: newStatus,
      healthScore: Number(newHealthScore) || 90,
      fuelLevelPercent: Number(newFuelLevel) || 80,
      operatingHours: Number(newOperatingHours) || 0,
      subZeroRating: newSubZeroRating,
      lastServiceDate: newLastServiceDate,
      nextServiceDue: newNextServiceDue,
      telemetry: {
        engineTemp: 'Optimal Standby',
        batteryHealth: '98%',
        gpsLock: true,
        lastPing: 'Just now'
      }
    });

    // Reset and close
    setNewName('');
    setNewTag('');
    setNewModel('');
    setIsNewAssetModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;

    updateAsset(editingAsset.id, editingAsset);
    if (selectedAsset?.id === editingAsset.id) {
      setSelectedAsset(editingAsset);
    }
    setEditingAsset(null);
  };

  const getCategoryIcon = (category: AssetCategory) => {
    switch (category) {
      case 'Overland Vehicles':
        return <Truck className="w-4 h-4 text-cyan-400" />;
      case 'Aviation':
        return <Plane className="w-4 h-4 text-sky-400" />;
      case 'Power & Heating Generators':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'Satellite Communications':
        return <Radio className="w-4 h-4 text-emerald-400" />;
      default:
        return <Wrench className="w-4 h-4 text-purple-400" />;
    }
  };

  const avgHealth = Math.round(assets.reduce((sum, a) => sum + (a.healthScore || 0), 0) / (assets.length || 1));
  const maintenanceDueCount = assets.filter((a) => isMaintenanceDue(a) || a.healthScore < 70).length;
  const inFieldCount = assets.filter((a) => a.status === 'In Field Use' || a.status === 'In Use').length;

  const columns: Column<PolarAsset>[] = [
    {
      key: 'assetTag',
      header: 'Asset Tag',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-xs text-cyan-400 bg-cyan-950/80 px-2 py-1 rounded border border-cyan-500/20">
          {row.assetTag}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Asset Equipment & Model',
      sortable: true,
      render: (row) => (
        <div className="max-w-md">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white group-hover:text-cyan-300 transition-colors">
              {row.name}
            </span>
            {(row as any)._isSeededDemo && (
              <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                SEEDED DEMO
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
            <span>{row.model}</span>
            <span>•</span>
            <span className="text-cyan-300">{row.currentStation}</span>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
          {getCategoryIcon(row.category)}
          <span className="truncate max-w-[150px]">{row.category}</span>
        </div>
      )
    },
    {
      key: 'healthScore',
      header: 'Health Score',
      sortable: true,
      render: (row) => (
        <div className="w-24 space-y-1">
          <div className="flex justify-between text-xs font-mono font-bold">
            <span className={row.healthScore < 70 ? 'text-rose-400' : 'text-emerald-400'}>
              {row.healthScore}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                row.healthScore < 70 ? 'bg-rose-500' : row.healthScore < 85 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${row.healthScore}%` }}
            />
          </div>
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
      key: 'nextServiceDue',
      header: 'Service Schedule',
      sortable: true,
      render: (row) => (
        <div className="text-xs font-mono">
          <div className={isMaintenanceDue(row) ? 'text-amber-400 font-bold' : 'text-slate-300'}>
            {row.nextServiceDue}
          </div>
          <div className="text-slate-500 text-[10px]">Last: {row.lastServiceDate}</div>
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
            onClick={() => setSelectedAsset(row)}
            className="p-1.5 rounded-lg text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/30 transition-colors"
            title="View Diagnostics Telemetry"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {canEditAssets && (
            <button
              type="button"
              onClick={() => setEditingAsset(row)}
              className="p-1.5 rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              title="Edit Asset"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {canDeleteAssets && (
            <button
              type="button"
              onClick={() => setDeletingId(row.id)}
              className="p-1.5 rounded-lg text-rose-400 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/30 transition-colors"
              title="Delete Asset"
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
        title="Heavy Machinery, Fleet & Base Assets"
        subtitle="Real-time telemetry, engine health diagnostics, and sub-zero operating readiness"
        icon={Wrench}
        badge={`${assets.length} ASSETS REGISTERED`}
      >
        {canCreateAssets && (
          <button
            type="button"
            onClick={() => setIsNewAssetModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-md shadow-cyan-950 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Machinery</span>
          </button>
        )}
      </PageHeader>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Fleet Health Composite"
          value={`${avgHealth}%`}
          subtitle="Diagnostics readiness index"
          icon={Activity}
          variant="emerald"
        />
        <StatCard
          title="In Field Operations"
          value={inFieldCount}
          subtitle="Actively traversing terrain"
          icon={Truck}
          variant="cyan"
        />
        <StatCard
          title="Maintenance Attention"
          value={maintenanceDueCount}
          subtitle="Overdue or checkup required"
          icon={AlertTriangle}
          variant="amber"
        />
        <StatCard
          title="Sub-Zero -55°C Certified"
          value="100%"
          subtitle="Polar winter standard"
          icon={ThermometerSnowflake}
          variant="blue"
        />
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by tag, model, machinery name, station..."
          className="flex-1 w-full"
        />
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <FilterDropdown
            value={stationFilter}
            options={['All Stations', ...stations.map((s) => s.name)]}
            onChange={setStationFilter}
            className="w-full sm:w-44"
          />
          <FilterDropdown
            value={categoryFilter}
            options={[
              'All Categories',
              'Overland Vehicles',
              'Aviation',
              'Power & Heating Generators',
              'Satellite Communications',
              'Deep Ice Drill Rigs',
              'Habitation Modules'
            ]}
            onChange={setCategoryFilter}
            className="w-full sm:w-48"
          />
          <FilterDropdown
            value={statusFilter}
            options={[
              'All Statuses',
              'Operational',
              'In Field Use',
              'Maintenance Required',
              'Available',
              'In Use',
              'Under Maintenance',
              'Unavailable',
              'De-iced / Standby',
              'Severe Breakdown'
            ]}
            onChange={setStatusFilter}
            className="w-full sm:w-40"
          />

          <button
            type="button"
            onClick={() => setOnlyOverdue(!onlyOverdue)}
            className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all border ${
              onlyOverdue
                ? 'bg-amber-950 text-amber-300 border-amber-500/50 shadow'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            🔧 Maintenance Due
          </button>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredData}
        keyExtractor={(item) => item.id}
        onRowClick={(item) => setSelectedAsset(item)}
        pageSize={8}
      />

      {/* Asset Telemetry Inspection Modal */}
      {selectedAsset && (
        <Modal
          isOpen={!!selectedAsset}
          onClose={() => setSelectedAsset(null)}
          title={selectedAsset.name}
          subtitle={`Tag: ${selectedAsset.assetTag} | Model: ${selectedAsset.model}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Status change bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Operational Status:</span>
                <StatusBadge status={selectedAsset.status} />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Update Status:</span>
                <select
                  value={selectedAsset.status}
                  onChange={(e) => {
                    const newSt = e.target.value as AssetOperationalStatus;
                    updateAssetStatus(selectedAsset.id, newSt);
                    setSelectedAsset({ ...selectedAsset, status: newSt });
                  }}
                  className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-cyan-300 font-semibold focus:outline-none"
                >
                  <option value="Operational">Operational</option>
                  <option value="In Field Use">In Field Use</option>
                  <option value="Available">Available</option>
                  <option value="In Use">In Use</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Maintenance Required">Maintenance Required</option>
                  <option value="De-iced / Standby">De-iced / Standby</option>
                  <option value="Severe Breakdown">Severe Breakdown</option>
                </select>
              </div>
            </div>

            {/* Live Telemetry Sensor Card */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>Sub-Zero IoT Telemetry & Diagnostics</span>
                </span>
                <span className="text-slate-400">Ping: {selectedAsset.telemetry.lastPing}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Health Rating</span>
                  <span
                    className={`text-base font-bold ${
                      selectedAsset.healthScore < 70 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {selectedAsset.healthScore}/100
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Engine Core Temp</span>
                  <span className="text-base font-bold text-cyan-400">{selectedAsset.telemetry.engineTemp}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Battery System</span>
                  <span className="text-base font-bold text-purple-300">{selectedAsset.telemetry.batteryHealth}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">GPS Iridium Lock</span>
                  <span className="text-base font-bold text-emerald-400">
                    {selectedAsset.telemetry.gpsLock ? '3D FIX' : 'NO FIX'}
                  </span>
                </div>
              </div>
            </div>

            {/* Operating specs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Assigned Station</span>
                <span className="font-bold text-white">{selectedAsset.currentStation}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Operating Hours</span>
                <span className="font-bold text-white">{selectedAsset.operatingHours.toLocaleString()} Hours</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Extreme Cold Rating</span>
                <span className="font-bold text-cyan-400">{selectedAsset.subZeroRating}</span>
              </div>
              {selectedAsset.fuelLevelPercent !== undefined && (
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Fuel Level</span>
                  <span className="font-bold text-emerald-400">{selectedAsset.fuelLevelPercent}% Tank Capacity</span>
                </div>
              )}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Last Maintained</span>
                <span className="font-bold text-slate-300">{selectedAsset.lastServiceDate}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Next Service Due</span>
                <span
                  className={`font-bold ${
                    isMaintenanceDue(selectedAsset) ? 'text-rose-400' : 'text-slate-300'
                  }`}
                >
                  {selectedAsset.nextServiceDue}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Asset Modal */}
      {editingAsset && (
        <Modal
          isOpen={!!editingAsset}
          onClose={() => setEditingAsset(null)}
          title={`Edit Asset Equipment: ${editingAsset.assetTag}`}
          subtitle="Modify operating station, health rating, and service schedules"
          maxWidth="2xl"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Asset Name *</label>
                <input
                  type="text"
                  required
                  value={editingAsset.name}
                  onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Model</label>
                <input
                  type="text"
                  value={editingAsset.model}
                  onChange={(e) => setEditingAsset({ ...editingAsset, model: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Station *</label>
                <select
                  value={editingAsset.currentStation}
                  onChange={(e) => setEditingAsset({ ...editingAsset, currentStation: e.target.value })}
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
                <label className="text-xs font-mono font-semibold text-slate-300">Operational Status *</label>
                <select
                  value={editingAsset.status}
                  onChange={(e) =>
                    setEditingAsset({ ...editingAsset, status: e.target.value as AssetOperationalStatus })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
                >
                  <option value="Operational">Operational</option>
                  <option value="In Field Use">In Field Use</option>
                  <option value="Available">Available</option>
                  <option value="In Use">In Use</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Maintenance Required">Maintenance Required</option>
                  <option value="De-iced / Standby">De-iced / Standby</option>
                  <option value="Severe Breakdown">Severe Breakdown</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Health Score (0-100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editingAsset.healthScore}
                  onChange={(e) => setEditingAsset({ ...editingAsset, healthScore: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Next Service Due Date</label>
                <input
                  type="text"
                  value={editingAsset.nextServiceDue}
                  onChange={(e) => setEditingAsset({ ...editingAsset, nextServiceDue: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingAsset(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-md shadow-cyan-950 transition-all active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Asset</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* New Asset Modal */}
      <Modal
        isOpen={isNewAssetModalOpen}
        onClose={() => setIsNewAssetModalOpen(false)}
        title="Register New Polar Asset / Machinery"
        subtitle="Catalog heavy tracked vehicles, aviation ski-planes, generators, or radar dishes"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateAsset} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Equipment Name *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Polaris Titan Heavy Snowmobile #12"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Asset Tag</label>
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="e.g. PLX-VEH-12"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Category *</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as AssetCategory)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
              >
                <option value="Overland Vehicles">Overland Vehicles</option>
                <option value="Aviation">Aviation</option>
                <option value="Power & Heating Generators">Power & Heating Generators</option>
                <option value="Satellite Communications">Satellite Communications</option>
                <option value="Deep Ice Drill Rigs">Deep Ice Drill Rigs</option>
                <option value="Habitation Modules">Habitation Modules</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Station *</label>
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
              <label className="text-xs font-mono font-semibold text-slate-300">Model Specification</label>
              <input
                type="text"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="e.g. Polaris Titan 800 Arctic"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Sub-Zero Rating</label>
              <input
                type="text"
                value={newSubZeroRating}
                onChange={(e) => setNewSubZeroRating(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewAssetModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-md shadow-cyan-950 transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Catalog Machinery</span>
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
            deleteAsset(deletingId);
            if (selectedAsset?.id === deletingId) setSelectedAsset(null);
            setDeletingId(null);
          }}
          title="Decommission / Delete Asset"
          message="Are you sure you want to remove this equipment from the active fleet registry?"
          confirmLabel="Yes, Delete Asset"
          type="danger"
        />
      )}
    </div>
  );
};
