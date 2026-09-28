import React, { useEffect, useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Download,
  Clock,
  Layers
} from 'lucide-react';
import { pwaService } from '../../services/pwa/pwaService';
import { syncQueueService } from '../../services/offline/syncQueueService';
import { cacheService, CacheFreshnessInfo } from '../../services/offline/cacheService';
import { QueuedMutation, SyncConflictRecord } from '../../services/offline/offlineDb';
import { conflictService } from '../../services/offline/conflictService';
import { usePolar } from '../../context';

interface NetworkStatusBannerProps {
  onOpenConflicts?: () => void;
}

export const NetworkStatusBanner: React.FC<NetworkStatusBannerProps> = ({ onOpenConflicts }) => {
  const { isFirebaseActive } = usePolar();
  const [isOnline, setIsOnline] = useState<boolean>(pwaService.isOnline());
  const [canInstall, setCanInstall] = useState<boolean>(pwaService.canInstall());
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS' | 'CONFLICT' | 'ERROR'>('IDLE');
  const [pendingQueue, setPendingQueue] = useState<QueuedMutation[]>([]);
  const [openConflicts, setOpenConflicts] = useState<SyncConflictRecord[]>([]);
  const [freshness, setFreshness] = useState<CacheFreshnessInfo>({
    lastSyncTimestamp: null,
    lastSyncFormatted: 'Loading...',
    isStale: false,
    status: 'CACHED'
  });

  useEffect(() => {
    const unsubNet = pwaService.subscribeNetworkStatus((online) => {
      setIsOnline(online);
      if (online) {
        // Automatically initiate sync queue processing when connection returns
        syncQueueService.processQueue();
      }
    });

    const unsubInstall = pwaService.subscribeInstallPrompt((installable) => {
      setCanInstall(installable);
    });

    const unsubQueue = syncQueueService.subscribeQueue((queue) => {
      setPendingQueue(queue);
    });

    const unsubSyncStatus = syncQueueService.subscribeStatus((status) => {
      setSyncStatus(status);
    });

    const updateFreshness = async () => {
      const info = await cacheService.getFreshnessInfo(pwaService.isOnline(), isFirebaseActive);
      setFreshness(info);
      const conflicts = await conflictService.getOpenConflicts();
      setOpenConflicts(conflicts);
    };

    updateFreshness();
    const interval = setInterval(updateFreshness, 15000);

    return () => {
      unsubNet();
      unsubInstall();
      unsubQueue();
      unsubSyncStatus();
      clearInterval(interval);
    };
  }, [isFirebaseActive]);

  const handleInstallClick = async () => {
    await pwaService.promptInstall();
  };

  const handleManualSync = async () => {
    await syncQueueService.processQueue();
    const info = await cacheService.getFreshnessInfo(pwaService.isOnline(), isFirebaseActive);
    setFreshness(info);
  };

  return (
    <div className="w-full bg-slate-950/90 border-b border-slate-800/80 px-4 py-1.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
      {/* Left: Connectivity Status & Sync Engine */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Connection Badge */}
        {isOnline ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span>ONLINE</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-500/40 text-[11px] font-bold animate-pulse">
            <WifiOff className="w-3 h-3 text-amber-400" />
            <span>OFFLINE LOCAL CACHE</span>
          </span>
        )}

        {/* Sync Status Badge */}
        {syncStatus === 'SYNCING' && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold">
            <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
            <span>SYNCING ({pendingQueue.length})</span>
          </span>
        )}

        {syncStatus === 'SUCCESS' && pendingQueue.length === 0 && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-950/60 text-sky-300 border border-sky-500/20 text-[11px]">
            <CheckCircle2 className="w-3 h-3 text-sky-400" />
            <span>SYNC COMPLETE</span>
          </span>
        )}

        {openConflicts.length > 0 && (
          <button
            type="button"
            onClick={onOpenConflicts}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/50 text-[11px] font-bold hover:bg-rose-900 transition-colors animate-pulse cursor-pointer"
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>SYNC CONFLICT ({openConflicts.length})</span>
          </button>
        )}

        {/* Pending Offline Mutation Count */}
        {pendingQueue.length > 0 && syncStatus !== 'SYNCING' && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 border border-amber-500/30 text-[11px]">
            <Layers className="w-3 h-3 text-amber-400" />
            <span>{pendingQueue.length} Queued Action{pendingQueue.length > 1 ? 's' : ''}</span>
          </span>
        )}

        {/* Stale Data Warning */}
        {freshness.isStale && !isOnline && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[11px]">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>STALE DATA ({freshness.lastSyncFormatted})</span>
          </span>
        )}
      </div>

      {/* Right: Freshness Timestamp, Manual Sync & PWA Install */}
      <div className="flex items-center gap-3 text-slate-400 text-[11px]">
        {/* Last Sync Indicator */}
        <div className="hidden sm:flex items-center gap-1.5" title="Last successful Firestore cloud handshake">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>Last sync: <strong className="text-slate-200">{freshness.lastSyncFormatted}</strong></span>
        </div>

        {/* Manual Sync Trigger */}
        {isOnline && (
          <button
            type="button"
            onClick={handleManualSync}
            disabled={syncStatus === 'SYNCING'}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700/60 transition-colors disabled:opacity-50"
            title="Force synchronization with cloud"
          >
            <RefreshCw className={`w-3 h-3 ${syncStatus === 'SYNCING' ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Sync</span>
          </button>
        )}

        {/* PWA Install Button */}
        {canInstall && (
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-slate-950 font-bold text-[11px] shadow-sm transition-all"
            title="Install POLAR-X to Desktop / Mobile home screen"
          >
            <Download className="w-3 h-3 text-slate-950" />
            <span>Install App</span>
          </button>
        )}
      </div>
    </div>
  );
};
