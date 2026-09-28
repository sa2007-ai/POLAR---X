import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OfflineMapPack } from '../services/maps/offline/mapPackTypes';
import { mapPackManager } from '../services/maps/offline/mapPackManager';
import { mapProviderService } from '../services/maps/mapProviderService';
import {
  Layers,
  HardDrive,
  Download,
  Trash2,
  CheckCircle2,
  Navigation
} from 'lucide-react';

export const OfflineMapsPage: React.FC = () => {
  const navigate = useNavigate();
  const [packs, setPacks] = useState<OfflineMapPack[]>(mapPackManager.getPacks());
  const [totalStorageMb, setTotalStorageMb] = useState<number>(mapPackManager.getTotalStorageUsedMb());

  useEffect(() => {
    const unsub = mapPackManager.subscribe((updatedPacks) => {
      setPacks(updatedPacks);
      setTotalStorageMb(mapPackManager.getTotalStorageUsedMb());
    });
    return () => unsub();
  }, []);

  const handleInstall = async (id: string) => {
    await mapPackManager.installPack(id);
  };

  const handleRemove = (id: string) => {
    mapPackManager.removePack(id);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-bold text-white font-sans">
              Antarctic Offline Vector Map Packs
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Pre-cached regional vector tiles, elevation contours, and nunatak topography for zero-network polar operations.
          </p>
        </div>

        {/* Total Storage Indicator & Launch Map Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              mapProviderService.setMode('OFFLINE_VECTOR');
              navigate('/map');
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-cyan-950/40 cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
            <span>Launch Offline Map</span>
          </button>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span>Local Vector Cache: <strong className="text-white">{totalStorageMb.toFixed(1)} MB</strong></span>
          </div>
        </div>
      </div>

      {/* Map Packs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {packs.map((pack) => {
          const isInstalled = pack.status === 'INSTALLED';
          const isDownloading = pack.status === 'DOWNLOADING';

          return (
            <div
              key={pack.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-cyan-400">{pack.packCode}</span>
                    <h3 className="text-base font-bold text-white font-sans mt-0.5">{pack.name}</h3>
                    <p className="text-xs text-slate-400">{pack.region}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                    isInstalled
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                      : isDownloading
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/30 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {pack.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {pack.description}
                </p>

                {/* Specs Matrix */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Pack Size</span>
                    <strong className="text-slate-200">{pack.sizeMb} MB</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Zoom Levels</span>
                    <strong className="text-cyan-300">{pack.zoomLevels}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Dataset Ver</span>
                    <strong className="text-slate-200">v{pack.version}</strong>
                  </div>
                </div>

                {/* Bounds & Checksum */}
                <div className="text-[10px] text-slate-500 space-y-1">
                  <div>Source: <span className="text-slate-400">{pack.source}</span></div>
                  <div className="truncate">SHA-256: <span className="font-mono text-slate-400">{pack.checksumSha256}</span></div>
                </div>
              </div>

              {/* Progress & Action Controls */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                {isDownloading && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-cyan-300">
                      <span>Caching vector tiles into IndexedDB...</span>
                      <span>{pack.downloadProgressPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 transition-all duration-300"
                        style={{ width: `${pack.downloadProgressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  {isInstalled ? (
                    <>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Ready for offline traverse</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(pack.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 hover:border-rose-500/40 border border-slate-700 text-xs transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Pack</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={() => handleInstall(pack.id)}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-cyan-950/50 disabled:opacity-50 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isDownloading ? 'Downloading Vector Pack...' : 'Download Offline Map Pack'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
