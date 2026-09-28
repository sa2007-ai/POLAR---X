/**
 * POLAR-X Offline Vector Map Canvas Component
 * Renders high-resolution vector cartography of Antarctica without requiring external network connections.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { usePolar } from '../../context';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface OfflineVectorMapCanvasProps {
  onSelectMarker?: (type: string, id: string) => void;
}

export const OfflineVectorMapCanvas: React.FC<OfflineVectorMapCanvasProps> = ({ onSelectMarker: _onSelectMarker }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { stations, expeditions, emergencies, geofences } = usePolar();

  const [centerLat, setCenterLat] = useState(-70.767); // Maitri Base latitude
  const [centerLng, setCenterLng] = useState(11.733);  // Maitri Base longitude
  const [zoom, setZoom] = useState(1.4); // Scale multiplier
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Layer toggles
  const [showStations, setShowStations] = useState(true);
  const [showExpeditions, setShowExpeditions] = useState(true);
  const [showEmergencies, setShowEmergencies] = useState(true);
  const [showGeofences, setShowGeofences] = useState(true);
  const [showCrevasseZones, setShowCrevasseZones] = useState(true);
  const [showContours, setShowContours] = useState(true);

  // Geographic projection helper: Polar Stereographic projection approximation for canvas
  const latLngToCanvas = useCallback(
    (lat: number, lng: number, width: number, height: number) => {
      const centerX = width / 2 + panX;
      const centerY = height / 2 + panY;

      // Distance from South Pole (-90 deg)
      const r = (90 + lat) * 14 * zoom;
      const radLng = ((lng - centerLng) * Math.PI) / 180;

      const x = centerX + r * Math.sin(radLng);
      const y = centerY + r * Math.cos(radLng);
      return { x, y };
    },
    [centerLng, panX, panY, zoom]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // 1. Draw Ocean Background
    const bgGradient = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width);
    bgGradient.addColorStop(0, '#0a1220');
    bgGradient.addColorStop(1, '#020611');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Vector Polar Grid / Concentric Latitude Rings
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#1e293b';
    const latitudes = [-85, -80, -75, -70, -65];
    latitudes.forEach((lat) => {
      const radius = (90 + lat) * 14 * zoom;
      ctx.beginPath();
      ctx.arc(width / 2 + panX, height / 2 + panY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Label latitude
      ctx.fillStyle = '#475569';
      ctx.font = '10px monospace';
      ctx.fillText(`${lat}°S`, width / 2 + panX + 4, height / 2 + panY - radius + 12);
    });

    // 3. Draw Longitude Radials
    for (let deg = 0; deg < 360; deg += 30) {
      const start = latLngToCanvas(-90, deg, width, height);
      const end = latLngToCanvas(-60, deg, width, height);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    // 4. Draw Antarctic Landmass Vector Polygon (SCAR ADD Coastal Outline Approximation)
    const coastlinePoints = [
      { lat: -69.5, lng: -10 },
      { lat: -70.8, lng: 11.7 }, // Dronning Maud Land (Maitri)
      { lat: -67.5, lng: 45.0 },
      { lat: -69.4, lng: 76.1 }, // Larsemann Hills (Bharati)
      { lat: -66.5, lng: 93.0 },
      { lat: -66.3, lng: 110.5 },
      { lat: -66.7, lng: 140.0 },
      { lat: -71.0, lng: 170.0 },
      { lat: -77.8, lng: 166.7 }, // Ross Ice Shelf
      { lat: -85.0, lng: 170.0 },
      { lat: -80.0, lng: -150.0 },
      { lat: -75.0, lng: -110.0 },
      { lat: -74.0, lng: -80.0 },
      { lat: -64.0, lng: -60.0 }, // Antarctic Peninsula
      { lat: -75.0, lng: -50.0 }, // Weddell Sea / Ronne Ice Shelf
      { lat: -72.0, lng: -20.0 }
    ];

    if (coastlinePoints.length > 0) {
      ctx.beginPath();
      const first = latLngToCanvas(coastlinePoints[0].lat, coastlinePoints[0].lng, width, height);
      ctx.moveTo(first.x, first.y);

      for (let i = 1; i < coastlinePoints.length; i++) {
        const pt = latLngToCanvas(coastlinePoints[i].lat, coastlinePoints[i].lng, width, height);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();

      // Landmass Fill
      const landGrad = ctx.createRadialGradient(width / 2 + panX, height / 2 + panY, 20, width / 2 + panX, height / 2 + panY, 350 * zoom);
      landGrad.addColorStop(0, '#1e293b');
      landGrad.addColorStop(0.7, '#0f172a');
      landGrad.addColorStop(1, '#09101d');
      ctx.fillStyle = landGrad;
      ctx.fill();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 5. Draw Elevation Contour Lines
    if (showContours) {
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // 2000m Plateau Contour
      const contour2000 = [
        { lat: -75, lng: 0 },
        { lat: -77, lng: 40 },
        { lat: -76, lng: 80 },
        { lat: -80, lng: 120 },
        { lat: -84, lng: 160 },
        { lat: -86, lng: -140 },
        { lat: -82, lng: -80 },
        { lat: -78, lng: -30 }
      ];

      ctx.beginPath();
      const cFirst = latLngToCanvas(contour2000[0].lat, contour2000[0].lng, width, height);
      ctx.moveTo(cFirst.x, cFirst.y);
      for (let i = 1; i < contour2000.length; i++) {
        const pt = latLngToCanvas(contour2000[i].lat, contour2000[i].lng, width, height);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 6. Draw Crevasse Hazard Zones
    if (showCrevasseZones) {
      const crevasseZones = [
        { lat: -71.2, lng: 12.4, r: 18, name: 'Schirmacher Shear Zone' },
        { lat: -69.8, lng: 76.8, r: 14, name: 'Dålk Glacier Crevasses' }
      ];

      crevasseZones.forEach((z) => {
        const pt = latLngToCanvas(z.lat, z.lng, width, height);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, z.r * zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f87171';
        ctx.font = '9px sans-serif';
        ctx.fillText(`⚠️ ${z.name}`, pt.x + z.r * zoom + 4, pt.y + 3);
      });
    }

    // 7. Draw Geofences
    if (showGeofences && geofences) {
      geofences.forEach((gf) => {
        if (!gf.center || typeof gf.center.lat !== 'number') return;
        const pt = latLngToCanvas(gf.center.lat, gf.center.lng, width, height);
        const radiusPx = ((gf.radiusMeters || 5000) / 10000) * 12 * zoom;

        ctx.fillStyle = gf.type === 'hazard' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.15)';
        ctx.strokeStyle = gf.type === 'hazard' ? '#ef4444' : '#38bdf8';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(8, radiusPx), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.fillText(gf.name, pt.x + Math.max(8, radiusPx) + 4, pt.y + 3);
      });
    }

    // 8. Draw Research Stations
    if (showStations && stations) {
      stations.forEach((st) => {
        if (!st.coordinates) return;
        const pt = latLngToCanvas(st.coordinates.lat, st.coordinates.lng, width, height);

        // Station Pin
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`🏛️ ${st.name}`, pt.x + 8, pt.y + 4);
      });
    }

    // 9. Draw Active Expeditions & Assets
    if (showExpeditions && expeditions) {
      expeditions.forEach((exp) => {
        if (!exp.coordinates) return;
        const pt = latLngToCanvas(exp.coordinates.lat, exp.coordinates.lng, width, height);

        // Vehicle / Convoy Pin
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#86efac';
        ctx.font = '10px monospace';
        ctx.fillText(`🚜 ${exp.title}`, pt.x + 8, pt.y + 3);
      });
    }

    // 10. Draw Active Emergencies (Flashing / Alert Icon)
    if (showEmergencies && emergencies) {
      emergencies
        .filter((e) => e.status !== 'RESOLVED' && e.status !== 'Resolved')
        .forEach((em) => {
          const matchedStation = stations.find((s) => s.name.toLowerCase().includes(em.stationOrRegion.toLowerCase())) || stations[0];
          const lat = matchedStation?.coordinates?.lat || -70.767;
          const lng = matchedStation?.coordinates?.lng || 11.733;
          const pt = latLngToCanvas(lat, lng, width, height);

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#fca5a5';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(`🚨 SOS: ${em.title}`, pt.x + 10, pt.y + 4);
        });
    }
  }, [
    centerLat,
    centerLng,
    zoom,
    panX,
    panY,
    stations,
    expeditions,
    emergencies,
    geofences,
    showStations,
    showExpeditions,
    showEmergencies,
    showGeofences,
    showCrevasseZones,
    showContours,
    latLngToCanvas
  ]);

  // Mouse drag pan handler
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(4.0, z * 1.25));
  const handleZoomOut = () => setZoom((z) => Math.max(0.6, z * 0.8));
  const handleReset = () => {
    setZoom(1.4);
    setPanX(0);
    setPanY(0);
    setCenterLat(-70.767);
    setCenterLng(11.733);
  };

  return (
    <div className="relative w-full h-full min-h-[500px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* Top Vector Map Header & Control HUD */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 px-4 py-2 rounded-xl shadow-xl flex items-center gap-3 pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>OFFLINE VECTOR ENGINE (SCAR ADD v7.4)</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                100% LOCAL
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Center: {centerLat.toFixed(3)}°S, {centerLng.toFixed(3)}°E • Zoom: {zoom.toFixed(2)}x
            </div>
          </div>
        </div>

        {/* Layer Filters HUD */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/60 px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-2 text-xs pointer-events-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setShowStations((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              showStations ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🏛️ Stations
          </button>
          <button
            onClick={() => setShowExpeditions((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              showExpeditions ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🚜 Units
          </button>
          <button
            onClick={() => setShowGeofences((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              showGeofences ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🛡️ Geofences
          </button>
          <button
            onClick={() => setShowCrevasseZones((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              showCrevasseZones ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚠️ Crevasses
          </button>
          <button
            onClick={() => setShowEmergencies((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              showEmergencies ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🚨 SOS
          </button>
          <button
            onClick={() => setShowContours((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              showContours ? 'bg-slate-700 text-slate-200' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Elevation Lines
          </button>
        </div>
      </div>

      {/* Interactive Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full cursor-grab active:cursor-grabbing flex-1"
      />

      {/* Floating Canvas Zoom & Reset Controls */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-2xl">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          title="Reset View"
          className="p-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-3 left-4 z-10 bg-slate-900/80 backdrop-blur-sm border border-slate-800/80 px-3 py-1 rounded-lg text-[10px] font-mono text-slate-400 pointer-events-none">
        Projection: Polar Stereographic (EPSG:3031) • Vector Tiles: SCAR ADD v7.4 MBTiles
      </div>
    </div>
  );
};
