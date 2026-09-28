/**
 * POLAR-X Firebase Cloud Backend Connection & Status Indicator Banner
 * Displays explicit live connection state, authentication status, permissions, and offline mode.
 */

import React, { useState, useEffect } from 'react';
import { useAuth, usePolar } from '../../context';
import {
  AlertTriangle,
  RefreshCw,
  Database,
  WifiOff,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const FirebaseConnectionBanner: React.FC = () => {
  const { currentUser, userProfile, isDemoMode } = useAuth();
  const { isFirebaseActive, dbLoading, dbError, retryFirestoreConnection } = usePolar();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showDiagnostic, setShowDiagnostic] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 1. Offline Mode Indicator
  if (!isOnline) {
    return (
      <div className="bg-amber-950/90 border-b border-amber-500/50 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-amber-200">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            <strong>POLAR MESH OFFLINE:</strong> Disconnected from Internet. Operating from secure local IndexedDB cache.
          </span>
        </div>
        <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-500/40 text-[10px] font-bold text-amber-300">
          OFFLINE CACHE
        </span>
      </div>
    );
  }

  // 2. Demo / Local Simulation Mode
  if (!isFirebaseActive || isDemoMode) {
    return (
      <div className="bg-slate-900/90 border-b border-cyan-500/20 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-cyan-300">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>
            <strong>DATABASE MODE: DEMO / LOCAL</strong> — Operating on local simulation fixtures.
          </span>
        </div>
        <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-[10px] font-bold text-cyan-300">
          DEMO MODE
        </span>
      </div>
    );
  }

  // 3. Genuine Firestore Permission Denied or Error State
  if (dbError) {
    const isPermissionError = dbError.toLowerCase().includes('permission') || dbError.toLowerCase().includes('insufficient');
    // Extract collection name if error starts with "collectionName: ..."
    const colonIdx = dbError.indexOf(':');
    const collectionName = colonIdx > 0 ? dbError.slice(0, colonIdx).trim() : 'general';

    return (
      <div className="bg-rose-950/95 border-b border-rose-500/50 px-4 py-2.5 text-xs font-mono text-rose-200 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {isPermissionError ? (
              <Lock className="w-4 h-4 text-rose-400 flex-shrink-0 animate-pulse" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 animate-pulse" />
            )}
            <div>
              {isPermissionError ? (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-bold text-white bg-rose-900/80 px-1.5 py-0.5 rounded border border-rose-500/40">
                    Firestore Permission Denied
                  </span>
                  <span>Collection: <strong className="text-rose-300">{collectionName}</strong></span>
                  <span>|</span>
                  <span>Role: <strong className="text-cyan-300">{userProfile?.role || 'UNRESOLVED'}</strong></span>
                  <span>|</span>
                  <span>UID: <strong className="text-slate-300">{currentUser?.uid || 'NONE'}</strong></span>
                </div>
              ) : (
                <div>
                  <span className="font-bold text-white">Cloud Database Error: </span>
                  <span>{dbError}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDiagnostic(!showDiagnostic)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-950/80 border border-rose-500/40 text-[10px] text-rose-300 hover:text-white"
            >
              <span>Diagnostics</span>
              {showDiagnostic ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <button
              type="button"
              onClick={retryFirestoreConnection}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Query</span>
            </button>
          </div>
        </div>

        {showDiagnostic && (
          <div className="p-3 bg-slate-950/90 rounded-lg border border-rose-500/30 text-[11px] space-y-1 text-slate-300">
            <p className="text-white font-bold">Diagnostic Telemetry:</p>
            <p>• Firebase SDK: <span className="text-emerald-400">INITIALIZED</span></p>
            <p>• Auth State: <span className="text-emerald-400">{currentUser ? `SIGNED IN (${currentUser.email})` : 'NOT AUTHENTICATED'}</span></p>
            <p>• Auth UID: <span className="text-emerald-400">{currentUser?.uid || 'N/A'}</span></p>
            <p>• Authoritative Role: <span className="text-cyan-400">{userProfile?.role || 'UNRESOLVED'}</span></p>
            <p>• Target Collection: <span className="text-amber-300">{collectionName}</span></p>
            <p>• Error Detail: <span className="text-rose-400 font-mono">{dbError}</span></p>
          </div>
        )}
      </div>
    );
  }

  // 4. Initial Synchronization Loading
  if (dbLoading) {
    return (
      <div className="bg-slate-900/90 border-b border-cyan-500/30 px-4 py-1.5 flex items-center justify-between text-xs font-mono text-slate-300">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          <span>Synchronizing with Cloud Firestore...</span>
        </div>
      </div>
    );
  }

  // 5. Active Connected & Authorized State — No error banner
  return null;
};
