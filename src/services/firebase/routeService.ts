/**
 * POLAR-X Traverse Route Cloud Persistence Service
 */

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
import { TraverseRoute } from '../../types/route';

const COLLECTION_NAME = 'routes';

export const normalizeTraverseRoute = (docId: string, rawData?: Record<string, any>): TraverseRoute => {
  const data = rawData || {};
  return {
    id: docId,
    code: typeof data.code === 'string' && data.code ? data.code : `TRV-${docId.slice(0, 4).toUpperCase()}`,
    title: typeof data.title === 'string' && data.title ? data.title : 'Traverse Route',
    expeditionId: typeof data.expeditionId === 'string' ? data.expeditionId : undefined,
    expeditionCode: typeof data.expeditionCode === 'string' ? data.expeditionCode : undefined,
    originStation: typeof data.originStation === 'string' && data.originStation ? data.originStation : 'Maitri Station',
    destinationStation: typeof data.destinationStation === 'string' && data.destinationStation ? data.destinationStation : 'Bharati Station',
    transportMethod: (typeof data.transportMethod === 'string' && data.transportMethod ? data.transportMethod : 'PistonBully PB100') as TraverseRoute['transportMethod'],
    waypoints: Array.isArray(data.waypoints) ? data.waypoints : [],
    segments: Array.isArray(data.segments) ? data.segments : [],
    totalDistanceKm: typeof data.totalDistanceKm === 'number' ? data.totalDistanceKm : 0,
    estimatedTravelHours: typeof data.estimatedTravelHours === 'number' ? data.estimatedTravelHours : 0,
    costAnalysis: data.costAnalysis && typeof data.costAnalysis.totalCalculatedRiskCost === 'number'
      ? data.costAnalysis
      : {
          baseDistanceCost: 0,
          terrainDifficultyPenalty: 0,
          hazardZonePenalty: 0,
          restrictedZonePenalty: 0,
          weatherRiskPenalty: 0,
          solarRadioDegradationPenalty: 0,
          totalCalculatedRiskCost: 0
        },
    warnings: Array.isArray(data.warnings) ? data.warnings : [],
    status: (typeof data.status === 'string' && data.status ? data.status : 'DRAFT') as TraverseRoute['status'],
    version: typeof data.version === 'number' ? data.version : 1,
    createdAt: typeof data.createdAt === 'string' && data.createdAt ? data.createdAt : new Date().toISOString(),
    createdBy: typeof data.createdBy === 'string' && data.createdBy ? data.createdBy : 'Polar Planner',
    createdByRole: typeof data.createdByRole === 'string' ? data.createdByRole : undefined,
    updatedAt: typeof data.updatedAt === 'string' && data.updatedAt ? data.updatedAt : new Date().toISOString(),
    updatedBy: typeof data.updatedBy === 'string' && data.updatedBy ? data.updatedBy : 'Polar Planner',
    proposedBy: typeof data.proposedBy === 'string' ? data.proposedBy : undefined,
    proposedAt: typeof data.proposedAt === 'string' ? data.proposedAt : undefined,
    approvedBy: typeof data.approvedBy === 'string' ? data.approvedBy : undefined,
    approvedAt: typeof data.approvedAt === 'string' ? data.approvedAt : undefined,
    rejectionReason: typeof data.rejectionReason === 'string' ? data.rejectionReason : undefined,
    notes: typeof data.notes === 'string' ? data.notes : undefined
  };
};

export const subscribeRoutes = (
  onUpdate: (routes: TraverseRoute[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  if (!db) {
    return () => {};
  }

  const q = query(collection(db, COLLECTION_NAME), orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => normalizeTraverseRoute(docSnap.id, docSnap.data()));
      onUpdate(items);
    },
    (err) => {
      console.error('Error in routes snapshot listener:', err);
      if (onError) onError(err);
    }
  );
};

export const getRoutes = async (): Promise<TraverseRoute[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => normalizeTraverseRoute(docSnap.id, docSnap.data()));
  } catch (error) {
    console.error('Error fetching routes:', error);
    throw new Error('Unable to retrieve traverse routes from Firestore.');
  }
};

export const createRoute = async (route: TraverseRoute): Promise<void> => {
  if (!db) return;

  if (!route.title?.trim()) throw new Error('Route title is required.');
  if (!route.originStation?.trim()) throw new Error('Origin station is required.');
  if (!route.destinationStation?.trim()) throw new Error('Destination station is required.');
  if (!route.waypoints || route.waypoints.length < 2) {
    throw new Error('Route requires at least 2 valid waypoints.');
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, route.id);
    await setDoc(docRef, route);
  } catch (error) {
    console.error('Error creating route in Firestore:', error);
    throw new Error('Unable to save traverse route to cloud database.');
  }
};

export const updateRoute = async (
  id: string,
  updates: Partial<TraverseRoute>
): Promise<void> => {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating route in Firestore:', error);
    throw new Error('Failed to update route details.');
  }
};

export const deleteRoute = async (id: string): Promise<void> => {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting route from Firestore:', error);
    throw new Error('Failed to remove route record.');
  }
};
