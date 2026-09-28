import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { auth, isSihDemoRoleRegistrationEnabled } from '../../firebase/config';
import { UserProfile, UserRole, RoleApprovalStatus } from '../../types/auth';
import { createUserProfile, getUserProfile, updateUserProfile } from './userService';

/**
 * Maps Firebase Auth error codes to user-friendly messages and safely logs error codes in development.
 * Never logs credentials, passwords, or tokens.
 */
export const formatAuthError = (
  error: any,
  operation: 'login' | 'register' | 'reset-password' | 'logout'
): string => {
  const code = error?.code || '';

  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.info(
      `[POLAR-X] ${operation.toUpperCase()}:\n` +
      `  Firebase error code: ${code || 'unknown'}\n` +
      `  Firebase error message: ${error?.message || 'unknown'}\n` +
      `  Operation: ${operation}`
    );
  }

  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/user-not-found':
      return 'No account was found for this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/weak-password':
      return "Password must meet Firebase's minimum password requirements.";
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/password authentication is not enabled in Firebase.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please verify your internet connection.';
    default:
      return 'Authentication failed. Please try again.';
  }
};

export const loginWithEmailPassword = async (
  email: string,
  pass: string
): Promise<{ user: FirebaseUser; profile: UserProfile | null }> => {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Please verify configuration.');
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    let profile = await getUserProfile(cred.user.uid);

    // If profile document does not exist yet in Firestore, initialize an authoritative one with UID
    if (!profile) {
      profile = {
        uid: cred.user.uid,
        email: cred.user.email || email.trim(),
        displayName: cred.user.displayName || email.trim().split('@')[0],
        role: 'VIEWER',
        badgeId: `POLAR-USER-${Math.floor(1000 + Math.random() * 9000)}`,
        station: 'Maitri Station (Antarctica)',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      try {
        await createUserProfile(profile);
      } catch (profileErr) {
        console.warn('[POLAR-X] User profile document creation deferred:', profileErr);
      }
    } else {
      try {
        await updateUserProfile(cred.user.uid, {
          lastLoginAt: new Date().toISOString()
        });
      } catch (updateErr) {
        console.warn('[POLAR-X] Last login update deferred:', updateErr);
      }
    }

    return { user: cred.user, profile };
  } catch (error: any) {
    const message = formatAuthError(error, 'login');
    const customErr = new Error(message);
    (customErr as any).code = error?.code;
    throw customErr;
  }
};

export const registerWithEmailPassword = async (
  email: string,
  pass: string,
  displayName: string,
  requestedRole: UserRole = 'VIEWER',
  badgeId?: string,
  station?: string
): Promise<{ user: FirebaseUser; profile: UserProfile }> => {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Please verify configuration.');
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    try {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    } catch (profileErr) {
      console.warn('[POLAR-X] Auth displayName update deferred:', profileErr);
    }

    // Role assignment: Controlled SIH demo environment immediately provisions selected operational clearance.
    // In production mode (flag false), non-VIEWER roles require administrative approval.
    const isSihDemoMode = isSihDemoRoleRegistrationEnabled();
    const authoritativeRole: UserRole = isSihDemoMode ? requestedRole : 'VIEWER';
    const approvalStatus: RoleApprovalStatus = isSihDemoMode || requestedRole === 'VIEWER' ? 'APPROVED' : 'PENDING';
    const now = new Date().toISOString();

    const newProfile: UserProfile = {
      uid: cred.user.uid,
      email: cred.user.email || email.trim(),
      displayName: displayName.trim(),
      name: displayName.trim(),
      role: authoritativeRole,
      requestedRole,
      approvalStatus,
      status: 'ACTIVE',
      badgeId: badgeId || `POLAR-USER-${Math.floor(1000 + Math.random() * 9000)}`,
      station: station || 'Maitri Station (Antarctica)',
      department: 'Field Operations',
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now
    };

    // Authoritative Firestore document creation with authenticated UID
    await createUserProfile(newProfile);

    return { user: cred.user, profile: newProfile };
  } catch (error: any) {
    const message = formatAuthError(error, 'register');
    const customErr = new Error(message);
    (customErr as any).code = error?.code;
    throw customErr;
  }
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized.');
  }
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error: any) {
    const message = formatAuthError(error, 'reset-password');
    const customErr = new Error(message);
    (customErr as any).code = error?.code;
    throw customErr;
  }
};

export const logoutUser = async (): Promise<void> => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error: any) {
    const message = formatAuthError(error, 'logout');
    throw new Error(message);
  }
};

export const subscribeToAuthState = (
  callback: (user: FirebaseUser | null) => void
): (() => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};
