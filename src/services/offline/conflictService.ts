/**
 * POLAR-X Conflict Detection and Resolution Engine
 */

import { offlineDB, STORES, SyncConflictRecord } from './offlineDb';

class ConflictService {
  public async recordConflict(
    conflict: Omit<SyncConflictRecord, 'id' | 'detectedAt' | 'status'>
  ): Promise<SyncConflictRecord> {
    const record: SyncConflictRecord = {
      id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      detectedAt: new Date().toISOString(),
      status: 'OPEN',
      ...conflict
    };

    await offlineDB.put(STORES.CONFLICTS, record);
    return record;
  }

  public async getOpenConflicts(): Promise<SyncConflictRecord[]> {
    const all = await offlineDB.getAll<SyncConflictRecord>(STORES.CONFLICTS);
    return all.filter((c) => c.status === 'OPEN');
  }

  public async getAllConflicts(): Promise<SyncConflictRecord[]> {
    return await offlineDB.getAll<SyncConflictRecord>(STORES.CONFLICTS);
  }

  public async resolveConflict(
    conflictId: string,
    strategy: 'KEEP_LOCAL' | 'KEEP_SERVER' | 'CUSTOM',
    resolvedBy: string,
    chosenPayload: any
  ): Promise<void> {
    const conflict = await offlineDB.get<SyncConflictRecord>(STORES.CONFLICTS, conflictId);
    if (!conflict) return;

    conflict.status = 'RESOLVED';
    conflict.resolution = {
      resolvedBy,
      resolvedAt: new Date().toISOString(),
      chosenPayload,
      strategy
    };

    await offlineDB.put(STORES.CONFLICTS, conflict);
  }

  public async discardConflict(conflictId: string): Promise<void> {
    const conflict = await offlineDB.get<SyncConflictRecord>(STORES.CONFLICTS, conflictId);
    if (!conflict) return;

    conflict.status = 'DISCARDED';
    await offlineDB.put(STORES.CONFLICTS, conflict);
  }
}

export const conflictService = new ConflictService();
