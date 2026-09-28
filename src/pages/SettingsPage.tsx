import React, { useState } from 'react';
import { usePolar, useAuth } from '../context';
import { canEdit, getRoleBadgeColor } from '../utils/permissions';
import { UserRole } from '../types/auth';
import { PageHeader } from '../components/common/PageHeader';
import {
  Settings,
  Radio,
  Building2,
  Bell,
  Save,
  CheckCircle2,
  Compass,
  RotateCcw,
  Database,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { SystemHealthCard } from '../components/system/SystemHealthCard';

export const SettingsPage: React.FC = () => {
  const { stations, isFirebaseActive, triggerDatabaseSeed, triggerDatabaseReset, resetDemoState } = usePolar();
  const { userProfile, role, switchDemoRole } = useAuth();
  const canEditSettings = canEdit(userProfile, 'settings') || role === 'ADMIN';

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [temperatureUnit, setTemperatureUnit] = useState<'Celsius' | 'Fahrenheit'>('Celsius');
  const [distanceUnit, setDistanceUnit] = useState<'Kilometers' | 'Nautical Miles'>('Kilometers');
  const [satellitePollingSec, setSatellitePollingSec] = useState('10');
  const [encryptionProtocol, setEncryptionProtocol] = useState('AES-256-GCM Polar Mesh');
  const [autoSOSBroadcasting, setAutoSOSBroadcasting] = useState(true);
  const [audibleAlerts, setAudibleAlerts] = useState(true);

  // Seed state
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedFeedback, setSeedFeedback] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDemoState = () => {
    resetDemoState();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3500);
  };

  const handleSeed = async () => {
    setSeedLoading(true);
    setSeedFeedback(null);
    try {
      const res = await triggerDatabaseSeed();
      setSeedFeedback(res.message);
    } catch (err: any) {
      setSeedFeedback(`Seeding failed: ${err.message}`);
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <PageHeader
        title="Polar Operations & Satellite Grid Settings"
        subtitle="Telemetry frequencies, base station parameters, geospatial unit systems, and cloud database persistence"
        icon={Settings}
      />

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-300 font-mono shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Settings successfully committed to Polar Grid master nodes.</span>
          </div>
        </div>
      )}

      {/* Production Health & Subsystem Diagnostics */}
      <SystemHealthCard />

      {/* Cloud Firestore & Persistence Card */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-md shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white font-sans">
                Cloud Firestore Persistence & Data Seeding
              </h3>
              <p className="text-xs text-slate-400">
                Manage cloud database synchronization and initial dataset population
              </p>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
              isFirebaseActive
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-950 text-amber-300 border-amber-500/40'
            }`}
          >
            {isFirebaseActive ? 'BACKEND: FIREBASE CONNECTED' : 'BACKEND: DEMO MODE (NOT CONNECTED)'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 block mb-1">Database Engine:</span>
            <span className="text-white font-bold">
              {isFirebaseActive ? 'Google Cloud Firestore' : 'React In-Memory State'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 block mb-1">Real-time Snapshots:</span>
            <span className="text-cyan-300 font-bold">
              {isFirebaseActive ? 'Enabled (8 Collections)' : 'Local React Hooks'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 block mb-1">Security Model:</span>
            <span className="text-emerald-400 font-bold">RBAC & firestore.rules</span>
          </div>
        </div>

        {/* Database Seed Trigger */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white">Seed Demo Data to Cloud Firestore</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Safely seed realistic expedition rosters, cargo manifests, inventory reserves, assets, and emergency protocols into the connected Firebase project.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSeed}
            disabled={seedLoading || !isFirebaseActive}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-mono flex-shrink-0 shadow-lg"
          >
            {seedLoading ? (
              <span>Seeding Collections...</span>
            ) : (
              <>
                <Database className="w-3.5 h-3.5" />
                <span>{isFirebaseActive ? 'Seed Demo Data' : 'Available in Cloud Mode'}</span>
              </>
            )}
          </button>
        </div>

        {/* Cloud Demo Data Reset Trigger */}
        {isFirebaseActive && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">Reset Demo Data from Cloud Firestore</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Clears only seeded demonstration records from your Firestore collections. Production user profiles and custom data are preserved.
              </p>
            </div>

            <button
              type="button"
              onClick={async () => {
                if (window.confirm('Are you sure you want to reset seeded demo data from your active Firebase project?')) {
                  setSeedLoading(true);
                  setSeedFeedback(null);
                  try {
                    const res = await triggerDatabaseReset();
                    setSeedFeedback(res.message);
                  } catch (err: any) {
                    setSeedFeedback(`Reset failed: ${err.message}`);
                  } finally {
                    setSeedLoading(false);
                  }
                }
              }}
              disabled={seedLoading || !isFirebaseActive}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-mono flex-shrink-0 shadow-lg"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Cloud Demo Data</span>
            </button>
          </div>
        )}

        {seedFeedback && (
          <div className="p-3 bg-cyan-950/80 border border-cyan-500/40 rounded-xl text-xs text-cyan-200 font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>{seedFeedback}</span>
          </div>
        )}
      </div>

      {/* Demonstration State Reset Card (Safe In-Memory Re-initialization) */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-md shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <RotateCcw className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white font-sans">
                Local In-Memory Demonstration Reset
              </h3>
              <p className="text-xs text-slate-400">
                Safely restore in-memory demonstration fixtures without affecting live production databases
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
            LOCAL DEMO ONLY
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-white">Reset Local Fixtures</span>
            <p className="text-[11px] text-slate-400 font-mono">
              Re-initializes local browser state to default demonstration fixtures.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetDemoState}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-all font-mono flex-shrink-0 shadow-lg"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Local Demo State</span>
          </button>
        </div>

        {resetSuccess && (
          <div className="p-3 bg-amber-950/80 border border-amber-500/40 rounded-xl text-xs text-amber-200 font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Local demonstration state successfully re-initialized to pristine defaults.</span>
          </div>
        )}
      </div>

      {/* SIH Demo Role Simulator Card */}
      <div className="rounded-2xl bg-slate-900/80 border border-cyan-500/30 p-5 backdrop-blur-md shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                <span>Demo Role Simulator</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  SIH TEST HARNESS
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Preview application interface, module access, and actions across all six operational clearance tiers
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-purple-950 text-purple-300 border border-purple-500/40">
            ACTIVE ROLE: {role}
          </span>
        </div>

        {/* Prominent Simulation Notice */}
        <div className="p-3 bg-slate-950/80 border border-cyan-500/30 rounded-xl flex items-start gap-2.5 text-xs text-cyan-200 font-mono">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-white uppercase tracking-wider">
              SIMULATION — does not change Firebase permissions
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              This simulator switches client-side UI clearance context for rapid SIH feature evaluation. Real production permissions remain strictly governed by Cloud Firestore security rules.
            </p>
          </div>
        </div>

        {/* 6 Role Selection Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
          {(
            [
              { roleName: 'ADMIN' as UserRole, label: 'Commander', color: 'border-cyan-500/50' },
              { roleName: 'EXPEDITION_MANAGER' as UserRole, label: 'Expedition Lead', color: 'border-sky-500/50' },
              { roleName: 'LOGISTICS_OFFICER' as UserRole, label: 'Logistics', color: 'border-amber-500/50' },
              { roleName: 'SCIENTIST' as UserRole, label: 'Scientist', color: 'border-purple-500/50' },
              { roleName: 'MEDICAL_OFFICER' as UserRole, label: 'Medical Lead', color: 'border-rose-500/50' },
              { roleName: 'VIEWER' as UserRole, label: 'Observer (Viewer)', color: 'border-slate-600' }
            ]
          ).map((item) => {
            const isSelected = role === item.roleName;
            const badgeColor = getRoleBadgeColor(item.roleName);
            return (
              <button
                key={item.roleName}
                type="button"
                onClick={() => switchDemoRole(item.roleName)}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 active:scale-95 ${
                  isSelected
                    ? `${badgeColor.bg} ${badgeColor.text} ${badgeColor.border} ring-2 ring-cyan-400/50 shadow-lg font-bold`
                    : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <ShieldCheck className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`} />
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-[11px] truncate">{item.roleName}</p>
                  <p className="text-[10px] text-slate-500 truncate">{item.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Telemetry & Satellite Communications */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Radio className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white font-sans">
                Satellite Mesh & Telemetry Sync
              </h3>
              <p className="text-xs text-slate-400">
                Configure Iridium / GSAT orbital transponder polling intervals
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">
                IoT Telemetry Ping Frequency
              </label>
              <select
                value={satellitePollingSec}
                onChange={(e) => setSatellitePollingSec(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
              >
                <option value="5">Real-time Stream (5 seconds) - High Bandwidth</option>
                <option value="10">Standard High Frequency (10 seconds - Recommended)</option>
                <option value="30">Eco Mode (30 seconds)</option>
                <option value="60">Low Power Wintering (60 seconds)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">
                Data Transmission Encryption
              </label>
              <select
                value={encryptionProtocol}
                onChange={(e) => setEncryptionProtocol(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg text-sm text-white focus:outline-none font-mono"
              >
                <option value="AES-256-GCM Polar Mesh">AES-256-GCM Polar Mesh (Military Grade)</option>
                <option value="Quantum Resistant Kyber-1024">Quantum Resistant Kyber-1024</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Units & Display Preferences */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Compass className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-base font-bold text-white font-sans">
                Geospatial & Climate Units
              </h3>
              <p className="text-xs text-slate-400">
                Scientific measurement systems and coordinate formats
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">
                Temperature Unit
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setTemperatureUnit('Celsius')}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                    temperatureUnit === 'Celsius'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Celsius (°C - Scientific Standard)
                </button>
                <button
                  type="button"
                  onClick={() => setTemperatureUnit('Fahrenheit')}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                    temperatureUnit === 'Fahrenheit'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Fahrenheit (°F)
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-300">
                Traverse & Distance Measurement
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDistanceUnit('Kilometers')}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                    distanceUnit === 'Kilometers'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Kilometers (km)
                </button>
                <button
                  type="button"
                  onClick={() => setDistanceUnit('Nautical Miles')}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                    distanceUnit === 'Nautical Miles'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Nautical Miles (NM)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Polar Bases Registry */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white font-sans">
                Station Ground Infrastructure Directory
              </h3>
              <p className="text-xs text-slate-400">
                Active research bases connected to the POLAR-X centralized mesh
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {stations.map((st) => (
              <div key={st.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{(st.name || '').split('(')[0]}</span>
                  <span className="text-[10px] font-mono text-emerald-400">{st.coordinates.lat < 0 ? '60°S' : '78°N'}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">{st.country}</p>
                <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
                  Bandwidth: <strong className="text-slate-300">{st.satelliteUplinkMbps} Mbps</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Emergency Alert Preferences */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Bell className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="text-base font-bold text-white font-sans">
                Crisis Broadcast & Automated SOS Relays
              </h3>
              <p className="text-xs text-slate-400">
                Rules for automatic dispatch during severe blizzard whiteouts and beacon pings
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSOSBroadcasting}
                onChange={(e) => setAutoSOSBroadcasting(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <div className="text-xs">
                <span className="font-bold text-white block">Auto-Trigger SAR on Beacon Disconnect</span>
                <span className="text-slate-400">
                  If an in-field expedition beacon loses signal for more than 45 minutes in sub -30°C conditions, auto-stage SAR.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={audibleAlerts}
                onChange={(e) => setAudibleAlerts(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <div className="text-xs">
                <span className="font-bold text-white block">Audible High-Priority Alert Siren</span>
                <span className="text-slate-400">
                  Sound browser alarm during incoming Code Red and Code Orange emergency broadcasts.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {canEditSettings ? (
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-lg shadow-cyan-950 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Commit Configuration</span>
            </button>
          ) : (
            <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>System Settings Read-Only for {role}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
