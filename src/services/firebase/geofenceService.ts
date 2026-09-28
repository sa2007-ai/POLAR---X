import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { GeofenceZone } from '../../types/geofence';

const COLLECTION_NAME = 'geofences';

export const normalizeGeofenceZone = (docId: string, rawData?: Record<string, any>): GeofenceZone => {
  const data = rawData || {};
  return {
    id: docId,
    code: typeof data.code === 'string' && data.code ? data.code : `GEO-${docId.slice(0, 4).toUpperCase()}`,
    name: typeof data.name === 'string' && data.name ? data.name : 'Geofence Sector',
    type: (typeof data.type === 'string' && data.type ? data.type : 'hazard') as GeofenceZone['type'],
    severity: (typeof data.severity === 'string' && data.severity ? data.severity : 'Warning') as GeofenceZone['severity'],
    stationOrRegion: typeof data.stationOrRegion === 'string' && data.stationOrRegion ? data.stationOrRegion : 'Antarctica',
    shape: (typeof data.shape === 'string' && data.shape ? data.shape : 'circle') as GeofenceZone['shape'],
    center: data.center && typeof data.center.lat === 'number' && typeof data.center.lng === 'number'
      ? { lat: data.center.lat, lng: data.center.lng }
      : { lat: -70.76, lng: 11.74 },
    radiusMeters: typeof data.radiusMeters === 'number' ? data.radiusMeters : 1000,
    polygonPoints: Array.isArray(data.polygonPoints) ? data.polygonPoints : undefined,
    description: typeof data.description === 'string' ? data.description : '',
    rules: Array.isArray(data.rules) ? data.rules : [],
    status: (typeof data.status === 'string' && data.status ? data.status : 'active') as GeofenceZone['status'],
    activeBreaches: Array.isArray(data.activeBreaches) ? data.activeBreaches : [],
    createdAt: typeof data.createdAt === 'string' && data.createdAt ? data.createdAt : new Date().toISOString(),
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined
  };
};

export const subscribeGeofences = (
  onUpdate: (geofences: GeofenceZone[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  if (!db) return () => {};

  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => normalizeGeofenceZone(docSnap.id, docSnap.data()));
      onUpdate(items);
    },
    (err) => {
      console.error('Error in geofences snapshot listener:', err);
      if (onError) onError(err);
    }
  );
};

export const getGeofencesList = async (): Promise<GeofenceZone[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => normalizeGeofenceZone(docSnap.id, docSnap.data()));
  } catch (error) {
    console.error('Error fetching geofences from Firestore:', error);
    throw new Error('Unable to retrieve geofences from cloud database.');
  }
};

export const createGeofence = async (geofence: GeofenceZone): Promise<void> => {
  if (!db) return;

  // Validation
  if (!geofence.name?.trim()) throw new Error('Geofence zone name is required.');
  if (!geofence.code?.trim()) throw new Error('Zone classification code is required.');
  if (!geofence.type) throw new Error('Zone category type is required.');
  if (!geofence.center || isNaN(geofence.center.lat) || isNaN(geofence.center.lng)) {
    throw new Error('Valid geographic center coordinates are required.');
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, geofence.id);
    await setDoc(docRef, geofence);
  } catch (error) {
    console.error('Error creating geofence in Firestore:', error);
    throw new Error('Failed to record geofence zone in Firestore.');
  }
};

export const updateGeofence = async (
  id: string,
  updates: Partial<GeofenceZone>
): Promise<void> => {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating geofence in Firestore:', error);
    throw new Error('Failed to update geofence parameters.');
  }
};

export const deleteGeofence = async (id: string): Promise<void> => {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting geofence from Firestore:', error);
    throw new Error('Failed to delete geofence from Firestore.');
  }
};
