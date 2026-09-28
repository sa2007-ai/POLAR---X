/**
 * POLAR-X Phase 9 — Interactive 3D Terrain & Crevasse Canvas Viewer
 * High-performance 3D projection • Orbit Controls • Thermal / Wireframe / Point Cloud Modes
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ReconstructionScene,
  CrevasseHazard
} from '../../services/reconstruction/reconstructionTypes';
import { CapabilityStatusBadge } from '../common/CapabilityStatusBadge';
import {
  RotateCcw,
  Eye,
  Layers,
  Thermometer,
  Box,
  Compass,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface Terrain3DViewerProps {
  scene: ReconstructionScene | null;
  selectedHazard: CrevasseHazard | null;
  onSelectHazard?: (hazard: CrevasseHazard) => void;
  className?: string;
}

export const Terrain3DViewer: React.FC<Terrain3DViewerProps> = ({
  scene,
  selectedHazard,
  onSelectHazard: _onSelectHazard,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Camera Orbit State
  const [rotX, setRotX] = useState<number>(35); // Elevation deg
  const [rotY, setRotY] = useState<number>(45); // Azimuth deg
  const [zoom, setZoom] = useState<number>(1.1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);

  // Display toggles
  const [renderMode, setRenderMode] = useState<'SURFACE' | 'WIREFRAME' | 'POINT_CLOUD'>('SURFACE');
  const [showThermalTexture, setShowThermalTexture] = useState<boolean>(true);
  const [showHazards, setShowHazards] = useState<boolean>(true);
  const [showCorridorOverlay, setShowCorridorOverlay] = useState<boolean>(true);

  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const resetCamera = useCallback(() => {
    setRotX(35);
    setRotY(45);
    setZoom(1.1);
    setPanX(0);
    setPanY(0);
  }, []);

  // Mouse Orbit Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    if (e.shiftKey) {
      setPanX((prev) => prev + dx * 0.5);
      setPanY((prev) => prev + dy * 0.5);
    } else {
      setRotY((prev) => (prev + dx * 0.5) % 360);
      setRotX((prev) => Math.max(-10, Math.min(85, prev + dy * 0.4)));
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.max(0.4, Math.min(3.5, prev * factor)));
  };

  // Main 3D Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize for high DPI
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Clear background
    ctx.fillStyle = '#050b18';
    ctx.fillRect(0, 0, w, h);

    if (!scene || !scene.heightMap) {
      ctx.fillStyle = '#64748b';
      ctx.font = '13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Awaiting 3D Terrain Reconstruction Stream...', w / 2, h / 2);
      return;
    }

    const hm = scene.heightMap;
    const radX = (rotX * Math.PI) / 180;
    const radY = (rotY * Math.PI) / 180;
    const cosX = Math.cos(radX);
    const sinX = Math.sin(radX);
    const cosY = Math.cos(radY);
    const sinY = Math.sin(radY);

    const scale = (Math.min(w, h) / 180) * zoom;
    const centerX = w / 2 + panX;
    const centerY = h / 2 + panY + 20;

    // Project 3D point (x, y, z) into 2D screen coordinates
    const project = (px: number, py: number, pz: number) => {
      // Rotate Y (Azimuth)
      const x1 = px * cosY - pz * sinY;
      const z1 = px * sinY + pz * cosY;

      // Rotate X (Pitch)
      const y2 = py * cosX - z1 * sinX;
      const z2 = py * sinX + z1 * cosX;

      // Isometric depth projection
      const sx = centerX + x1 * scale;
      const sy = centerY - y2 * scale;
      return { x: sx, y: sy, depth: z2 };
    };

    const resX = hm.resolutionX;
    const resY = hm.resolutionY;
    const halfW = (resX * hm.gridSpacingMeters) / 2;
    const halfL = (resY * hm.gridSpacingMeters) / 2;

    // 1. Draw Grid Base & Elevation Polygons
    if (renderMode === 'SURFACE' || renderMode === 'WIREFRAME') {
      for (let y = 0; y < resY - 1; y++) {
        for (let x = 0; x < resX - 1; x++) {
          const x0 = x * hm.gridSpacingMeters - halfW;
          const x1 = (x + 1) * hm.gridSpacingMeters - halfW;
          const z0 = y * hm.gridSpacingMeters - halfL;
          const z1 = (y + 1) * hm.gridSpacingMeters - halfL;

          const e00 = hm.elevations[y * resX + x] || 0;
          const e10 = hm.elevations[y * resX + (x + 1)] || 0;
          const e01 = hm.elevations[(y + 1) * resX + x] || 0;
          const e11 = hm.elevations[(y + 1) * resX + (x + 1)] || 0;

          const t00 = hm.thermalDeltas ? hm.thermalDeltas[y * resX + x] || 0 : 0;

          const p00 = project(x0, e00, z0);
          const p10 = project(x1, e10, z0);
          const p11 = project(x1, e11, z1);
          const p01 = project(x0, e01, z1);

          ctx.beginPath();
          ctx.moveTo(p00.x, p00.y);
          ctx.lineTo(p10.x, p10.y);
          ctx.lineTo(p11.x, p11.y);
          ctx.lineTo(p01.x, p01.y);
          ctx.closePath();

          if (renderMode === 'SURFACE') {
            if (showThermalTexture && t00 < -1.5) {
              // Thermal Inversion (Ironbow Purple/Red for Crevasse Chasm)
              ctx.fillStyle = t00 < -3.5 ? 'rgba(76, 29, 149, 0.85)' : 'rgba(124, 58, 237, 0.7)';
            } else if (e00 < 0) {
              // Blue Ice Crevasse Floor
              ctx.fillStyle = 'rgba(14, 116, 144, 0.75)';
            } else {
              // Antarctic Glacial Surface Snow with height shading
              const light = Math.max(0.4, Math.min(0.95, 0.6 + (e00 / 20) * 0.3));
              ctx.fillStyle = `rgba(${Math.round(200 * light)}, ${Math.round(220 * light)}, ${Math.round(245 * light)}, 0.8)`;
            }
            ctx.fill();
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          } else {
            // WIREFRAME
            ctx.strokeStyle = t00 < -1.5 ? '#f43f5e' : '#38bdf8';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }

    // 2. Render Point Cloud Mode
    if (renderMode === 'POINT_CLOUD' && scene.pointCloud) {
      for (const pt of scene.pointCloud.points) {
        const p = project(pt.x, pt.y, pt.z);
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1.5, 2.5 * zoom), 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${pt.r}, ${pt.g}, ${pt.b})`;
        ctx.fill();
      }
    }

    // 3. Render 3D Crevasse Hazards & Bounding Boxes
    if (showHazards && scene.detectedHazards) {
      for (const hzd of scene.detectedHazards) {
        const isSelected = selectedHazard?.id === hzd.id;
        const hx = (hzd.dimensions.orientationDeg > 90 ? 1 : -1) * 15;
        const hy = -hzd.dimensions.estimatedDepthMeters;
        const hz = 0;

        const hp = project(hx, hy / 2, hz);

        // Crevasse Bounding Ring
        ctx.beginPath();
        ctx.ellipse(hp.x, hp.y, 45 * zoom, 18 * zoom, (rotY * Math.PI) / 180, 0, Math.PI * 2);
        ctx.strokeStyle =
          hzd.reviewStatus === 'CONFIRMED'
            ? '#ef4444'
            : isSelected
              ? '#38bdf8'
              : hzd.reviewStatus === 'REJECTED'
                ? '#64748b'
                : '#fbbf24';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label Badge
        ctx.fillStyle = isSelected ? '#0284c7' : 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.fillRect(hp.x - 65, hp.y - 32, 130, 22);
        ctx.strokeRect(hp.x - 65, hp.y - 32, 130, 22);

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${hzd.name.slice(0, 14)} (${hzd.dimensions.estimatedDepthMeters}m)`, hp.x, hp.y - 18);
      }
    }

    // 4. Render Route Corridor Overlay
    if (showCorridorOverlay) {
      const waypoints = [
        project(-60, 4, -60),
        project(-20, 2, -20),
        project(15, -6, 10),
        project(55, 6, 55)
      ];

      ctx.beginPath();
      ctx.moveTo(waypoints[0].x, waypoints[0].y);
      for (let i = 1; i < waypoints.length; i++) {
        ctx.lineTo(waypoints[i].x, waypoints[i].y);
      }
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.85)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Waypoint Dots
      waypoints.forEach((wp, idx) => {
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#34d399';
        ctx.font = '9px monospace';
        ctx.fillText(`WP-0${idx + 1}`, wp.x + 8, wp.y - 4);
      });
    }

    // 5. Compass HUD
    ctx.save();
    ctx.translate(50, 50);
    ctx.rotate((-rotY * Math.PI) / 180);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -22);
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('N', -3, -25);

    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 18);
    ctx.stroke();
    ctx.restore();
  }, [
    scene,
    rotX,
    rotY,
    zoom,
    panX,
    panY,
    renderMode,
    showThermalTexture,
    showHazards,
    showCorridorOverlay,
    selectedHazard
  ]);

  return (
    <div className={`relative flex flex-col bg-slate-950 rounded-xl border border-slate-800 overflow-hidden ${className}`}>
      {/* 3D Canvas Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-200">
            {scene?.sectorName || '3D Polar Reconstruction'}
          </span>
          <CapabilityStatusBadge state={scene?.dataState || 'SIMULATED'} size="xs" />
        </div>

        {/* View Controls Toolbar */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setRenderMode('SURFACE')}
            className={`px-2 py-1 rounded text-[11px] transition-colors ${
              renderMode === 'SURFACE'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Surface Shaded Mesh"
          >
            Surface
          </button>
          <button
            onClick={() => setRenderMode('WIREFRAME')}
            className={`px-2 py-1 rounded text-[11px] transition-colors ${
              renderMode === 'WIREFRAME'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Wireframe Geometry"
          >
            <Box className="w-3.5 h-3.5 inline mr-1" />
            Wire
          </button>
          <button
            onClick={() => setRenderMode('POINT_CLOUD')}
            className={`px-2 py-1 rounded text-[11px] transition-colors ${
              renderMode === 'POINT_CLOUD'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="LiDAR Point Cloud"
          >
            Points
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          <button
            onClick={() => setShowThermalTexture(!showThermalTexture)}
            className={`p-1 rounded transition-colors ${
              showThermalTexture ? 'bg-purple-900/60 text-purple-300' : 'bg-slate-800 text-slate-500'
            }`}
            title="Toggle Radiometric Thermal IR Inversion Overlay"
          >
            <Thermometer className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowHazards(!showHazards)}
            className={`p-1 rounded transition-colors ${
              showHazards ? 'bg-rose-900/60 text-rose-300' : 'bg-slate-800 text-slate-500'
            }`}
            title="Toggle Crevasse Hazard Bounding Volumes"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowCorridorOverlay(!showCorridorOverlay)}
            className={`p-1 rounded transition-colors ${
              showCorridorOverlay ? 'bg-emerald-900/60 text-emerald-300' : 'bg-slate-800 text-slate-500'
            }`}
            title="Toggle Route Corridor Vector"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          <button
            onClick={() => setZoom((z) => Math.min(3.5, z * 1.15))}
            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z * 0.85))}
            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetCamera}
            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
            title="Reset Camera Orientation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive 3D Canvas Viewport */}
      <div className="relative flex-1 min-h-[380px] cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className="w-full h-full block"
        />

        {/* Orbit Overlay HUD */}
        <div className="absolute bottom-2 left-2 flex items-center gap-2 pointer-events-none text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/80">
          <span>Pitch: {Math.round(rotX)}°</span>
          <span>Yaw: {Math.round(rotY)}°</span>
          <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
          <span className="text-slate-500">| Drag: Orbit • Shift+Drag: Pan • Wheel: Zoom</span>
        </div>

        {/* Selected Hazard Quick Card */}
        {selectedHazard && (
          <div className="absolute top-2 right-2 max-w-xs bg-slate-900/95 border border-cyan-500/40 rounded-lg p-3 text-xs font-mono shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-cyan-300">{selectedHazard.name}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  selectedHazard.reviewStatus === 'CONFIRMED'
                    ? 'bg-rose-950 text-rose-300 border border-rose-600'
                    : selectedHazard.reviewStatus === 'REJECTED'
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-amber-950 text-amber-300 border border-amber-600'
                }`}
              >
                {selectedHazard.reviewStatus}
              </span>
            </div>
            <div className="space-y-1 text-slate-300 text-[11px]">
              <div>Depth: <span className="text-rose-400 font-bold">{selectedHazard.dimensions.estimatedDepthMeters}m</span></div>
              <div>Width / Length: {selectedHazard.dimensions.widthMeters}m × {selectedHazard.dimensions.lengthMeters}m</div>
              <div>Thermal Inversion: <span className="text-purple-300">{selectedHazard.thermalSignatureDeltaK}°K</span></div>
              <div>Confidence: {(selectedHazard.confidenceScore * 100).toFixed(0)}%</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
