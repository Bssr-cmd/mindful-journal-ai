import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Explicitly connect to the provisioned Firestore database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    const code = error?.code || '';
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/user-cancelled'
    ) {
      // User closed or dismissed the popup without signing in; safe no-op
      return null;
    }
    if (code === 'auth/popup-blocked') {
      throw new Error(
        'The sign-in popup was blocked by your browser. Please allow popups or open this app in a new tab.'
      );
    }
    throw error;
  }
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged };
export type { User };
