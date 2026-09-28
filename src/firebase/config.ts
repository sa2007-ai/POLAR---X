import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Static compile-time environment variable access for Vite
const rawApiKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_FIREBASE_API_KEY : undefined;
const rawAuthDomain = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN : undefined;
const rawProjectId = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_FIREBASE_PROJECT_ID : undefined;
const rawStorageBucket = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET : undefined;
const rawMessagingSenderId = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID : undefined;
const rawAppId = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_FIREBASE_APP_ID : undefined;

const firebaseConfig = {
  apiKey: rawApiKey?.trim(),
  authDomain: rawAuthDomain?.trim(),
  projectId: rawProjectId?.trim(),
  storageBucket: rawStorageBucket?.trim(),
  messagingSenderId: rawMessagingSenderId?.trim(),
  appId: rawAppId?.trim(),
};

export type EnvVarStatus = 'PRESENT' | 'MISSING' | 'PLACEHOLDER';

/**
 * Evaluates whether an environment variable string is PRESENT, MISSING, or a template PLACEHOLDER.
 * Never leaks the actual credential string.
 */
export const getEnvVarStatus = (val: string | undefined): EnvVarStatus => {
  if (!val || typeof val !== 'string' || val.trim() === '') {
    return 'MISSING';
  }
  const cleaned = val.trim().toLowerCase();
  if (
    cleaned.includes('your_firebase') ||
    cleaned.includes('your_project_id') ||
    cleaned.includes('your_app_id') ||
    cleaned.includes('your_storage_bucket') ||
    cleaned.includes('your_messaging') ||
    cleaned.includes('your_real_value') ||
    cleaned.includes('your_api_key') ||
    cleaned.startsWith('<') ||
    cleaned.startsWith('[your') ||
    cleaned === 'undefined' ||
    cleaned === 'null'
  ) {
    return 'PLACEHOLDER';
  }
  return 'PRESENT';
};

/**
 * Checks if Firebase configuration environment variables are properly defined and valid.
 * Returns true only if all mandatory keys are PRESENT and not PLACEHOLDER values.
 */
export const isFirebaseConfigured = (): boolean => {
  const { apiKey, projectId, authDomain, appId } = firebaseConfig;
  return (
    getEnvVarStatus(apiKey) === 'PRESENT' &&
    getEnvVarStatus(projectId) === 'PRESENT' &&
    getEnvVarStatus(authDomain) === 'PRESENT' &&
    getEnvVarStatus(appId) === 'PRESENT'
  );
};

/**
 * Evaluates whether immediate role registration is enabled for the SIH demonstration environment.
 */
export const isSihDemoRoleRegistrationEnabled = (): boolean => {
  if (typeof import.meta === 'undefined' || !import.meta.env) return true;
  const val = import.meta.env.VITE_SIH_DEMO_ROLE_REGISTRATION;
  if (val === undefined || val === null || val === '') return true;
  return val === 'true' || val === true;
};

// Safe development diagnostic without exposing credentials
if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
  console.info(
    '[POLAR-X] Firebase env diagnostic:\n' +
    `  API_KEY: ${getEnvVarStatus(firebaseConfig.apiKey)}\n` +
    `  AUTH_DOMAIN: ${getEnvVarStatus(firebaseConfig.authDomain)}\n` +
    `  PROJECT_ID: ${getEnvVarStatus(firebaseConfig.projectId)}\n` +
    `  STORAGE_BUCKET: ${getEnvVarStatus(firebaseConfig.storageBucket)}\n` +
    `  MESSAGING_SENDER_ID: ${getEnvVarStatus(firebaseConfig.messagingSenderId)}\n` +
    `  APP_ID: ${getEnvVarStatus(firebaseConfig.appId)}`
  );
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    if (app) {
      auth = getAuth(app);
      db = getFirestore(app);
      try {
        storage = getStorage(app);
      } catch (storageErr) {
        console.warn('[POLAR-X] Optional Firebase Storage init deferred:', storageErr);
      }
      console.info('[POLAR-X] Firebase initialized successfully with cloud project:', firebaseConfig.projectId);
    }
  } catch (error) {
    console.warn('[POLAR-X] Failed to initialize Firebase:', error);
  }
} else {
  console.info('[POLAR-X] Firebase environment variables not detected or contain placeholders. Operating in Safe Demo Mode with local mock telemetry.');
}

export { app, auth, db, storage };
