import { getStorage } from 'firebase/storage';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';

export const firebaseConfig = {
  apiKey: appletConfig.apiKey || "AIzaSyAFZMmRDnVF6_vuYf1syx-NkZ6Wyq-bDRk",
  authDomain: appletConfig.authDomain || "storelly-ece40.firebaseapp.com",
  projectId: appletConfig.projectId || "storelly-ece40",
  storageBucket: appletConfig.storageBucket || "storelly-ece40.firebasestorage.app",
  messagingSenderId: appletConfig.messagingSenderId || "213462240043",
  appId: appletConfig.appId || "1:213462240043:web:330159d4cc80bd1355536e",
  measurementId: appletConfig.measurementId || "",
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth with Local Persistence
export const auth = getAuth(app);
try {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Auth persistence note:', err);
  });
} catch (e) {
  // Ignored in non-browser
}

// Target the provisioned Firestore database with auto-detect long polling enabled for proxies / iframes
let firestoreInstance: Firestore;
const targetDbId = appletConfig.firestoreDatabaseId && appletConfig.firestoreDatabaseId.trim()
  ? appletConfig.firestoreDatabaseId.trim()
  : undefined;

try {
  if (targetDbId && targetDbId !== '(default)') {
    firestoreInstance = initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
      },
      targetDbId
    );
  } else {
    firestoreInstance = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });
  }
} catch (e) {
  // If already initialized, retrieve existing instance
  firestoreInstance = targetDbId && targetDbId !== '(default)'
    ? getFirestore(app, targetDbId)
    : getFirestore(app);
}

export const db = firestoreInstance;

// Validate connection per Firebase guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    const errMsg = error?.message || '';
    if (errMsg.includes('the client is offline') || errMsg.includes('closing') || errMsg.includes('hidden')) {
      console.warn('Firestore connection lifecycle notice:', errMsg);
    } else {
      console.warn('Firestore connectivity note:', errMsg);
    }
    return false;
  }
}

// Google Auth Provider configured for popups
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export const APP_BASE_URL = typeof window !== 'undefined'
  ? ((window as any).APP_BASE_URL || window.location.origin)
  : "https://storelly-ece40.web.app";

export const storage = getStorage(app);
