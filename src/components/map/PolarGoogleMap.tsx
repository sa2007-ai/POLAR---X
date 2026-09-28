import React, { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { PolarStation, Expedition, PolarAsset, EmergencyIncident } from '../../types';
import { GeofenceZone, GeofenceBreach } from '../../types/geofence';
import {
  ShieldAlert,
  Compass,
  Building2,
  AlertTriangle,
  Flame,
  Info,
  Crosshair,
  Map as MapIcon,
  Truck
} from 'lucide-react';

export type GoogleMapType = 'roadmap' | 'satellite' | 'hybrid' | 'terrain';

interface PolarGoogleMapProps {
  stations: PolarStation[];
  expeditions: Expedition[];
  assets: PolarAsset[];
  emergencies: EmergencyIncident[];
  geofences: GeofenceZone[];
  breaches?: GeofenceBreach[];
  selectedStationName?: string;
  onSelectEntity?: (entity: any) => void;
  activeLayers: {
    stations: boolean;
    expeditions: boolean;
    geofences: boolean;
    emergencies: boolean;
    assets: boolean;
  };
}

export const PolarGoogleMap: React.FC<PolarGoogleMapProps> = ({
  stations,
  expeditions,
  assets,
  emergencies,
  geofences,
  breaches = [],
  selectedStationName,
  onSelectEntity,
  activeLayers
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const overlaysRef = useRef<(google.maps.Polygon | google.maps.Circle)[]>([]);

  const [mapsLoaded, setMapsLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [hoveredCoords, setHoveredCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [currentMapType, setCurrentMapType] = useState<GoogleMapType>('roadmap');

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const isKeyConfigured = Boolean(apiKey && !apiKey.includes('your_google_maps'));

  // Initialize Standard Google Maps JavaScript SDK
  useEffect(() => {
    if (!isKeyConfigured || !mapContainerRef.current) {
      return;
    }

    let isMounted = true;

    const initMap = async () => {
      try {
        setOptions({
          key: apiKey,
          v: 'weekly'
        });

        await importLibrary('maps');
        if (!isMounted || !mapContainerRef.current) return;

        // Antarctic operational area default center: Maitri Station / Queen Maud Land
        const defaultCenter = { lat: -70.762, lng: 11.741 };

        // Standard Google Maps instance (no custom dark map styles, real basemap with geographic labels and coastlines)
        const map = new google.maps.Map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 4,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: true,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_LEFT,
            mapTypeIds: [
              google.maps.MapTypeId.ROADMAP,
              google.maps.MapTypeId.SATELLITE,
              google.maps.MapTypeId.HYBRID,
              google.maps.MapTypeId.TERRAIN
            ]
          },
          fullscreenControl: true,
          scaleControl: true,
          rotateControl: true
        });

        // Listen for user cursor position on the real map
        map.addListener('mousemove', (e: google.maps.MapMouseEvent) => {
          if (e.latLng && isMounted) {
            setHoveredCoords({
              lat: Number(e.latLng.lat().toFixed(4)),
              lng: Number(e.latLng.lng().toFixed(4))
            });
          }
        });

        // Sync state when user changes map type via native Google controls
        map.addListener('maptypeid_changed', () => {
          if (!isMounted) return;
          const newType = map.getMapTypeId() as GoogleMapType;
          if (newType) {
            setCurrentMapType(newType);
          }
        });

        if (isMounted) {
          mapInstanceRef.current = map;
          setMapsLoaded(true);
          setLoadError(null);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.warn('[POLAR-X] Google Maps JS API initialization error:', err);
        setLoadError(err?.message || 'Unable to load Google Maps SDK');
      }
    };

    void initMap();

    return () => {
      isMounted = false;
    };
  }, [apiKey, isKeyConfigured]);

  // Center on selected station when filter changes
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedStationName || selectedStationName === 'All Stations') {
      if (mapInstanceRef.current && selectedStationName === 'All Stations') {
        mapInstanceRef.current.panTo({ lat: -70.762, lng: 11.741 });
        mapInstanceRef.current.setZoom(4);
      }
      return;
    }
    const matched = stations.find((s) => s.name === selectedStationName);
    if (matched) {
      mapInstanceRef.current.panTo({
        lat: matched.coordinates.lat,
        lng: matched.coordinates.lng
      });
      mapInstanceRef.current.setZoom(7);
    }
  }, [selectedStationName, stations]);

  // Handle map type change from UI buttons
  const handleSetMapType = (type: GoogleMapType) => {
    setCurrentMapType(type);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(type);
    }
  };

  // Draw Markers, Overlays, Traverses & Geofences on Google Maps
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapsLoaded || typeof google === 'undefined') return;

    // Clear previous markers and overlays
    markersRef.current.forEach((m) => m.setMap(null));
    overlaysRef.current.forEach((o) => o.setMap(null));
    markersRef.current = [];
    overlaysRef.current = [];

    // 1. BASE STATIONS LAYER (Standard Google Maps Markers with clear badges)
    if (activeLayers.stations) {
      stations.forEach((station) => {
        const marker = new google.maps.Marker({
          position: { lat: station.coordinates.lat, lng: station.coordinates.lng },
          map,
          title: station.name,
          icon: {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: '#0284c7', // Sky blue for station base
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });

        marker.addListener('click', () => {
          const entity = { ...station, entityType: 'station' };
          setSelectedEntity(entity);
          if (onSelectEntity) onSelectEntity(entity);
        });

        markersRef.current.push(marker);
      });
    }

    // 2. EXPEDITIONS & TRAVERSES LAYER
    if (activeLayers.expeditions) {
      expeditions.forEach((exp) => {
        if (!exp.coordinates) return;

        const isExpActive = exp.status === 'Active';
        const marker = new google.maps.Marker({
          position: { lat: exp.coordinates.lat, lng: exp.coordinates.lng },
          map,
          title: `${exp.code}: ${exp.title}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: isExpActive ? 7 : 5,
            fillColor: isExpActive ? '#10b981' : '#64748b', // Emerald for active, slate for planned
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: isExpActive ? 2 : 1
          }
        });

        marker.addListener('click', () => {
          const entity = { ...exp, entityType: 'expedition' };
          setSelectedEntity(entity);
          if (onSelectEntity) onSelectEntity(entity);
        });

        markersRef.current.push(marker);
      });
    }

    // 3. ASSETS & VEHICLES LAYER
    if (activeLayers.assets) {
      assets.forEach((asset, idx) => {
        // Associate asset coordinates with station if not standalone
        const matchedStation = stations.find((s) => s.name.includes(asset.currentStation.split(' ')[0]));
        if (matchedStation) {
          const latOffset = ((idx % 3) - 1) * 0.03;
          const lngOffset = (Math.floor(idx / 3) * 0.04) + 0.02;
          const pos = {
            lat: matchedStation.coordinates.lat + latOffset,
            lng: matchedStation.coordinates.lng + lngOffset
          };

          const assetMarker = new google.maps.Marker({
            position: pos,
            map,
            title: `${asset.assetTag} - ${asset.name} (${asset.status})`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 4,
              fillColor: '#f59e0b', // Amber for vehicles & assets
              fillOpacity: 0.9,
              strokeColor: '#000000',
              strokeWeight: 1
            }
          });

          assetMarker.addListener('click', () => {
            const entity = { ...asset, entityType: 'asset', coordinates: pos };
            setSelectedEntity(entity);
            if (onSelectEntity) onSelectEntity(entity);
          });

          markersRef.current.push(assetMarker);
        }
      });
    }

    // 4. GEOFENCES LAYER (Polygons & Circles)
    if (activeLayers.geofences) {
      geofences.forEach((zone) => {
        if (zone.status === 'inactive') return;

        const fillColor =
          zone.type === 'hazard'
            ? '#ef4444'
            : zone.type === 'wildlife'
            ? '#10b981'
            : '#f59e0b';

        if (zone.shape === 'polygon' && zone.polygonPoints) {
          const polygon = new google.maps.Polygon({
            paths: zone.polygonPoints,
            strokeColor: fillColor,
            strokeOpacity: 0.9,
            strokeWeight: 2,
            fillColor,
            fillOpacity: 0.25,
            map
          });

          polygon.addListener('click', () => {
            const entity = { ...zone, entityType: 'geofence' };
            setSelectedEntity(entity);
            if (onSelectEntity) onSelectEntity(entity);
          });

          overlaysRef.current.push(polygon);
        } else if (zone.shape === 'circle' && zone.center && zone.radiusMeters) {
          const circle = new google.maps.Circle({
            center: zone.center,
            radius: zone.radiusMeters,
            strokeColor: fillColor,
            strokeOpacity: 0.9,
            strokeWeight: 2,
            fillColor,
            fillOpacity: 0.2,
            map
          });

          circle.addListener('click', () => {
            const entity = { ...zone, entityType: 'geofence' };
            setSelectedEntity(entity);
            if (onSelectEntity) onSelectEntity(entity);
          });

          overlaysRef.current.push(circle);
        }
      });
    }

    // 5. EMERGENCIES LAYER
    if (activeLayers.emergencies) {
      emergencies.forEach((emg) => {
        if (emg.status === 'RESOLVED' || emg.status === 'CLOSED') return;

        const matchedStation = stations.find((s) => emg.stationOrRegion.includes(s.name.split(' ')[0]));
        const pos = matchedStation
          ? {
              lat: matchedStation.coordinates.lat + 0.05,
              lng: matchedStation.coordinates.lng + 0.05
            }
          : { lat: -70.8, lng: 11.8 };

        const emgMarker = new google.maps.Marker({
          position: pos,
          map,
          title: `EMERGENCY: ${emg.title}`,
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 8,
            fillColor: '#e11d48',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });

        emgMarker.addListener('click', () => {
          const entity = { ...emg, entityType: 'emergency' };
          setSelectedEntity(entity);
          if (onSelectEntity) onSelectEntity(entity);
        });

        markersRef.current.push(emgMarker);
      });
    }
  }, [mapsLoaded, stations, expeditions, assets, emergencies, geofences, activeLayers, onSelectEntity]);

  // Tactical Canvas Fallback Map for zero-key scenarios
  const renderTacticalCanvasFallback = () => {
    return (
      <div className="relative w-full h-full min-h-[500px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-950/20 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#082f4920_1px,transparent_1px),linear-gradient(to_bottom,#082f4920_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        {/* Top Floating Status Strip */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-bold text-white font-sans">
              Tactical Polar Geographic Radar (Fallback Engine)
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300">
              Antarctic Sector: 60°S - 90°S
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              GPS LOCK: ACTIVE (SIMULATED)
            </span>
          </div>
        </div>

        {/* Tactical Canvas Map Plotter */}
        <div className="relative flex-1 my-4 flex items-center justify-center">
          <div className="absolute w-96 h-96 rounded-full border border-cyan-500/20 animate-pulse pointer-events-none" />
          <div className="absolute w-72 h-72 rounded-full border border-cyan-500/30 pointer-events-none" />
          <div className="absolute w-44 h-44 rounded-full border border-cyan-500/40 pointer-events-none" />

          <div className="relative w-full h-full max-w-2xl max-h-[380px] border border-slate-800/80 rounded-2xl bg-slate-900/40 p-4">
            {/* Base Stations */}
            {activeLayers.stations &&
              stations.map((st, i) => {
                const leftPercent = 25 + (i * 24) % 65;
                const topPercent = 30 + (i * 18) % 55;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      const entity = { ...st, entityType: 'station' };
                      setSelectedEntity(entity);
                      if (onSelectEntity) onSelectEntity(entity);
                    }}
                    style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl bg-slate-950/90 border border-cyan-500/60 hover:border-cyan-400 text-left transition-all hover:scale-105 shadow-xl group z-20"
                  >
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-xs font-bold text-white group-hover:text-cyan-300 truncate max-w-[130px]">
                        {st.name.split('(')[0]}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-cyan-400">
                      {st.coordinates.lat.toFixed(2)}°S, {st.coordinates.lng.toFixed(2)}°E
                    </p>
                  </button>
                );
              })}

            {/* Geofence Zones */}
            {activeLayers.geofences &&
              geofences.map((geo, i) => {
                const leftPercent = 18 + (i * 22) % 70;
                const topPercent = 22 + (i * 25) % 60;
                const isHazard = geo.type === 'hazard';
                return (
                  <button
                    key={geo.id}
                    type="button"
                    onClick={() => {
                      const entity = { ...geo, entityType: 'geofence' };
                      setSelectedEntity(entity);
                      if (onSelectEntity) onSelectEntity(entity);
                    }}
                    style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl text-left border backdrop-blur-md transition-all hover:scale-105 z-10 ${
                      isHazard
                        ? 'bg-rose-950/70 border-rose-500/60 text-rose-200'
                        : 'bg-amber-950/70 border-amber-500/60 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      <span className="text-[11px] font-bold truncate max-w-[120px]">{geo.code}</span>
                    </div>
                    <span className="text-[9px] font-mono block opacity-80 truncate max-w-[120px]">
                      {geo.name}
                    </span>
                  </button>
                );
              })}

            {/* Active Expeditions */}
            {activeLayers.expeditions &&
              expeditions
                .filter((e) => e.status === 'Active')
                .map((exp, i) => (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => {
                      const entity = { ...exp, entityType: 'expedition' };
                      setSelectedEntity(entity);
                      if (onSelectEntity) onSelectEntity(entity);
                    }}
                    style={{ left: `${40 + i * 20}%`, top: `${65 - i * 15}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-sky-950/90 border border-sky-400 text-left transition-all hover:scale-110 z-20"
                  >
                    <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-sky-300">
                      <Compass className="w-3 h-3 text-sky-400 animate-spin-slow" />
                      <span>{exp.code}</span>
                    </div>
                  </button>
                ))}
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="relative z-10 p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>
              Google Maps API Key not configured in environment (`VITE_GOOGLE_MAPS_API_KEY`). Displaying Tactical Polar Radar fallback.
            </span>
          </div>
          <span className="text-cyan-400 font-bold">READY FOR DEPLOYMENT</span>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full min-h-[600px] flex flex-col rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
      {/* Top Floating Map Type Selector Toolbar */}
      {isKeyConfigured && !loadError && (
        <div className="absolute top-4 left-4 z-20 flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 backdrop-blur-md shadow-xl text-xs font-mono">
          <div className="flex items-center gap-1">
            <span className="px-2 text-slate-400 font-bold hidden sm:inline-flex items-center gap-1">
              <MapIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Map Type:</span>
            </span>
            <button
              type="button"
              onClick={() => handleSetMapType('roadmap')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                currentMapType === 'roadmap'
                  ? 'bg-cyan-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Roadmap
            </button>
            <button
              type="button"
              onClick={() => handleSetMapType('satellite')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                currentMapType === 'satellite'
                  ? 'bg-cyan-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => handleSetMapType('hybrid')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                currentMapType === 'hybrid'
                  ? 'bg-cyan-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Hybrid
            </button>
            <button
              type="button"
              onClick={() => handleSetMapType('terrain')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                currentMapType === 'terrain'
                  ? 'bg-cyan-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Terrain
            </button>
          </div>
        </div>
      )}

      {/* Live Map or Tactical Fallback Container */}
      {isKeyConfigured && !loadError ? (
        <div ref={mapContainerRef} className="w-full h-full min-h-[600px] flex-1" />
      ) : (
        renderTacticalCanvasFallback()
      )}

      {/* Floating Active Breach Alert Banner */}
      {breaches.length > 0 && (
        <div className="absolute top-16 left-4 right-4 sm:right-auto z-20 max-w-md p-3.5 bg-rose-950/90 border border-rose-500/70 rounded-xl shadow-2xl backdrop-blur-md animate-pulse space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Flame className="w-4 h-4 text-rose-400 animate-bounce" />
            <span>ACTIVE GEOFENCE HAZARD BREACH DETECTED ({breaches.length})</span>
          </div>
          {breaches.map((b) => (
            <div key={b.id} className="text-[11px] font-mono text-rose-200 pl-6">
              <strong>{b.entityName}</strong> breached boundary of <em>{b.geofenceName}</em>
            </div>
          ))}
        </div>
      )}

      {/* Floating Live Coordinate HUD */}
      {hoveredCoords && (
        <div className="absolute bottom-4 left-4 z-20 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs font-mono text-cyan-300 shadow-xl hidden sm:flex items-center gap-2">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            LAT: {hoveredCoords.lat}° | LNG: {hoveredCoords.lng}°
          </span>
        </div>
      )}

      {/* Selected Entity Inspector Drawer */}
      {selectedEntity && (
        <div className="absolute top-4 right-4 z-30 w-80 sm:w-96 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl p-4 backdrop-blur-xl animate-in slide-in-from-right-4 duration-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                {selectedEntity.entityType === 'station' ? (
                  <Building2 className="w-4 h-4" />
                ) : selectedEntity.entityType === 'geofence' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                ) : selectedEntity.entityType === 'emergency' ? (
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                ) : selectedEntity.entityType === 'asset' ? (
                  <Truck className="w-4 h-4 text-amber-400" />
                ) : (
                  <Compass className="w-4 h-4" />
                )}
              </span>
              <div>
                <h4 className="text-xs font-bold text-white font-sans uppercase">
                  {selectedEntity.name || selectedEntity.title || selectedEntity.code || selectedEntity.assetTag}
                </h4>
                <span className="text-[10px] font-mono text-cyan-400">
                  {selectedEntity.entityType?.toUpperCase()} OVERLAY
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedEntity(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 text-xs"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {selectedEntity.entityType === 'station' && (
              <>
                <div className="flex justify-between p-2 rounded-lg bg-slate-950">
                  <span className="text-slate-400">Coordinates:</span>
                  <span className="text-white font-bold">{selectedEntity.coordinates?.formatted || `${selectedEntity.coordinates?.lat}°S, ${selectedEntity.coordinates?.lng}°E`}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-950">
                  <span className="text-slate-400">Current Temperature:</span>
                  <span className="text-cyan-300 font-bold">{selectedEntity.currentTemp}°C</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-950">
                  <span className="text-slate-400">Satellite Link:</span>
                  <span className="text-emerald-400 font-bold">{selectedEntity.satelliteUplinkMbps} Mbps</span>
                </div>
              </>
            )}

            {selectedEntity.entityType === 'geofence' && (
              <>
                <div className="p-2 rounded-lg bg-slate-950 space-y-1">
                  <span className="text-slate-400 block text-[10px]">Zone Type & Severity:</span>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-950 text-rose-300 border border-rose-500/40">
                      {selectedEntity.type}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950 text-amber-300 border border-amber-500/40">
                      {selectedEntity.severity}
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-950">
                  <span className="text-slate-400 block text-[10px]">Description:</span>
                  <p className="text-slate-200 text-[11px] mt-0.5 font-sans">{selectedEntity.description}</p>
                </div>
                {selectedEntity.rules && (
                  <div className="p-2 rounded-lg bg-slate-950 space-y-1">
                    <span className="text-slate-400 block text-[10px]">Enforced Operational Rules:</span>
                    <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5 font-sans">
                      {selectedEntity.rules.map((rule: string, idx: number) => (
                        <li key={idx}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {selectedEntity.entityType === 'expedition' && (
              <>
                <div className="flex justify-between p-2 rounded-lg bg-slate-950">
                  <span className="text-slate-400">Mission Leader:</span>
                  <span className="text-white font-bold">{selectedEntity.leader}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-950">
                  <span className="text-slate-400">Traverse Status:</span>
                  <span className="text-cyan-300 font-bold">{selectedEntity.status}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-950">
                  <span className="text-slate-400">Progress:</span>
                  <span className="text-emerald-400 font-bold">{selectedEntity.progressPercent}%</span>
                </div>
              </>
            )}

            {selectedEntity.entityType === 'asset' && (
              <>
                <div className="flex justify-between p-2 rounded-lg bg-slate-950">
                  <span className="text-slate-400">Category:</span>
                  <span className="text-white font-bold">{selectedEntity.category}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-950">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-emerald-400 font-bold">{selectedEntity.status}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-950">
                  <span className="text-slate-400">Health Score:</span>
                  <span className="text-cyan-300 font-bold">{selectedEntity.healthScore}%</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
