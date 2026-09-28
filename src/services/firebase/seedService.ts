import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { mockExpeditions } from '../../data/mockExpeditions';
import { mockPersonnel } from '../../data/mockPersonnel';
import { mockCargo } from '../../data/mockCargo';
import { mockInventory } from '../../data/mockInventory';
import { mockAssets } from '../../data/mockAssets';
import { mockEmergencies } from '../../data/mockEmergencies';
import { mockNotifications } from '../../data/mockNotifications';
import { mockGeofences } from '../../data/mockGeofences';
import { mockRoutes } from '../../data/mockRoutes';

export interface SeedResult {
  success: boolean;
  totalRecords: number;
  breakdown: Record<string, number>;
  message: string;
}

/**
 * Explicitly triggers seeding of initial realistic mock dataset into Firestore collections.
 * Uses Firestore Batches to safely and atomically write documents without destructive deletion.
 * Uses merge: true for complete idempotency.
 */
export const seedFirestoreDatabase = async (): Promise<SeedResult> => {
  if (!db) {
    throw new Error('Firestore is not configured. Seeding is only available with an active Firebase project.');
  }

  try {
    const batch = writeBatch(db);
    let totalCount = 0;
    const breakdown: Record<string, number> = {};

    // Expeditions
    mockExpeditions.forEach((item) => {
      const ref = doc(db!, 'expeditions', item.id);
      batch.set(ref, { ...item, _isSeededDemo: true }, { merge: true });
      totalCount++;
    });
    breakdown['expeditions'] = mockExpeditions.length;

    // Personnel
    mockPersonnel.forEach((item) => {
      const ref = doc(db!, 'personnel', item.id);
      batch.set(ref, { ...item, _isSeededDemo: true }, { merge: true });
      totalCount++;
    });
    breakdown['personnel'] = mockPersonnel.length;

    // Cargo
    mockCargo.forEach((item) => {
      const ref = doc(db!, 'cargo', item.id);
      batch.set(ref, { ...item, _isSeededDemo: true }, { merge: true });
      totalCount++;
    });
    breakdown['cargo'] = mockCargo.length;

    // Inventory
    mockInventory.forEach((item) => {
      const ref = doc(db!, 'inventory', item.id);
      batch.set(ref, { ...item, _isSeededDemo: true }, { merge: true });
      totalCount++;
    });
    breakdown['inventory'] = mockInventory.length;

    // Assets
    mockAssets.forEach((item) => {
      const ref = doc(db!, 'assets', item.id);
      batch.set(ref, { ...item, _isSeededDemo: true }, { merge: true });
      totalCount++;
    });
    breakdown['assets'] = mockAssets.length;

    // Emergencies
    mockEmergencies.forEach((item) => {
      const ref = doc(db!, 'emergencies', item.id);
      batch.set(ref, { ...item, _isSeededDemo: true }, { merge: true });
      totalCount++;
    });
    breakdown['emergencies'] = mockEmergencies.length;

    // Geofences
    mockGeofences.forEach((item) => {
      const ref = doc(db!, 'geofences', item.id);
      batch.set(ref, { ...item, _isSeededDemo: true }, { merge: true });
      totalCount++;
    });
    breakdown['geofences'] = mockGeofences.length;

    // Traverse Routes
    mockRoutes.forEach((item) => {
      const ref = doc(db!, 'routes', item.id);
      batch.set(ref, { ...item, _isSeededDemo: true }, { merge: true });
      totalCount++;
    });
    breakdown['routes'] = mockRoutes.length;

    // Notifications
    mockNotifications.forEach((item) => {
      const ref = doc(db!, 'notifications', item.id);
      batch.set(ref, { ...item, _isSeededDemo: true }, { merge: true });
      totalCount++;
    });
    breakdown['notifications'] = mockNotifications.length;

    // Initial audit log
    const logId = `LOG-INIT-SEED-${Date.now()}`;
    const logRef = doc(db!, 'activityLogs', logId);
    batch.set(logRef, {
      id: logId,
      timestamp: new Date().toISOString(),
      module: 'system',
      action: 'SYSTEM_DATABASE_SEEDED',
      details: `Initialized scientific operational records across 10 collections from polar demonstration dataset.`,
      severity: 'success',
      user: 'Command Admin / Explicit Seeder'
    });
    breakdown['activityLogs'] = 1;
    totalCount++;

    await batch.commit();

    return {
      success: true,
      totalRecords: totalCount,
      breakdown,
      message: `Successfully seeded ${totalCount} records across 10 Firestore collections.`
    };
  } catch (error: any) {
    console.error('Error during Firestore seed:', error);
    throw new Error(`Seeding failed: ${error.message || 'Firestore write rejected'}`);
  }
};

/**
 * Safely resets seeded demonstration data in Firestore.
 * Requires explicit confirmation parameter.
 */
export const resetFirestoreDemoData = async (confirmToken: string): Promise<SeedResult> => {
  if (!db) {
    throw new Error('Firestore is not configured. Operation is only available with an active Firebase project.');
  }

  if (confirmToken !== 'CONFIRM_POLAR_DEMO_RESET') {
    throw new Error('Safety confirmation token required to reset demonstration collections.');
  }

  try {
    const batch = writeBatch(db);
    let deletedCount = 0;
    const breakdown: Record<string, number> = {};

    // Delete seeded mock items by known IDs to prevent wiping production items
    mockExpeditions.forEach((item) => {
      const ref = doc(db!, 'expeditions', item.id);
      batch.delete(ref);
      deletedCount++;
    });
    breakdown['expeditions'] = mockExpeditions.length;

    mockPersonnel.forEach((item) => {
      const ref = doc(db!, 'personnel', item.id);
      batch.delete(ref);
      deletedCount++;
    });
    breakdown['personnel'] = mockPersonnel.length;

    mockCargo.forEach((item) => {
      const ref = doc(db!, 'cargo', item.id);
      batch.delete(ref);
      deletedCount++;
    });
    breakdown['cargo'] = mockCargo.length;

    mockInventory.forEach((item) => {
      const ref = doc(db!, 'inventory', item.id);
      batch.delete(ref);
      deletedCount++;
    });
    breakdown['inventory'] = mockInventory.length;

    mockAssets.forEach((item) => {
      const ref = doc(db!, 'assets', item.id);
      batch.delete(ref);
      deletedCount++;
    });
    breakdown['assets'] = mockAssets.length;

    mockEmergencies.forEach((item) => {
      const ref = doc(db!, 'emergencies', item.id);
      batch.delete(ref);
      deletedCount++;
    });
    breakdown['emergencies'] = mockEmergencies.length;

    mockGeofences.forEach((item) => {
      const ref = doc(db!, 'geofences', item.id);
      batch.delete(ref);
      deletedCount++;
    });
    breakdown['geofences'] = mockGeofences.length;

    mockRoutes.forEach((item) => {
      const ref = doc(db!, 'routes', item.id);
      batch.delete(ref);
      deletedCount++;
    });
    breakdown['routes'] = mockRoutes.length;

    mockNotifications.forEach((item) => {
      const ref = doc(db!, 'notifications', item.id);
      batch.delete(ref);
      deletedCount++;
    });
    breakdown['notifications'] = mockNotifications.length;

    // Audit log
    const logId = `LOG-RESET-SEED-${Date.now()}`;
    const logRef = doc(db!, 'activityLogs', logId);
    batch.set(logRef, {
      id: logId,
      timestamp: new Date().toISOString(),
      module: 'system',
      action: 'SYSTEM_DATABASE_DEMO_RESET',
      details: `Safely cleared ${deletedCount} demonstration fixture records from Firestore.`,
      severity: 'warning',
      user: 'Command Admin / Reset Utility'
    });
    deletedCount++;

    await batch.commit();

    return {
      success: true,
      totalRecords: deletedCount,
      breakdown,
      message: `Safely cleared ${deletedCount} demonstration records from active Firestore database.`
    };
  } catch (error: any) {
    console.error('Error during Firestore demo reset:', error);
    throw new Error(`Demo reset failed: ${error.message || 'Firestore delete rejected'}`);
  }
};

