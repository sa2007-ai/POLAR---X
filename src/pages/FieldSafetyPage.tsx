/**
 * POLAR-X Phase 8 — Advanced Field Safety & Multi-Sensor Command Center
 * WebGPU Edge AI • AFSK 1200 Audio Modem • LoRa Mesh • BLE Biometrics • Unified Failover
 */

import React, { useState, useEffect } from 'react';
import { fieldSafetyService } from '../services/safety/fieldSafetyService';
import { PersonnelSafetyStatusSummary, FieldSafetyAlert } from '../services/safety/fieldSafetyTypes';
import { communicationManager } from '../services/communications/communicationManager';
import { CommBearerStatus, CommFailoverEvent } from '../services/communications/communicationTypes';
import { loraDeviceManager } from '../services/radio/lora/loraDeviceManager';
import { LoraNodeInfo } from '../services/radio/lora/loraTypes';
import { audioModemService } from '../services/radio/afsk/audioModemService';
import { audioDeviceManager } from '../services/radio/afsk/audioDeviceManager';
import { aiRuntimeManager, AiExecutionMetrics } from '../services/ai/aiRuntimeManager';
import { aiHardwareCapabilities, WebGpuAdapterInfo } from '../services/ai/aiHardwareCapabilities';
import {
  ShieldAlert,
  Heart,
  Thermometer,
  Radio,
  Cpu,
  Volume2,
  Share2,
  Activity,
  AlertTriangle,
  Send,
  Play,
  RotateCcw,
  Zap,
  ArrowRight,
  Battery,
  Users
} from 'lucide-react';

export const FieldSafetyPage: React.FC = () => {
  // 1. Safety Roster & Alerts State
  const [roster, setRoster] = useState<PersonnelSafetyStatusSummary[]>(fieldSafetyService.getRoster());
  const [safetyAlerts, setSafetyAlerts] = useState<FieldSafetyAlert[]>(fieldSafetyService.getAlerts());

  // 2. Unified Comms & Failover State
  const [bearers, setBearers] = useState<CommBearerStatus[]>(communicationManager.getBearers());
  const [failoverHistory, setFailoverHistory] = useState<CommFailoverEvent[]>(communicationManager.getFailoverHistory());

  // 3. LoRa Mesh State
  const [meshNodes, setMeshNodes] = useState<LoraNodeInfo[]>(loraDeviceManager.getNodes());
  const [meshBroadcastText, setMeshBroadcastText] = useState('');

  // 4. Audio Modem State
  const [audioStatus, setAudioStatus] = useState(audioModemService.getStatus());
  const [isTransmittingAudio, setIsTransmittingAudio] = useState(false);
  const [audioDeviceInfo] = useState(audioDeviceManager.getDeviceInfo());

  // 5. WebGPU & AI Acceleration State
  const [gpuInfo, setGpuInfo] = useState<WebGpuAdapterInfo | null>(null);
  const [aiMetrics, setAiMetrics] = useState<AiExecutionMetrics | null>(aiRuntimeManager.getLatestMetrics());
  const [activeBackend] = useState(aiRuntimeManager.getActiveBackend());

  // 6. Interactive 14-Step Controlled Field Demo Scenario State
  const [demoStep, setDemoStep] = useState<number>(0);

  const demoScenarioSteps = [
    '1. Web Serial GNSS hardware connected (u-blox NEO-M8N)',
    '2. Field personnel geographic fix authenticated (-70.767°S, 11.733°E)',
    '3. BLE biometric strap paired (Heart Rate: 84 BPM, Skin Temp: 32.4°C)',
    '4. Meshtastic LoRa mesh initialized (4 nodes active, LongFast-Antarctica)',
    '5. Airborne UAV radiometric thermal IR reconnaissance scan initiated',
    '6. Sub-surface crevasse anomaly detected (ΔT = 4.2°K gradient)',
    '7. Human review verification & promotion to mission hazard geofence',
    '8. Traverse route recalculated: automatic corridor detour penalty applied',
    '9. Primary LoRa node obstructed by nunatak: communication timeout detected',
    '10. Unified manager triggered automated failover to AFSK Audio / Convoy Mesh',
    '11. Emergency SOS packet generated with signed coordinates & biometrics',
    '12. Low-bandwidth CRC16 telegram transmitted via backup carrier',
    '13. Remote base relay confirmed packet delivery (ACK handshake verified)',
    '14. Mission stabilized: All personnel safety telemetry restored to NORMAL'
  ];

  useEffect(() => {
    const unsubSafety = fieldSafetyService.subscribe((r, a) => {
      setRoster(r);
      setSafetyAlerts(a);
    });

    const unsubComms = communicationManager.subscribe(() => {
      setBearers(communicationManager.getBearers());
      setFailoverHistory(communicationManager.getFailoverHistory());
    });

    const unsubLoraNodes = loraDeviceManager.subscribeNodes((n) => setMeshNodes(n));
    const unsubLoraPackets = loraDeviceManager.subscribePackets(() => {});

    const unsubAudio = audioModemService.subscribe((st) => setAudioStatus(st));

    const unsubAi = aiRuntimeManager.subscribeMetrics((m) => setAiMetrics(m));

    // Detect GPU
    aiHardwareCapabilities.detectCapabilities().then((info) => setGpuInfo(info));

    return () => {
      unsubSafety();
      unsubComms();
      unsubLoraNodes();
      unsubLoraPackets();
      unsubAudio();
      unsubAi();
    };
  }, []);

  const handleBroadcastMesh = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meshBroadcastText.trim()) return;
    await loraDeviceManager.broadcastMeshMessage(meshBroadcastText);
    setMeshBroadcastText('');
  };

  const handleTestAudioTransmission = async () => {
    setIsTransmittingAudio(true);
    try {
      await audioModemService.transmitAudioTelegram('PX10103B7C2A3C400B309A066F6A00000TEST_AUDIO76FA');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsTransmittingAudio(false);
    }
  };

  const handleAdvanceDemoScenario = () => {
    setDemoStep((prev) => (prev < demoScenarioSteps.length - 1 ? prev + 1 : 0));
  };

  const handleResetDemoScenario = () => {
    setDemoStep(0);
  };

  const normalPersonnelCount = roster.filter((p) => p.safetyState === 'NORMAL').length;
  const criticalAlertsCount = safetyAlerts.filter((a) => a.severity === 'CRITICAL' && !a.isResolved).length;

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-6 h-6 text-cyan-400 animate-pulse" />
            <h1 className="text-xl font-bold text-white font-sans">
              Advanced Field Safety & Multi-Sensor Command Center
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            WebGPU Edge AI • AFSK 1200 Audio Modem • LoRa Mesh • BLE Biometrics • Automated Failover
          </p>
        </div>

        {/* Global Operational Tone */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-slate-900 border border-emerald-500/30 text-xs font-bold text-emerald-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>FIELD OPERATIONS: NORMAL</span>
          </span>
        </div>
      </div>

      {/* Primary Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tracked Operatives</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-sans">
            {roster.length} Personnel
          </div>
          <div className="text-[11px] text-emerald-400">
            {normalPersonnelCount} / {roster.length} links normal
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>LoRa Mesh Nodes</span>
            <Share2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white font-sans">
            {meshNodes.length} Online
          </div>
          <div className="text-[11px] text-purple-300">
            LongFast-Antarctica (868 MHz)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Edge AI Acceleration</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-sans">
            {gpuInfo?.isSupported ? 'WebGPU Live' : 'WASM SIMD'}
          </div>
          <div className="text-[11px] text-slate-400">
            {aiMetrics ? `${aiMetrics.inferenceMs}ms latency (${aiMetrics.throughputFps} FPS)` : 'Quantized INT8'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Environmental Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-sans">
            {safetyAlerts.length} Alerts
          </div>
          <div className={`text-[11px] ${criticalAlertsCount > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
            {criticalAlertsCount} critical safety warnings
          </div>
        </div>
      </div>

      {/* Controlled 14-Step Field Safety Demo Scenario Player */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/40 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-sans">CONTROLLED FIELD DRILL & DEMO SCENARIO</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  STEP {demoStep + 1} OF {demoScenarioSteps.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                14-phase automated polar mission event flow for SIH evaluation (GPS ➔ Biometrics ➔ AI ➔ Failover ➔ SOS ➔ ACK).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAdvanceDemoScenario}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-cyan-950/40 cursor-pointer"
            >
              <span>Next Simulation Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetDemoScenario}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Reset Scenario"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current Step Banner */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping flex-shrink-0" />
            <span className="text-cyan-300 font-bold font-mono truncate">{demoScenarioSteps[demoStep]}</span>
          </div>
          <span className="text-slate-500 font-mono text-[11px] flex-shrink-0">
            SIMULATION MODE
          </span>
        </div>
      </div>

      {/* Main Grid: Personnel Biometric Safety Roster & Multi-Band Communications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Personnel Biometric & Environmental Status Roster */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Personnel Field Biometrics & Environmental Safety ({roster.length})</span>
            </h3>
            <span className="text-[10px] text-slate-500">DISCLAIMER: Operational Safety (Non-Medical)</span>
          </div>

          <div className="space-y-3">
            {roster.map((person) => {
              const w = person.wearable;
              return (
                <div
                  key={person.personnelId}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition-all shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white font-sans">{person.personnelName}</span>
                        <span className="text-xs font-bold text-cyan-400">({person.role})</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Expedition: {person.expeditionCode} • Location: [{person.lastKnownCoordinates.lat.toFixed(4)}°, {person.lastKnownCoordinates.lng.toFixed(4)}°]
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      person.safetyState === 'NORMAL'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-950 text-rose-300 border-rose-500/40 animate-pulse'
                    }`}>
                      {person.safetyState.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Biometric Sensor HUD */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-400 animate-pulse" />
                      <div>
                        <span className="text-slate-500 text-[10px] block">Heart Rate</span>
                        <strong className="text-white">{w ? `${w.heartRateBpm} BPM` : 'N/A'}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-cyan-400" />
                      <div>
                        <span className="text-slate-500 text-[10px] block">Skin Temp</span>
                        <strong className={`text-xs ${w && w.hasHypothermiaRisk ? 'text-rose-400 font-bold' : 'text-slate-200'}`}>
                          {w ? `${w.skinTempC}°C` : 'N/A'}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="text-slate-500 text-[10px] block">Exertion</span>
                        <strong className="text-slate-200">{w ? w.activityLevel : 'RESTING'}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Battery className="w-4 h-4 text-amber-400" />
                      <div>
                        <span className="text-slate-500 text-[10px] block">Sensor Battery</span>
                        <strong className="text-slate-200">{w ? `${w.batteryPercent}%` : '100%'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Active Safety Alerts for Person */}
                  {person.activeAlerts.length > 0 && (
                    <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-[11px] text-rose-300 space-y-1">
                      {person.activeAlerts.map((alt) => (
                        <div key={alt.alertId} className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                          <span>{alt.title}: {alt.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Columns: Unified Multi-Band Communications & Failover Manager */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>Multi-Band Comms & Failover Orchestration</span>
          </h3>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <span className="text-slate-300 font-bold">Bearer Priority Routing</span>
              <span className="text-[10px] text-cyan-400 font-mono">Failover Strategy: Auto-Next</span>
            </div>

            <div className="space-y-2">
              {bearers.map((b, idx) => (
                <div
                  key={b.type}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-white block">{b.name}</span>
                      <span className="text-[10px] text-slate-500">{b.band}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      b.status === 'SIMULATED' || b.status === 'CONNECTED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : b.status === 'AVAILABLE'
                        ? 'bg-cyan-950 text-cyan-300'
                        : 'bg-slate-800 text-slate-500'
                    }`}>
                      {b.status}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{b.latencyMs}ms • {b.bandwidthBps} bps</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Failover Events Log */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 block">Recent Failover Diagnostics</span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {failoverHistory.length === 0 ? (
                <p className="text-[11px] text-slate-500">Zero active bearer dropouts recorded.</p>
              ) : (
                failoverHistory.slice(0, 3).map((f) => (
                  <div key={f.eventId} className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] space-y-0.5">
                    <div className="flex justify-between text-rose-400 font-bold">
                      <span>{f.attemptedBearer} ➔ {f.fallbackBearer}</span>
                      <span className="text-slate-500">{new Date(f.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-400 text-[10px]">{f.reason}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lower Row: LoRa Mesh Topology & AFSK Audio Modem & WebGPU Benchmarks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: LoRa / Meshtastic Mesh Topology */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white font-sans">LoRa Mesh Topology</h3>
              </div>
              <span className="text-[10px] text-purple-300 font-bold">868 MHz</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {meshNodes.map((node) => (
                <div key={node.nodeId} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{node.shortName} - {node.longName}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-950 text-purple-300">
                      {node.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>SNR: {node.snrDb} dB • RSSI: {node.rssiDbm} dBm</span>
                    <span>Batt: {node.batteryPercent}% ({node.voltage}V)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleBroadcastMesh} className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <input
              type="text"
              value={meshBroadcastText}
              onChange={(e) => setMeshBroadcastText(e.target.value)}
              placeholder="Broadcast mesh message..."
              className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none"
            />
            <button
              type="submit"
              className="p-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Card 2: AFSK 1200 / Bell 202 Audio Modem */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-sans">AFSK 1200 Audio Modem</h3>
              </div>
              <span className="text-[10px] text-cyan-300 font-bold">Bell 202</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 font-mono">
              <div className="text-slate-400">Mark Tone: <strong className="text-white">1200 Hz (Bit 1)</strong></div>
              <div className="text-slate-400">Space Tone: <strong className="text-white">2200 Hz (Bit 0)</strong></div>
              <div className="text-slate-400">Modem Status: <strong className="text-cyan-300">{audioStatus}</strong></div>
              <div className="text-slate-400 truncate">Audio Out: <span className="text-slate-500">{audioDeviceInfo.outputDeviceLabel}</span></div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Synthesizes continuous-phase Bell 202 audio frequency shift keying for acoustic or 3.5mm TRRS walkie-talkie transmission.
            </p>
          </div>

          <button
            type="button"
            disabled={isTransmittingAudio}
            onClick={handleTestAudioTransmission}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-md disabled:opacity-50 cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            <span>{isTransmittingAudio ? 'Broadcasting Audio Burst...' : 'Transmit Test Bell 202 Burst'}</span>
          </button>
        </div>

        {/* Card 3: WebGPU Neural Network Accelerators */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white font-sans">Edge AI Acceleration</h3>
              </div>
              <span className="text-[10px] text-emerald-300 font-bold">WebGPU</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 font-mono">
              <div className="text-slate-400">Compute Device: <strong className="text-white">{gpuInfo?.device || 'GPU Compute Adapter'}</strong></div>
              <div className="text-slate-400">FP16 Shaders: <strong className="text-emerald-400">{gpuInfo?.hasFp16Support ? 'Supported' : 'Emulated'}</strong></div>
              <div className="text-slate-400">Inference Time: <strong className="text-cyan-300">{aiMetrics ? `${aiMetrics.inferenceMs} ms` : '22 ms'}</strong></div>
              <div className="text-slate-400">Throughput: <strong className="text-white">{aiMetrics ? `${aiMetrics.throughputFps} FPS` : '45 FPS'}</strong></div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Direct hardware compute shaders for high-speed radiometric thermal crevasse segmentation.
            </p>
          </div>

          <div className="p-2 rounded-xl bg-slate-950 text-center text-[10px] text-slate-500 border border-slate-800">
            Runtime Engine: {activeBackend} (Quantized INT8)
          </div>
        </div>
      </div>
    </div>
  );
};
