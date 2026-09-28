import React, { useState, useEffect, useMemo } from 'react';
import { usePolar } from '../context';
import { TelemetryRecord } from '../types/telemetry';
import { telemetryService } from '../services/telemetry/telemetryService';
import { evaluateRouteDeviation } from '../services/telemetry/telemetryAlertService';
import { gpsDeviceManager } from '../services/gps/gpsDeviceManager';
import { GpsBaudRate, GpsConnectionStatus, GpsQualityReport } from '../services/gps/gpsTypes';
import {
  Activity,
  Radio,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Usb,
  Terminal
} from 'lucide-react';

export const TelemetryPage: React.FC = () => {
  const { assets, routes } = usePolar();
  const [telemetryRecords, setTelemetryRecords] = useState<TelemetryRecord[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id || 'ast-1');
  const [historyRecords, setHistoryRecords] = useState<TelemetryRecord[]>([]);

  // Playback Player State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackIndex, setPlaybackIndex] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Subscribe to live telemetry
  useEffect(() => {
    const unsub = telemetryService.subscribe((records) => {
      setTelemetryRecords(records);
    });
    return () => unsub();
  }, []);

  // GPS Device State
  const [gpsStatus, setGpsStatus] = useState<GpsConnectionStatus>(gpsDeviceManager.getStatus());
  const [baudRate, setBaudRate] = useState<GpsBaudRate>(9600);
  const [gpsReport, setGpsReport] = useState<GpsQualityReport | null>(gpsDeviceManager.getLatestReport());
  const [rawNmeaLines, setRawNmeaLines] = useState<string[]>(gpsDeviceManager.getRawHistory());
  const isWebSerialAvailable = gpsDeviceManager.isSupported();

  // Subscribe to GPS events
  useEffect(() => {
    const unsubStatus = gpsDeviceManager.subscribeQualityReport((report) => setGpsReport(report));
    const unsubRaw = gpsDeviceManager.subscribeRawStream((lines) => setRawNmeaLines(lines));
    return () => {
      unsubStatus();
      unsubRaw();
    };
  }, []);

  const handleConnectGps = async () => {
    try {
      await gpsDeviceManager.connectDevice(baudRate);
      setGpsStatus(gpsDeviceManager.getStatus());
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDisconnectGps = async () => {
    await gpsDeviceManager.disconnectDevice();
    setGpsStatus(gpsDeviceManager.getStatus());
  };

  const handleInjectTestSentence = () => {
    const testSentences = [
      '$GPGGA,123519,7045.600,S,01144.100,E,1,08,0.9,120.0,M,46.9,M,,*47',
      '$GPRMC,123519,A,7045.600,S,01144.100,E,022.4,084.4,230394,003.1,W*6A'
    ];
    const sentence = testSentences[Math.floor(Math.random() * testSentences.length)];
    gpsDeviceManager.injectTestNmeaSentence(sentence);
  };

  // Fetch history for selected asset
  useEffect(() => {
    const loadHistory = async () => {
      const hist = await telemetryService.getAssetHistory(selectedAssetId, 50);
      setHistoryRecords(hist);
      setPlaybackIndex(hist.length > 0 ? hist.length - 1 : 0);
      setIsPlaying(false);
    };
    loadHistory();
  }, [selectedAssetId]);

  // Playback timer loop
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && historyRecords.length > 0) {
      interval = setInterval(() => {
        setPlaybackIndex((prev) => {
          if (prev >= historyRecords.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, historyRecords.length]);

  const activeRecord = historyRecords[playbackIndex] || telemetryRecords.find((r) => r.assetId === selectedAssetId) || telemetryRecords[0];
  const activeRoute = routes.find((r) => r.expeditionCode === activeRecord?.expeditionCode) || routes[0];

  const deviationCheck = useMemo(() => {
    if (!activeRecord) return null;
    return evaluateRouteDeviation(activeRecord, activeRoute);
  }, [activeRecord, activeRoute]);

  const deviationBadgeColors = {
    ON_ROUTE: 'bg-emerald-950 text-emerald-300 border-emerald-500/30',
    NEAR_EDGE: 'bg-amber-950 text-amber-300 border-amber-500/30',
    OFF_ROUTE: 'bg-rose-950 text-rose-300 border-rose-500/50 animate-pulse',
    UNKNOWN: 'bg-slate-800 text-slate-400 border-slate-700'
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-6 h-6 text-cyan-400 animate-pulse" />
            <h1 className="text-xl font-bold text-white font-sans">
              GNSS Telemetry & Trajectory Replay
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Simulated satellite telemetry ingestion, corridor deviation analysis, and historical mission playback.
          </p>
        </div>

        {/* Telemetry Status Indicator */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>{telemetryService.isSimulated() ? `SIMULATED: ${telemetryService.getProviderName()}` : telemetryService.getProviderName()}</span>
          </span>
        </div>
      </div>

      {/* Direct GPS Device Manager (Web Serial API) */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${
              gpsStatus === 'CONNECTED'
                ? 'bg-emerald-950 border-emerald-500/40 text-emerald-400'
                : gpsStatus === 'CONNECTING'
                ? 'bg-cyan-950 border-cyan-500/40 text-cyan-400 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <Usb className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-sans">DIRECT GPS SERIAL INTERFACE</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                  gpsStatus === 'CONNECTED'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                    : gpsStatus === 'CONNECTING'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                    : isWebSerialAvailable
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : 'bg-rose-950 text-rose-300 border-rose-500/40'
                }`}>
                  {isWebSerialAvailable ? gpsStatus : 'WEB SERIAL UNAVAILABLE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Direct browser NMEA 0183 hardware ingestion (u-blox / Garmin / Generic Serial GPS).
              </p>
            </div>
          </div>

          {/* Connection Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 text-[11px]">Baud:</span>
              <select
                value={baudRate}
                onChange={(e) => setBaudRate(Number(e.target.value) as GpsBaudRate)}
                disabled={gpsStatus === 'CONNECTED'}
                className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none"
              >
                <option value={4800}>4800 bps</option>
                <option value={9600}>9600 bps (Standard)</option>
                <option value={38400}>38400 bps</option>
                <option value={115200}>115200 bps (High Speed)</option>
              </select>
            </div>

            {gpsStatus === 'CONNECTED' ? (
              <button
                type="button"
                onClick={handleDisconnectGps}
                className="px-3.5 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Disconnect Port
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectGps}
                disabled={!isWebSerialAvailable}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors shadow-md shadow-cyan-950/40 disabled:opacity-50 cursor-pointer"
              >
                Connect GPS Device
              </button>
            )}

            <button
              type="button"
              onClick={handleInjectTestSentence}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              title="Inject simulated NMEA sentence into parser pipeline"
            >
              Test NMEA Feed
            </button>
          </div>
        </div>

        {/* Live GPS Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 text-[10px] block">Fix Status</span>
            <strong className={`text-xs ${gpsReport?.fixType === '3D' ? 'text-emerald-400' : 'text-slate-300'}`}>
              {gpsReport?.fixType || 'NO FIX'}
            </strong>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 text-[10px] block">Satellites Tracked</span>
            <strong className="text-xs text-cyan-300">{gpsReport?.satellites || 0} Sats</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 text-[10px] block">HDOP / Precision</span>
            <strong className="text-xs text-slate-200">{gpsReport?.hdop ? `${gpsReport.hdop.toFixed(1)} (±${gpsReport.accuracyMeters?.toFixed(1)}m)` : 'N/A'}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 text-[10px] block">Ground Speed</span>
            <strong className="text-xs text-slate-200">{gpsReport?.speedKmh ? `${gpsReport.speedKmh.toFixed(1)} km/h` : '0.0 km/h'}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 text-[10px] block">Quality Status</span>
            <strong className={`text-xs font-bold ${
              gpsReport?.status === 'VALID'
                ? 'text-emerald-400'
                : gpsReport?.status === 'DEGRADED'
                ? 'text-amber-400'
                : 'text-slate-400'
            }`}>
              {gpsReport?.status || 'STANDBY'}
            </strong>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 text-[10px] block">Last Sentence</span>
            <strong className="text-[11px] text-slate-400 truncate block">
              {gpsReport?.lastSentenceAt ? new Date(gpsReport.lastSentenceAt).toLocaleTimeString() : 'Awaiting data'}
            </strong>
          </div>
        </div>

        {/* Live NMEA Terminal Stream */}
        {rawNmeaLines.length > 0 && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-400/90 space-y-1 max-h-24 overflow-y-auto">
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] mb-1">
              <Terminal className="w-3 h-3" />
              <span>RAW NMEA 0183 SERIAL LOG:</span>
            </div>
            {rawNmeaLines.slice(0, 3).map((line, idx) => (
              <div key={idx} className="truncate">{line}</div>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tracked Assets Feed */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Tracked Field Units ({telemetryRecords.length})
          </h3>

          <div className="space-y-3">
            {telemetryRecords.map((record) => {
              const isSelected = record.assetId === selectedAssetId;
              return (
                <div
                  key={record.telemetryId}
                  onClick={() => setSelectedAssetId(record.assetId)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-950/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white font-sans">{record.assetName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/20">
                      {record.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 mb-2">
                    <div>
                      <span className="text-slate-500">Speed:</span> <strong className="text-slate-200">{record.speedKmh} km/h</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Heading:</span> <strong className="text-slate-200">{record.headingDegrees}°</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Batt:</span> <strong className="text-emerald-400">{record.batteryLevelPercent}%</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Sats:</span> <strong className="text-cyan-300">{record.satelliteCount || 12}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/80">
                    <span className="truncate">{record.coordinates.latitude.toFixed(4)}°, {record.coordinates.longitude.toFixed(4)}°</span>
                    <span>{new Date(record.timestamp).toUTCString().slice(17, 22)} UTC</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Vector & Historical Playback Deck */}
        <div className="lg:col-span-8 space-y-6">
          {activeRecord ? (
            <>
              {/* Telemetry Vector HUD */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-cyan-400">{activeRecord.deviceId}</span>
                      <span className="text-xs text-slate-500">• {activeRecord.source}</span>
                    </div>
                    <h2 className="text-lg font-bold text-white font-sans">{activeRecord.assetName}</h2>
                  </div>

                  {deviationCheck && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${deviationBadgeColors[deviationCheck.status]}`}>
                      {deviationCheck.status.replace('_', ' ')}
                    </span>
                  )}
                </div>

                {/* Primary Telemetry Metrics Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block mb-0.5">Coordinates</span>
                    <span className="text-sm font-bold text-white truncate block">
                      {activeRecord.coordinates.latitude.toFixed(4)}°, {activeRecord.coordinates.longitude.toFixed(4)}°
                    </span>
                    <span className="text-[10px] text-slate-400">Alt: {activeRecord.coordinates.altitudeMeters || 0}m</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block mb-0.5">Velocity & Heading</span>
                    <span className="text-sm font-bold text-white">
                      {activeRecord.speedKmh} <span className="text-[10px] font-normal text-slate-400">km/h</span>
                    </span>
                    <span className="text-[10px] text-cyan-300 block">Bearing: {activeRecord.headingDegrees}°</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block mb-0.5">Signal & Satellites</span>
                    <span className="text-sm font-bold text-white">
                      {activeRecord.signalStrengthDbm} <span className="text-[10px] font-normal text-slate-400">dBm</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 block">{activeRecord.satelliteCount || 12} GNSS Locks (HDOP: {activeRecord.hdop || 0.9})</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block mb-0.5">Power & Temp</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {activeRecord.batteryLevelPercent}%
                    </span>
                    <span className="text-[10px] text-slate-400 block">Ambient: {activeRecord.temperatureC || -22}°C</span>
                  </div>
                </div>

                {/* Route Deviation Banner */}
                {deviationCheck && (
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                    deviationCheck.status === 'OFF_ROUTE'
                      ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                      : deviationCheck.status === 'NEAR_EDGE'
                      ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                      : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{deviationCheck.message}</span>
                    </div>
                    {activeRoute && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        Route: {activeRoute.code}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* ================= HISTORICAL TRAJECTORY PLAYBACK DECK ================= */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white font-sans">
                      Historical Trajectory Playback ({historyRecords.length} Telemetry Points)
                    </h3>
                  </div>

                  {/* Playback Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPlaybackIndex(0)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Reset to beginning"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      <span>{isPlaying ? 'Pause' : 'Replay'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 2 : playbackSpeed === 2 ? 5 : 1)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs transition-colors"
                      title="Toggle playback speed"
                    >
                      {playbackSpeed}x Speed
                    </button>
                  </div>
                </div>

                {/* Timeline Scrubber */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Point {playbackIndex + 1} of {historyRecords.length}</span>
                    <span>{activeRecord ? new Date(activeRecord.timestamp).toUTCString().slice(0, 22) : ''}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, historyRecords.length - 1)}
                    value={playbackIndex}
                    onChange={(e) => {
                      setPlaybackIndex(parseInt(e.target.value, 10));
                      setIsPlaying(false);
                    }}
                    className="w-full accent-cyan-400 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
              Select a field asset from the left panel to inspect real-time telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
