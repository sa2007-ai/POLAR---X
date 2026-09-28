/**
 * POLAR-X Firebase Storage Service
 * Handles uploading and managing files, photos, telemetry data dumps, and mission attachments.
 */

import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage, isFirebaseConfigured } from '../../firebase/config';

export interface StorageUploadResult {
  url: string;
  fullPath: string;
  name: string;
  size: number;
  contentType?: string;
  uploadedAt: string;
  isSimulated?: boolean;
}

/**
 * Uploads a file/blob to Firebase Storage.
 * When Firebase is unconfigured or offline, falls back gracefully to a temporary Object URL with explicit simulation status.
 */
export const uploadMissionFile = async (
  path: string,
  file: Blob | File,
  metadata?: { contentType?: string; customMetadata?: Record<string, string> }
): Promise<StorageUploadResult> => {
  const isCloudActive = isFirebaseConfigured() && storage !== null;

  if (!isCloudActive) {
    // Demo mode / offline local fallback
    const localUrl = URL.createObjectURL(file);
    return {
      url: localUrl,
      fullPath: `local/${path}`,
      name: file instanceof File ? file.name : path.split('/').pop() || 'attachment',
      size: file.size,
      contentType: metadata?.contentType || file.type || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
      isSimulated: true
    };
  }

  try {
    const storageRef = ref(storage!, path);
    const uploadResult = await uploadBytes(storageRef, file, {
      contentType: metadata?.contentType || file.type,
      customMetadata: metadata?.customMetadata
    });

    const downloadUrl = await getDownloadURL(uploadResult.ref);

    return {
      url: downloadUrl,
      fullPath: uploadResult.ref.fullPath,
      name: uploadResult.ref.name,
      size: file.size,
      contentType: metadata?.contentType || file.type,
      uploadedAt: new Date().toISOString(),
      isSimulated: false
    };
  } catch (error: any) {
    console.error('Firebase Storage upload error:', error);
    throw new Error(`Storage upload failed: ${error.message || 'Access denied or network error'}`);
  }
};

/**
 * Deletes a file from Firebase Storage given its storage path.
 */
export const deleteMissionFile = async (path: string): Promise<void> => {
  if (!isFirebaseConfigured() || !storage) {
    return;
  }

  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error: any) {
    console.error('Firebase Storage deletion error:', error);
    throw new Error(`Failed to delete storage file: ${error.message}`);
  }
};

/**
 * Lists files in a given storage directory.
 */
export const listMissionFiles = async (folderPath: string): Promise<string[]> => {
  if (!isFirebaseConfigured() || !storage) {
    return [];
  }

  try {
    const listRef = ref(storage, folderPath);
    const res = await listAll(listRef);
    return res.items.map((item) => item.fullPath);
  } catch (error: any) {
    console.error('Firebase Storage list error:', error);
    return [];
  }
};
