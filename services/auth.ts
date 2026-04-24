import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import {
  signOut as firebaseSignOut,
  getIdToken,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
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
 * Google Sign-In using OAuth 2.0 + AuthSession + Firebase
 *
 * IMPORTANT: This uses the native Google OAuth flow with proper error handling.
 * If you get a 400 error, it's likely due to:
 * 1. Client ID not registered in Google Cloud Console
 * 2. Redirect URI not matching what's registered
 *
 * SOLUTION: Use Firebase's official approach or set up custom OAuth credentials:
 *
 * Option A (Recommended for Expo): Use Firebase's Web Client ID
 * - Go to: Firebase Console → Project Settings → Service Accounts → Generate new private key
 * - Or: Go to Google Cloud Console → Credentials → Create OAuth 2.0 Web Client
 * - Register redirect URI: urn:ietf:wg:oauth:2.0:oob (for native apps)
 * - Update CLIENT_ID below with your actual Web Client ID
 *
 * Option B (This implementation): Use Expo's URL scheme-based redirect
 * - Requires registering: todoapp://redirect in Google Cloud Console
 * - Go to: Google Cloud Console → APIs & Services → Credentials
 * - Edit the Web Client ID
 * - Add redirect URI: todoapp://redirect (or whatever makeRedirectUri() generates)
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    // ⚠️ IMPORTANT: Replace with your actual Google OAuth 2.0 Web Client ID
    // This is NOT your Firebase project ID
    // Get it from: Google Cloud Console → Credentials → OAuth 2.0 Web Client
    const CLIENT_ID = 'YOUR_GOOGLE_OAUTH_WEB_CLIENT_ID.apps.googleusercontent.com';

    // Check if CLIENT_ID has been configured
    if (CLIENT_ID === 'YOUR_GOOGLE_OAUTH_WEB_CLIENT_ID.apps.googleusercontent.com') {
      throw new Error(
        'Google OAuth client ID not configured. ' +
          'Please update CLIENT_ID in services/auth.ts with your actual Web Client ID from Google Cloud Console. ' +
          'Get it from: https://console.cloud.google.com/apis/credentials'
      );
    }

    // Build the redirect URI that Expo will use
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'todoapp',
      path: 'redirect',
    });

    console.log('OAuth Redirect URI:', redirectUri);
    console.log('Client ID:', CLIENT_ID);

    // Create OAuth request for Google
    const request = new AuthSession.AuthRequest({
      clientId: CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: redirectUri,
    });

    // Google OAuth endpoints
    const discovery = {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://www.googleapis.com/oauth2/v4/token',
      revocationEndpoint: 'https://oauth.googleapis.com/revoke',
    };

    // Prompt user with Google OAuth screen
    const result = await request.promptAsync(discovery);

    if (result.type !== 'success') {
      throw new Error(
        `Google authentication ${result.type || 'failed'}. ` +
          `Make sure your Google OAuth client ID is registered with redirect URI: ${redirectUri}`
      );
    }

    // Extract ID token from response
    const idToken = (result as any).params?.id_token || (result as any).params?.access_token;
    if (!idToken) {
      throw new Error(
        'No ID token received from Google. ' +
          'Ensure your OAuth client ID and redirect URI are properly configured in Google Cloud Console.'
      );
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
