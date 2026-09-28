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
import { CargoItem } from '../../types';

const COLLECTION_NAME = 'cargo';

export const normalizeCargoItem = (docId: string, rawData?: Record<string, any>): CargoItem => {
  const data = rawData || {};
  return {
    id: docId,
    trackingNumber: typeof data.trackingNumber === 'string' && data.trackingNumber ? data.trackingNumber : `TRK-POLAR-${docId.slice(0, 4).toUpperCase()}`,
    title: typeof data.title === 'string' && data.title ? data.title : 'Cargo Consignment',
    category: (typeof data.category === 'string' && data.category ? data.category : 'Scientific Equipment') as CargoItem['category'],
    origin: typeof data.origin === 'string' && data.origin ? data.origin : 'Cape Town Port, South Africa',
    destinationStation: typeof data.destinationStation === 'string' && data.destinationStation ? data.destinationStation : 'Maitri Station',
    expeditionId: typeof data.expeditionId === 'string' ? data.expeditionId : undefined,
    expeditionName: typeof data.expeditionName === 'string' ? data.expeditionName : undefined,
    transportMode: (typeof data.transportMode === 'string' && data.transportMode ? data.transportMode : 'Icebreaker Ship (MV Golovnin)') as CargoItem['transportMode'],
    weightKg: typeof data.weightKg === 'number' ? data.weightKg : 0,
    volumeM3: typeof data.volumeM3 === 'number' ? data.volumeM3 : 0,
    hazardousMaterial: !!data.hazardousMaterial,
    temperatureControlled: !!data.temperatureControlled,
    tempRequirement: typeof data.tempRequirement === 'string' ? data.tempRequirement : undefined,
    status: (typeof data.status === 'string' && data.status ? data.status : 'Prepared') as CargoItem['status'],
    eta: typeof data.eta === 'string' && data.eta ? data.eta : '2026-12-01',
    departureDate: typeof data.departureDate === 'string' && data.departureDate ? data.departureDate : '2026-10-01',
    carrier: typeof data.carrier === 'string' && data.carrier ? data.carrier : 'NCPOR Logistics Wing',
    priority: (typeof data.priority === 'string' && data.priority ? data.priority : 'Routine') as CargoItem['priority'],
    manifestDetails: Array.isArray(data.manifestDetails) ? data.manifestDetails : []
  };
};

export const subscribeCargo = (
  onUpdate: (cargo: CargoItem[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  if (!db) return () => {};

  const q = query(collection(db, COLLECTION_NAME), orderBy('departureDate', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => normalizeCargoItem(docSnap.id, docSnap.data()));
      onUpdate(items);
    },
    (err) => {
      console.error('Error in cargo snapshot listener:', err);
      if (onError) onError(err);
    }
  );
};

export const getCargoList = async (): Promise<CargoItem[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('departureDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => normalizeCargoItem(docSnap.id, docSnap.data()));
  } catch (error) {
    console.error('Error fetching cargo from Firestore:', error);
    throw new Error('Unable to retrieve cargo manifests.');
  }
};

export const createCargoItem = async (cargo: CargoItem): Promise<void> => {
  if (!db) return;

  // Validation
  if (!cargo.title?.trim()) throw new Error('Cargo title or manifest name is required.');
  if (!cargo.trackingNumber?.trim()) throw new Error('Tracking number is required.');
  if (!cargo.destinationStation) throw new Error('Destination station is required.');
  if (!cargo.status) throw new Error('Cargo shipment status is required.');
  if (cargo.weightKg === undefined || cargo.weightKg < 0) {
    throw new Error('Valid cargo gross weight is required.');
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, cargo.id);
    await setDoc(docRef, cargo);
  } catch (error) {
    console.error('Error creating cargo in Firestore:', error);
    throw new Error('Unable to save cargo item to Firestore.');
  }
};

export const updateCargoItem = async (
  id: string,
  updates: Partial<CargoItem>
): Promise<void> => {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating cargo in Firestore:', error);
    throw new Error('Failed to update cargo shipment.');
  }
};

export const deleteCargoItem = async (id: string): Promise<void> => {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting cargo from Firestore:', error);
    throw new Error('Failed to remove cargo shipment record.');
  }
};
