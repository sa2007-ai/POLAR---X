import React, { useState } from 'react';
import { usePolar, useAuth } from '../context';
import { canCreate, canEdit, canDelete } from '../utils/permissions';
import { CargoItem, CargoStatus, TransportMode } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { SearchBar } from '../components/common/SearchBar';
import { FilterDropdown } from '../components/common/FilterDropdown';
import { Modal } from '../components/common/Modal';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import {
  Boxes,
  Plus,
  Ship,
  Plane,
  Truck,
  Eye,
  ThermometerSnowflake,
  AlertTriangle,
  Weight,
  Send,
  CheckCircle,
  Clock,
  Edit2,
  Trash2,
  Save,
  PackageCheck
} from 'lucide-react';

export const CargoPage: React.FC = () => {
  const { cargo, addCargo, updateCargo, deleteCargo, updateCargoStatus, stations } = usePolar();
  const { userProfile } = useAuth();

  const canCreateCargo = canCreate(userProfile, 'cargo');
  const canEditCargo = canEdit(userProfile, 'cargo');
  const canDeleteCargo = canDelete(userProfile, 'cargo');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [modeFilter, setModeFilter] = useState('All Modes');

  // Modals
  const [selectedCargo, setSelectedCargo] = useState<CargoItem | null>(null);
  const [editingCargo, setEditingCargo] = useState<CargoItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isNewCargoModalOpen, setIsNewCargoModalOpen] = useState(false);

  // New Cargo Form
  const [newTitle, setNewTitle] = useState('');
  const [newTracking, setNewTracking] = useState('');
  const [newCategory, setNewCategory] = useState<CargoItem['category']>('Scientific Equipment');
  const [newOrigin] = useState('Cape Town Port, South Africa');
  const [newDestination, setNewDestination] = useState(stations[0]?.name || 'Maitri Research Base');
  const [newTransportMode, setNewTransportMode] = useState<TransportMode>('Icebreaker Ship (MV Golovnin)');
  const [newWeight, setNewWeight] = useState<number>(1200);
  const [newVolume] = useState<number>(4.5);
  const [newCarrier, setNewCarrier] = useState('Indian Antarctic Logistic Vessel');
  const [newEta, setNewEta] = useState('');
  const [newStatus] = useState<CargoStatus>('In Transit');
  const [newPriority] = useState<CargoItem['priority']>('High Priority');
  const [newHazardous, setNewHazardous] = useState(false);
  const [newTempControlled, setNewTempControlled] = useState(false);
  const [newTempReq] = useState('-20°C Cryo-Pack');
  const [newManifestText, setNewManifestText] = useState('');

  const filteredData = cargo.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.destinationStation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.carrier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All Statuses' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'All Categories' || item.category === categoryFilter;
    const matchesMode = modeFilter === 'All Modes' || item.transportMode.includes(modeFilter);
    return matchesSearch && matchesStatus && matchesCategory && matchesMode;
  });

  const handleCreateCargo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const manifest = newManifestText
      ? newManifestText.split('\n').map((m) => m.trim()).filter(Boolean)
      : ['1x Staged polar pallet'];

    addCargo({
      trackingNumber:
        newTracking || `PLX-CON-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      title: newTitle,
      category: newCategory,
      origin: newOrigin,
      destinationStation: newDestination,
      transportMode: newTransportMode,
      weightKg: Number(newWeight) || 500,
      volumeM3: Number(newVolume) || 1.5,
      hazardousMaterial: newHazardous,
      temperatureControlled: newTempControlled,
      tempRequirement: newTempControlled ? newTempReq : undefined,
      status: newStatus,
      eta: newEta || '2026-11-15',
      departureDate: new Date().toISOString().slice(0, 10),
      carrier: newCarrier,
      priority: newPriority,
      manifestDetails: manifest
    });

    // Reset and close
    setNewTitle('');
    setNewTracking('');
    setNewManifestText('');
    setIsNewCargoModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCargo) return;

    updateCargo(editingCargo.id, editingCargo);
    if (selectedCargo?.id === editingCargo.id) {
      setSelectedCargo(editingCargo);
    }
    setEditingCargo(null);
  };

  const getTransportIcon = (mode: TransportMode) => {
    if (mode.includes('Ship')) return <Ship className="w-4 h-4 text-cyan-400" />;
    if (mode.includes('Air') || mode.includes('Plane')) return <Plane className="w-4 h-4 text-sky-400" />;
    return <Truck className="w-4 h-4 text-amber-400" />;
  };

  const totalWeightTonnes = (cargo.reduce((sum, c) => sum + (c.weightKg || 0), 0) / 1000).toFixed(1);
  const deliveredCount = cargo.filter((c) => c.status === 'Delivered').length;
  const inTransitCount = cargo.filter(
    (c) => c.status === 'In Transit' || c.status === 'Loaded' || c.status === 'Air-Dropped'
  ).length;

  const journeySteps: CargoStatus[] = ['Prepared', 'Loaded', 'In Transit', 'Arrived', 'Delivered'];

  const getStepIndex = (st: CargoStatus) => {
    if (st === 'Prepared' || st === 'Staged at Port') return 0;
    if (st === 'Loaded' || st === 'Customs Cleared') return 1;
    if (st === 'In Transit' || st === 'Air-Dropped' || st === 'Delayed' || st === 'Delayed by Weather') return 2;
    if (st === 'Arrived') return 3;
    if (st === 'Delivered') return 4;
    return 2;
  };

  const columns: Column<CargoItem>[] = [
    {
      key: 'trackingNumber',
      header: 'Tracking ID',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-xs text-cyan-400 bg-cyan-950/80 px-2 py-1 rounded border border-cyan-500/20">
          {row.trackingNumber}
        </span>
      )
    },
    {
      key: 'title',
      header: 'Cargo Consignment & Destination',
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
            <span>{(row.origin || 'Base Port').split(',')[0]}</span>
            <span>→</span>
            <span className="text-cyan-300 font-semibold">{row.destinationStation}</span>
          </div>
        </div>
      )
    },
    {
      key: 'transportMode',
      header: 'Transport Mode',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          {getTransportIcon(row.transportMode)}
          <span className="truncate max-w-[140px]">{(row.transportMode || 'Air-Drop').split(' ')[0]}</span>
        </div>
      )
    },
    {
      key: 'weightKg',
      header: 'Weight / Vol',
      sortable: true,
      render: (row) => (
        <div className="text-xs font-mono">
          <div className="text-slate-200 font-semibold">{row.weightKg?.toLocaleString()} kg</div>
          <div className="text-slate-400">{row.volumeM3} m³</div>
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
      key: 'eta',
      header: 'Est. Arrival',
      sortable: true,
      render: (row) => (
        <div className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{row.eta}</span>
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
            onClick={() => setSelectedCargo(row)}
            className="p-1.5 rounded-lg text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/30 transition-colors"
            title="Inspect Manifest & Journey"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {canEditCargo && (
            <button
              type="button"
              onClick={() => setEditingCargo(row)}
              className="p-1.5 rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              title="Edit Cargo"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {canDeleteCargo && (
            <button
              type="button"
              onClick={() => setDeletingId(row.id)}
              className="p-1.5 rounded-lg text-rose-400 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/30 transition-colors"
              title="Delete Manifest"
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
        title="Polar Cargo & Freight Tracking"
        subtitle="Multimodal icebreaker, airlift and overland traverse logistics pipeline"
        icon={Boxes}
        badge={`${cargo.length} CONSIGNMENTS REGISTERED`}
      >
        {canCreateCargo && (
          <button
            type="button"
            onClick={() => setIsNewCargoModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-md shadow-cyan-950 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Log New Consignment</span>
          </button>
        )}
      </PageHeader>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="In-Transit Cargo"
          value={inTransitCount}
          subtitle="En route via sea/air/traverse"
          icon={Boxes}
          variant="cyan"
        />
        <StatCard
          title="Delivered Successfully"
          value={deliveredCount}
          subtitle="Received at research base"
          icon={PackageCheck}
          variant="emerald"
        />
        <StatCard
          title="Total Freight Mass"
          value={`${totalWeightTonnes} Tons`}
          subtitle="Cumulative scientific & fuel mass"
          icon={Weight}
          variant="blue"
        />
        <StatCard
          title="Weather Delayed"
          value={cargo.filter((c) => c.status === 'Delayed' || c.status === 'Delayed by Weather').length}
          subtitle="Blizzard / packing ice delay"
          icon={AlertTriangle}
          variant="amber"
        />
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by tracking number, cargo name, origin, carrier..."
          className="flex-1 w-full"
        />
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <FilterDropdown
            value={statusFilter}
            options={[
              'All Statuses',
              'Prepared',
              'Loaded',
              'In Transit',
              'Arrived',
              'Delivered',
              'Delayed',
              'Lost'
            ]}
            onChange={setStatusFilter}
            className="w-full sm:w-40"
          />
          <FilterDropdown
            value={categoryFilter}
            options={[
              'All Categories',
              'Scientific Equipment',
              'Fuel & Lubricants',
              'Food & Rations',
              'Survival & Cold Gear',
              'Station Spare Parts',
              'Medical Supplies'
            ]}
            onChange={setCategoryFilter}
            className="w-full sm:w-48"
          />
          <FilterDropdown
            value={modeFilter}
            options={['All Modes', 'Ship', 'Air', 'Plane', 'Traverse']}
            onChange={setModeFilter}
            className="w-full sm:w-36"
          />
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredData}
        keyExtractor={(c) => c.id}
        onRowClick={(c) => setSelectedCargo(c)}
        pageSize={8}
      />

      {/* Cargo Manifest Inspection & Journey Timeline Modal */}
      {selectedCargo && (
        <Modal
          isOpen={!!selectedCargo}
          onClose={() => setSelectedCargo(null)}
          title={selectedCargo.title}
          subtitle={`Tracking: ${selectedCargo.trackingNumber} | Carrier: ${selectedCargo.carrier}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Visual Cargo Journey Timeline */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <span className="text-xs font-mono font-bold text-slate-300 block uppercase tracking-wider">
                Visual Freight Transit Journey Timeline
              </span>
              <div className="flex items-center justify-between relative pt-2">
                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
                {journeySteps.map((step, idx) => {
                  const currentIdx = getStepIndex(selectedCargo.status);
                  const isCompleted = idx < currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={step} className="flex flex-col items-center relative z-10">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all ${
                          isCompleted
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950'
                            : isCurrent
                            ? 'bg-cyan-400 text-slate-950 ring-4 ring-cyan-500/20 animate-pulse font-black'
                            : 'bg-slate-900 text-slate-500 border border-slate-800'
                        }`}
                      >
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      <span
                        className={`text-[10px] font-mono mt-1.5 ${
                          isCurrent
                            ? 'text-cyan-400 font-bold'
                            : isCompleted
                            ? 'text-emerald-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Status update bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Consignment Status:</span>
                <StatusBadge status={selectedCargo.status} />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Shift Status:</span>
                <select
                  value={selectedCargo.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as CargoStatus;
                    updateCargoStatus(selectedCargo.id, newStatus);
                    setSelectedCargo({ ...selectedCargo, status: newStatus });
                  }}
                  className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-cyan-300 font-semibold focus:outline-none"
                >
                  <option value="Prepared">Prepared</option>
                  <option value="Loaded">Loaded</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Arrived">Arrived</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>
            </div>

            {/* Special handling alert */}
            {(selectedCargo.temperatureControlled || selectedCargo.hazardousMaterial) && (
              <div className="flex flex-wrap gap-2.5">
                {selectedCargo.temperatureControlled && (
                  <div className="flex-1 p-3 bg-cyan-950/50 border border-cyan-500/30 rounded-xl flex items-center gap-2 text-xs text-cyan-300 font-mono">
                    <ThermometerSnowflake className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>Cryo Controlled: {selectedCargo.tempRequirement}</span>
                  </div>
                )}
                {selectedCargo.hazardousMaterial && (
                  <div className="flex-1 p-3 bg-amber-950/50 border border-amber-500/30 rounded-xl flex items-center gap-2 text-xs text-amber-300 font-mono">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>HAZMAT PROTOCOL ACTIVE (Classified Flammable / Dangerous Goods)</span>
                  </div>
                )}
              </div>
            )}

            {/* Consignment Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Origin Port</span>
                <span className="font-bold text-white">{selectedCargo.origin}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Destination Base</span>
                <span className="font-bold text-cyan-400">{selectedCargo.destinationStation}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Transport Mode</span>
                <span className="font-bold text-white">{selectedCargo.transportMode}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Total Weight</span>
                <span className="font-bold text-emerald-400">{selectedCargo.weightKg?.toLocaleString()} kg</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Cargo Volume</span>
                <span className="font-bold text-white">{selectedCargo.volumeM3} m³</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Estimated ETA</span>
                <span className="font-bold text-sky-300">{selectedCargo.eta}</span>
              </div>
            </div>

            {/* Manifest Line Items */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-cyan-400" />
                <span>Verified Customs Manifest Line Items</span>
              </h4>
              <div className="space-y-1.5">
                {selectedCargo.manifestDetails.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs text-slate-200 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 font-mono"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Cargo Modal */}
      {editingCargo && (
        <Modal
          isOpen={!!editingCargo}
          onClose={() => setEditingCargo(null)}
          title={`Edit Consignment: ${editingCargo.trackingNumber}`}
          subtitle="Modify destination, carrier, and transit status"
          maxWidth="2xl"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Cargo Title *</label>
                <input
                  type="text"
                  required
                  value={editingCargo.title}
                  onChange={(e) => setEditingCargo({ ...editingCargo, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Status *</label>
                <select
                  value={editingCargo.status}
                  onChange={(e) => setEditingCargo({ ...editingCargo, status: e.target.value as CargoStatus })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
                >
                  <option value="Prepared">Prepared</option>
                  <option value="Loaded">Loaded</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Arrived">Arrived</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Destination *</label>
                <select
                  value={editingCargo.destinationStation}
                  onChange={(e) => setEditingCargo({ ...editingCargo, destinationStation: e.target.value })}
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
                <label className="text-xs font-mono font-semibold text-slate-300">Carrier</label>
                <input
                  type="text"
                  value={editingCargo.carrier}
                  onChange={(e) => setEditingCargo({ ...editingCargo, carrier: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">ETA</label>
                <input
                  type="date"
                  value={editingCargo.eta}
                  onChange={(e) => setEditingCargo({ ...editingCargo, eta: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Weight (Kg)</label>
                <input
                  type="number"
                  value={editingCargo.weightKg}
                  onChange={(e) => setEditingCargo({ ...editingCargo, weightKg: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingCargo(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-md shadow-cyan-950 transition-all active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Manifest</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* New Cargo Modal */}
      <Modal
        isOpen={isNewCargoModalOpen}
        onClose={() => setIsNewCargoModalOpen(false)}
        title="Log New Polar Cargo Consignment"
        subtitle="Staging freight for icebreaker shipment, polar airlift, or inland traverse"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateCargo} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Consignment Title *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Deep Sea CTD Sensor Moorings"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Tracking Identifier</label>
              <input
                type="text"
                value={newTracking}
                onChange={(e) => setNewTracking(e.target.value)}
                placeholder="e.g. PLX-SEA-2026-904"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Cargo Category *</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
              >
                <option value="Scientific Equipment">Scientific Equipment</option>
                <option value="Fuel & Lubricants">Fuel & Lubricants</option>
                <option value="Food & Rations">Food & Rations</option>
                <option value="Survival & Cold Gear">Survival & Cold Gear</option>
                <option value="Station Spare Parts">Station Spare Parts</option>
                <option value="Medical Supplies">Medical Supplies</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Destination Station *</label>
              <select
                value={newDestination}
                onChange={(e) => setNewDestination(e.target.value)}
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
              <label className="text-xs font-mono font-semibold text-slate-300">Transport Logistics Mode *</label>
              <select
                value={newTransportMode}
                onChange={(e) => setNewTransportMode(e.target.value as TransportMode)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
              >
                <option value="Icebreaker Ship (MV Golovnin)">Icebreaker Ship (MV Golovnin)</option>
                <option value="C-130 Hercules Air">C-130 Hercules Air</option>
                <option value="Twin Otter Ski-Plane">Twin Otter Ski-Plane</option>
                <option value="PistonBully Overland Traverse">PistonBully Overland Traverse</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Carrier / Vessel Name</label>
              <input
                type="text"
                value={newCarrier}
                onChange={(e) => setNewCarrier(e.target.value)}
                placeholder="e.g. Russian Maritime Icebreaker Agency"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Gross Weight (Kg)</label>
              <input
                type="number"
                value={newWeight}
                onChange={(e) => setNewWeight(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Estimated Arrival (ETA)</label>
              <input
                type="date"
                value={newEta}
                onChange={(e) => setNewEta(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newHazardous}
                onChange={(e) => setNewHazardous(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span className="text-slate-300 font-mono">Contains HazMat / Chemicals / Fuel</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newTempControlled}
                onChange={(e) => setNewTempControlled(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span className="text-slate-300 font-mono">Temperature Sensitive / Active Cryo Required</span>
            </label>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold text-slate-300">Manifest Line Items (one per line)</label>
            <textarea
              rows={3}
              value={newManifestText}
              onChange={(e) => setNewManifestText(e.target.value)}
              placeholder="e.g. 2x Acoustic Echo Sounders&#10;1x Calibration Rig"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewCargoModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-md shadow-cyan-950 transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Register Manifest</span>
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
            deleteCargo(deletingId);
            if (selectedCargo?.id === deletingId) setSelectedCargo(null);
            setDeletingId(null);
          }}
          title="Delete Cargo Manifest"
          message="Are you sure you want to remove this consignment from the tracking registry?"
          confirmLabel="Yes, Delete Manifest"
          type="danger"
        />
      )}
    </div>
  );
};
