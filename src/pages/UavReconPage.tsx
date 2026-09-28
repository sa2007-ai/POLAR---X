import React, { useState, useEffect } from 'react';
import { usePolar, useAuth } from '../context';
import { UavTelemetry, CrevasseDetection } from '../types/uav';
import { uavReconService } from '../services/uav/simulatedUavProvider';
import { edgeAiService } from '../services/ai/edgeAiService';
import { EdgeAiModel, CrevasseInferenceResult } from '../services/ai/inferenceTypes';
import { uavAutonomyManager } from '../services/uav/uavAutonomyManager';
import { uavReturnHomeService } from '../services/uav/uavReturnHomeService';
import { uavLinkMonitor } from '../services/uav/uavLinkMonitor';
import {
  UavAutonomyStatus,
  UavCommandAuditRecord
} from '../services/uav/uavAutonomyTypes';
import { CapabilityStatusBadge } from '../components/common/CapabilityStatusBadge';
import {
  Plane,
  AlertTriangle,
  Flame,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Brain,
  Scan,
  Radio,
  RotateCcw,
  Play,
  Compass,
  Battery,
  MapPin,
  Lock,
  ArrowRight,
  Activity
} from 'lucide-react';

import { canCreate } from '../utils/permissions';

export const UavReconPage: React.FC = () => {
  const { addGeofence, logActivity } = usePolar();
  const { userProfile, role } = useAuth();
  const isViewer = role === 'VIEWER' || (!canCreate(userProfile, 'uav') && role !== 'ADMIN');

  const [uavFleet, setUavFleet] = useState<UavTelemetry[]>(uavReconService.getUavFleet());
  const [detections, setDetections] = useState<CrevasseDetection[]>(uavReconService.getDetections());
  const [selectedUavId, setSelectedUavId] = useState<string>(uavFleet[0]?.uavId || 'uav-01');
  const [activeThermalMode, setActiveThermalMode] = useState<'IRONBOW' | 'RAINBOW' | 'WHITE_HOT'>('IRONBOW');

  // Autonomy & RTL State
  const [autonomyStatus, setAutonomyStatus] = useState<UavAutonomyStatus>(uavAutonomyManager.getStatus());
  const [auditLog, setAuditLog] = useState<UavCommandAuditRecord[]>(uavAutonomyManager.getAuditHistory());
  const [homePoints] = useState(uavReturnHomeService.getHomePoints());
  const [selectedHomeId, setSelectedHomeId] = useState<string>(homePoints[0]?.id || 'home-sledge-01');

  // Controlled 24-Step Phase 9 Scenario State
  const [demoStep, setDemoStep] = useState<number>(0);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const phase9DemoSteps = [
    '1. UAV-RECON-ALPHA initiates scouting flight on mission corridor Alpha-4.',
    '2. UAV streams valid GNSS telemetry fix (-70.920°S, 11.850°E, 145m AGL).',
    '3. Airborne forward transit active (Speed: 48 km/h, Battery: 76.5%).',
    '4. Radiometric LWIR thermal sensor detects surface temperature gradient.',
    '5. Atmospheric ionospheric storm causes link quality to drop to 40% (LINK_DEGRADED).',
    '6. RF signal timeout exceeds 10.0s threshold — State transitioned to LINK_LOST.',
    '7. Autonomy engine assesses RTL readiness across return corridor.',
    '8. Selected Home Point verified (Traverse Sledge 01 Mobile Pad).',
    '9. Battery estimation check: 76% available vs 18% required (PASS).',
    '10. Geofence & restricted wildlife zones evaluated (CLEAR).',
    '11. Autonomous system requests RTL command (State: RTL_REQUESTED).',
    '12. Simulated PX4 Autopilot MAVLink bridge accepts command (State: RTL_ACTIVE).',
    '13. UAV recalculates bearing vector directly toward Home Point.',
    '14. UAV returns along safe corridor (Altitude elevated to 165m AGL).',
    '15. Satellite broadband bearer link establishes telemetry backup bridge.',
    '16. Emergency P0 SOS packet generated with signed coordinates.',
    '17. Satellite gateway confirms ACK handshake (ACK-IRIDIUM-7740).',
    '18. UAV arrives within 250m safety radius of Recovery Pad.',
    '19. Autonomous landing sequence initiated (State: LANDING).',
    '20. Ground contact confirmed — UAV state transitioned to RECOVERED.',
    '21. Multi-view RGB and radiometric IR imagery uploaded to 3D pipeline.',
    '22. 3D surface mesh & point cloud generated for detected anomaly.',
    '23. Glaciological human review confirms 26.5m deep crevasse hazard.',
    '24. Active hazard geofence created & Route Planner detour applied.'
  ];

  useEffect(() => {
    const unsubUav = uavReconService.subscribe((uavs, dets) => {
      setUavFleet(uavs);
      setDetections(dets);
    });

    const unsubAutonomy = uavAutonomyManager.subscribe((st) => setAutonomyStatus(st));
    const unsubAudit = uavAutonomyManager.subscribeAudit((aud) => setAuditLog(aud));

    return () => {
      unsubUav();
      unsubAutonomy();
      unsubAudit();
    };
  }, []);

  // Edge AI State
  const [models, setModels] = useState<EdgeAiModel[]>(edgeAiService.getModels());
  const [aiDetections, setAiDetections] = useState<CrevasseInferenceResult[]>(edgeAiService.getDetections());
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const unsubModels = edgeAiService.subscribeModels((m) => setModels(m));
    const unsubDetections = edgeAiService.subscribeDetections((d) => setAiDetections(d));
    return () => {
      unsubModels();
      unsubDetections();
    };
  }, []);

  const activeUav = uavFleet.find((u) => u.uavId === selectedUavId) || uavFleet[0];
  const activeModel = models.find((m) => m.status === 'INSTALLED');

  const handleRunEdgeAiScan = async () => {
    if (!activeUav) return;
    setIsScanning(true);
    await edgeAiService.scanThermalImage({
      imageId: `IMG-UAV-${Date.now()}`,
      latitude: activeUav.coordinates.lat,
      longitude: activeUav.coordinates.lng,
      altitudeMeters: activeUav.coordinates.altitudeMeters,
      modelId: activeModel?.modelId
    });
    setIsScanning(false);
  };

  const handleConfirmAiDetection = async (det: CrevasseInferenceResult) => {
    const geofenceCode = `GEO-AI-${det.detectionId.replace(/[^a-zA-Z0-9]/g, '').slice(-6)}`;
    await addGeofence({
      code: geofenceCode,
      name: `AI Confirmed Crevasse: ${det.detectionId}`,
      type: 'hazard',
      severity: det.riskLevel === 'HIGH' ? 'Critical' : 'Warning',
      stationOrRegion: 'Traverse Sector Alpha',
      shape: 'circle',
      center: {
        lat: det.latitude,
        lng: det.longitude
      },
      radiusMeters: Math.max(350, (det.crevasseWidthMeters || 10) * 25),
      description: `Confirmed from Edge AI inference (${det.modelId} v${det.modelVersion}). Confidence: ${Math.round(det.confidence * 100)}%. Thermal Delta: ${det.temperatureDeltaKelvin}°K.`,
      rules: ['Ground traverse prohibited', 'Mandatory detour route'],
      status: 'active'
    });

    edgeAiService.reviewDetection(
      det.detectionId,
      'CONFIRMED',
      'Verified by Field Commander and promoted to active geofence.',
      'MISSION_COMMANDER',
      geofenceCode
    );
  };

  const handleRejectAiDetection = (det: CrevasseInferenceResult) => {
    edgeAiService.reviewDetection(
      det.detectionId,
      'REJECTED',
      'Surface sastrugi shadow artifact / false positive.',
      'MISSION_COMMANDER'
    );
  };

  const handlePromoteToGeofence = async (det: CrevasseDetection) => {
    await addGeofence({
      code: `GEO-CRV-${det.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6)}`,
      name: `UAV Detected Crevasse: ${det.id}`,
      type: 'hazard',
      severity: det.riskLevel === 'HIGH_RISK' ? 'Critical' : 'Warning',
      stationOrRegion: 'Forward Traverse Corridor',
      shape: 'circle',
      center: {
        lat: det.coordinates.lat,
        lng: det.coordinates.lng
      },
      radiusMeters: Math.max(300, det.estimatedLengthMeters * 1.5),
      description: `Discovered by ${det.uavId} via Thermal IR Gradient (${det.thermalGradientDeltaC}°C). Confidence: ${det.confidenceScorePercent}%. ${det.notes}`,
      rules: ['Vehicle traverse strictly prohibited', 'Ground penetrating radar scan mandatory'],
      status: 'active'
    });
    setActionFeedback(`Crevasse ${det.id} successfully converted to an active mission hazard geofence.`);
  };

  const riskBadgeColors = {
    HIGH_RISK: 'bg-rose-950 text-rose-300 border-rose-500/50 animate-pulse',
    MODERATE_RISK: 'bg-amber-950 text-amber-300 border-amber-500/40',
    LOW_RISK: 'bg-emerald-950 text-emerald-300 border-emerald-500/30',
    UNKNOWN: 'bg-slate-800 text-slate-400 border-slate-700'
  };

  const handleSelectHomePoint = (id: string) => {
    setSelectedHomeId(id);
    uavReturnHomeService.selectHomePoint(id);
    const hp = uavReturnHomeService.getSelectedHomePoint();
    if (hp) {
      setActionFeedback(`Selected Home Point: ${hp.name} (${hp.coordinates.lat.toFixed(4)}°S, ${hp.coordinates.lng.toFixed(4)}°E)`);
    }
  };

  const handleToggleSimulatedLinkLoss = () => {
    const nextLost = autonomyStatus.linkHealth === 'HEALTHY';
    uavLinkMonitor.setSimulatedLinkLost(nextLost);
    setActionFeedback(nextLost ? 'Simulated RF Link Lost (Telemetry timeout > 10.0s triggered)' : 'Simulated RF Link Restored (Nominal telemetry stream)');
  };

  const handleExecuteFlightCommand = async (command: any) => {
    const op = userProfile?.displayName || 'Field Commander';
    const res = await uavAutonomyManager.executeCommand(
      command,
      op,
      role,
      `Operator command issued from Command Dashboard.`
    );
    setActionFeedback(res.message);

    logActivity(
      'expeditions',
      `UAV Flight Command: ${command}`,
      res.message,
      res.success ? 'info' : 'warning',
      op
    );
  };

  const handleAdvanceDemo = () => {
    setDemoStep((prev) => {
      const next = prev < phase9DemoSteps.length - 1 ? prev + 1 : 0;
      setActionFeedback(`Step ${next + 1}: ${phase9DemoSteps[next]}`);
      return next;
    });
  };

  const handleResetDemo = () => {
    setDemoStep(0);
    uavLinkMonitor.setSimulatedLinkLost(false);
    setActionFeedback('Demonstration scenario reset to Step 1.');
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-wider text-slate-100 uppercase flex items-center gap-2.5">
              <Plane className="w-6 h-6 text-cyan-400" />
              Autonomous UAV Reconnaissance & Safety Command
            </h1>
            <CapabilityStatusBadge state="SIMULATED" size="sm" />
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            ArduPilot / PX4 MAVLink Autopilot • Autonomous Link-Loss & RTL Interlock • Radiometric Thermal IR Crevasse Inversion
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleToggleSimulatedLinkLoss}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              autonomyStatus.linkHealth === 'LOST'
                ? 'bg-rose-950 text-rose-300 border-rose-500/50 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{autonomyStatus.linkHealth === 'LOST' ? 'RF Link Lost (Simulated)' : 'Simulate Link Loss'}</span>
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3.5 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-xs text-cyan-200 flex items-center justify-between animate-fadeIn">
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="text-cyan-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* 24-Step Controlled Demonstration Walkthrough Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-indigo-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-sans">
                  PHASE 9 CONTROLLED END-TO-END DEMO SCENARIO
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                  STEP {demoStep + 1} OF 24
                </span>
                <CapabilityStatusBadge state="SIMULATED" size="xs" />
              </div>
              <p className="text-[11px] text-slate-400">
                Deterministic 24-step walkthrough: UAV Mission ➔ Link Loss ➔ Autonomous RTL ➔ Satellite SOS ➔ 3D Reconstruction ➔ Hazard Geofence.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAdvanceDemo}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-950/50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Next Step ({demoStep + 1}/24)</span>
            </button>
            <button
              onClick={handleResetDemo}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
              title="Reset Scenario"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current Step Highlight */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/40 text-xs font-mono text-indigo-200 flex items-center gap-3">
          <ArrowRight className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span className="font-semibold">{phase9DemoSteps[demoStep]}</span>
        </div>
      </div>

      {/* UAV Autonomy & Return-To-Home Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Autopilot Flight State */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-slate-300">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Autopilot State
            </span>
            <span className="text-[10px] text-slate-500">{autonomyStatus.flightControllerName.slice(0, 14)}...</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-cyan-300">{autonomyStatus.flightState}</span>
            <CapabilityStatusBadge state={autonomyStatus.dataState} size="xs" />
          </div>
          <div className="text-[10px] text-slate-500 truncate">
            GPS Fix: {autonomyStatus.currentCoordinates.lat.toFixed(4)}°, {autonomyStatus.currentCoordinates.lng.toFixed(4)}° ({autonomyStatus.gpsSatellites} Sats)
          </div>
        </div>

        {/* Communication Link Health */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-slate-300">
              <Radio className="w-4 h-4 text-cyan-400" />
              Telemetry Link
            </span>
            <span className="text-[10px] text-slate-500">{autonomyStatus.telemetryFreshnessMs}ms ago</span>
          </div>
          <div className="flex items-center justify-between">
            <span
              className={`text-base font-bold ${
                autonomyStatus.linkHealth === 'HEALTHY'
                  ? 'text-emerald-400'
                  : autonomyStatus.linkHealth === 'DEGRADED'
                    ? 'text-amber-400'
                    : 'text-rose-400'
              }`}
            >
              {autonomyStatus.linkHealth} ({autonomyStatus.linkQualityPercent}%)
            </span>
            <span className={`w-2 h-2 rounded-full ${autonomyStatus.linkHealth === 'HEALTHY' ? 'bg-emerald-400' : 'bg-rose-400'} animate-ping`} />
          </div>
          <div className="text-[10px] text-slate-500">
            Link-Loss Timeout: {autonomyStatus.linkTimeoutSeconds}s Threshold
          </div>
        </div>

        {/* Battery & Power Estimation */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-slate-300">
              <Battery className="w-4 h-4 text-emerald-400" />
              Avionics Battery
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">Heated LiPo</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-white">{autonomyStatus.batteryPercent.toFixed(1)}%</span>
            <span className="text-xs text-slate-400">RTL Req: {autonomyStatus.rtlReadiness.batteryRequiredPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${
                autonomyStatus.batteryPercent > 30 ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, autonomyStatus.batteryPercent)}%` }}
            />
          </div>
        </div>

        {/* RTL Safety Readiness Interlock */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-slate-300">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              RTL Interlock
            </span>
            <span className="text-[10px] text-slate-500">Safety Verification</span>
          </div>
          <div className="flex items-center justify-between">
            <span
              className={`text-base font-bold ${
                autonomyStatus.rtlReadiness.canExecuteRtl ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {autonomyStatus.rtlReadiness.canExecuteRtl ? 'RTL AUTHORIZED' : 'RTL BLOCKED'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {autonomyStatus.rtlReadiness.canExecuteRtl
              ? `Distance: ${autonomyStatus.rtlReadiness.distanceToHomeMeters}m (~${autonomyStatus.rtlReadiness.estimatedReturnTimeMinutes} min)`
              : `Blocked: ${autonomyStatus.rtlReadiness.blockedReasons.join(', ')}`}
          </div>
        </div>
      </div>

      {/* Home Point Management & Flight Command Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Home Point Selector & Autonomy Commands */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-sans">
                Verified Return-To-Home (RTL) Target Points
              </h3>
            </div>
            <span className="text-xs text-slate-500">Autonomous Failover Waypoint</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {homePoints.map((hp) => {
              const isSelected = selectedHomeId === hp.id;
              return (
                <div
                  key={hp.id}
                  onClick={() => handleSelectHomePoint(hp.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-500 shadow-md shadow-cyan-950/50'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate">{hp.name}</span>
                    <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                  </div>
                  <div className="text-[11px] text-slate-400">{hp.stationOrRegion}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {hp.coordinates.lat.toFixed(3)}°S, {hp.coordinates.lng.toFixed(3)}°E ({hp.coordinates.altitudeMeters}m)
                  </div>
                  <div className="text-[9px] text-emerald-400 flex items-center gap-1 pt-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified Safe Corridor
                  </div>
                </div>
              );
            })}
          </div>

          {/* Autonomy Command Controls */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 uppercase">Autopilot Flight Commands:</span>
              <span className="text-[10px] text-slate-500">Simulated MAVLink Autopilot Controller</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleExecuteFlightCommand('REQUEST_RTL')}
                disabled={isViewer || !autonomyStatus.rtlReadiness.canExecuteRtl}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-lg shadow-rose-950/50 disabled:opacity-40 cursor-pointer"
                title="Command UAV to execute Return-To-Home"
              >
                <Compass className="w-4 h-4" />
                <span>Request Return-To-Home (RTL)</span>
              </button>

              <button
                onClick={() => handleExecuteFlightCommand('ABORT_RTL')}
                disabled={isViewer || autonomyStatus.flightState !== 'RTL_ACTIVE'}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Abort RTL</span>
              </button>

              <button
                onClick={() => handleExecuteFlightCommand('PAUSE_MISSION')}
                disabled={isViewer || autonomyStatus.flightState !== 'MISSION_ACTIVE'}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer"
              >
                <span>Hold Loiter</span>
              </button>

              <button
                onClick={() => handleExecuteFlightCommand('RESUME_MISSION')}
                disabled={isViewer || autonomyStatus.flightState !== 'IDLE'}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer"
              >
                <span>Resume Mission</span>
              </button>
            </div>

            {isViewer && (
              <div className="text-[10px] text-amber-400 bg-amber-950/40 border border-amber-800/40 p-2 rounded flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                <span>VIEWER Role Restriction: Flight commands require EXPEDITION_MANAGER or ADMIN privileges.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Append-Only Command Audit History Stream */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Command Audit History ({auditLog.length})
            </h3>
            <span className="text-[10px] text-slate-500">Append-Only Log</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {auditLog.map((aud) => (
              <div
                key={aud.id}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300">{aud.command}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      aud.executionStatus === 'SIMULATED_SUCCESS' || aud.executionStatus === 'ACCEPTED'
                        ? 'bg-emerald-950 text-emerald-300'
                        : aud.executionStatus === 'REJECTED_RBAC'
                          ? 'bg-rose-950 text-rose-300'
                          : 'bg-amber-950 text-amber-300'
                    }`}
                  >
                    {aud.executionStatus}
                  </span>
                </div>
                <div className="text-slate-400 truncate">{aud.reason}</div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                  <span>By: {aud.operator} ({aud.operatorRole})</span>
                  <span>{new Date(aud.timestamp).toUTCString().slice(17, 22)} UTC</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edge AI Neural Network Model Manager Card */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-400">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-sans">EDGE AI / ONNX RUNTIME CREVASSE CLASSIFIER</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/30">
                  {activeModel ? `${activeModel.precision} QUANTIZED` : 'DEMO MODE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                On-device neural network execution for radiometric thermal anomaly segmentation. Operates with zero network connectivity.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isScanning}
            onClick={handleRunEdgeAiScan}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-lg shadow-purple-950/50 disabled:opacity-50 cursor-pointer"
          >
            <Scan className="w-4 h-4" />
            <span>{isScanning ? 'Running ONNX Inference...' : 'Run Edge AI Thermal Scan'}</span>
          </button>
        </div>

        {/* Models Specs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {models.map((m) => {
            const isInstalled = m.status === 'INSTALLED';
            const isDownloading = m.status === 'DOWNLOADING';
            return (
              <div key={m.modelId} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-slate-200">{m.name}</span>
                    <span className="text-[10px] text-slate-500">v{m.version}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                    isInstalled
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                      : isDownloading
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/30 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {m.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{m.description}</p>
                <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-900 text-slate-500 font-mono">
                  <span>Size: {m.sizeMb} MB ({m.framework})</span>
                  <span>Input: {m.inputFormat.slice(0, 20)}...</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Edge AI Detections & Human Review Stream */}
        {aiDetections.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-slate-800/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Recent Edge AI Detections & Human Review ({aiDetections.length})
            </span>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {aiDetections.slice(0, 4).map((det) => (
                <div
                  key={det.detectionId}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 truncate max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{det.detectionId}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        det.riskLevel === 'HIGH' ? 'bg-rose-950 text-rose-300 border border-rose-500/30' : 'bg-amber-950 text-amber-300'
                      }`}>
                        {det.riskLevel} RISK ({Math.round(det.confidence * 100)}%)
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        det.status === 'CONFIRMED' ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {det.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {det.reviewNotes} • Location: [{det.latitude.toFixed(4)}°, {det.longitude.toFixed(4)}°] • Depth: ~{det.estimatedDepthMeters}m
                    </p>
                  </div>

                  {/* Human Review Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {det.status === 'DETECTED' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleConfirmAiDetection(det)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Confirm & Geofence
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectAiDetection(det)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 text-[11px] transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {det.status === 'CONFIRMED' && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Promoted to Geofence</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: UAV Fleet Sorties */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Airborne UAV Units ({uavFleet.length})
          </h3>

          <div className="space-y-3">
            {uavFleet.map((uav) => {
              const isSelected = uav.uavId === selectedUavId;
              return (
                <div
                  key={uav.uavId}
                  onClick={() => setSelectedUavId(uav.uavId)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-950/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-cyan-400">{uav.code}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/20">
                      {uav.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white font-sans truncate mb-2">{uav.model}</h4>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 mb-2">
                    <div>
                      <span className="text-slate-500">Speed:</span> <strong className="text-slate-200">{uav.speedKmh} km/h</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Alt:</span> <strong className="text-cyan-300">{uav.coordinates.altitudeMeters}m</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Battery:</span> <strong className="text-emerald-400">{uav.batteryLevelPercent}%</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Flight:</span> <strong className="text-slate-200">{Math.round(uav.flightTimeMinutes)}m</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/80">
                    <span className="truncate">{uav.missionName}</span>
                    <span className="text-amber-400 font-bold">{uav.detectionsCount} Detections</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: UAV Sensor Feed & Detected Crevasses Matrix */}
        <div className="lg:col-span-8 space-y-6">
          {activeUav && (
            <>
              {/* Thermal Infrared Camera Simulation Feed */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white font-sans">
                        Forward Thermal Infrared Radiometric Stream ({activeUav.code})
                      </h3>
                      <p className="text-[10px] text-slate-400">Sensor: Flir Boson 640 LWIR Radiometric Camera</p>
                    </div>
                  </div>

                  {/* Palette Switcher */}
                  <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px]">
                    {(['IRONBOW', 'RAINBOW', 'WHITE_HOT'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setActiveThermalMode(mode)}
                        className={`px-2 py-0.5 rounded transition-colors ${
                          activeThermalMode === mode ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {mode.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulated Thermal Imaging Canvas Display */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 flex flex-col justify-between p-4 shadow-inner">
                  {/* Thermal Background Gradient */}
                  <div
                    className="absolute inset-0 opacity-40 pointer-events-none"
                    style={{
                      background:
                        activeThermalMode === 'IRONBOW'
                          ? 'radial-gradient(circle at 60% 40%, rgba(245, 158, 11, 0.4), rgba(185, 28, 28, 0.5) 40%, rgba(30, 27, 75, 0.9) 80%)'
                          : activeThermalMode === 'RAINBOW'
                          ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.5), rgba(168, 85, 247, 0.5), rgba(239, 68, 68, 0.5))'
                          : 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.4), rgba(50, 50, 50, 0.9))'
                    }}
                  />

                  {/* Telemetry HUD Overlays */}
                  <div className="relative z-10 flex justify-between text-xs text-cyan-300 font-mono">
                    <div className="space-y-0.5 bg-slate-950/80 p-2 rounded border border-slate-800">
                      <div>UAV ALT: <strong className="text-white">{activeUav.coordinates.altitudeMeters}m AGL</strong></div>
                      <div>SURFACE DELTA: <strong className="text-amber-400">-5.4°C (ANOMALY)</strong></div>
                    </div>
                    <div className="space-y-0.5 bg-slate-950/80 p-2 rounded border border-slate-800 text-right">
                      <div>FOV: 45° LWIR</div>
                      <div>FPS: 30.0 (SIMULATED)</div>
                    </div>
                  </div>

                  {/* Target Bounding Box overlay */}
                  <div className="relative z-10 mx-auto border-2 border-rose-500/80 bg-rose-500/10 p-3 rounded-lg flex flex-col items-center justify-center animate-pulse">
                    <AlertTriangle className="w-6 h-6 text-rose-400 mb-1" />
                    <span className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                      SUB-SURFACE CREVASSE FRACTURE DETECTED
                    </span>
                    <span className="text-[10px] text-white">Confidence: 94% • Width: 6.5m • Length: 180m</span>
                  </div>

                  <div className="relative z-10 flex justify-between text-[10px] text-slate-400 bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
                    <span>GPS: {activeUav.coordinates.lat.toFixed(5)}°, {activeUav.coordinates.lng.toFixed(5)}°</span>
                    <span>BEARING: {activeUav.headingDegrees}°</span>
                  </div>
                </div>
              </div>

              {/* Detected Crevasse Hazards Matrix */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                    <h3 className="text-sm font-bold text-white font-sans">
                      Detected Crevasse Hazard Records ({detections.length})
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-500">Method: Thermal Gradient & Shadow Analysis</span>
                </div>

                <div className="space-y-3">
                  {detections.map((det) => (
                    <div
                      key={det.id}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-cyan-400">{det.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${riskBadgeColors[det.riskLevel]}`}>
                            {det.riskLevel.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-xs text-emerald-400 font-bold">
                          {det.confidenceScorePercent}% Confidence
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {det.notes}
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                        <div>
                          <span className="text-slate-500">Estimated Dim:</span>
                          <div className="text-slate-200">{det.estimatedWidthMeters}m × {det.estimatedLengthMeters}m</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Apparent Depth:</span>
                          <div className="text-slate-200">{det.apparentDepthMeters || 20}m</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Thermal Delta:</span>
                          <div className="text-amber-400 font-bold">{det.thermalGradientDeltaC}°C</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Coordinates:</span>
                          <div className="text-slate-200 truncate">{det.coordinates.lat.toFixed(4)}°, {det.coordinates.lng.toFixed(4)}°</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <span className="text-[10px] text-slate-500">Discovered {new Date(det.timestamp).toUTCString().slice(17, 22)} UTC</span>
                        <button
                          type="button"
                          onClick={() => handlePromoteToGeofence(det)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-500/40 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          <span>Establish Geofence Zone</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
