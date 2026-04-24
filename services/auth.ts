import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import {
  signOut as firebaseSignOut,
  getIdToken,
  onAuthStateChanged,
  User,
  signInWithCredential,
  GoogleAuthProvider,
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
 * Google Sign-In using OAuth 2.0 + AuthSession + Firebase
 *
 * Flow:
 * 1. Launch Google OAuth consent screen in web browser via AuthSession
 * 2. User grants permission and is redirected with authorization code
 * 3. Exchange code for ID token and access token
 * 4. Create Firebase credential from ID token
 * 5. Sign in to Firebase with credential
 * 6. Persist user session to AsyncStorage
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    // Create OAuth request for Google
    // Using the Firebase Web Client ID (from Firebase Console)
    const discovery = {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://www.googleapis.com/oauth2/v4/token',
      revocationEndpoint: 'https://oauth.googleapis.com/revoke',
    };

    // Get the project ID from Firebase config
    const projectId = 'todo-list-app-8d8f4';

    // Build OAuth request
    const request = new AuthSession.AuthRequest({
      clientId: `${projectId}.apps.googleusercontent.com`,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'todoapp',
      }),
    });

    // Prompt user with Google OAuth screen
    const result = await request.promptAsync(discovery);

    if (result.type !== 'success') {
      throw new Error('Google authentication cancelled or failed');
    }

    // Extract ID token from response
    const idToken = result.params.id_token;
    if (!idToken) {
      throw new Error('No ID token received from Google');
    }

    // Create Firebase credential from Google ID token
    const credential = GoogleAuthProvider.credential(idToken);

    // Sign in to Firebase with the credential
    const userCredential = await signInWithCredential(auth, credential);
    const firebaseUser = userCredential.user;

    // Persist session to AsyncStorage
    const sessionData: AuthSessionData = {
      user: {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      },
      idToken: await getIdToken(firebaseUser),
      refreshToken: firebaseUser.refreshToken,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));

    return firebaseUser;
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
