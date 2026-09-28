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
import { Personnel } from '../../types';

const COLLECTION_NAME = 'personnel';

export const normalizePersonnel = (docId: string, rawData?: Record<string, any>): Personnel => {
  const data = rawData || {};
  return {
    id: docId,
    badgeId: typeof data.badgeId === 'string' && data.badgeId ? data.badgeId : `NCPOR-${docId.slice(0, 4).toUpperCase()}`,
    name: typeof data.name === 'string' && data.name ? data.name : 'Polar Officer',
    role: (typeof data.role === 'string' && data.role ? data.role : 'Glaciologist') as Personnel['role'],
    team: (typeof data.team === 'string' && data.team ? data.team : 'Science') as Personnel['team'],
    station: typeof data.station === 'string' && data.station ? data.station : 'Maitri Station',
    expeditionId: typeof data.expeditionId === 'string' ? data.expeditionId : undefined,
    expeditionName: typeof data.expeditionName === 'string' ? data.expeditionName : undefined,
    nationality: typeof data.nationality === 'string' && data.nationality ? data.nationality : 'India',
    bloodGroup: typeof data.bloodGroup === 'string' && data.bloodGroup ? data.bloodGroup : 'O+',
    medicalClearance: (typeof data.medicalClearance === 'string' && data.medicalClearance ? data.medicalClearance : 'Class-1 Polar Unrestricted') as Personnel['medicalClearance'],
    winterOverExperience: typeof data.winterOverExperience === 'number' ? data.winterOverExperience : 0,
    survivalCertExpiry: typeof data.survivalCertExpiry === 'string' && data.survivalCertExpiry ? data.survivalCertExpiry : '2027-01-01',
    status: (typeof data.status === 'string' && data.status ? data.status : 'Active') as Personnel['status'],
    email: typeof data.email === 'string' ? data.email : '',
    satPhone: typeof data.satPhone === 'string' ? data.satPhone : '',
    emergencyContact: data.emergencyContact && typeof data.emergencyContact.name === 'string'
      ? data.emergencyContact
      : {
          name: 'NCPOR Mission Operations Support',
          relation: 'Emergency Operations Command',
          phone: '+91-832-2525600'
        },
    vitalStatus: data.vitalStatus && typeof data.vitalStatus.heartRate === 'number'
      ? data.vitalStatus
      : {
          heartRate: 72,
          bodyTemp: '36.8°C',
          lastChecked: 'Live Telemetry'
        }
  };
};

export const subscribePersonnel = (
  onUpdate: (personnel: Personnel[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  if (!db) return () => {};

  const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => normalizePersonnel(docSnap.id, docSnap.data()));
      onUpdate(items);
    },
    (err) => {
      console.error('Error in personnel snapshot listener:', err);
      if (onError) onError(err);
    }
  );
};

export const getPersonnelList = async (): Promise<Personnel[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => normalizePersonnel(docSnap.id, docSnap.data()));
  } catch (error) {
    console.error('Error fetching personnel from Firestore:', error);
    throw new Error('Unable to retrieve personnel roster.');
  }
};

export const createPersonnel = async (personnel: Personnel): Promise<void> => {
  if (!db) return;

  // Validation
  if (!personnel.name?.trim()) throw new Error('Personnel full name is required.');
  if (!personnel.role) throw new Error('Role assignment is required.');
  if (!personnel.team) throw new Error('Functional team unit is required.');
  if (!personnel.station) throw new Error('Base station deployment is required.');

  try {
    const docRef = doc(db, COLLECTION_NAME, personnel.id);
    await setDoc(docRef, personnel);
  } catch (error) {
    console.error('Error creating personnel in Firestore:', error);
    throw new Error('Unable to create personnel member in cloud roster.');
  }
};

export const updatePersonnel = async (
  id: string,
  updates: Partial<Personnel>
): Promise<void> => {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating personnel in Firestore:', error);
    throw new Error('Failed to update personnel record.');
  }
};

export const deletePersonnel = async (id: string): Promise<void> => {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting personnel from Firestore:', error);
    throw new Error('Failed to remove personnel member from roster.');
  }
};
