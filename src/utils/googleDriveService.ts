import firebaseConfigJson from '../../firebase-applet-config.json';
import { auth, googleProvider } from '../firebase/config';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { safeLocalStorage } from './storage';

/**
 * Google Drive Integration Service
 * Provides direct upload, folder management, and document synchronization into Google Drive
 */

const GOOGLE_CLIENT_ID = firebaseConfigJson.oAuthClientId || '1085942903216-8r6nokb6dcefphvpvt50n48kavgespht.apps.googleusercontent.com';
const DRIVE_SCOPES = 'https://www.googleapis.com/auth/drive.file';

export interface GoogleDriveFileResult {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  parents?: string[];
  size?: string;
  createdTime?: string;
}

export interface GoogleDriveAuthState {
  isConnected: boolean;
  accessToken: string | null;
  expiresAt: number | null;
  userEmail?: string;
  userName?: string;
  userPhoto?: string;
  folderId?: string;
  folderName?: string;
}

const STORAGE_KEY_TOKEN = 'verix_gdrive_token';
const STORAGE_KEY_EXPIRY = 'verix_gdrive_expiry';
const STORAGE_KEY_USER = 'verix_gdrive_user';
const STORAGE_KEY_ROOT_FOLDER = 'verix_gdrive_root_folder';

// Master App Folder name in Google Drive
export const DEFAULT_ROOT_FOLDER_NAME = 'VERIX CRM - Consulting & TKDN Vault';

let tokenClientInstance: any = null;

/**
 * Load Google Identity Services (GSI) script dynamically if not yet in DOM
 */
export function loadGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();
    if ((window as any).google?.accounts?.oauth2) {
      return resolve();
    }

    const existingScript = document.getElementById('google-gsi-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', (err) => reject(err));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

/**
 * Initialize or get the Token Client
 */
export async function initGoogleDriveAuth(callback?: (token: string) => void): Promise<any> {
  await loadGsiScript();

  if (!(window as any).google?.accounts?.oauth2) {
    throw new Error('Google Identity Services script failed to load.');
  }

  tokenClientInstance = (window as any).google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: DRIVE_SCOPES,
    callback: async (tokenResponse: any) => {
      if (tokenResponse && tokenResponse.access_token) {
        const expiresIn = Number(tokenResponse.expires_in) || 3599;
        const expiresAt = Date.now() + expiresIn * 1000;
        
        saveAccessToken(tokenResponse.access_token, expiresAt);
        
        if (callback) {
          callback(tokenResponse.access_token);
        }
      }
    },
  });

  return tokenClientInstance;
}

/**
 * Save access token to storage
 */
export function saveAccessToken(token: string, expiresAt: number, user?: { email?: string; name?: string; photo?: string }) {
  safeLocalStorage.setItem(STORAGE_KEY_TOKEN, token);
  safeLocalStorage.setItem(STORAGE_KEY_EXPIRY, expiresAt.toString());
  if (user) {
    safeLocalStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  }
}

/**
 * Get active access token if still valid
 */
export function getActiveAccessToken(): string | null {
  const token = localStorage.getItem(STORAGE_KEY_TOKEN);
  const expiry = localStorage.getItem(STORAGE_KEY_EXPIRY);
  if (!token || !expiry) return null;

  const expiryNum = parseInt(expiry, 10);
  if (Date.now() > expiryNum - 60000) {
    // Expired or close to expiring (within 1 min)
    return null;
  }
  return token;
}

/**
 * Request Google Drive authorization popup
 */
export async function requestGoogleDriveAccess(): Promise<string> {
  // First attempt: Firebase Auth signInWithPopup with GoogleAuthProvider & drive scope
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      const expiresIn = 3599;
      const expiresAt = Date.now() + expiresIn * 1000;
      const userProfile = {
        email: result.user?.email || undefined,
        name: result.user?.displayName || undefined,
        photo: result.user?.photoURL || undefined,
      };
      saveAccessToken(credential.accessToken, expiresAt, userProfile);
      return credential.accessToken;
    }
  } catch (firebaseErr: any) {
    console.warn('Firebase popup drive auth note (falling back to Google Identity Services if needed):', firebaseErr);
  }

  // Second attempt: Google Identity Services (GSI) Token Client
  return new Promise(async (resolve, reject) => {
    try {
      await loadGsiScript();
      
      const tokenClient = (window as any).google?.accounts?.oauth2?.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: DRIVE_SCOPES,
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            console.error('Google OAuth Error:', tokenResponse);
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }
          if (tokenResponse.access_token) {
            const expiresIn = Number(tokenResponse.expires_in) || 3599;
            const expiresAt = Date.now() + expiresIn * 1000;
            
            // Try to fetch user info with access token
            let userInfo: { email?: string; name?: string; photo?: string } | undefined;
            try {
              const uRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              if (uRes.ok) {
                const uData = await uRes.json();
                userInfo = { email: uData.email, name: uData.name, photo: uData.picture };
              }
            } catch (uErr) {
              console.warn('Failed to fetch user info:', uErr);
            }

            saveAccessToken(tokenResponse.access_token, expiresAt, userInfo);
            resolve(tokenResponse.access_token);
          } else {
            reject(new Error('No access token received from Google.'));
          }
        },
      });

      if (!tokenClient) {
        throw new Error('Google Identity Services client is not initialized.');
      }

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      reject(err);
    }
  });
}

/**
 * Disconnect Google Drive
 */
export function disconnectGoogleDrive() {
  const token = localStorage.getItem(STORAGE_KEY_TOKEN);
  if (token && (window as any).google?.accounts?.oauth2?.revoke) {
    try {
      (window as any).google.accounts.oauth2.revoke(token, () => {});
    } catch (e) {
      console.warn('Could not revoke Google OAuth token:', e);
    }
  }
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_EXPIRY);
  localStorage.removeItem(STORAGE_KEY_USER);
  localStorage.removeItem(STORAGE_KEY_ROOT_FOLDER);
}

/**
 * Check if a folder exists in Google Drive, or create it
 */
export async function getOrCreateFolder(folderName: string, parentId?: string, accessToken?: string): Promise<string> {
  const token = accessToken || getActiveAccessToken();
  if (!token) {
    throw new Error('Google Drive is not connected. Please connect Google Drive first.');
  }

  // 1. Search for existing folder
  let q = `mimeType='application/vnd.google-apps.folder' and name='${folderName.replace(/'/g, "\\'")}' and trashed=false`;
  if (parentId) {
    q += ` and '${parentId}' in parents`;
  } else {
    q += ` and 'root' in parents`;
  }

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&spaces=drive`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!searchRes.ok) {
    const errJson = await searchRes.json().catch(() => ({}));
    throw new Error(errJson.error?.message || `Failed to query Google Drive folder: ${searchRes.statusText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // 2. Create folder if not found
  const metadata: { name: string; mimeType: string; parents?: string[] } = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    metadata.parents = [parentId];
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!createRes.ok) {
    const errJson = await createRes.json().catch(() => ({}));
    throw new Error(errJson.error?.message || `Failed to create Google Drive folder: ${createRes.statusText}`);
  }

  const createData = await createRes.json();
  return createData.id;
}

/**
 * Get or create structured project folder in Google Drive:
 * Root ("VERIX CRM - Consulting & TKDN Vault") -> Project Folder ("[CODE] Client Name") -> Category Subfolder
 */
export async function getProjectCategoryFolder(
  projectCode: string,
  clientName: string,
  categoryGroupName: string,
  accessToken?: string
): Promise<string> {
  const token = accessToken || getActiveAccessToken();
  if (!token) throw new Error('Not connected to Google Drive');

  // 1. Get or create Master Root folder
  const rootFolderId = await getOrCreateFolder(DEFAULT_ROOT_FOLDER_NAME, undefined, token);

  // 2. Get or create Project folder (e.g. "[TKDN-2025-001] PT Krakatau Steel Tbk")
  const projectFolderName = `[${projectCode}] ${clientName}`;
  const projectFolderId = await getOrCreateFolder(projectFolderName, rootFolderId, token);

  // 3. Get or create Category subfolder (e.g. "Commercial Offers & SPK", "Technical Dossiers & BOM")
  const categoryFolderId = await getOrCreateFolder(categoryGroupName, projectFolderId, token);

  return categoryFolderId;
}

/**
 * Upload a File or Blob directly to Google Drive via multipart upload
 */
export async function uploadFileToGoogleDrive({
  file,
  fileName,
  mimeType,
  folderId,
  accessToken,
  description,
}: {
  file: File | Blob | string; // File, Blob, or base64 Data URL
  fileName: string;
  mimeType?: string;
  folderId?: string;
  accessToken?: string;
  description?: string;
}): Promise<GoogleDriveFileResult> {
  const token = accessToken || getActiveAccessToken();
  if (!token) {
    throw new Error('Google Drive is not authenticated. Please connect Google Drive first.');
  }

  let finalBlob: Blob;
  let finalMimeType = mimeType || 'application/octet-stream';

  if (typeof file === 'string') {
    // It's a Data URL or base64
    if (file.startsWith('data:')) {
      const parts = file.split(',');
      const meta = parts[0];
      const match = meta.match(/data:(.*?);base64/);
      if (match) {
        finalMimeType = match[1];
      }
      const byteString = atob(parts[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      finalBlob = new Blob([ab], { type: finalMimeType });
    } else {
      // Plain text or json content
      finalBlob = new Blob([file], { type: 'text/plain;charset=utf-8' });
      finalMimeType = 'text/plain';
    }
  } else {
    finalBlob = file;
    if (file.type) {
      finalMimeType = file.type;
    }
  }

  // Metadata object
  const metadata: any = {
    name: fileName,
    mimeType: finalMimeType,
  };
  if (description) {
    metadata.description = description;
  }
  if (folderId) {
    metadata.parents = [folderId];
  }

  // Use multipart upload to send metadata + content in one request
  const boundary = `-------314159265358979323846_${Date.now()}`;
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metaPart = `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;

  // Read blob as ArrayBuffer to build raw multipart payload
  const arrayBuffer = await finalBlob.arrayBuffer();

  const preBody = new TextEncoder().encode(`${delimiter}${metaPart}${delimiter}Content-Type: ${finalMimeType}\r\n\r\n`);
  const postBody = new TextEncoder().encode(`${closeDelimiter}`);

  const combinedLength = preBody.byteLength + arrayBuffer.byteLength + postBody.byteLength;
  const combinedBuffer = new Uint8Array(combinedLength);

  combinedBuffer.set(preBody, 0);
  combinedBuffer.set(new Uint8Array(arrayBuffer), preBody.byteLength);
  combinedBuffer.set(postBody, preBody.byteLength + arrayBuffer.byteLength);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,parents,size,createdTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: combinedBuffer,
    }
  );

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    console.error('Google Drive Upload Failed:', errorJson);
    throw new Error(errorJson.error?.message || `Google Drive upload failed (${response.status}: ${response.statusText})`);
  }

  const resultData: GoogleDriveFileResult = await response.json();
  return resultData;
}
