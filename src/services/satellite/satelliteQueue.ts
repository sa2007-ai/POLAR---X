/**
 * POLAR-X Phase 9 — Multi-Priority Satellite Message Queue
 * P0 (SOS) to P5 (Sync) • FIFO per Priority • Exponential Backoff • Offline IndexedDB Persistence
 */

import { SatelliteMessage, SatelliteMessagePriority, SATELLITE_PRIORITIES } from './satelliteTypes';
import { offlineDB, STORES } from '../offline/offlineDb';

export class SatellitePriorityQueue {
  private queue: SatelliteMessage[] = [];
  private listeners: Set<(queue: SatelliteMessage[]) => void> = new Set();
  private isProcessing = false;

  constructor() {
    this.hydrateFromOfflineStorage();
  }

  /**
   * Enqueue a new message with priority enforcement and deduplication
   */
  public async enqueue(
    priority: SatelliteMessagePriority,
    topic: string,
    payload: Record<string, any> | string,
    options: {
      destination?: string;
      sourceStationOrAsset?: string;
      customId?: string;
    } = {}
  ): Promise<SatelliteMessage> {
    const rawPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const byteSize = new TextEncoder().encode(rawPayload).length;

    const message: SatelliteMessage = {
      id: options.customId || `SAT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      priority,
      topic,
      payload,
      byteSize,
      createdAt: new Date().toISOString(),
      status: 'QUEUED',
      retryCount: 0,
      traceId: `TRC-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      destination: options.destination || 'NCPOR_GROUND_STATION',
      sourceStationOrAsset: options.sourceStationOrAsset || 'MAITRI_BASE'
    };

    // Prevent duplicate active queue entries
    const existingIndex = this.queue.findIndex(
      (m) => m.id === message.id || (m.topic === message.topic && JSON.stringify(m.payload) === rawPayload && m.status === 'QUEUED')
    );
    if (existingIndex >= 0) {
      return this.queue[existingIndex];
    }

    this.insertPrioritized(message);
    await this.persistToIndexedDb(message);
    this.notify();
    return message;
  }

  /**
   * Insert into queue preserving P0 -> P5 priority and FIFO order within priority
   */
  private insertPrioritized(msg: SatelliteMessage): void {
    const priorityWeight: Record<SatelliteMessagePriority, number> = {
      P0: 0,
      P1: 1,
      P2: 2,
      P3: 3,
      P4: 4,
      P5: 5
    };

    const targetWeight = priorityWeight[msg.priority];
    let insertIdx = this.queue.length;

    for (let i = 0; i < this.queue.length; i++) {
      const currentWeight = priorityWeight[this.queue[i].priority];
      if (targetWeight < currentWeight) {
        insertIdx = i;
        break;
      }
    }

    this.queue.splice(insertIdx, 0, msg);
  }

  /**
   * Peek highest priority pending message
   */
  public peek(): SatelliteMessage | undefined {
    return this.queue.find((m) => m.status === 'QUEUED' || m.status === 'RETRYING');
  }

  /**
   * Mark message status and update in-memory / offline store
   */
  public async updateStatus(
    messageId: string,
    status: SatelliteMessage['status'],
    details?: { errorMessage?: string; acknowledgedAt?: string }
  ): Promise<void> {
    const msg = this.queue.find((m) => m.id === messageId);
    if (!msg) return;

    msg.status = status;
    msg.lastAttemptAt = new Date().toISOString();

    if (details?.errorMessage) msg.errorMessage = details.errorMessage;
    if (details?.acknowledgedAt) msg.acknowledgedAt = details.acknowledgedAt;

    if (status === 'RETRYING') {
      msg.retryCount += 1;
      const maxRetries = SATELLITE_PRIORITIES[msg.priority].maxRetries;
      if (msg.retryCount > maxRetries) {
        msg.status = 'FAILED';
        msg.errorMessage = `Exceeded max priority retry allowance (${maxRetries})`;
      }
    }

    await this.persistToIndexedDb(msg);
    this.notify();
  }

  /**
   * Remove delivered or permanently failed message
   */
  public async remove(messageId: string): Promise<void> {
    this.queue = this.queue.filter((m) => m.id !== messageId);
    try {
      await offlineDB.delete(STORES.MUTATION_QUEUE, messageId);
    } catch {
      // Ignore offline store deletion failure in memory-fallback mode
    }
    this.notify();
  }

  /**
   * Retrieve all messages currently in queue
   */
  public getAll(): SatelliteMessage[] {
    return [...this.queue];
  }

  /**
   * Get queue depth (pending items)
   */
  public getPendingCount(): number {
    return this.queue.filter((m) => m.status === 'QUEUED' || m.status === 'RETRYING' || m.status === 'TRANSMITTING').length;
  }

  /**
   * Subscribe to queue state changes
   */
  public subscribe(callback: (queue: SatelliteMessage[]) => void): () => void {
    this.listeners.add(callback);
    callback(this.getAll());
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    const snapshot = this.getAll();
    this.listeners.forEach((cb) => cb(snapshot));
  }

  private async persistToIndexedDb(msg: SatelliteMessage): Promise<void> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return;
    try {
      await offlineDB.put(STORES.MUTATION_QUEUE, {
        id: `SAT_${msg.id}`,
        collection: 'satellite_queue',
        action: 'TRANSMIT',
        payload: msg,
        timestamp: Date.now(),
        retryCount: msg.retryCount,
        status: msg.status === 'ACKNOWLEDGED' ? 'SYNCED' : 'PENDING'
      });
    } catch {
      // Fallback in-memory
    }
  }

  private async hydrateFromOfflineStorage(): Promise<void> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return;
    try {
      const records = await offlineDB.getAll<any>(STORES.MUTATION_QUEUE);
      const satRecords = records.filter((r) => r.collection === 'satellite_queue' && r.status === 'PENDING');
      for (const rec of satRecords) {
        if (rec.payload && !this.queue.some((m) => m.id === rec.payload.id)) {
          rec.payload.offlineQueued = true;
          this.insertPrioritized(rec.payload);
        }
      }
      if (satRecords.length > 0) {
        this.notify();
      }
    } catch {
      // In-memory mode fallback
    }
  }

  public getIsProcessing(): boolean {
    return this.isProcessing;
  }

  public setProcessing(val: boolean): void {
    this.isProcessing = val;
  }
}

export const satelliteQueue = new SatellitePriorityQueue();
