import {
  collection,
  doc,
  getDocs,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { PolarActivityLog } from '../../types';

const COLLECTION_NAME = 'activityLogs';

export const normalizeActivityLog = (docId: string, rawData?: Record<string, any>): PolarActivityLog => {
  const data = rawData || {};
  return {
    id: docId,
    timestamp: typeof data.timestamp === 'string' && data.timestamp ? data.timestamp : 'Just now',
    module: (typeof data.module === 'string' && data.module ? data.module : 'system') as PolarActivityLog['module'],
    action: typeof data.action === 'string' && data.action ? data.action : 'System Action',
    details: typeof data.details === 'string' ? data.details : '',
    severity: (typeof data.severity === 'string' && data.severity ? data.severity : 'info') as PolarActivityLog['severity'],
    user: typeof data.user === 'string' && data.user ? data.user : 'System Telemetry'
  };
};

export const subscribeActivityLogs = (
  onUpdate: (logs: PolarActivityLog[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  if (!db) return () => {};

  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy('timestamp', 'desc'),
    limit(50)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => normalizeActivityLog(docSnap.id, docSnap.data()));
      onUpdate(items);
    },
    (err) => {
      console.error('Error in activity logs snapshot listener:', err);
      if (onError) onError(err);
    }
  );
};

export const getActivityLogsList = async (): Promise<PolarActivityLog[]> => {
  if (!db) return [];
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => normalizeActivityLog(docSnap.id, docSnap.data()));
  } catch (error) {
    console.error('Error fetching activity logs from Firestore:', error);
    return [];
  }
};

export const createActivityLog = async (log: PolarActivityLog): Promise<void> => {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, log.id);
    await setDoc(docRef, log);
  } catch (error) {
    console.error('Error writing activity log to Firestore:', error);
  }
};
