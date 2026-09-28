import React, { useState, useMemo } from 'react';
import { usePolar, useAuth } from '../context';
import { TraverseRoute, RouteWaypoint, RouteStatus } from '../types/route';
import { routeOptimizationService } from '../services/routing/routeOptimizationService';
import { hasRole, hasPermission } from '../utils/permissions';
import {
  Navigation,
  Plus,
  Compass,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Archive
} from 'lucide-react';

export const RoutePlannerPage: React.FC = () => {
  const { routes, addRoute, updateRouteStatus, expeditions, geofences, stations } = usePolar();
  const { userProfile, role } = useAuth();

  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(routes[0]?.id || null);
  const [filterStatus, setFilterStatus] = useState<RouteStatus | 'ALL'>('ALL');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Form State for creating new route
  const [newTitle, setNewTitle] = useState('');
  const [newExpeditionCode, setNewExpeditionCode] = useState(expeditions[0]?.code || 'EXP-2026-088');
  const [originStation, setOriginStation] = useState(stations[0]?.name || 'Maitri Station');
  const [destinationStation, setDestinationStation] = useState(stations[1]?.name || 'Bharati Station');
  const [transportMethod, setTransportMethod] = useState<TraverseRoute['transportMethod']>('PistonBully PB100');
  const [waypoints, setWaypoints] = useState<RouteWaypoint[]>([
    { id: 'wp-orig', name: 'Maitri Base Camp', lat: -70.7667, lng: 11.7333, elevationMeters: 130 },
    { id: 'wp-dest', name: 'Bharati Coastal Pad', lat: -69.4072, lng: 76.1953, elevationMeters: 45 }
  ]);
  const [notes] = useState('');

  const canCreate = hasPermission(userProfile, 'routes', 'create');
  const canManage = hasRole(userProfile, ['ADMIN', 'EXPEDITION_MANAGER']);

  const filteredRoutes = useMemo(() => {
    if (filterStatus === 'ALL') return routes;
    return routes.filter((r) => r.status === filterStatus);
  }, [routes, filterStatus]);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  // Dynamic analysis for creating/editing route
  const liveAnalysis = useMemo(() => {
    return routeOptimizationService.analyzeRoute(waypoints, geofences);
  }, [waypoints, geofences]);

  const handleAddWaypoint = () => {
    const newWp: RouteWaypoint = {
      id: `wp-${Date.now()}`,
      name: `Traverse Waypoint ${waypoints.length}`,
      lat: waypoints[waypoints.length - 1].lat - 0.2,
      lng: waypoints[waypoints.length - 1].lng + 0.5,
      elevationMeters: 250,
      isCustom: true
    };
    // Insert before destination
    const updated = [...waypoints];
    updated.splice(waypoints.length - 1, 0, newWp);
    setWaypoints(updated);
  };

  const handleRemoveWaypoint = (id: string) => {
    if (waypoints.length <= 2) return;
    setWaypoints(waypoints.filter((w) => w.id !== id));
  };

  const handleUpdateWaypoint = (id: string, updates: Partial<RouteWaypoint>) => {
    setWaypoints(waypoints.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  };

  const handleCreateRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || waypoints.length < 2) return;

    const analysis = routeOptimizationService.analyzeRoute(waypoints, geofences);
    const code = `TRV-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newRoute: Omit<TraverseRoute, 'id'> = {
      code,
      title: newTitle,
      expeditionCode: newExpeditionCode,
      originStation,
      destinationStation,
      transportMethod,
      waypoints,
      segments: analysis.segments,
      totalDistanceKm: analysis.totalDistanceKm,
      estimatedTravelHours: analysis.estimatedTravelHours,
      costAnalysis: analysis.costAnalysis,
      warnings: analysis.warnings,
      status: 'DRAFT',
      version: 1,
      createdAt: new Date().toISOString(),
      createdBy: userProfile?.displayName || 'Polar Planner',
      createdByRole: role,
      updatedAt: new Date().toISOString(),
      updatedBy: userProfile?.displayName || 'Polar Planner',
      notes
    };

    await addRoute(newRoute);
    setIsCreating(false);
    setNewTitle('');
  };

  const handleProposeRoute = async (routeId: string) => {
    await updateRouteStatus(routeId, 'PROPOSED', {
      proposedBy: userProfile?.displayName || 'Mission Planner',
      proposedAt: new Date().toISOString()
    });
  };

  const handleApproveRoute = async (routeId: string) => {
    if (!canManage) return;
    await updateRouteStatus(routeId, 'APPROVED', {
      approvedBy: userProfile?.displayName || 'Base Commander',
      approvedAt: new Date().toISOString()
    });
  };

  const handleRejectRoute = async (routeId: string) => {
    if (!canManage) return;
    const reason = prompt('Enter justification for route rejection / reroute order:') || 'Requires hazard avoidance redesign.';
    await updateRouteStatus(routeId, 'REJECTED', {
      rejectionReason: reason
    });
  };

  const handleArchiveRoute = async (routeId: string) => {
    if (!canManage) return;
    await updateRouteStatus(routeId, 'ARCHIVED');
  };

  const statusBadgeColors = {
    DRAFT: 'bg-slate-800 text-slate-300 border-slate-700',
    PROPOSED: 'bg-amber-950 text-amber-300 border-amber-500/40 animate-pulse',
    APPROVED: 'bg-emerald-950 text-emerald-300 border-emerald-500/40',
    REJECTED: 'bg-rose-950 text-rose-300 border-rose-500/40',
    ARCHIVED: 'bg-slate-900 text-slate-500 border-slate-800'
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Navigation className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-bold text-white font-sans">
              Antarctic Traverse Route Planner & Optimization Engine
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Multi-waypoint corridor analysis, crevasse hazard intersection checking, and proposal workflow.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {canCreate && !isCreating && (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-cyan-950/50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Plan New Traverse</span>
            </button>
          )}

          {isCreating && (
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              Cancel Planning
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Route Selector & Filters */}
        <div className="lg:col-span-4 space-y-4">
          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
            {(['ALL', 'DRAFT', 'PROPOSED', 'APPROVED', 'REJECTED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterStatus === st
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Route Cards List */}
          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
            {filteredRoutes.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
                No traverse routes match current filter.
              </div>
            ) : (
              filteredRoutes.map((route) => (
                <div
                  key={route.id}
                  onClick={() => {
                    setSelectedRouteId(route.id);
                    setIsCreating(false);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedRoute?.id === route.id && !isCreating
                      ? 'bg-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-950/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-cyan-400">{route.code}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadgeColors[route.status]}`}>
                      {route.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white font-sans truncate mb-2">{route.title}</h4>
                  <div className="space-y-1 text-[11px] text-slate-400">
                    <div className="flex justify-between">
                      <span>Corridor:</span>
                      <span className="text-slate-200 truncate max-w-[150px]">{route.originStation} → {route.destinationStation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Distance / Time:</span>
                      <span className="text-slate-200">{route.totalDistanceKm} km ({route.estimatedTravelHours}h)</span>
                    </div>
                    {route.warnings.length > 0 && (
                      <div className="flex items-center gap-1 text-rose-400 text-[10px] font-bold mt-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{route.warnings.length} Active Hazard Warning{route.warnings.length > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Route Details or Create Form */}
        <div className="lg:col-span-8">
          {isCreating ? (
            /* ================= ROUTE CREATOR FORM ================= */
            <form onSubmit={handleCreateRouteSubmit} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white font-sans">
                    Plan Polar Traverse Corridor
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Status: DRAFT</span>
              </div>

              {/* Title & Expedition Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Traverse Route Title *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Maitri to Queen Maud Ridge Traverse"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Assigned Expedition</label>
                  <select
                    value={newExpeditionCode}
                    onChange={(e) => setNewExpeditionCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {expeditions.map((exp) => (
                      <option key={exp.id} value={exp.code}>
                        {exp.code}: {exp.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stations & Vehicle */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Origin Base Station</label>
                  <select
                    value={originStation}
                    onChange={(e) => setOriginStation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {stations.map((st) => (
                      <option key={st.id} value={st.name}>{st.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Destination Location</label>
                  <select
                    value={destinationStation}
                    onChange={(e) => setDestinationStation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {stations.map((st) => (
                      <option key={st.id} value={st.name}>{st.name}</option>
                    ))}
                    <option value="Wohlthat Nunatak Alpha">Wohlthat Nunatak Alpha</option>
                    <option value="Grovenes Coastal Depot">Grovenes Coastal Depot</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Transport Vehicle / Method</label>
                  <select
                    value={transportMethod}
                    onChange={(e) => setTransportMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="PistonBully PB100">PistonBully PB100 (Tracked)</option>
                    <option value="Snowcat Convoy">Heavy Snowcat Convoy</option>
                    <option value="Ski-Doo Recon">Ski-Doo Fast Recon</option>
                    <option value="Heavy Sledge Traverse">Heavy Fuel Sledge Traverse</option>
                  </select>
                </div>
              </div>

              {/* Waypoints Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-cyan-400">Waypoints Sequence ({waypoints.length})</h4>
                  <button
                    type="button"
                    onClick={handleAddWaypoint}
                    className="flex items-center gap-1 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Intermediate Waypoint</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {waypoints.map((wp, idx) => (
                    <div key={wp.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-wrap items-center gap-3 text-xs">
                      <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-cyan-400 text-[11px]">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={wp.name}
                        onChange={(e) => handleUpdateWaypoint(wp.id, { name: e.target.value })}
                        className="flex-1 min-w-[140px] px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[10px]">Lat:</span>
                        <input
                          type="number"
                          step="0.0001"
                          value={wp.lat}
                          onChange={(e) => handleUpdateWaypoint(wp.id, { lat: parseFloat(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[10px]">Lng:</span>
                        <input
                          type="number"
                          step="0.0001"
                          value={wp.lng}
                          onChange={(e) => handleUpdateWaypoint(wp.id, { lng: parseFloat(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                      </div>
                      {waypoints.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveWaypoint(wp.id)}
                          className="p-1 text-slate-500 hover:text-rose-400"
                          title="Remove waypoint"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Cost & Warnings Preview */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Live Route Analysis Preview:</span>
                  <span className="text-cyan-300 font-bold">
                    {liveAnalysis.totalDistanceKm} km • Est. {liveAnalysis.estimatedTravelHours}h Travel
                  </span>
                </div>

                {liveAnalysis.warnings.length > 0 && (
                  <div className="space-y-1.5">
                    {liveAnalysis.warnings.map((w, i) => (
                      <div key={i} className="p-2 rounded bg-rose-950/50 border border-rose-500/40 text-rose-300 text-[11px] flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" />
                        <span>{w.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Info className="w-3 h-3 flex-shrink-0" />
                  <span>Calculated operational risk aid based on polar terrain and geofences. Not certified navigation.</span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-cyan-950/50"
                >
                  Save Draft Route
                </button>
              </div>
            </form>
          ) : selectedRoute ? (
            /* ================= ROUTE INSPECTION & WORKFLOW ================= */
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-cyan-400">{selectedRoute.code}</span>
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${statusBadgeColors[selectedRoute.status]}`}>
                      {selectedRoute.status}
                    </span>
                    <span className="text-xs text-slate-500">• v{selectedRoute.version}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white font-sans">{selectedRoute.title}</h2>
                </div>

                {/* Workflow Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {selectedRoute.status === 'DRAFT' && canCreate && (
                    <button
                      type="button"
                      onClick={() => handleProposeRoute(selectedRoute.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-md cursor-pointer"
                    >
                      Submit for Proposal
                    </button>
                  )}

                  {selectedRoute.status === 'PROPOSED' && canManage && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApproveRoute(selectedRoute.id)}
                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-md cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Route</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectRoute(selectedRoute.id)}
                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-rose-900 hover:bg-rose-800 text-rose-200 border border-rose-700 text-xs transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {selectedRoute.status === 'APPROVED' && canManage && (
                    <button
                      type="button"
                      onClick={() => handleArchiveRoute(selectedRoute.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archive</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Total Distance</span>
                  <span className="text-base font-bold text-white">{selectedRoute.totalDistanceKm} km</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Est. Travel Duration</span>
                  <span className="text-base font-bold text-white">{selectedRoute.estimatedTravelHours} Hours</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Transport Method</span>
                  <span className="text-xs font-bold text-cyan-300 truncate block mt-1">{selectedRoute.transportMethod}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Operational Risk Score</span>
                  <span className="text-base font-bold text-amber-400">{selectedRoute.costAnalysis.totalCalculatedRiskCost} pts</span>
                </div>
              </div>

              {/* Warnings & Intersections */}
              {selectedRoute.warnings.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-2">
                  <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Identified Polar Hazards & Geofence Intersections ({selectedRoute.warnings.length})</span>
                  </div>
                  <div className="space-y-1">
                    {selectedRoute.warnings.map((w, i) => (
                      <div key={i} className="text-rose-200 text-xs pl-6">
                        • {w.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Segments Breakdown Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white">Traverse Segments ({selectedRoute.segments.length})</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900/80 text-slate-400 text-[11px] border-b border-slate-800">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Leg / Corridor</th>
                        <th className="p-3">Distance</th>
                        <th className="p-3">Terrain</th>
                        <th className="p-3">Weather Risk</th>
                        <th className="p-3">Hazard Intersections</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {selectedRoute.segments.map((seg) => (
                        <tr key={seg.index} className="hover:bg-slate-900/40">
                          <td className="p-3 font-bold text-cyan-400">{seg.index + 1}</td>
                          <td className="p-3 font-bold text-white truncate max-w-[200px]">
                            {seg.fromName} → {seg.toName}
                          </td>
                          <td className="p-3">{seg.distanceKm} km ({seg.estimatedTravelHours}h)</td>
                          <td className="p-3 text-slate-400">{seg.terrainType}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              seg.weatherRiskLevel === 'LOW'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-950 text-amber-300 border-amber-500/30'
                            }`}>
                              {seg.weatherRiskLevel}
                            </span>
                          </td>
                          <td className="p-3">
                            {seg.hazardIntersections.length > 0 ? (
                              <span className="text-rose-400 font-bold">{seg.hazardIntersections.join(', ')}</span>
                            ) : (
                              <span className="text-emerald-400">Clear</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Waypoints Coordinate Manifest */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white">Waypoint Coordinates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedRoute.waypoints.map((wp, idx) => (
                    <div key={wp.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-cyan-400 text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="text-white font-medium truncate max-w-[150px]">{wp.name}</span>
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        {wp.lat.toFixed(4)}°, {wp.lng.toFixed(4)}°
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit & Workflow Metadata */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-400">
                <div className="flex flex-wrap justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <span>Created by: <strong className="text-slate-200">{selectedRoute.createdBy}</strong> ({selectedRoute.createdByRole || 'Operator'})</span>
                  <span>Created at: {new Date(selectedRoute.createdAt).toUTCString().slice(0, 22)}</span>
                </div>
                {selectedRoute.proposedBy && (
                  <div className="flex justify-between">
                    <span>Proposed by: <strong className="text-amber-300">{selectedRoute.proposedBy}</strong></span>
                    <span>{selectedRoute.proposedAt ? new Date(selectedRoute.proposedAt).toUTCString().slice(0, 22) : ''}</span>
                  </div>
                )}
                {selectedRoute.approvedBy && (
                  <div className="flex justify-between">
                    <span>Approved by: <strong className="text-emerald-300">{selectedRoute.approvedBy}</strong></span>
                    <span>{selectedRoute.approvedAt ? new Date(selectedRoute.approvedAt).toUTCString().slice(0, 22) : ''}</span>
                  </div>
                )}
                {selectedRoute.rejectionReason && (
                  <div className="p-2 rounded bg-rose-950/40 text-rose-300 border border-rose-500/30">
                    <strong>Rejection Order Note:</strong> {selectedRoute.rejectionReason}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
              Select or create a traverse route from the left panel.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
