import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  signOut as firebaseSignOut,
  getIdToken,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from './firebase';

export interface AuthSessionData {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  } | null;
  idToken: string | null;
  refreshToken: string | null;
}

const STORAGE_KEY = 'auth_session';

/**
 * Google Sign-In using Web Browser OAuth + Firebase
 *
 * Flow:
 * 1. Opens browser → Google OAuth2 consent screen
 * 2. User grants permission
 * 3. Browser redirects back to app with ID token in URL fragment
 * 4. Extract ID token and create Firebase credential
 * 5. Sign in to Firebase
 * 6. Persist user session to AsyncStorage
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    // For actual implementation, use expo-auth-session or Firebase's native libraries
    // This is a placeholder that shows the intended flow
    throw new Error(
      'Google Sign-In requires setting up OAuth 2.0 credentials. ' +
      'See comments in services/auth.ts for setup instructions.'
    );

    // TODO: After setting up OAuth credentials, implement using:
    // - expo-auth-session for pure Expo approach, OR
    // - Firebase Phone/Email auth as interim solution, OR
    // - expo-google-sign-in for native Google Sign-In
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw new Error(
      `Sign-in failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Sign out user and clear session
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Sign-out error:', error);
    throw new Error(`Sign-out failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Restore session from AsyncStorage (called on app boot)
 */
export async function restoreSession(): Promise<AuthSessionData | null> {
  try {
    const sessionData = await AsyncStorage.getItem(STORAGE_KEY);

    if (!sessionData) {
      return null;
    }

    const session = JSON.parse(sessionData) as AuthSessionData;

    // Validate session still exists in Firebase
    if (auth.currentUser) {
      // Refresh the token to ensure it's still valid
      const idToken = await getIdToken(auth.currentUser, true);
      session.idToken = idToken;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }

    return session;
  } catch (error) {
    console.error('Session restoration error:', error);
    // Clear invalid session
    await AsyncStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/**
 * Get current valid ID token (refreshes if expired)
 */
export async function getValidIdToken(): Promise<string | null> {
  try {
    if (!auth.currentUser) return null;
    return await getIdToken(auth.currentUser, true);
  } catch (error) {
    console.error('Failed to get ID token:', error);
    return null;
  }
}

/**
 * Listen to auth state changes (for real-time sync)
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get current user (if any)
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return auth.currentUser !== null;
}
