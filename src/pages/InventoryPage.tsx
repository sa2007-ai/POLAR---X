import React, { useState } from 'react';
import { usePolar, useAuth } from '../context';
import { canCreate, canEdit, canDelete } from '../utils/permissions';
import { InventoryItem, InventoryCategory } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { SearchBar } from '../components/common/SearchBar';
import { FilterDropdown } from '../components/common/FilterDropdown';
import { Modal } from '../components/common/Modal';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import {
  Package,
  Plus,
  AlertOctagon,
  TrendingDown,
  PlusCircle,
  MinusCircle,
  Eye,
  Edit2,
  Trash2,
  Save,
  Send,
  Calendar
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { inventory, updateInventoryStock, addInventoryItem, updateInventoryItem, deleteInventoryItem, stations } =
    usePolar();
  const { userProfile } = useAuth();

  const canCreateInventory = canCreate(userProfile, 'inventory');
  const canEditInventory = canEdit(userProfile, 'inventory');
  const canDeleteInventory = canDelete(userProfile, 'inventory');

  const [searchQuery, setSearchQuery] = useState('');
  const [stationFilter, setStationFilter] = useState('All Stations');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [onlyExpiring, setOnlyExpiring] = useState(false);

  // Modals
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);

  // New Item Form
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newCategory, setNewCategory] = useState<InventoryCategory>('Survival Rations');
  const [newStation, setNewStation] = useState(stations[0]?.name || 'Maitri Research Base');
  const [newLocationBin, setNewLocationBin] = useState('');
  const [newQuantity, setNewQuantity] = useState<number>(100);
  const [newUnit, setNewUnit] = useState('Units');
  const [newMinThreshold, setNewMinThreshold] = useState<number>(30);
  const [newMaxCapacity] = useState<number>(200);
  const [newExpiryDate, setNewExpiryDate] = useState('2029-12-31');
  const [newCostPerUnit] = useState<number>(150);
  const [newSupplier, setNewSupplier] = useState('');

  const filteredData = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.locationBin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.station.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStation = stationFilter === 'All Stations' || item.station.includes(stationFilter);
    const matchesCategory = categoryFilter === 'All Categories' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'All Statuses' || item.status === statusFilter;
    const matchesLowStock = !onlyLowStock || item.status === 'LOW STOCK' || item.status === 'CRITICAL' || item.status === 'Low Stock' || item.status === 'Critical Shortage';
    const matchesExpiring = !onlyExpiring || item.status === 'EXPIRED' || item.status === 'Expiring Soon';

    return matchesSearch && matchesStation && matchesCategory && matchesStatus && matchesLowStock && matchesExpiring;
  });

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    addInventoryItem({
      sku: newSku || `POLAR-SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newName,
      category: newCategory,
      station: newStation,
      locationBin: newLocationBin || 'Vault A - Rack 01',
      quantity: Number(newQuantity) || 50,
      unit: newUnit,
      minimumThreshold: Number(newMinThreshold) || 20,
      maximumCapacity: Number(newMaxCapacity) || 100,
      expiryDate: newExpiryDate,
      costPerUnit: Number(newCostPerUnit) || 100,
      lastAudited: new Date().toISOString().slice(0, 10),
      supplier: newSupplier || 'NCPOR Central Supply'
    });

    // Reset and close
    setNewName('');
    setNewSku('');
    setNewLocationBin('');
    setNewSupplier('');
    setIsNewItemModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    updateInventoryItem(editingItem.id, editingItem);
    if (selectedItem?.id === editingItem.id) {
      setSelectedItem(editingItem);
    }
    setEditingItem(null);
  };

  const lowStockCount = inventory.filter(
    (i) => i.status === 'LOW STOCK' || i.status === 'CRITICAL' || i.status === 'Low Stock' || i.status === 'Critical Shortage'
  ).length;
  const criticalCount = inventory.filter(
    (i) => i.status === 'CRITICAL' || i.status === 'Critical Shortage'
  ).length;
  const expiredCount = inventory.filter(
    (i) => i.status === 'EXPIRED' || i.status === 'Expiring Soon'
  ).length;

  const columns: Column<InventoryItem>[] = [
    {
      key: 'sku',
      header: 'SKU / Identifier',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-xs text-cyan-400 bg-cyan-950/80 px-2 py-1 rounded border border-cyan-500/20">
          {row.sku}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Item Description & Storage',
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
            <span>{row.category}</span>
            <span>•</span>
            <span className="text-cyan-300">{row.station}</span>
            <span>•</span>
            <span className="text-slate-500">{row.locationBin}</span>
          </div>
        </div>
      )
    },
    {
      key: 'quantity',
      header: 'Stock Level & Adjustment',
      sortable: true,
      render: (row) => (
        <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-white">
              {row.quantity} <span className="text-slate-400 font-normal">{row.unit}</span>
            </span>
            {canEditInventory && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => updateInventoryStock(row.id, -1)}
                  className="p-0.5 text-rose-400 hover:text-white bg-rose-950/80 hover:bg-rose-900 border border-rose-500/30 rounded"
                  title="Decrement Stock -1"
                >
                  <MinusCircle className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => updateInventoryStock(row.id, +1)}
                  className="p-0.5 text-emerald-400 hover:text-white bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 rounded"
                  title="Increment Stock +1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                row.quantity <= row.minimumThreshold * 0.4
                  ? 'bg-rose-500'
                  : row.quantity <= row.minimumThreshold
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.min(100, (row.quantity / (row.maximumCapacity || 100)) * 100)}%`
              }}
            />
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Min: {row.minimumThreshold} | Max: {row.maximumCapacity}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Stock Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} size="sm" />
    },
    {
      key: 'expiryDate',
      header: 'Expiry Date',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-mono text-slate-300">
          {row.expiryDate}
        </span>
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
            onClick={() => setSelectedItem(row)}
            className="p-1.5 rounded-lg text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/30 transition-colors"
            title="Inspect Stock Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {canEditInventory && (
            <button
              type="button"
              onClick={() => setEditingItem(row)}
              className="p-1.5 rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              title="Edit SKU Details"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {canDeleteInventory && (
            <button
              type="button"
              onClick={() => setDeletingId(row.id)}
              className="p-1.5 rounded-lg text-rose-400 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/30 transition-colors"
              title="Delete SKU"
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
        title="Base Station Inventory & Survival Stockpile"
        subtitle="Critical rations, cold weather survival kits, aviation fuel, and spare parts catalog"
        icon={Package}
        badge={`${inventory.length} SKUs MANAGED`}
      >
        {canCreateInventory && (
          <button
            type="button"
            onClick={() => setIsNewItemModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-md shadow-cyan-950 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock SKU</span>
          </button>
        )}
      </PageHeader>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Managed Items"
          value={inventory.length}
          subtitle="Catalog across all 3 bases"
          icon={Package}
          variant="cyan"
        />
        <StatCard
          title="Low Stock Warnings"
          value={lowStockCount}
          subtitle="Below safety thresholds"
          icon={TrendingDown}
          variant="amber"
        />
        <StatCard
          title="Critical Shortages"
          value={criticalCount}
          subtitle="Immediate airlift required"
          icon={AlertOctagon}
          variant="rose"
        />
        <StatCard
          title="Expiry Watch"
          value={expiredCount}
          subtitle="Shelf-life within 60 days"
          icon={Calendar}
          variant="purple"
        />
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by SKU, item name, bin, supplier..."
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
              'Survival Rations',
              'Fuel Reserves',
              'Medical Stock',
              'Extreme Cold Wear',
              'Vehicle Spare Parts',
              'Oxygen & Gas Cylinders'
            ]}
            onChange={setCategoryFilter}
            className="w-full sm:w-48"
          />
          <FilterDropdown
            value={statusFilter}
            options={[
              'All Statuses',
              'NORMAL',
              'LOW STOCK',
              'CRITICAL',
              'EXPIRED',
              'Adequate',
              'Low Stock',
              'Critical Shortage',
              'Expiring Soon'
            ]}
            onChange={setStatusFilter}
            className="w-full sm:w-36"
          />

          {/* Quick toggle chips */}
          <button
            type="button"
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all border ${
              onlyLowStock
                ? 'bg-amber-950 text-amber-300 border-amber-500/50 shadow'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            ⚠️ Low Stock Only
          </button>
          <button
            type="button"
            onClick={() => setOnlyExpiring(!onlyExpiring)}
            className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all border ${
              onlyExpiring
                ? 'bg-purple-950 text-purple-300 border-purple-500/50 shadow'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            📅 Expiry Watch
          </button>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredData}
        keyExtractor={(item) => item.id}
        onRowClick={(item) => setSelectedItem(item)}
        pageSize={8}
      />

      {/* Inventory Item Inspection Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={selectedItem.name}
          subtitle={`SKU: ${selectedItem.sku} | Location: ${selectedItem.locationBin}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Current Stock Status:</span>
                <StatusBadge status={selectedItem.status} />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateInventoryStock(selectedItem.id, -5)}
                  className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded text-xs font-mono font-bold"
                >
                  -5 {selectedItem.unit}
                </button>
                <button
                  type="button"
                  onClick={() => updateInventoryStock(selectedItem.id, +10)}
                  className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 rounded text-xs font-mono font-bold"
                >
                  +10 Restock
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Base Station</span>
                <span className="font-bold text-white">{selectedItem.station}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Category</span>
                <span className="font-bold text-cyan-400">{selectedItem.category}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Current Quantity</span>
                <span className="font-bold text-emerald-400">
                  {selectedItem.quantity} {selectedItem.unit}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Minimum Threshold</span>
                <span className="font-bold text-amber-400">
                  {selectedItem.minimumThreshold} {selectedItem.unit}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Max Vault Capacity</span>
                <span className="font-bold text-white">
                  {selectedItem.maximumCapacity} {selectedItem.unit}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Unit Cost</span>
                <span className="font-bold text-slate-200">₹{selectedItem.costPerUnit.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-1">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Certified Supplier:</span>
                <span className="font-bold text-white">{selectedItem.supplier}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Expiration Date:</span>
                <span className="font-bold text-cyan-400">{selectedItem.expiryDate}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Last Physical Inventory Audit:</span>
                <span className="text-slate-300">{selectedItem.lastAudited}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit SKU Modal */}
      {editingItem && (
        <Modal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          title={`Edit Inventory SKU: ${editingItem.sku}`}
          subtitle="Modify quantity thresholds, storage bin, and supplier"
          maxWidth="2xl"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Item Description *</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Station *</label>
                <select
                  value={editingItem.station}
                  onChange={(e) => setEditingItem({ ...editingItem, station: e.target.value })}
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
                <label className="text-xs font-mono font-semibold text-slate-300">Storage Location Bin</label>
                <input
                  type="text"
                  value={editingItem.locationBin}
                  onChange={(e) => setEditingItem({ ...editingItem, locationBin: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Current Quantity</label>
                <input
                  type="number"
                  value={editingItem.quantity}
                  onChange={(e) => setEditingItem({ ...editingItem, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Minimum Safety Threshold</label>
                <input
                  type="number"
                  value={editingItem.minimumThreshold}
                  onChange={(e) => setEditingItem({ ...editingItem, minimumThreshold: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-300">Expiry Cutoff Date</label>
                <input
                  type="date"
                  value={editingItem.expiryDate}
                  onChange={(e) => setEditingItem({ ...editingItem, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
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

      {/* Add New SKU Modal */}
      <Modal
        isOpen={isNewItemModalOpen}
        onClose={() => setIsNewItemModalOpen(false)}
        title="Add Inventory Item to Survival Stockpile"
        subtitle="Catalog new rations, spares, fuel reserves, or medical equipment"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateItem} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Item Description *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Extreme Sub-Zero Thermal Sleeping Bags"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">SKU Code</label>
              <input
                type="text"
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                placeholder="e.g. POLAR-GEAR-SLP-01"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Category *</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as InventoryCategory)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
              >
                <option value="Survival Rations">Survival Rations</option>
                <option value="Fuel Reserves">Fuel Reserves</option>
                <option value="Medical Stock">Medical Stock</option>
                <option value="Extreme Cold Wear">Extreme Cold Wear</option>
                <option value="Vehicle Spare Parts">Vehicle Spare Parts</option>
                <option value="Oxygen & Gas Cylinders">Oxygen & Gas Cylinders</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Station / Base *</label>
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
              <label className="text-xs font-mono font-semibold text-slate-300">Storage Location Bin</label>
              <input
                type="text"
                value={newLocationBin}
                onChange={(e) => setNewLocationBin(e.target.value)}
                placeholder="e.g. Survival Depot - Rack C3"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Certified Supplier</label>
              <input
                type="text"
                value={newSupplier}
                onChange={(e) => setNewSupplier(e.target.value)}
                placeholder="e.g. Mountain Hardwear Polar Tech"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Initial Quantity *</label>
              <input
                type="number"
                value={newQuantity}
                onChange={(e) => setNewQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Quantity Unit</label>
              <input
                type="text"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="e.g. Suits, Boxes, Liters"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Minimum Safety Threshold</label>
              <input
                type="number"
                value={newMinThreshold}
                onChange={(e) => setNewMinThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">Expiry Date</label>
              <input
                type="date"
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewItemModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-md shadow-cyan-950 transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Catalog In Stockpile</span>
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
            deleteInventoryItem(deletingId);
            if (selectedItem?.id === deletingId) setSelectedItem(null);
            setDeletingId(null);
          }}
          title="Delete Stock SKU"
          message="Are you sure you want to remove this item from the active inventory stockpile?"
          confirmLabel="Yes, Delete SKU"
          type="danger"
        />
      )}
    </div>
  );
};
