import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { PolarNotification } from '../../types';

const COLLECTION_NAME = 'notifications';

export const normalizeNotification = (docId: string, rawData?: Record<string, any>): PolarNotification => {
  const data = rawData || {};
  return {
    id: docId,
    title: typeof data.title === 'string' && data.title ? data.title : 'Polar System Notification',
    description: typeof data.description === 'string' ? data.description : '',
    timestamp: typeof data.timestamp === 'string' && data.timestamp ? data.timestamp : new Date().toISOString(),
    type: (typeof data.type === 'string' && data.type ? data.type : 'info') as PolarNotification['type'],
    read: !!data.read,
    link: typeof data.link === 'string' ? data.link : undefined
  };
};

export const subscribeNotifications = (
  onUpdate: (notifications: PolarNotification[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  if (!db) return () => {};

  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy('timestamp', 'desc'),
    limit(40)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => normalizeNotification(docSnap.id, docSnap.data()));
      onUpdate(items);
    },
    (err) => {
      console.error('Error in notifications snapshot listener:', err);
      if (onError) onError(err);
    }
  );
};

export const getNotificationsList = async (): Promise<PolarNotification[]> => {
  if (!db) return [];
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('timestamp', 'desc'),
      limit(40)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => normalizeNotification(docSnap.id, docSnap.data()));
  } catch (error) {
    console.error('Error fetching notifications from Firestore:', error);
    return [];
  }
};

export const createNotification = async (notification: PolarNotification): Promise<void> => {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, notification.id);
    await setDoc(docRef, notification);
  } catch (error) {
    console.error('Error creating notification in Firestore:', error);
  }
};

export const markNotificationAsReadInDb = async (id: string): Promise<void> => {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { read: true });
  } catch (error) {
    console.error('Error marking notification as read in Firestore:', error);
  }
};

export const deleteNotificationFromDb = async (id: string): Promise<void> => {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting notification from Firestore:', error);
  }
};
