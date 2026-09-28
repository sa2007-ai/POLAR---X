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
import { InventoryItem, getInventoryCalculatedStatus } from '../../types';

const COLLECTION_NAME = 'inventory';

export const normalizeInventoryItem = (docId: string, rawData?: Record<string, any>): InventoryItem => {
  const data = rawData || {};
  const qty = typeof data.quantity === 'number' ? data.quantity : 0;
  const minThresh = typeof data.minimumThreshold === 'number' ? data.minimumThreshold : 10;
  const expiry = typeof data.expiryDate === 'string' && data.expiryDate ? data.expiryDate : '2027-01-01';
  const autoStatus = getInventoryCalculatedStatus(qty, minThresh, expiry);

  return {
    id: docId,
    sku: typeof data.sku === 'string' && data.sku ? data.sku : `SKU-${docId.slice(0, 6).toUpperCase()}`,
    name: typeof data.name === 'string' && data.name ? data.name : 'Inventory Supply',
    category: (typeof data.category === 'string' && data.category ? data.category : 'Survival Rations') as InventoryItem['category'],
    station: typeof data.station === 'string' && data.station ? data.station : 'Maitri Station',
    locationBin: typeof data.locationBin === 'string' && data.locationBin ? data.locationBin : 'Main Depot',
    quantity: qty,
    unit: typeof data.unit === 'string' && data.unit ? data.unit : 'Units',
    minimumThreshold: minThresh,
    maximumCapacity: typeof data.maximumCapacity === 'number' ? data.maximumCapacity : 100,
    expiryDate: expiry,
    status: (typeof data.status === 'string' && data.status ? data.status : autoStatus) as InventoryItem['status'],
    costPerUnit: typeof data.costPerUnit === 'number' ? data.costPerUnit : 0,
    lastAudited: typeof data.lastAudited === 'string' && data.lastAudited ? data.lastAudited : new Date().toISOString().slice(0, 10),
    supplier: typeof data.supplier === 'string' && data.supplier ? data.supplier : 'NCPOR Supplier'
  };
};

export const subscribeInventory = (
  onUpdate: (inventory: InventoryItem[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  if (!db) return () => {};

  const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => normalizeInventoryItem(docSnap.id, docSnap.data()));
      onUpdate(items);
    },
    (err) => {
      console.error('Error in inventory snapshot listener:', err);
      if (onError) onError(err);
    }
  );
};

export const getInventoryList = async (): Promise<InventoryItem[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => normalizeInventoryItem(docSnap.id, docSnap.data()));
  } catch (error) {
    console.error('Error fetching inventory from Firestore:', error);
    throw new Error('Unable to retrieve inventory stock records.');
  }
};

export const createInventoryItem = async (item: InventoryItem): Promise<void> => {
  if (!db) return;

  // Validation
  if (!item.name?.trim()) throw new Error('Inventory item name is required.');
  if (!item.sku?.trim()) throw new Error('Item SKU is required.');
  if (item.quantity === undefined || item.quantity < 0) {
    throw new Error('Valid current quantity is required.');
  }
  if (!item.minimumThreshold || item.minimumThreshold < 0) {
    throw new Error('Valid minimum safety threshold is required.');
  }
  if (!item.unit?.trim()) throw new Error('Unit of measurement is required.');

  const calculatedStatus = getInventoryCalculatedStatus(
    item.quantity,
    item.minimumThreshold,
    item.expiryDate
  );

  const payload: InventoryItem = {
    ...item,
    status: calculatedStatus
  };

  try {
    const docRef = doc(db, COLLECTION_NAME, item.id);
    await setDoc(docRef, payload);
  } catch (error) {
    console.error('Error creating inventory item in Firestore:', error);
    throw new Error('Failed to create inventory item in Firestore.');
  }
};

export const updateInventoryItem = async (
  id: string,
  updates: Partial<InventoryItem>
): Promise<void> => {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating inventory item in Firestore:', error);
    throw new Error('Failed to update inventory record.');
  }
};

export const deleteInventoryItem = async (id: string): Promise<void> => {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting inventory item from Firestore:', error);
    throw new Error('Failed to remove inventory record.');
  }
};
