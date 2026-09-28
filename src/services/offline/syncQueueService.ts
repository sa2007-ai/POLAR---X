/**
 * POLAR-X Offline Mutation Queue & Synchronization Engine
 */

import { offlineDB, STORES, QueuedMutation } from './offlineDb';
import { conflictService } from './conflictService';
import { isFirebaseConfigured } from '../../firebase/config';

// Firebase Services for syncing
import * as expService from '../firebase/expeditionService';
import * as persService from '../firebase/personnelService';
import * as cargoService from '../firebase/cargoService';
import * as invService from '../firebase/inventoryService';
import * as assetService from '../firebase/assetService';
import * as emgService from '../firebase/emergencyService';
import * as geoService from '../firebase/geofenceService';
import * as notifService from '../firebase/notificationService';

export const MAX_RETRY_LIMIT = 5;

export interface SyncResult {
  total: number;
  synced: number;
  failed: number;
  conflicts: number;
  errors: string[];
}

type QueueListener = (queue: QueuedMutation[]) => void;
type SyncStatusListener = (status: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'CONFLICT' | 'ERROR') => void;

class SyncQueueService {
  private queueListeners: Set<QueueListener> = new Set();
  private statusListeners: Set<SyncStatusListener> = new Set();
  private isSyncing = false;

  /**
   * Add a mutation to the local IndexedDB queue
   */
  public async enqueue(
    entityType: QueuedMutation['entityType'],
    entityId: string,
    operation: QueuedMutation['operation'],
    payload: any,
    createdBy: string = 'Current Operator'
  ): Promise<QueuedMutation> {
    const mutation: QueuedMutation = {
      mutationId: `mut-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      entityType,
      entityId,
      operation,
      payload,
      createdAt: new Date().toISOString(),
      createdBy,
      retryCount: 0,
      status: 'QUEUED',
      clientTimestamp: Date.now(),
      version: payload?.version || 1
    };

    await offlineDB.put(STORES.MUTATION_QUEUE, mutation);
    await this.notifyQueueListeners();
    return mutation;
  }

  public async getPendingQueue(): Promise<QueuedMutation[]> {
    const all = await offlineDB.getAll<QueuedMutation>(STORES.MUTATION_QUEUE);
    return all
      .filter((m) => m.status === 'QUEUED' || m.status === 'SYNCING' || m.status === 'FAILED')
      .sort((a, b) => a.clientTimestamp - b.clientTimestamp);
  }

  public async getAllMutations(): Promise<QueuedMutation[]> {
    const all = await offlineDB.getAll<QueuedMutation>(STORES.MUTATION_QUEUE);
    return all.sort((a, b) => b.clientTimestamp - a.clientTimestamp);
  }

  public async clearCompletedMutations(): Promise<void> {
    const all = await offlineDB.getAll<QueuedMutation>(STORES.MUTATION_QUEUE);
    for (const m of all) {
      if (m.status === 'SYNCED') {
        await offlineDB.delete(STORES.MUTATION_QUEUE, m.mutationId);
      }
    }
    await this.notifyQueueListeners();
  }

  /**
   * Process all pending mutations in chronological order
   */
  public async processQueue(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { total: 0, synced: 0, failed: 0, conflicts: 0, errors: ['Sync already in progress'] };
    }

    if (!navigator.onLine || !isFirebaseConfigured()) {
      return { total: 0, synced: 0, failed: 0, conflicts: 0, errors: ['Offline or Firebase unconfigured'] };
    }

    this.isSyncing = true;
    this.notifyStatusListeners('SYNCING');

    const pending = await this.getPendingQueue();
    const result: SyncResult = {
      total: pending.length,
      synced: 0,
      failed: 0,
      conflicts: 0,
      errors: []
    };

    for (const mutation of pending) {
      // Abort infinite retries
      if (mutation.retryCount >= MAX_RETRY_LIMIT) {
        mutation.status = 'FAILED';
        mutation.errorMessage = `Max retry limit (${MAX_RETRY_LIMIT}) exceeded.`;
        await offlineDB.put(STORES.MUTATION_QUEUE, mutation);
        result.failed++;
        result.errors.push(`Mutation ${mutation.mutationId} exceeded retry limit.`);
        continue;
      }

      mutation.status = 'SYNCING';
      mutation.retryCount += 1;
      await offlineDB.put(STORES.MUTATION_QUEUE, mutation);

      try {
        await this.dispatchToFirebase(mutation);
        mutation.status = 'SYNCED';
        mutation.errorMessage = undefined;
        await offlineDB.put(STORES.MUTATION_QUEUE, mutation);
        result.synced++;
      } catch (err: any) {
        const errorMsg = err.message || 'Unknown network error during mutation sync';
        
        // Concurrency conflict detection
        if (err.code === 'failed-precondition' || err.message?.includes('conflict') || err.message?.includes('version')) {
          mutation.status = 'CONFLICT';
          mutation.errorMessage = errorMsg;
          await offlineDB.put(STORES.MUTATION_QUEUE, mutation);
          
          await conflictService.recordConflict({
            entityType: mutation.entityType,
            entityId: mutation.entityId,
            localVersion: mutation.version || 1,
            serverVersion: (mutation.version || 1) + 1,
            localPayload: mutation.payload,
            serverPayload: { note: 'Server contains newer version from another operator.' },
            localUpdatedAt: mutation.createdAt,
            serverUpdatedAt: new Date().toISOString(),
            localUpdatedBy: mutation.createdBy,
            serverUpdatedBy: 'Remote Cloud Operator'
          });

          result.conflicts++;
          result.errors.push(`Conflict on ${mutation.entityType}:${mutation.entityId}`);
        } else {
          mutation.status = 'FAILED';
          mutation.errorMessage = errorMsg;
          await offlineDB.put(STORES.MUTATION_QUEUE, mutation);
          result.failed++;
          result.errors.push(`Failed ${mutation.entityType}:${mutation.entityId} — ${errorMsg}`);
        }
      }
    }

    this.isSyncing = false;
    await this.notifyQueueListeners();

    if (result.conflicts > 0) {
      this.notifyStatusListeners('CONFLICT');
    } else if (result.failed > 0) {
      this.notifyStatusListeners('ERROR');
    } else {
      this.notifyStatusListeners('SUCCESS');
    }

    return result;
  }

  private async dispatchToFirebase(mutation: QueuedMutation): Promise<void> {
    const { entityType, entityId, operation, payload } = mutation;

    switch (entityType) {
      case 'expeditions':
        if (operation === 'CREATE') await expService.createExpedition(payload);
        else if (operation === 'UPDATE') await expService.updateExpedition(entityId, payload);
        else if (operation === 'DELETE') await expService.deleteExpedition(entityId);
        break;

      case 'personnel':
        if (operation === 'CREATE') await persService.createPersonnel(payload);
        else if (operation === 'UPDATE') await persService.updatePersonnel(entityId, payload);
        else if (operation === 'DELETE') await persService.deletePersonnel(entityId);
        break;

      case 'cargo':
        if (operation === 'CREATE') await cargoService.createCargoItem(payload);
        else if (operation === 'UPDATE') await cargoService.updateCargoItem(entityId, payload);
        else if (operation === 'DELETE') await cargoService.deleteCargoItem(entityId);
        break;

      case 'inventory':
        if (operation === 'CREATE') await invService.createInventoryItem(payload);
        else if (operation === 'UPDATE') await invService.updateInventoryItem(entityId, payload);
        else if (operation === 'DELETE') await invService.deleteInventoryItem(entityId);
        break;

      case 'assets':
        if (operation === 'CREATE') await assetService.createAsset(payload);
        else if (operation === 'UPDATE') await assetService.updateAsset(entityId, payload);
        else if (operation === 'DELETE') await assetService.deleteAsset(entityId);
        break;

      case 'emergencies':
        if (operation === 'CREATE') await emgService.createEmergencyIncident(payload);
        else if (operation === 'UPDATE') await emgService.updateEmergencyIncident(entityId, payload);
        else if (operation === 'DELETE') await emgService.deleteEmergencyIncident(entityId);
        break;

      case 'geofences':
        if (operation === 'CREATE') await geoService.createGeofence(payload);
        else if (operation === 'UPDATE') await geoService.updateGeofence(entityId, payload);
        else if (operation === 'DELETE') await geoService.deleteGeofence(entityId);
        break;

      case 'notifications':
        if (operation === 'CREATE') await notifService.createNotification(payload);
        break;

      default:
        console.warn(`[POLAR-X Sync] Unhandled entity type: ${entityType}`);
    }
  }

  public subscribeQueue(listener: QueueListener): () => void {
    this.queueListeners.add(listener);
    this.getPendingQueue().then((q) => listener(q));
    return () => this.queueListeners.delete(listener);
  }

  public subscribeStatus(listener: SyncStatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private async notifyQueueListeners(): Promise<void> {
    const pending = await this.getPendingQueue();
    this.queueListeners.forEach((listener) => listener(pending));
  }

  private notifyStatusListeners(status: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'CONFLICT' | 'ERROR'): void {
    this.statusListeners.forEach((listener) => listener(status));
  }
}

export const syncQueueService = new SyncQueueService();
