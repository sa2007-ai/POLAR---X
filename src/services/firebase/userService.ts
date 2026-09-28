import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { UserProfile, UserRole, RoleApprovalStatus } from '../../types/auth';

const COLLECTION_NAME = 'users';

const mapDocToProfile = (id: string, data: any): UserProfile => {
  const role: UserRole = data.role || 'VIEWER';
  const requestedRole: UserRole | undefined = data.requestedRole;
  const approvalStatus: RoleApprovalStatus =
    data.approvalStatus ||
    (role === 'ADMIN' || !requestedRole || requestedRole === role ? 'APPROVED' : 'PENDING');

  return {
    uid: data.uid || id,
    email: data.email || '',
    displayName: data.displayName || data.name || data.email?.split('@')[0] || 'Polar Operator',
    name: data.name || data.displayName,
    role,
    requestedRole,
    approvalStatus,
    status: data.status || 'ACTIVE',
    station: data.station || 'Maitri Station (Antarctica)',
    badgeId: data.badgeId || 'NCPOR-POLAR-001',
    department: data.department || 'Operations',
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : (data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()),
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : (data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : undefined),
    lastLoginAt: typeof data.lastLoginAt === 'string' ? data.lastLoginAt : (data.lastLoginAt?.toDate ? data.lastLoginAt.toDate().toISOString() : undefined),
    photoURL: data.photoURL
  };
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!db || !uid) return null;
  try {
    const userDocRef = doc(db, COLLECTION_NAME, uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return mapDocToProfile(snap.id, snap.data());
    }
    return null;
  } catch (error) {
    console.warn('[POLAR-X] User profile document not found or access pending:', error);
    return null;
  }
};

export const createUserProfile = async (profile: UserProfile): Promise<void> => {
  if (!db) return;
  try {
    const userDocRef = doc(db, COLLECTION_NAME, profile.uid);
    await setDoc(userDocRef, {
      ...profile,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating user profile in Firestore:', error);
    throw new Error('Failed to create user record.');
  }
};

export const updateUserProfile = async (
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  if (!db) return;
  try {
    const userDocRef = doc(db, COLLECTION_NAME, uid);
    await updateDoc(userDocRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile in Firestore.');
  }
};

export const listAllUsers = async (): Promise<UserProfile[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, COLLECTION_NAME));
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => mapDocToProfile(docSnap.id, docSnap.data()));
  } catch (error) {
    console.error('Error listing all users from Firestore:', error);
    return [];
  }
};

export const subscribeUsers = (
  callback: (users: UserProfile[]) => void,
  onError?: (err: Error) => void
): (() => void) => {
  if (!db) {
    callback([]);
    return () => {};
  }
  return onSnapshot(
    collection(db, COLLECTION_NAME),
    (snap) => {
      const users = snap.docs.map((docSnap) => mapDocToProfile(docSnap.id, docSnap.data()));
      callback(users);
    },
    (error) => {
      console.warn('[POLAR-X] Users collection subscription warning:', error);
      if (onError) onError(error);
    }
  );
};

export const subscribeUserProfile = (
  uid: string,
  callback: (profile: UserProfile | null) => void,
  onError?: (err: Error) => void
): (() => void) => {
  if (!db || !uid) {
    callback(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, COLLECTION_NAME, uid),
    (snap) => {
      if (snap.exists()) {
        const profile = mapDocToProfile(snap.id, snap.data());
        if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
          console.info(
            `[POLAR-X AUTH PROFILE]\n` +
            `  uid=${profile.uid}\n` +
            `  email=${profile.email}\n` +
            `  firestoreProfileExists=true\n` +
            `  role=${profile.role}`
          );
        }
        callback(profile);
      } else {
        if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
          console.warn(
            `[POLAR-X AUTH PROFILE]\n` +
            `  uid=${uid}\n` +
            `  firestoreProfileExists=false`
          );
        }
        callback(null);
      }
    },
    (error) => {
      console.warn('[POLAR-X] User profile document subscription warning:', error);
      if (onError) onError(error);
    }
  );
};

export const changeUserRole = async (
  actorUid: string,
  targetUid: string,
  newRole: UserRole,
  targetName: string,
  previousRole: UserRole,
  previousApprovalStatus?: string
): Promise<void> => {
  if (!db) return;

  const now = new Date().toISOString();
  const userDocRef = doc(db, COLLECTION_NAME, targetUid);

  // 1. Atomically update user role, approvalStatus, status, and approval metadata
  await updateDoc(userDocRef, {
    role: newRole,
    approvalStatus: 'APPROVED',
    status: 'ACTIVE',
    approvedBy: actorUid,
    approvedAt: now,
    updatedAt: now
  });

  // 2. Write immutable audit log record to activityLogs
  try {
    const logId = `LOG-ROLE-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const logRef = doc(db, 'activityLogs', logId);
    await setDoc(logRef, {
      id: logId,
      timestamp: now,
      module: 'personnel',
      action: 'ROLE_CHANGED',
      details: `Admin clearance update: ${targetName} (${previousRole} → ${newRole}, approvalStatus: APPROVED) authorized by command operator ${actorUid}.`,
      severity: 'warning',
      user: 'Station Commander (ADMIN)',
      actorUid,
      targetUid,
      targetUserId: targetUid,
      previousRole,
      newRole,
      previousApprovalStatus: previousApprovalStatus || 'PENDING',
      newApprovalStatus: 'APPROVED'
    });
  } catch (logErr) {
    console.warn('[POLAR-X] Role change audit log write deferred:', logErr);
  }
};

export const approveRoleRequest = async (
  actorUid: string,
  targetUid: string,
  targetName: string,
  previousRole: UserRole,
  requestedRole: UserRole,
  previousApprovalStatus?: string
): Promise<void> => {
  if (!db) return;

  const now = new Date().toISOString();
  const userDocRef = doc(db, COLLECTION_NAME, targetUid);

  // 1. Atomically update user role and approval status in Firestore
  await updateDoc(userDocRef, {
    role: requestedRole,
    approvalStatus: 'APPROVED',
    status: 'ACTIVE',
    approvedBy: actorUid,
    approvedAt: now,
    updatedAt: now
  });

  // 2. Write immutable audit log record to activityLogs
  try {
    const logId = `LOG-APPROVE-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const logRef = doc(db, 'activityLogs', logId);
    await setDoc(logRef, {
      id: logId,
      timestamp: now,
      module: 'personnel',
      action: 'ROLE_REQUEST_APPROVED',
      details: `Role request approved: ${targetName} elevated from ${previousRole} to ${requestedRole} (approvalStatus: APPROVED) by admin ${actorUid}.`,
      severity: 'warning',
      user: 'Station Commander (ADMIN)',
      actorUid,
      targetUid,
      targetUserId: targetUid,
      previousRole,
      newRole: requestedRole,
      previousApprovalStatus: previousApprovalStatus || 'PENDING',
      newApprovalStatus: 'APPROVED'
    });
  } catch (logErr) {
    console.warn('[POLAR-X] Role approval audit log write deferred:', logErr);
  }
};

export const rejectRoleRequest = async (
  actorUid: string,
  targetUid: string,
  targetName: string,
  currentRole: UserRole,
  requestedRole: UserRole
): Promise<void> => {
  if (!db) return;

  const now = new Date().toISOString();
  const userDocRef = doc(db, COLLECTION_NAME, targetUid);

  // 1. Update approval status to REJECTED in Firestore
  await updateDoc(userDocRef, {
    approvalStatus: 'REJECTED',
    rejectedBy: actorUid,
    rejectedAt: now,
    updatedAt: now
  });

  // 2. Write immutable audit log record to activityLogs
  try {
    const logId = `LOG-REJECT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const logRef = doc(db, 'activityLogs', logId);
    await setDoc(logRef, {
      id: logId,
      timestamp: now,
      module: 'personnel',
      action: 'ROLE_REQUEST_REJECTED',
      details: `Role request rejected: Request for ${requestedRole} by ${targetName} rejected by admin ${actorUid}. Clearance remains ${currentRole}.`,
      severity: 'info',
      user: 'Station Commander (ADMIN)',
      actorUid,
      targetUid,
      previousRole: currentRole,
      newRole: currentRole
    });
  } catch (logErr) {
    console.warn('[POLAR-X] Role rejection audit log write deferred:', logErr);
  }
};

export const listUsersByRole = async (role: UserRole): Promise<UserProfile[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, COLLECTION_NAME), where('role', '==', role));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((docSnap) => docSnap.data() as UserProfile);
  } catch (error) {
    console.error('Error listing users by role:', error);
    return [];
  }
};
