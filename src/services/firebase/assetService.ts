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
import { PolarAsset } from '../../types';

const COLLECTION_NAME = 'assets';

export const normalizePolarAsset = (docId: string, rawData?: Record<string, any>): PolarAsset => {
  const data = rawData || {};
  return {
    id: docId,
    assetTag: typeof data.assetTag === 'string' && data.assetTag ? data.assetTag : `AST-${docId.slice(0, 4).toUpperCase()}`,
    name: typeof data.name === 'string' && data.name ? data.name : 'Polar Asset Unit',
    category: (typeof data.category === 'string' && data.category ? data.category : 'Overland Vehicles') as PolarAsset['category'],
    model: typeof data.model === 'string' && data.model ? data.model : 'Standard Spec',
    currentStation: typeof data.currentStation === 'string' && data.currentStation ? data.currentStation : 'Maitri Station',
    assignedExpedition: typeof data.assignedExpedition === 'string' ? data.assignedExpedition : undefined,
    status: (typeof data.status === 'string' && data.status ? data.status : 'Operational') as PolarAsset['status'],
    healthScore: typeof data.healthScore === 'number' ? data.healthScore : 100,
    fuelLevelPercent: typeof data.fuelLevelPercent === 'number' ? data.fuelLevelPercent : 100,
    operatingHours: typeof data.operatingHours === 'number' ? data.operatingHours : 0,
    subZeroRating: typeof data.subZeroRating === 'string' && data.subZeroRating ? data.subZeroRating : '-50°C',
    lastServiceDate: typeof data.lastServiceDate === 'string' && data.lastServiceDate ? data.lastServiceDate : '2026-01-01',
    nextServiceDue: typeof data.nextServiceDue === 'string' && data.nextServiceDue ? data.nextServiceDue : '2026-12-01',
    telemetry: data.telemetry && typeof data.telemetry.engineTemp === 'string'
      ? data.telemetry
      : {
          engineTemp: '-12°C',
          batteryHealth: '98%',
          gpsLock: true,
          lastPing: 'Live'
        }
  };
};

export const subscribeAssets = (
  onUpdate: (assets: PolarAsset[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  if (!db) return () => {};

  const q = query(collection(db, COLLECTION_NAME), orderBy('assetTag', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => normalizePolarAsset(docSnap.id, docSnap.data()));
      onUpdate(items);
    },
    (err) => {
      console.error('Error in assets snapshot listener:', err);
      if (onError) onError(err);
    }
  );
};

export const getAssetsList = async (): Promise<PolarAsset[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('assetTag', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => normalizePolarAsset(docSnap.id, docSnap.data()));
  } catch (error) {
    console.error('Error fetching assets from Firestore:', error);
    throw new Error('Unable to retrieve base assets roster.');
  }
};

export const createAsset = async (asset: PolarAsset): Promise<void> => {
  if (!db) return;

  // Validation
  if (!asset.name?.trim()) throw new Error('Asset name is required.');
  if (!asset.assetTag?.trim()) throw new Error('Asset identification tag is required.');
  if (!asset.category) throw new Error('Asset category is required.');
  if (!asset.status) throw new Error('Operational status is required.');
  if (!asset.currentStation) throw new Error('Station assignment is required.');

  try {
    const docRef = doc(db, COLLECTION_NAME, asset.id);
    await setDoc(docRef, asset);
  } catch (error) {
    console.error('Error creating asset in Firestore:', error);
    throw new Error('Failed to record asset in Firestore.');
  }
};

export const updateAsset = async (
  id: string,
  updates: Partial<PolarAsset>
): Promise<void> => {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating asset in Firestore:', error);
    throw new Error('Failed to update asset telemetry and status.');
  }
};

export const deleteAsset = async (id: string): Promise<void> => {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting asset from Firestore:', error);
    throw new Error('Failed to remove asset record.');
  }
};
