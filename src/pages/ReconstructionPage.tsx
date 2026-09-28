/**
 * POLAR-X Phase 9 — 3D Crevasse & Terrain Reconstruction Command Center
 * Multi-View Photogrammetry • Radiometric IR Fusion • Human-in-the-Loop Review
 */

import React, { useState, useEffect } from 'react';
import { reconstructionManager, INITIAL_MULTI_VIEW_FRAMES } from '../services/reconstruction/reconstructionManager';
import {
  ReconstructionScene,
  CrevasseHazard,
  HazardReviewStatus
} from '../services/reconstruction/reconstructionTypes';
import { Terrain3DViewer } from '../components/reconstruction/Terrain3DViewer';
import { CapabilityStatusBadge } from '../components/common/CapabilityStatusBadge';
import { useAuth, usePolar } from '../context';
import {
  Layers,
  Box,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Camera,
  Play,
  UserCheck
} from 'lucide-react';

export const ReconstructionPage: React.FC = () => {
  const { userProfile, role } = useAuth();
  const { addGeofence, logActivity } = usePolar();

  const [scenes, setScenes] = useState<ReconstructionScene[]>(reconstructionManager.getScenes());
  const [activeScene, setActiveScene] = useState<ReconstructionScene | null>(reconstructionManager.getActiveScene());
  const [selectedHazard, setSelectedHazard] = useState<CrevasseHazard | null>(null);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = reconstructionManager.subscribe((scns, active) => {
      setScenes(scns);
      setActiveScene(active);
      if (active && active.detectedHazards.length > 0 && !selectedHazard) {
        setSelectedHazard(active.detectedHazards[0]);
      }
    });
    return unsub;
  }, [selectedHazard]);

  // Run new reconstruction pipeline
  const handleTriggerReconstruction = async () => {
    setIsProcessing(true);
    setFeedbackMessage(null);
    try {
      const newScene = await reconstructionManager.processReconstruction(
        INITIAL_MULTI_VIEW_FRAMES,
        `Traverse Corridor Anomaly Sector ${String.fromCharCode(65 + scenes.length)}`
      );
      setActiveScene(newScene);
      if (newScene.detectedHazards.length > 0) {
        setSelectedHazard(newScene.detectedHazards[0]);
      }
      setFeedbackMessage('3D Reconstruction and Crevasse Anomaly Inversion generated successfully.');
    } catch (err: any) {
      setFeedbackMessage(`Reconstruction failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Human Review Decision
  const handleReviewDecision = async (status: HazardReviewStatus) => {
    if (!selectedHazard) return;

    const operatorName = userProfile?.displayName || 'Field Commander';
    const result = reconstructionManager.reviewHazard(
      selectedHazard.id,
      status,
      operatorName,
      role,
      reviewNotes || (status === 'CONFIRMED' ? 'Confirmed by glaciological review' : 'Rejected as surface artifact')
    );

    if (!result.success) {
      setFeedbackMessage(result.message);
      return;
    }

    // If confirmed, automatically promote to active hazard geofence
    if (status === 'CONFIRMED' && result.hazard) {
      await addGeofence({
        code: result.hazard.associatedGeofenceCode || `GEO-CRV-${Date.now().toString().slice(-4)}`,
        name: `3D Confirmed Crevasse: ${result.hazard.name}`,
        type: 'hazard',
        severity: result.hazard.riskLevel === 'CRITICAL' ? 'Critical' : 'Warning',
        stationOrRegion: activeScene?.sectorName || 'Forward Traverse Corridor',
        shape: 'circle',
        center: {
          lat: result.hazard.centerCoordinates.lat,
          lng: result.hazard.centerCoordinates.lng
        },
        radiusMeters: Math.max(300, result.hazard.dimensions.lengthMeters * 1.2),
        description: `Verified from 3D Photogrammetry + Thermal IR Inversion (${result.hazard.dimensions.estimatedDepthMeters}m depth, ${result.hazard.dimensions.widthMeters}m width). Confidence: ${(result.hazard.confidenceScore * 100).toFixed(0)}%. Reviewed by ${operatorName}.`,
        rules: ['Ground traverse strictly prohibited', 'Mandatory 300m detour corridor'],
        status: 'active'
      });

      logActivity(
        'expeditions',
        '3D Crevasse Hazard Confirmed & Geofenced',
        `${result.hazard.name} (${result.hazard.dimensions.estimatedDepthMeters}m depth) confirmed by ${operatorName}. Promoted to active route hazard geofence.`,
        'warning',
        operatorName
      );
    }

    setFeedbackMessage(result.message);
    setReviewNotes('');
  };

  const isViewer = role === 'VIEWER';

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-wider text-slate-100 uppercase flex items-center gap-2.5">
              <Box className="w-6 h-6 text-cyan-400" />
              3D Crevasse & Terrain Reconstruction
            </h1>
            <CapabilityStatusBadge state="SIMULATED" size="sm" />
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Multi-View Photogrammetry • Radiometric IR Inversion • Human-in-the-Loop Glaciological Review
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleTriggerReconstruction}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-950/50 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            {isProcessing ? 'Synthesizing 3D Mesh...' : 'Run 3D Reconstruction Pipeline'}
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-xs text-cyan-200 flex items-center justify-between animate-fadeIn">
          <span>{feedbackMessage}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-cyan-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Main 3D Recon Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 3D Interactive Canvas Viewer */}
        <div className="lg:col-span-2 space-y-4">
          <Terrain3DViewer
            scene={activeScene}
            selectedHazard={selectedHazard}
            onSelectHazard={(h) => setSelectedHazard(h)}
            className="h-[520px]"
          />

          {/* Multi-View Ingested Frames Filmstrip */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                Ingested Multi-View Telemetry Frames ({activeScene?.sourceImages.length || 0})
              </span>
              <span className="text-slate-400 text-[11px]">UAV-RECON-ALPHA • Gimbal Pitch -45° to -90°</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {activeScene?.sourceImages.map((img, idx) => (
                <div
                  key={img.imageId}
                  className="bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 text-[11px] space-y-1 hover:border-cyan-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-semibold text-slate-300">Frame #{idx + 1}</span>
                    <span className={img.sensorType === 'RADIOMETRIC_THERMAL' ? 'text-purple-400' : 'text-blue-400'}>
                      {img.sensorType === 'RADIOMETRIC_THERMAL' ? 'IR Thermal' : 'Optical RGB'}
                    </span>
                  </div>
                  <div className="text-slate-500 truncate">{img.imageId}</div>
                  <div className="text-slate-400">Alt: {img.altitudeMeters}m • Pitch: {img.cameraPitchDeg}°</div>
                  <div className="text-[10px] text-slate-500">{img.latitude.toFixed(4)}°, {img.longitude.toFixed(4)}°</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Hazard Inspector & Human Review Workflow Panel */}
        <div className="space-y-4">
          {/* Active Scene Metadata */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Reconstructed Scene Telemetry
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Scene ID:</span>
                <span className="text-cyan-300 font-semibold">{activeScene?.sceneId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Grid Spacing / Res:</span>
                <span className="text-slate-200">{activeScene?.resolutionGridMeters}m (28×28 Mesh)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Surface Bounds:</span>
                <span className="text-slate-200">{activeScene?.boundsMeters.widthMeters}m × {activeScene?.boundsMeters.lengthMeters}m</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Point Cloud Density:</span>
                <span className="text-slate-200">{activeScene?.pointCloud?.pointCount || 784} pts</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Reconstruction Confidence:</span>
                <span className="text-emerald-400 font-bold">{((activeScene?.confidenceScore || 0.94) * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Detected Hazards List */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Detected Crevasse Hazards ({activeScene?.detectedHazards.length || 0})
              </span>
              <span className="text-[10px] text-amber-400">Human Review Required</span>
            </h3>

            <div className="space-y-2">
              {activeScene?.detectedHazards.map((hzd) => {
                const isSelected = selectedHazard?.id === hzd.id;
                return (
                  <div
                    key={hzd.id}
                    onClick={() => setSelectedHazard(hzd)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-950/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-200">{hzd.name}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          hzd.reviewStatus === 'CONFIRMED'
                            ? 'bg-rose-950 text-rose-300 border border-rose-600'
                            : hzd.reviewStatus === 'REJECTED'
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-amber-950 text-amber-300 border border-amber-600'
                        }`}
                      >
                        {hzd.reviewStatus}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400 mt-1">
                      <div>Depth: <span className="text-rose-400 font-semibold">{hzd.dimensions.estimatedDepthMeters}m</span></div>
                      <div>Width: {hzd.dimensions.widthMeters}m</div>
                      <div>Length: {hzd.dimensions.lengthMeters}m</div>
                      <div>Thermal ΔT: <span className="text-purple-300">{hzd.thermalSignatureDeltaK}°K</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Human Review & Promotion Workflow Card */}
          {selectedHazard && (
            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                Glaciological Review Interlock
              </h3>

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-white">{selectedHazard.name}</div>
                <div className="text-[11px] text-slate-400">
                  Target: {selectedHazard.centerCoordinates.lat.toFixed(5)}°S, {selectedHazard.centerCoordinates.lng.toFixed(5)}°E
                </div>
                <div className="text-[11px] text-slate-400">
                  Estimated Chasm Depth: <span className="text-rose-400 font-bold">{selectedHazard.dimensions.estimatedDepthMeters}m</span>
                </div>
                {selectedHazard.reviewedBy && (
                  <div className="text-[10px] text-cyan-400 pt-1 border-t border-slate-800">
                    Reviewed By: {selectedHazard.reviewedBy}
                  </div>
                )}
              </div>

              {/* Review Notes Input */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Reviewer Assessment Notes:</label>
                <input
                  type="text"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Verified sub-surface snow bridge failure risk..."
                  disabled={isViewer}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-hidden focus:border-cyan-500 disabled:opacity-50"
                />
              </div>

              {/* Review Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleReviewDecision('CONFIRMED')}
                  disabled={isViewer || selectedHazard.reviewStatus === 'CONFIRMED'}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-600/60 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                  title="Confirm as active hazard geofence and re-route traverses"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Hazard
                </button>

                <button
                  onClick={() => handleReviewDecision('REJECTED')}
                  disabled={isViewer || selectedHazard.reviewStatus === 'REJECTED'}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                  title="Reject as non-hazardous surface feature"
                >
                  <XCircle className="w-4 h-4" />
                  Reject False Positive
                </button>
              </div>

              {isViewer && (
                <div className="text-[10px] text-amber-400 bg-amber-950/40 border border-amber-800/40 p-2 rounded">
                  VIEWER Role Restriction: Hazard approvals require SCIENTIST, EXPEDITION_MANAGER, or ADMIN privileges.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
