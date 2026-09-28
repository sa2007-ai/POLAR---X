import React, { useState } from 'react';
import { SyncConflictRecord } from '../../services/offline/offlineDb';
import { conflictService } from '../../services/offline/conflictService';
import { useAuth, usePolar } from '../../context';
import { hasRole } from '../../utils/permissions';
import {
  AlertTriangle,
  X,
  Check,
  Server,
  Smartphone,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface ConflictResolutionModalProps {
  conflicts: SyncConflictRecord[];
  isOpen: boolean;
  onClose: () => void;
  onResolved: () => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  conflicts,
  isOpen,
  onClose,
  onResolved
}) => {
  const { userProfile } = useAuth();
  const { logActivity, addNotification } = usePolar();
  const [selectedConflictId, setSelectedConflictId] = useState<string>(
    conflicts[0]?.id || ''
  );
  const [resolving, setResolving] = useState<boolean>(false);

  if (!isOpen || conflicts.length === 0) return null;

  const canResolve = hasRole(userProfile, ['ADMIN', 'EXPEDITION_MANAGER']);
  const currentConflict = conflicts.find((c) => c.id === selectedConflictId) || conflicts[0];

  const handleResolve = async (strategy: 'KEEP_LOCAL' | 'KEEP_SERVER') => {
    if (!currentConflict || !canResolve) return;
    setResolving(true);

    try {
      const chosenPayload =
        strategy === 'KEEP_LOCAL'
          ? currentConflict.localPayload
          : currentConflict.serverPayload;

      await conflictService.resolveConflict(
        currentConflict.id,
        strategy,
        userProfile?.displayName || 'Authorized Commander',
        chosenPayload
      );

      await logActivity(
        'system',
        'Sync Conflict Resolved',
        `Conflict on ${currentConflict.entityType}:${currentConflict.entityId} resolved using ${strategy}.`,
        'info',
        userProfile?.displayName
      );

      await addNotification({
        title: `Conflict Resolved: ${currentConflict.entityType}`,
        description: `Operational state synchronized using ${strategy}.`,
        type: 'info',
        link: '/settings'
      });

      onResolved();
      if (conflicts.length <= 1) {
        onClose();
      }
    } catch (err) {
      console.error('Failed to resolve conflict:', err);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-sans">
                Operational Concurrency Conflict Resolution
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {conflicts.length} Unresolved Conflict{conflicts.length > 1 ? 's' : ''} Detected
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {!canResolve && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-300 flex items-center gap-3 font-mono">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-400" />
              <span>
                Read-Only: Conflict resolution requires Base Commander (ADMIN) or Operations Lead (EXPEDITION_MANAGER) clearance.
              </span>
            </div>
          )}

          {/* Conflict Selector if multiple */}
          {conflicts.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {conflicts.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedConflictId(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap border transition-all ${
                    c.id === currentConflict.id
                      ? 'bg-rose-950 text-rose-300 border-rose-500/50 font-bold'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {c.entityType} : {c.entityId.slice(0, 10)}
                </button>
              ))}
            </div>
          )}

          {/* Diff comparison cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Local Offline Mutation */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="flex items-center gap-1.5 font-bold text-cyan-400 font-mono">
                  <Smartphone className="w-4 h-4" />
                  Local Field Version
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  v{currentConflict.localVersion}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300 font-mono">
                <p><span className="text-slate-500">Operator:</span> {currentConflict.localUpdatedBy}</p>
                <p><span className="text-slate-500">Timestamp:</span> {currentConflict.localUpdatedAt}</p>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-slate-300 max-h-48 overflow-y-auto border border-slate-800">
                <pre className="whitespace-pre-wrap break-all text-[11px]">
                  {JSON.stringify(currentConflict.localPayload, null, 2)}
                </pre>
              </div>
              {canResolve && (
                <button
                  type="button"
                  onClick={() => handleResolve('KEEP_LOCAL')}
                  disabled={resolving}
                  className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Accept Local Field Version</span>
                </button>
              )}
            </div>

            {/* Remote Cloud Version */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="flex items-center gap-1.5 font-bold text-sky-400 font-mono">
                  <Server className="w-4 h-4" />
                  Remote Cloud Version
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  v{currentConflict.serverVersion}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300 font-mono">
                <p><span className="text-slate-500">Source:</span> {currentConflict.serverUpdatedBy}</p>
                <p><span className="text-slate-500">Timestamp:</span> {currentConflict.serverUpdatedAt}</p>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-slate-300 max-h-48 overflow-y-auto border border-slate-800">
                <pre className="whitespace-pre-wrap break-all text-[11px]">
                  {JSON.stringify(currentConflict.serverPayload, null, 2)}
                </pre>
              </div>
              {canResolve && (
                <button
                  type="button"
                  onClick={() => handleResolve('KEEP_SERVER')}
                  disabled={resolving}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs font-mono transition-colors flex items-center justify-center gap-2 border border-slate-700"
                >
                  <ArrowRight className="w-4 h-4 text-sky-400" />
                  <span>Accept Cloud Version</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
