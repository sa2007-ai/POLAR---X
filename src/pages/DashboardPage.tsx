import React from 'react';
import { usePolar, useAuth } from '../context';
import { canCreate, canView, getRoleDisplayName, getRoleBadgeColor } from '../utils/permissions';
import {
  Compass,
  Users,
  Boxes,
  Wrench,
  AlertTriangle,
  PlusCircle,
  Package,
  ChevronRight,
  ShieldAlert,
  ThermometerSnowflake,
  Activity,
  HeartPulse,
  Radio,
  Plane,
  ShieldCheck
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { PolarRadarMap } from '../components/polar/PolarRadarMap';
import { WeatherIntelligenceCard } from '../components/weather/WeatherIntelligenceCard';
import { SolarActivityCard } from '../components/solar/SolarActivityCard';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const {
    dashboardMetrics,
    expeditions,
    personnel,
    cargo,
    inventory,
    assets,
    emergencies,
    activityLogs,
    selectedStation,
    setIsSOSModalOpen,
    updateInventoryStock,
    geofenceBreaches
  } = usePolar();

  const { userProfile, role } = useAuth();
  const canSendSOS = canCreate(userProfile, 'emergency');
  const roleColors = getRoleBadgeColor(role);

  // Station Filtered Expeditions
  const filteredExpeditions = expeditions.filter(
    (e) => selectedStation === 'All Stations' || (e.station && e.station.includes(selectedStation))
  );

  const activeExpeditionsList = filteredExpeditions.filter(
    (e) => e.status === 'Active' || e.status === 'Scheduled'
  );

  // Critical items
  const criticalStockItems = inventory.filter(
    (i) => i.status === 'CRITICAL' || i.status === 'Critical Shortage' || i.status === 'LOW STOCK' || i.status === 'Low Stock'
  );

  const activeEmergenciesList = emergencies.filter(
    (e) => e.status !== 'RESOLVED' && e.status !== 'Resolved' && e.status !== 'CLOSED'
  );

  const renderRoleSpecificActions = () => {
    switch (role) {
      case 'ADMIN':
      case 'EXPEDITION_MANAGER':
        return (
          <>
            {canSendSOS && (
              <button
                type="button"
                onClick={() => setIsSOSModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-950 transition-all active:scale-95 animate-pulse"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Report Incident SOS</span>
              </button>
            )}
            <Link
              to="/expeditions"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-md shadow-cyan-950 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Stage Expedition</span>
            </Link>
          </>
        );

      case 'LOGISTICS_OFFICER':
        return (
          <>
            <Link
              to="/cargo"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-md shadow-cyan-950 transition-all active:scale-95"
            >
              <Boxes className="w-4 h-4" />
              <span>Track Cargo Freight</span>
            </Link>
            <Link
              to="/inventory"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all active:scale-95"
            >
              <Package className="w-4 h-4" />
              <span>Inventory SKUs</span>
            </Link>
          </>
        );

      case 'SCIENTIST':
        return (
          <>
            <Link
              to="/uav"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-md shadow-cyan-950 transition-all active:scale-95"
            >
              <Plane className="w-4 h-4" />
              <span>UAV Recon Console</span>
            </Link>
            <Link
              to="/reconstruction"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all active:scale-95"
            >
              <Boxes className="w-4 h-4" />
              <span>3D Terrain Hazard Models</span>
            </Link>
          </>
        );

      case 'MEDICAL_OFFICER':
        return (
          <>
            {canSendSOS && (
              <button
                type="button"
                onClick={() => setIsSOSModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-950 transition-all active:scale-95 animate-pulse"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Medical SOS Protocol</span>
              </button>
            )}
            <Link
              to="/personnel"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-md shadow-cyan-950 transition-all active:scale-95"
            >
              <HeartPulse className="w-4 h-4" />
              <span>Crew Health Telemetry</span>
            </Link>
          </>
        );

      case 'VIEWER':
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-400 bg-slate-900 border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>OBSERVER CLEARANCE: READ-ONLY</span>
          </div>
        );
    }
  };

  const renderRoleSpecificStats = () => {
    switch (role) {
      case 'ADMIN':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              title="ACTIVE EXPEDITIONS"
              value={dashboardMetrics.activeExpeditions}
              subtitle={`${expeditions.length} total registered`}
              icon={Compass}
              variant="cyan"
              trend={{ value: `${expeditions.filter((e) => e.status === 'Planning').length} planning`, isNeutral: true }}
            />
            <StatCard
              title="TOTAL PERSONNEL"
              value={dashboardMetrics.totalPersonnel}
              subtitle={`${dashboardMetrics.inFieldPersonnel} deployed in field`}
              icon={Users}
              variant="blue"
              trend={{ value: '100%', isPositive: true, label: 'simulated stream' }}
            />
            <StatCard
              title="CARGO IN TRANSIT"
              value={dashboardMetrics.cargoInTransit}
              subtitle={`${cargo.length} total shipments`}
              icon={Boxes}
              variant="purple"
              trend={{ value: `${cargo.filter((c) => c.status === 'Delivered').length} delivered`, isPositive: true }}
            />
            <StatCard
              title="LOW STOCK ITEMS"
              value={dashboardMetrics.lowStockItems}
              subtitle={`${dashboardMetrics.criticalStockItems} critical shortages`}
              icon={Package}
              variant="amber"
              trend={{
                value: dashboardMetrics.criticalStockItems > 0 ? 'ATTENTION' : 'NOMINAL',
                isPositive: dashboardMetrics.criticalStockItems === 0
              }}
            />
            <StatCard
              title="ACTIVE ASSETS"
              value={dashboardMetrics.activeAssets}
              subtitle={`${dashboardMetrics.fleetReadinessScore}% avg fleet health`}
              icon={Wrench}
              variant="emerald"
              trend={{
                value: `${dashboardMetrics.assetsNeedingMaintenance} checkups due`,
                isNeutral: dashboardMetrics.assetsNeedingMaintenance === 0,
                isPositive: dashboardMetrics.assetsNeedingMaintenance === 0
              }}
            />
            <StatCard
              title="ACTIVE EMERGENCIES"
              value={dashboardMetrics.activeEmergencies}
              subtitle={`${dashboardMetrics.criticalEmergencies} critical code red`}
              icon={AlertTriangle}
              variant="rose"
              trend={{
                value: dashboardMetrics.criticalEmergencies > 0 ? 'CRITICAL' : 'STANDBY',
                isPositive: dashboardMetrics.criticalEmergencies === 0
              }}
            />
          </div>
        );

      case 'EXPEDITION_MANAGER':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              title="ACTIVE SORTIES"
              value={dashboardMetrics.activeExpeditions}
              subtitle="Deployments underway"
              icon={Compass}
              variant="cyan"
              trend={{ value: `${expeditions.filter((e) => e.status === 'Planning').length} planning`, isNeutral: true }}
            />
            <StatCard
              title="IN-FIELD CREW"
              value={dashboardMetrics.inFieldPersonnel}
              subtitle="Traverse field personnel"
              icon={Users}
              variant="blue"
              trend={{ value: '100% Tracking', isPositive: true }}
            />
            <StatCard
              title="SCHEDULED MISSIONS"
              value={expeditions.filter((e) => e.status === 'Scheduled').length}
              subtitle="Pending weather clearance"
              icon={PlusCircle}
              variant="purple"
            />
            <StatCard
              title="HAZARD BREACHES"
              value={geofenceBreaches.length}
              subtitle="Active crevasse alerts"
              icon={AlertTriangle}
              variant={geofenceBreaches.length > 0 ? 'rose' : 'emerald'}
              trend={{
                value: geofenceBreaches.length > 0 ? 'ALERT' : 'CLEAR',
                isPositive: geofenceBreaches.length === 0
              }}
            />
            <StatCard
              title="TOTAL REGISTERED"
              value={expeditions.length}
              subtitle="All polar sortie sorties"
              icon={Activity}
              variant="emerald"
            />
            <StatCard
              title="CRISIS PROTOCOLS"
              value={dashboardMetrics.activeEmergencies}
              subtitle="Open emergency status"
              icon={ShieldAlert}
              variant="rose"
              trend={{
                value: dashboardMetrics.criticalEmergencies > 0 ? 'STANDBY' : 'CLEAR',
                isPositive: dashboardMetrics.criticalEmergencies === 0
              }}
            />
          </div>
        );

      case 'LOGISTICS_OFFICER':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              title="CARGO IN TRANSIT"
              value={dashboardMetrics.cargoInTransit}
              subtitle="Sea, air & traverse freight"
              icon={Boxes}
              variant="purple"
              trend={{ value: `${cargo.length} Total`, isPositive: true }}
            />
            <StatCard
              title="DELIVERED FREIGHT"
              value={cargo.filter((c) => c.status === 'Delivered').length}
              subtitle="Successfully received"
              icon={Boxes}
              variant="cyan"
            />
            <StatCard
              title="LOW STOCK SKUS"
              value={dashboardMetrics.lowStockItems}
              subtitle="Below buffer threshold"
              icon={Package}
              variant="amber"
              trend={{
                value: dashboardMetrics.lowStockItems > 0 ? 'RESTOCK' : 'NOMINAL',
                isPositive: dashboardMetrics.lowStockItems === 0
              }}
            />
            <StatCard
              title="CRITICAL SHORTAGES"
              value={dashboardMetrics.criticalStockItems}
              subtitle="Rations / fuel reserves"
              icon={AlertTriangle}
              variant="rose"
              trend={{
                value: dashboardMetrics.criticalStockItems > 0 ? 'URGENT' : 'NOMINAL',
                isPositive: dashboardMetrics.criticalStockItems === 0
              }}
            />
            <StatCard
              title="ACTIVE ASSETS"
              value={dashboardMetrics.activeAssets}
              subtitle="Fleet & heavy machinery"
              icon={Wrench}
              variant="emerald"
            />
            <StatCard
              title="MAINTENANCE DUE"
              value={dashboardMetrics.assetsNeedingMaintenance}
              subtitle="Scheduled overhaul"
              icon={Wrench}
              variant={dashboardMetrics.assetsNeedingMaintenance > 0 ? 'amber' : 'emerald'}
            />
          </div>
        );

      case 'SCIENTIST':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              title="SCIENCE SORTIES"
              value={expeditions.filter((e) => e.type === 'Glaciology & Ice Core' || e.type === 'Atmospheric Physics' || e.type === 'Geological Survey' || e.status === 'Active').length}
              subtitle="Glacial & climate field tasks"
              icon={Compass}
              variant="cyan"
            />
            <StatCard
              title="TELEMETRY SENSORS"
              value="8 ACTIVE"
              subtitle="GNSS, Weather & LoRa"
              icon={Radio}
              variant="blue"
              trend={{ value: 'LIVE FEED', isPositive: true }}
            />
            <StatCard
              title="CREVASSE HAZARDS"
              value={geofenceBreaches.length}
              subtitle="Edge AI detected"
              icon={AlertTriangle}
              variant={geofenceBreaches.length > 0 ? 'rose' : 'purple'}
            />
            <StatCard
              title="3D RECON VOLUMES"
              value="4 COMPLETE"
              subtitle="Terrain depth profiles"
              icon={Boxes}
              variant="purple"
            />
            <StatCard
              title="UAV SURVEILLANCE"
              value="STANDBY"
              subtitle="Autonomous RTL safety armed"
              icon={Plane}
              variant="emerald"
            />
            <StatCard
              title="ATMOSPHERE INDEX"
              value="-28°C"
              subtitle="Mean polar conditions"
              icon={ThermometerSnowflake}
              variant="cyan"
            />
          </div>
        );

      case 'MEDICAL_OFFICER':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              title="STATION CREW"
              value={dashboardMetrics.totalPersonnel}
              subtitle="Registered station staff"
              icon={Users}
              variant="blue"
            />
            <StatCard
              title="IN-FIELD CREW"
              value={dashboardMetrics.inFieldPersonnel}
              subtitle="High-risk traverse crew"
              icon={Users}
              variant="cyan"
              trend={{ value: 'MONITORED', isPositive: true }}
            />
            <StatCard
              title="VITALS TELEMETRY"
              value="100% NOMINAL"
              subtitle="Heart rate & body temp live"
              icon={HeartPulse}
              variant="emerald"
            />
            <StatCard
              title="ACTIVE CRISES"
              value={dashboardMetrics.activeEmergencies}
              subtitle="Open triage cases"
              icon={AlertTriangle}
              variant="rose"
            />
            <StatCard
              title="FIELD SAFETY ALERTS"
              value={geofenceBreaches.length}
              subtitle="Biometric & zone breaches"
              icon={ShieldAlert}
              variant={geofenceBreaches.length > 0 ? 'rose' : 'emerald'}
            />
            <StatCard
              title="MEDICAL SKUS"
              value={inventory.filter((i) => i.category === 'Medical Stock').length}
              subtitle="First aid & trauma packs"
              icon={Package}
              variant="purple"
            />
          </div>
        );

      case 'VIEWER':
      default:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="ACTIVE SORTIES"
              value={dashboardMetrics.activeExpeditions}
              subtitle="Antarctic sorties in field"
              icon={Compass}
              variant="cyan"
            />
            <StatCard
              title="TOTAL STATION CREW"
              value={dashboardMetrics.totalPersonnel}
              subtitle="Base personnel deployed"
              icon={Users}
              variant="blue"
            />
            <StatCard
              title="DELIVERED FREIGHT"
              value={cargo.filter((c) => c.status === 'Delivered').length}
              subtitle="Consignments received"
              icon={Boxes}
              variant="purple"
            />
            <StatCard
              title="BASE GRID STATUS"
              value="OPERATIONAL"
              subtitle="SatMesh synchronized"
              icon={Activity}
              variant="emerald"
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Page Header */}
      <PageHeader
        title="Polar Operations Command Center"
        subtitle={`Real-time telemetry and logistics command for ${selectedStation}`}
        icon={Compass}
        badge={`CLEARANCE: ${role}`}
      >
        {renderRoleSpecificActions()}
      </PageHeader>

      {/* Role Context Bar */}
      <div className={`px-4 py-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono ${roleColors.bg} ${roleColors.border}`}>
        <div className="flex items-center gap-2">
          <ShieldCheck className={`w-4 h-4 ${roleColors.text}`} />
          <span className="text-white font-bold">Active Role Profile:</span>
          <span className={`${roleColors.text} font-bold`}>{getRoleDisplayName(role)}</span>
        </div>
        <div className="text-slate-400 text-[11px]">
          <span>Station: </span>
          <strong className="text-white">{selectedStation}</strong>
          <span className="mx-2">•</span>
          <span>Access Level: </span>
          <strong className="text-cyan-300">{role === 'ADMIN' ? 'UNRESTRICTED' : role === 'VIEWER' ? 'READ-ONLY OBSERVER' : 'DOMAIN AUTHORIZED'}</strong>
        </div>
      </div>

      {/* Section 1: Role-Aware Mission Statistics Grid */}
      {renderRoleSpecificStats()}

      {/* Section 2: Active Emergency Alert Banner (if any) */}
      {activeEmergenciesList.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/60 shadow-2xl shadow-rose-950/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-600 text-white animate-pulse">
                  ACTIVE CRISIS ({activeEmergenciesList[0].severity})
                </span>
                <span className="text-xs font-mono text-rose-300 font-bold">
                  {activeEmergenciesList[0].incidentCode}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white font-sans mt-0.5">
                {activeEmergenciesList[0].title}
              </h4>
              <p className="text-xs text-rose-200 mt-0.5 line-clamp-1">
                {activeEmergenciesList[0].summary}
              </p>
            </div>
          </div>
          <Link
            to="/emergency"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-rose-300 hover:bg-white transition-colors flex-shrink-0"
          >
            <span>Open Crisis Console</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Section 3: Geospatial Polar Radar & Stations Map */}
      <PolarRadarMap />

      {/* Section 3.5: Antarctic Weather Intelligence & Solar Space Weather */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WeatherIntelligenceCard stationName={selectedStation === 'All Stations' ? 'Maitri Station' : selectedStation} />
        <SolarActivityCard />
      </div>

      {/* Section 4 & 5: Active Expeditions & Cargo Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Expeditions Summary */}
        <div className="lg:col-span-8 rounded-2xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white font-sans">
                Active Expeditions & Scientific Sorties ({activeExpeditionsList.length})
              </h3>
            </div>
            <Link
              to="/expeditions"
              className="inline-flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              <span>Manage Registry</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {activeExpeditionsList.slice(0, 4).map((exp) => (
              <div
                key={exp.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/20">
                      {exp.code}
                    </span>
                    <StatusBadge status={exp.status} size="sm" />
                    <span className="text-xs text-slate-400 font-mono">
                      {exp.station}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                    {exp.title}
                  </h4>

                  <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                    <span>Lead: <strong className="text-slate-200">{exp.leader}</strong></span>
                    <span>Crew: <strong className="text-slate-200">{exp.personnelCount}</strong></span>
                    <span>Alt: <strong className="text-slate-200">{exp.coordinates.altitude}</strong></span>
                  </div>

                  {exp.weatherAlert && (
                    <div className="flex items-center gap-1 text-[11px] text-amber-400 font-mono bg-amber-950/30 px-2 py-0.5 rounded border border-amber-500/20 mt-1">
                      <ThermometerSnowflake className="w-3.5 h-3.5" />
                      <span>{exp.weatherAlert}</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar & Percentage */}
                <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 min-w-[140px]">
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-cyan-400">{exp.progressPercent}%</span>
                    <span className="text-[10px] text-slate-400 block font-mono">Mission Complete</span>
                  </div>
                  <div className="w-32 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 rounded-full transition-all duration-500"
                      style={{ width: `${exp.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cargo Operations Journey Tracker */}
        <div className="lg:col-span-4 rounded-2xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-sans">
                Cargo Operations & Transit
              </h3>
            </div>
            <Link to="/cargo" className="text-xs font-mono text-cyan-400 hover:underline">
              All Cargo
            </Link>
          </div>

          <div className="space-y-3">
            {cargo.slice(0, 3).map((item) => (
              <div key={item.id} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {item.trackingNumber}
                  </span>
                  <StatusBadge status={item.status} size="sm" />
                </div>
                <p className="text-xs font-bold text-slate-200 line-clamp-1">
                  {item.title}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{item.transportMode.split(' ')[0]}</span>
                  <span>ETA: <strong className="text-slate-200">{item.eta}</strong></span>
                </div>
                {/* Mini Journey Steps */}
                <div className="flex items-center gap-1 pt-1">
                  {['Prepared', 'Loaded', 'In Transit', 'Delivered'].map((step, idx) => {
                    const isDone =
                      item.status === 'Delivered' ||
                      (item.status === 'In Transit' && idx <= 2) ||
                      (item.status === 'Staged at Port' && idx <= 0) ||
                      (item.status === 'Air-Dropped' && idx <= 2);
                    return (
                      <div
                        key={step}
                        className={`flex-1 h-1 rounded-full ${
                          isDone ? 'bg-cyan-400' : 'bg-slate-800'
                        }`}
                        title={step}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 6, 7 & 8: Role-Specific Operational Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Inventory Stock Alerts (Admin / Logistics / Medical) */}
        {canView(userProfile, 'inventory') && (
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-md shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white font-sans">
                  Critical Stock Alerts ({criticalStockItems.length})
                </h3>
              </div>
              <Link to="/inventory" className="text-xs font-mono text-cyan-400 hover:underline">
                Inventory Vault
              </Link>
            </div>

            <div className="space-y-2.5">
              {criticalStockItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={item.status} size="sm" />
                      <span className="text-[10px] text-slate-400 font-mono truncate">{item.station}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-200 truncate mt-1">{item.name}</p>
                    <p className="text-[10px] text-amber-400 font-mono">
                      Stock: {item.quantity} {item.unit} (Threshold: {item.minimumThreshold})
                    </p>
                  </div>
                  {canCreate(userProfile, 'inventory') && (
                    <button
                      type="button"
                      onClick={() => updateInventoryStock(item.id, 10)}
                      className="px-2.5 py-1 text-[11px] font-mono font-bold bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 rounded-lg flex-shrink-0"
                    >
                      +10 Restock
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personnel Crew Readiness (Admin / Expedition Lead / Medical) */}
        {canView(userProfile, 'personnel') && (
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-md shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white font-sans">
                  Personnel & Crew Telemetry
                </h3>
              </div>
              <Link to="/personnel" className="text-xs font-mono text-cyan-400 hover:underline">
                View Roster
              </Link>
            </div>

            <div className="space-y-2.5">
              {personnel.slice(0, 3).map((pers) => (
                <div
                  key={pers.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {pers.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">{pers.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{pers.role} • {pers.station}</p>
                    </div>
                  </div>
                  <div className="text-right font-mono flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-rose-400 font-bold">
                      <HeartPulse className="w-3 h-3 animate-pulse" />
                      <span>{pers.vitalStatus.heartRate} BPM</span>
                    </div>
                    <span className="text-[10px] text-cyan-300">{pers.vitalStatus.bodyTemp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Asset Readiness & Diagnostics (Admin / Logistics) */}
        {canView(userProfile, 'assets') && (
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-md shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white font-sans">
                  Asset Health & Readiness
                </h3>
              </div>
              <Link to="/assets" className="text-xs font-mono text-cyan-400 hover:underline">
                Fleet Grid
              </Link>
            </div>

            <div className="space-y-2.5">
              {assets.slice(0, 3).map((asset) => (
                <div
                  key={asset.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-cyan-300">{asset.assetTag}</span>
                    <span className={asset.healthScore < 70 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {asset.healthScore}% Health
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-200 truncate">{asset.name}</p>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        asset.healthScore < 70 ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${asset.healthScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Sorties Summary (Scientist / Viewer / Expedition Lead) */}
        {(canView(userProfile, 'expeditions') && (!canView(userProfile, 'inventory') || !canView(userProfile, 'assets'))) && (
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-md shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-sans">
                  Active Expeditions Summary
                </h3>
              </div>
              <Link to="/expeditions" className="text-xs font-mono text-cyan-400 hover:underline">
                Sortie Grid
              </Link>
            </div>

            <div className="space-y-2.5">
              {expeditions.slice(0, 3).map((exp) => (
                <div
                  key={exp.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-cyan-300">{exp.code}</span>
                    <StatusBadge status={exp.status} size="sm" />
                  </div>
                  <p className="font-semibold text-white truncate">{exp.title}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{exp.station}</span>
                    <span>{exp.region}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section 9 & 10: Mission Control Activity Logs & Live Telemetry Feed */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-md shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h3 className="text-base font-bold text-white font-sans">
              Recent Mission Control Activity & Cross-Module Log
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            AUTO-SYNCED TO POLAR GRID
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {activityLogs.slice(0, 4).map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-900 text-cyan-300 border border-slate-800">
                  {log.module}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{log.timestamp}</span>
              </div>
              <p className="font-bold text-white line-clamp-1">{log.action}</p>
              <p className="text-slate-300 text-[11px] line-clamp-2 leading-relaxed">{log.details}</p>
              <span className="text-[10px] font-mono text-slate-500 block pt-1">By: {log.user}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
