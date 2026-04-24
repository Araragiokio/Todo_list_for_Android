import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {
  signOut as firebaseSignOut,
  getIdToken,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  User,
} from 'firebase/auth';
import { auth } from './firebase';

// Complete web browser for OAuth redirect
WebBrowser.maybeCompleteAuthSession();

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
 * Google Sign-In using Firebase's built-in OAuth support
 *
 * This implementation uses Firebase's official OAuth handler, which automatically
 * uses the redirect URIs configured in your Google Cloud OAuth client.
 *
 * Your OAuth client (in Google Cloud Console) should have these redirect URIs:
 * - https://<your-firebase-project>.firebaseapp.com/__/auth/handler
 * - https://<your-firebase-project>.firebaseapp.com/__/auth/handler (for web)
 *
 * Firebase automatically handles the OAuth flow and creates the proper credentials.
 * For native apps (Expo), we use WebBrowser to handle the OAuth popup redirect.
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    // For native apps, we need to configure the redirect URL for the OAuth popup
    // Firebase will use its handler to complete the OAuth flow
    const redirectUrl = AuthSession.makeRedirectUri({
      scheme: 'todoapp',
      path: 'redirect',
    });

    console.log('Firebase OAuth - Using Firebase handler redirect');
    console.log('App redirect URL available:', redirectUrl);

    // Use Firebase's signInWithPopup - on native, it uses web browser for OAuth
    // Firebase automatically handles the Google OAuth flow with your configured client
    const provider = new GoogleAuthProvider();

    // Set scopes
    provider.addScope('profile');
    provider.addScope('email');

    // Sign in using Firebase's built-in OAuth support
    // On Expo/React Native, this will open a browser for the OAuth flow
    // Firebase will handle the redirect and credential creation automatically
    const userCredential = await signInWithPopup(auth, provider);
    const firebaseUser = userCredential.user;

    console.log('Firebase sign-in successful:', {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
    });

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

    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('popup_blocked_by_browser')) {
        throw new Error('Popup was blocked. Please allow popups and try again.');
      }
      if (error.message.includes('cancelled')) {
        throw new Error('Sign-in was cancelled.');
      }
      if (error.message.includes('invalid_grant')) {
        throw new Error(
          'Authentication failed. Make sure your Firebase project has Google sign-in enabled ' +
            'and your OAuth client is properly configured.'
        );
      }
    }

    throw new Error(
      `Sign-in failed: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
        'Make sure Google sign-in is enabled in Firebase Authentication.'
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
