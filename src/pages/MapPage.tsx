import React, { useState } from 'react';
import { usePolar, useAuth } from '../context';
import { GeofenceZoneType } from '../types/geofence';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { Modal } from '../components/common/Modal';
import { PolarGoogleMap } from '../components/map/PolarGoogleMap';
import { OfflineVectorMapCanvas } from '../components/map/OfflineVectorMapCanvas';
import { mapProviderService } from '../services/maps/mapProviderService';
import { MapProviderType } from '../services/maps/mapProvider';
import {
  Map as MapIcon,
  Compass,
  Building2,
  AlertTriangle,
  Layers,
  Plus,
  Flame,
  ShieldCheck
} from 'lucide-react';

export const MapPage: React.FC = () => {
  const {
    stations,
    expeditions,
    assets,
    emergencies,
    geofences,
    geofenceBreaches,
    addGeofence,
    toggleGeofenceStatus,
    selectedStation,
    setSelectedStation
  } = usePolar();

  const { role } = useAuth();
  const canManageGeofences = role === 'ADMIN' || role === 'EXPEDITION_MANAGER';

  // Map Provider Mode State
  const [mapMode, setMapMode] = useState<MapProviderType>(mapProviderService.getActiveMode());

  // Layer control states
  const [layers, setLayers] = useState({
    stations: true,
    expeditions: true,
    geofences: true,
    emergencies: true,
    assets: true
  });

  // Geofence Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const [zoneCode, setZoneCode] = useState('');
  const [zoneType, setZoneType] = useState<GeofenceZoneType>('hazard');
  const [severity, setSeverity] = useState<'Critical' | 'Warning' | 'Advisory'>('Critical');
  const [stationRegion] = useState('Maitri Station (Queen Maud Land)');
  const [centerLat, setCenterLat] = useState('-70.762');
  const [centerLng, setCenterLng] = useState('11.741');
  const [radiusMeters, setRadiusMeters] = useState('3000');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('Mandatory GPS Tether\nSpeed Limit 15 km/h');

  const handleToggleLayer = (key: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCreateGeofence = async (e: React.FormEvent) => {
    e.preventDefault();
    const rulesList = rules
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean);

    await addGeofence({
      code: zoneCode || `GEO-${zoneType.slice(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`,
      name: zoneName,
      type: zoneType,
      severity,
      stationOrRegion: stationRegion,
      shape: 'circle',
      center: {
        lat: parseFloat(centerLat),
        lng: parseFloat(centerLng)
      },
      radiusMeters: parseInt(radiusMeters, 10),
      description,
      rules: rulesList,
      status: 'active'
    });

    setIsAddModalOpen(false);
    setZoneName('');
    setZoneCode('');
    setDescription('');
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <PageHeader
        title="Antarctic & Arctic GIS Operations Map"
        subtitle="Real-time geospatial tracking of traverses, satellite-linked research stations, and crevasse geofence perimeters"
        icon={MapIcon}
        badge={`${geofences.length} GEOFENCES ACTIVE`}
      >
        {canManageGeofences && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-lg shadow-cyan-950/80 transition-all active:scale-95 font-mono"
          >
            <Plus className="w-4 h-4" />
            <span>Define New Geofence</span>
          </button>
        )}
      </PageHeader>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monitored Stations"
          value={stations.length}
          subtitle="All bases reporting nominal"
          icon={Building2}
          variant="cyan"
        />
        <StatCard
          title="Active Traverses"
          value={expeditions.filter((e) => e.status === 'Active').length}
          subtitle="GPS telemetry locked"
          icon={Compass}
          variant="blue"
        />
        <StatCard
          title="Perimeter Geofences"
          value={geofences.filter((g) => g.status === 'active').length}
          subtitle="Hazards & wildlife zones"
          icon={AlertTriangle}
          variant="amber"
        />
        <StatCard
          title="Hazard Breaches"
          value={geofenceBreaches.length}
          subtitle={geofenceBreaches.length === 0 ? 'Zero active perimeter breaches' : 'Immediate advisory issued'}
          icon={Flame}
          variant={geofenceBreaches.length > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Layer Control Bar & Station Teleport */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
        {/* Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-slate-400 font-bold flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Map Layers:</span>
          </span>

          <button
            type="button"
            onClick={() => handleToggleLayer('stations')}
            className={`px-3 py-1 rounded-lg border transition-all ${
              layers.stations
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
          >
            Bases & Stations
          </button>

          <button
            type="button"
            onClick={() => handleToggleLayer('expeditions')}
            className={`px-3 py-1 rounded-lg border transition-all ${
              layers.expeditions
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-sm'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
          >
            Active Traverses
          </button>

          <button
            type="button"
            onClick={() => handleToggleLayer('geofences')}
            className={`px-3 py-1 rounded-lg border transition-all ${
              layers.geofences
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
          >
            Geofence Perimeters
          </button>

          <button
            type="button"
            onClick={() => handleToggleLayer('emergencies')}
            className={`px-3 py-1 rounded-lg border transition-all ${
              layers.emergencies
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
          >
            Emergency Beacons
          </button>
        </div>

        {/* Map Provider Engine Switcher & Sector Focus */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          {/* Provider Mode Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
            <button
              onClick={() => {
                setMapMode('GOOGLE_MAPS');
                mapProviderService.setMode('GOOGLE_MAPS');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                mapMode === 'GOOGLE_MAPS'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Google Maps
            </button>
            <button
              onClick={() => {
                setMapMode('OFFLINE_VECTOR');
                mapProviderService.setMode('OFFLINE_VECTOR');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                mapMode === 'OFFLINE_VECTOR'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Offline Vector (SCAR)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sector:</span>
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-white font-mono focus:outline-none"
            >
              <option value="All Stations">Antarctic Overview (All Stations)</option>
              {stations.map((st) => (
                <option key={st.id} value={st.name}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Columns: Interactive Polar Map */}
        <div className="lg:col-span-3 h-[640px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
          {mapMode === 'OFFLINE_VECTOR' ? (
            <OfflineVectorMapCanvas />
          ) : (
            <PolarGoogleMap
              stations={stations}
              expeditions={expeditions}
              assets={assets}
              emergencies={emergencies}
              geofences={geofences}
              breaches={geofenceBreaches}
              selectedStationName={selectedStation}
              activeLayers={layers}
            />
          )}
        </div>

        {/* Right Column: Geofences & Hazard Roster */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white font-sans uppercase">
                Active Hazard Perimeters ({geofences.length})
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="max-h-[550px] overflow-y-auto space-y-2.5 pr-1">
              {geofences.map((zone) => {
                const isHazard = zone.type === 'hazard';
                return (
                  <div
                    key={zone.id}
                    className={`p-3 rounded-xl border transition-all text-xs ${
                      zone.status === 'active'
                        ? isHazard
                          ? 'bg-rose-950/30 border-rose-500/40 text-rose-100'
                          : 'bg-amber-950/30 border-amber-500/40 text-amber-100'
                        : 'bg-slate-950/50 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white truncate">{zone.name}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                          zone.severity === 'Critical'
                            ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {zone.severity}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{zone.description}</p>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800/80 text-[10px] font-mono">
                      <span className="text-cyan-400">
                        {zone.shape === 'circle' ? `Radius: ${zone.radiusMeters}m` : 'Polygon Area'}
                      </span>
                      {canManageGeofences && (
                        <button
                          type="button"
                          onClick={() => toggleGeofenceStatus(zone.id)}
                          className="text-cyan-400 hover:text-cyan-300 underline"
                        >
                          {zone.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add Geofence Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Establish New Polar Geofence Perimeter"
          subtitle="Define safety boundaries, crevasse hazard sectors, and biological sanctuaries"
          maxWidth="2xl"
        >
          <form onSubmit={handleCreateGeofence} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-mono font-semibold text-slate-300">Zone Name</label>
                <input
                  type="text"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  placeholder="e.g. Larsemann Hills Crevasse Barrier"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-white font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono font-semibold text-slate-300">Zone Identification Code</label>
                <input
                  type="text"
                  value={zoneCode}
                  onChange={(e) => setZoneCode(e.target.value)}
                  placeholder="e.g. GEO-HAZ-09"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-white font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-mono font-semibold text-slate-300">Zone Category</label>
                <select
                  value={zoneType}
                  onChange={(e) => setZoneType(e.target.value as GeofenceZoneType)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-white font-mono"
                >
                  <option value="hazard">Hazard Zone (Crevasse / Ice Cliff)</option>
                  <option value="wildlife">Wildlife Protected Sanctuary</option>
                  <option value="restricted">Restricted Sensor / Comms Area</option>
                  <option value="scientific">Scientific Sampling Sector</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-mono font-semibold text-slate-300">Severity Classification</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-white font-mono"
                >
                  <option value="Critical">Critical (Immediate Code Red)</option>
                  <option value="Warning">Warning (Caution / Restricted)</option>
                  <option value="Advisory">Advisory (Notice Only)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-mono font-semibold text-slate-300">Radial Radius (Meters)</label>
                <input
                  type="number"
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-white font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-mono font-semibold text-slate-300">Center Latitude (°S / °N)</label>
                <input
                  type="text"
                  value={centerLat}
                  onChange={(e) => setCenterLat(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-white font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono font-semibold text-slate-300">Center Longitude (°E / °W)</label>
                <input
                  type="text"
                  value={centerLng}
                  onChange={(e) => setCenterLng(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-white font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-mono font-semibold text-slate-300">Geographic Hazard Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Explain the environmental hazard, crevasse depth, or wildlife protection rationale..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-white font-sans"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono font-semibold text-slate-300">Enforced Operational Rules (One per line)</label>
              <textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-white font-mono"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-400 text-slate-950 font-bold hover:bg-cyan-300 shadow-lg"
              >
                Commit Geofence
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
