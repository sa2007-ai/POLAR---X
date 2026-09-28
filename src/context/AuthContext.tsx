import React, { useState, useEffect } from 'react';
import { AuthContext } from './authContextInstance';
import { User as FirebaseUser } from 'firebase/auth';
import { UserProfile, UserRole, ProfileLoadStatus } from '../types/auth';
import { isFirebaseConfigured } from '../firebase/config';
import {
  loginWithEmailPassword,
  registerWithEmailPassword,
  sendPasswordReset,
  logoutUser,
  subscribeToAuthState
} from '../services/firebase/authService';
import {
  createUserProfile,
  subscribeUserProfile,
  updateUserProfile as updateProfileInDb
} from '../services/firebase/userService';

const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  ADMIN: {
    uid: 'demo-admin-01',
    email: 'admin.director@polar-x.ncpor.gov.in',
    displayName: 'Dr. Rajesh Sharma',
    role: 'ADMIN',
    badgeId: 'NCPOR-POLAR-001',
    station: 'Maitri Station (Antarctica)',
    department: 'Station Command & Executive Operations',
    createdAt: '2026-01-01T00:00:00.000Z',
    lastLoginAt: new Date().toISOString()
  },
  EXPEDITION_MANAGER: {
    uid: 'demo-exp-mgr-02',
    email: 'operations.traverse@polar-x.ncpor.gov.in',
    displayName: 'Cmdr. Vikram Sen',
    role: 'EXPEDITION_MANAGER',
    badgeId: 'NCPOR-OPS-042',
    station: 'Bharati Station (Larsemann Hills)',
    department: 'Overland Traverses & Field Operations',
    createdAt: '2026-01-10T00:00:00.000Z',
    lastLoginAt: new Date().toISOString()
  },
  LOGISTICS_OFFICER: {
    uid: 'demo-logistics-03',
    email: 'logistics.supply@polar-x.ncpor.gov.in',
    displayName: 'S. K. Nair',
    role: 'LOGISTICS_OFFICER',
    badgeId: 'NCPOR-LOG-108',
    station: 'Maitri Station (Antarctica)',
    department: 'Fuel Reserves & Cargo Resupply',
    createdAt: '2026-01-15T00:00:00.000Z',
    lastLoginAt: new Date().toISOString()
  },
  SCIENTIST: {
    uid: 'demo-scientist-04',
    email: 'glaciology.lead@polar-x.ncpor.gov.in',
    displayName: 'Dr. Ananya Mukherjee',
    role: 'SCIENTIST',
    badgeId: 'NCPOR-SCI-204',
    station: 'Himadri Station (Ny-Ålesund, Arctic)',
    department: 'Paleoclimate & Ice Core Physics',
    createdAt: '2026-02-01T00:00:00.000Z',
    lastLoginAt: new Date().toISOString()
  },
  MEDICAL_OFFICER: {
    uid: 'demo-medical-05',
    email: 'medical.bay@polar-x.ncpor.gov.in',
    displayName: 'Dr. Priyanshu Roy',
    role: 'MEDICAL_OFFICER',
    badgeId: 'NCPOR-MED-099',
    station: 'Maitri Station (Antarctica)',
    department: 'Polar Emergency Medicine & Telemetry',
    createdAt: '2026-02-10T00:00:00.000Z',
    lastLoginAt: new Date().toISOString()
  },
  VIEWER: {
    uid: 'demo-viewer-06',
    email: 'liaison.observer@polar-x.ncpor.gov.in',
    displayName: 'Govt. Scientific Observer',
    role: 'VIEWER',
    badgeId: 'NCPOR-OBS-550',
    station: 'All Polar Stations (Global Feed)',
    department: 'External Ministry Liaison',
    createdAt: '2026-02-20T00:00:00.000Z',
    lastLoginAt: new Date().toISOString()
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const firebaseReady = isFirebaseConfigured();
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!firebaseReady);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    return !firebaseReady ? DEMO_PROFILES.ADMIN : null;
  });
  const [profileStatus, setProfileStatus] = useState<ProfileLoadStatus>(() => {
    return !firebaseReady ? 'READY' : 'LOADING';
  });
  const [loading, setLoading] = useState<boolean>(firebaseReady);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseReady) {
      return;
    }

    let profileUnsub: (() => void) | null = null;

    const authUnsub = subscribeToAuthState((fbUser) => {
      setCurrentUser(fbUser);
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (fbUser) {
        if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
          console.info(
            `[POLAR-X CURRENT AUTH]\n` +
            `  email=${fbUser.email}\n` +
            `  uid=${fbUser.uid}`
          );
        }
        setProfileStatus('LOADING');
        setIsDemoMode(false);

        // Authoritative Realtime listener on users/{uid}
        profileUnsub = subscribeUserProfile(
          fbUser.uid,
          async (realtimeProfile) => {
            if (realtimeProfile) {
              if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
                console.info(
                  `[POLAR-X AUTHORITATIVE PROFILE]\n` +
                  `  authEmail=${fbUser.email}\n` +
                  `  authUid=${fbUser.uid}\n` +
                  `  profileExists=true\n` +
                  `  profileEmail=${realtimeProfile.email}\n` +
                  `  firestoreRole=${realtimeProfile.role}\n` +
                  `  approvalStatus=${realtimeProfile.approvalStatus || 'APPROVED'}`
                );
              }
              setUserProfile(realtimeProfile);
              setProfileStatus('READY');
              setLoading(false);
            } else {
              if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
                console.warn(
                  `[POLAR-X AUTHORITATIVE PROFILE]\n` +
                  `  authEmail=${fbUser.email}\n` +
                  `  authUid=${fbUser.uid}\n` +
                  `  profileExists=false\n` +
                  `  profileEmail=N/A\n` +
                  `  firestoreRole=N/A\n` +
                  `  approvalStatus=N/A`
                );
              }
              // Profile document does not exist yet in Firestore
              setProfileStatus('MISSING');
              const now = new Date().toISOString();
              const initialProfile: UserProfile = {
                uid: fbUser.uid,
                email: fbUser.email || '',
                displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Polar Operator',
                name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Polar Operator',
                role: 'VIEWER',
                requestedRole: 'VIEWER',
                approvalStatus: 'APPROVED',
                status: 'ACTIVE',
                badgeId: `POLAR-USER-${Math.floor(1000 + Math.random() * 9000)}`,
                station: 'Maitri Station (Antarctica)',
                department: 'Field Operations',
                createdAt: now,
                updatedAt: now,
                lastLoginAt: now
              };
              try {
                await createUserProfile(initialProfile);
              } catch (createErr) {
                console.warn('[POLAR-X] Initial user profile write in Firestore deferred:', createErr);
              }
              setLoading(false);
            }
          },
          (subErr) => {
            console.warn('[POLAR-X] User profile subscription error:', subErr);
            setProfileStatus('ERROR');
            setLoading(false);
          }
        );
      } else {
        setUserProfile(null);
        setProfileStatus('IDLE');
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      if (profileUnsub) profileUnsub();
    };
  }, [firebaseReady]);

  const login = async (email: string, pass: string) => {
    setError(null);
    try {
      if (!firebaseReady) {
        // Demo login
        const matched = Object.values(DEMO_PROFILES).find(
          (p) => p.email.toLowerCase() === email.toLowerCase()
        );
        if (matched) {
          setUserProfile(matched);
        } else {
          setUserProfile({
            ...DEMO_PROFILES.ADMIN,
            email,
            displayName: email.split('@')[0]
          });
        }
        setProfileStatus('READY');
        setIsDemoMode(true);
        return;
      }

      const { user, profile } = await loginWithEmailPassword(email, pass);
      setCurrentUser(user);
      if (profile) {
        setUserProfile(profile);
        setProfileStatus('READY');
      }
      setIsDemoMode(false);
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
      throw err;
    }
  };

  const register = async (
    email: string,
    pass: string,
    displayName: string,
    role: UserRole = 'VIEWER',
    badgeId?: string,
    station?: string
  ) => {
    setError(null);
    try {
      if (!firebaseReady) {
        const demoUser: UserProfile = {
          uid: `demo-${Date.now()}`,
          email,
          displayName,
          role,
          badgeId: badgeId || `NCPOR-${Math.floor(1000 + Math.random() * 9000)}`,
          station: station || 'Maitri Station (Antarctica)',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        };
        setUserProfile(demoUser);
        setProfileStatus('READY');
        setIsDemoMode(true);
        return;
      }

      const { user, profile } = await registerWithEmailPassword(
        email,
        pass,
        displayName,
        role,
        badgeId,
        station
      );
      setCurrentUser(user);
      setUserProfile(profile);
      setProfileStatus('READY');
      setIsDemoMode(false);
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    if (firebaseReady) {
      await logoutUser();
    }
    setCurrentUser(null);
    setUserProfile(null);
    setProfileStatus(firebaseReady ? 'IDLE' : 'READY');
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      if (!firebaseReady) {
        return; // Simulated success
      }
      await sendPasswordReset(email);
    } catch (err: any) {
      setError(err?.message || 'Password reset failed');
      throw err;
    }
  };

  const switchDemoRole = (targetRole: UserRole) => {
    const profile = DEMO_PROFILES[targetRole];
    setUserProfile(profile);
    setProfileStatus('READY');
  };

  const updateCurrentUserProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;
    const updated = { ...userProfile, ...updates };
    setUserProfile(updated);
    if (firebaseReady && currentUser) {
      await updateProfileInDb(currentUser.uid, updates);
    }
  };

  const role: UserRole = userProfile?.role || 'VIEWER';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role,
        profileStatus,
        loading,
        isDemoMode,
        error,
        login,
        register,
        logout,
        resetPassword,
        switchDemoRole,
        updateCurrentUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
