import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Enforce browser-session-only persistence: Closing the browser window/tab automatically terminates the active session
setPersistence(auth, browserSessionPersistence).catch((err) => {
  console.warn('Firebase session persistence configuration note:', err);
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

const rawDbId = (firebaseConfigJson as Record<string, any>).firestoreDatabaseId;
const databaseId = rawDbId && rawDbId !== '(default)'
  ? rawDbId
  : undefined;

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    }),
    ...(databaseId ? { databaseId } : {})
  });
} catch (e) {
  firestoreInstance = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
}

export const db = firestoreInstance;

// Authentication Helpers
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error: any) {
    console.error('Firebase Google Sign-In Error:', error);
    return { user: null, error: error.message || 'Failed to sign in with Google' };
  }
};

export const logoutFirebase = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error('Firebase Sign-Out Error:', error);
    return { success: false, error: error.message };
  }
};

export const sendResetPasswordEmail = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (error: any) {
    console.warn('Firebase Auth sendPasswordResetEmail:', error);
    return { success: false, error: error.message };
  }
};

export {
  app,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  onAuthStateChanged
};
export type { FirebaseUser };
