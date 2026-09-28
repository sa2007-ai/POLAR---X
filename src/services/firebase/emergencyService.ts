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
import { EmergencyIncident } from '../../types';

const COLLECTION_NAME = 'emergencies';

export const normalizeEmergencyIncident = (docId: string, rawData?: Record<string, any>): EmergencyIncident => {
  const data = rawData || {};
  return {
    id: docId,
    incidentCode: typeof data.incidentCode === 'string' && data.incidentCode ? data.incidentCode : docId,
    title: typeof data.title === 'string' && data.title ? data.title : 'Polar Operational Incident',
    severity: (typeof data.severity === 'string' && data.severity ? data.severity : 'Medium') as EmergencyIncident['severity'],
    status: (typeof data.status === 'string' && data.status ? data.status : 'REPORTED') as EmergencyIncident['status'],
    stationOrRegion: typeof data.stationOrRegion === 'string' && data.stationOrRegion ? data.stationOrRegion : 'Maitri Station',
    reportedAt: typeof data.reportedAt === 'string' && data.reportedAt ? data.reportedAt : new Date().toISOString(),
    reportedBy: typeof data.reportedBy === 'string' && data.reportedBy ? data.reportedBy : 'Station Operator',
    assignedTeam: typeof data.assignedTeam === 'string' ? data.assignedTeam : 'SAR Alpha',
    involvedPersonnel: Array.isArray(data.involvedPersonnel) ? data.involvedPersonnel : [],
    summary: typeof data.summary === 'string' ? data.summary : '',
    weatherCondition: typeof data.weatherCondition === 'string' ? data.weatherCondition : 'Clear',
    protocolsTriggered: Array.isArray(data.protocolsTriggered) ? data.protocolsTriggered : [],
    lastUpdate: typeof data.lastUpdate === 'string' && data.lastUpdate ? data.lastUpdate : new Date().toISOString()
  };
};

export const subscribeEmergencies = (
  onUpdate: (emergencies: EmergencyIncident[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  if (!db) return () => {};

  const q = query(collection(db, COLLECTION_NAME), orderBy('reportedAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => normalizeEmergencyIncident(docSnap.id, docSnap.data()));
      onUpdate(items);
    },
    (err) => {
      console.error('Error in emergencies snapshot listener:', err);
      if (onError) onError(err);
    }
  );
};

export const getEmergenciesList = async (): Promise<EmergencyIncident[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('reportedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => normalizeEmergencyIncident(docSnap.id, docSnap.data()));
  } catch (error) {
    console.error('Error fetching emergencies from Firestore:', error);
    throw new Error('Unable to retrieve emergency incidents.');
  }
};

export const createEmergencyIncident = async (incident: EmergencyIncident): Promise<void> => {
  if (!db) return;

  // Validation
  if (!incident.title?.trim()) throw new Error('Emergency title or code is required.');
  if (!incident.severity) throw new Error('Severity level classification is required.');
  if (!incident.stationOrRegion?.trim()) throw new Error('Incident location or sector is required.');
  if (!incident.summary?.trim()) throw new Error('Brief emergency summary is required.');

  try {
    const docRef = doc(db, COLLECTION_NAME, incident.id);
    await setDoc(docRef, incident);
  } catch (error) {
    console.error('Error creating emergency incident in Firestore:', error);
    throw new Error('Failed to broadcast and store emergency incident.');
  }
};

export const updateEmergencyIncident = async (
  id: string,
  updates: Partial<EmergencyIncident>
): Promise<void> => {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating emergency incident in Firestore:', error);
    throw new Error('Failed to update emergency lifecycle status.');
  }
};

export const deleteEmergencyIncident = async (id: string): Promise<void> => {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting emergency from Firestore:', error);
    throw new Error('Failed to remove emergency record.');
  }
};
