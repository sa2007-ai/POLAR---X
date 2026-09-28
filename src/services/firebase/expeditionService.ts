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
import { Expedition } from '../../types';

const COLLECTION_NAME = 'expeditions';

export const normalizeExpedition = (docId: string, rawData?: Record<string, any>): Expedition => {
  const data = rawData || {};
  return {
    id: docId,
    code: typeof data.code === 'string' && data.code ? data.code : docId,
    title: typeof data.title === 'string' && data.title ? data.title : 'Polar Expedition',
    type: (typeof data.type === 'string' && data.type ? data.type : 'Glaciology & Ice Core') as Expedition['type'],
    leader: typeof data.leader === 'string' && data.leader ? data.leader : 'Expedition Leader',
    leaderId: typeof data.leaderId === 'string' ? data.leaderId : '',
    station: typeof data.station === 'string' && data.station ? data.station : 'Maitri Station',
    region: typeof data.region === 'string' && data.region ? data.region : 'Antarctica',
    startDate: typeof data.startDate === 'string' && data.startDate ? data.startDate : new Date().toISOString(),
    endDate: typeof data.endDate === 'string' && data.endDate ? data.endDate : new Date().toISOString(),
    status: (typeof data.status === 'string' && data.status ? data.status : 'Planning') as Expedition['status'],
    priority: (typeof data.priority === 'string' && data.priority ? data.priority : 'Normal') as Expedition['priority'],
    personnelCount: typeof data.personnelCount === 'number' ? data.personnelCount : 0,
    assignedVehicles: Array.isArray(data.assignedVehicles) ? data.assignedVehicles : [],
    progressPercent: typeof data.progressPercent === 'number' ? data.progressPercent : 0,
    budgetAllocated: typeof data.budgetAllocated === 'number' ? data.budgetAllocated : 0,
    budgetUsed: typeof data.budgetUsed === 'number' ? data.budgetUsed : 0,
    coordinates: data.coordinates && typeof data.coordinates.lat === 'number' && typeof data.coordinates.lng === 'number'
      ? {
          lat: data.coordinates.lat,
          lng: data.coordinates.lng,
          altitude: typeof data.coordinates.altitude === 'string' ? data.coordinates.altitude : '100m'
        }
      : { lat: -70.76, lng: 11.74, altitude: '117m' },
    objectives: Array.isArray(data.objectives) ? data.objectives : [],
    weatherAlert: typeof data.weatherAlert === 'string' ? data.weatherAlert : undefined
  };
};

export const subscribeExpeditions = (
  onUpdate: (expeditions: Expedition[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  if (!db) {
    return () => {};
  }

  const q = query(collection(db, COLLECTION_NAME), orderBy('startDate', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => normalizeExpedition(docSnap.id, docSnap.data()));
      onUpdate(items);
    },
    (err) => {
      console.error('Error in expeditions snapshot listener:', err);
      if (onError) onError(err);
    }
  );
};

export const getExpeditions = async (): Promise<Expedition[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('startDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => normalizeExpedition(docSnap.id, docSnap.data()));
  } catch (error) {
    console.error('Error fetching expeditions:', error);
    throw new Error('Unable to retrieve polar expeditions from Firestore.');
  }
};

export const createExpedition = async (expedition: Expedition): Promise<void> => {
  if (!db) return;

  // Validation
  if (!expedition.title?.trim()) throw new Error('Expedition title is required.');
  if (!expedition.leader?.trim()) throw new Error('Expedition mission leader is required.');
  if (!expedition.station?.trim()) throw new Error('Base station or target region is required.');
  if (!expedition.startDate) throw new Error('Traverse departure date is required.');
  if (!expedition.endDate) throw new Error('Estimated completion date is required.');

  try {
    const docRef = doc(db, COLLECTION_NAME, expedition.id);
    await setDoc(docRef, expedition);
  } catch (error) {
    console.error('Error creating expedition in Firestore:', error);
    throw new Error('Unable to save expedition to cloud database. Please verify connection.');
  }
};

export const updateExpedition = async (
  id: string,
  updates: Partial<Expedition>
): Promise<void> => {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating expedition in Firestore:', error);
    throw new Error('Failed to update expedition details.');
  }
};

export const deleteExpedition = async (id: string): Promise<void> => {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting expedition from Firestore:', error);
    throw new Error('Failed to remove expedition record.');
  }
};
