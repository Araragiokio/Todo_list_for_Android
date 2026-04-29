import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {
  signOut as firebaseSignOut,
  getIdToken,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  User,
} from 'firebase/auth';
import { auth } from './firebase';

// Ensure WebBrowser is properly initialized for OAuth redirect handling
WebBrowser.maybeCompleteAuthSession();

/**
 * Google OAuth Web Client ID from Google Cloud Console
 * 
 * ⚠️ SETUP REQUIRED:
 * 1. Go to Google Cloud Console → Select your Firebase project
 * 2. Navigate to "APIs & Services" → "Credentials"
 * 3. Create OAuth 2.0 credential → "Web application"
 * 4. Add Authorized Redirect URIs:
 *    - https://auth.expo.io/@YOUR_EXPO_USERNAME/TodoApp/callback
 *    - https://localhost:19000 (for local testing with Expo Go)
 * 5. Copy the Client ID and paste below (NOT the Firebase Project ID)
 * 
 * This is different from:
 * - Firebase Project ID (todo-list-app-8d8f4)
 * - Google App ID (not used for OAuth 2.0 Web flow)
 * 
 * The Web Client ID format: xxxxx.apps.googleusercontent.com
 */
const GOOGLE_OAUTH_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID || 'YOUR_GOOGLE_OAUTH_WEB_CLIENT_ID.apps.googleusercontent.com';

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
 * Google Sign-In for Expo React Native using OAuth 2.0 + Firebase
 *
 * This implementation uses the proper Expo + Firebase sign-in flow:
 * 1. AuthSession handles OAuth 2.0 implicit flow with Expo proxy (useProxy: true)
 * 2. Request ID token directly (responseType: IdToken) from Google authorization server
 * 3. User authorizes in browser → Google redirects to app with ID token
 * 4. Create Firebase credential from ID token
 * 5. Firebase signInWithCredential() authenticates with Firebase
 * 6. Session persisted to AsyncStorage
 *
 * Configuration Requirements:
 * - EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID: Web Client ID (NOT Mobile/Native OAuth app)
 *   From: Google Cloud Console → APIs & Services → Credentials
 *   Must be "Web application" type, NOT "Android" or "iOS"
 *
 * - Redirect URI Registration (in BOTH places):
 *   a) Google Cloud Console:
 *      - https://auth.expo.io/@YOUR_EXPO_USERNAME/TodoApp/callback
 *      - https://localhost:19000 (for local Expo Go testing)
 *   b) Firebase Console:
 *      - Authentication → Google → Custom Domain (if using custom domain)
 *
 * - Firebase Authentication:
 *   Google sign-in provider must be enabled in Firebase Console
 *
 * Key Differences from Mobile OAuth:
 * - Uses Web Client ID (not Android/iOS credentials)
 * - useProxy: true leverages Expo's redirect proxy for native apps
 * - Implicit flow (responseType: IdToken) avoids backend token exchange
 * - Works on Expo Go, standalone app, and web (same client ID)
 *
 * Error Handling:
 * - 400 Malformed Request: Usually means placeholder client ID or redirect URI mismatch
 * - redirect_uri_mismatch: URI not registered in Google Cloud Console
 * - INVALID_CLIENT: Client ID is invalid or wrong type
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    // Validate client ID is set
    if (GOOGLE_OAUTH_CLIENT_ID.includes('YOUR_GOOGLE')) {
      throw new Error(
        'Google OAuth Client ID not configured. ' +
          'Set EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID environment variable or update services/auth.ts'
      );
    }

    // Get OAuth discovery - must be called each time (hooks requirement)
    const discovery = await AuthSession.fetchDiscoveryAsync('https://accounts.google.com');

    if (!discovery) {
      throw new Error('OAuth discovery failed. Unable to reach OAuth server.');
    }

    // Configure the OAuth request with proper Expo + Firebase flow
    // Key: useProxy: true allows Web Client ID to work with native apps via Expo's proxy
    const request = new AuthSession.AuthRequest({
      clientId: GOOGLE_OAUTH_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      // Implicit flow: directly request ID token (not authorization code)
      responseType: AuthSession.ResponseType.IdToken,
      // Use Expo's proxy server - required for Web Client ID in native apps
      usePKCE: false,
      // Prompt user to select account / login
      prompt: AuthSession.Prompt.Login,
      // Generate redirect URI using Expo scheme registered in app.json
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'todoapp',
        path: 'oauth-redirect',
        useProxy: true, // Tell Expo to handle the redirect via proxy
      }),
    });

    console.log('Starting Google OAuth flow...');
    console.log('OAuth Client ID:', GOOGLE_OAUTH_CLIENT_ID);
    console.log('Redirect URI:', request.redirectUri);

    // Prompt user to authorize (opens browser)
    const result = await request.promptAsync(discovery);

    // Check if user cancelled
    if (result.type !== 'success') {
      throw new Error('Authorization was cancelled or failed.');
    }

    // Extract ID token from response
    // With responseType: IdToken, the ID token should be in params.id_token
    let idToken: string | null = null;

    if (result.params.id_token) {
      // Implicit flow returns ID token directly
      idToken = result.params.id_token;
      console.log('ID token received from OAuth server');
    } else if (result.params.access_token) {
      // Fallback: some OAuth servers return access token instead
      // For Google, this shouldn't happen with IdToken responseType
      console.warn('Received access token instead of ID token');
      idToken = result.params.access_token;
    } else if (result.params.code) {
      // Authorization code flow (shouldn't happen with IdToken responseType)
      // This would require backend exchange
      throw new Error(
        'Received authorization code instead of ID token. ' +
          'Ensure Google OAuth client is configured for implicit flow (responseType: id_token)'
      );
    } else {
      // No token received
      console.error('OAuth response params:', result.params);
      throw new Error(
        'No ID token received from authorization server. ' +
          'Check that your Google OAuth Web Client ID is valid and redirect URI is configured.'
      );
    }

    if (!idToken) {
      throw new Error('No ID token could be extracted from authorization response.');
    }

    console.log('Creating Firebase credential from ID token...');

    // Create Firebase credential from the ID token
    const credential = GoogleAuthProvider.credential(idToken);

    // Sign in to Firebase with the credential
    const userCredential = await signInWithCredential(auth, credential);
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

    // Provide helpful error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes('cancelled') || error.message.includes('dismissed')) {
        throw new Error('Sign-in was cancelled by user.');
      }
      if (error.message.includes('INVALID_CLIENT')) {
        throw new Error(
          'Invalid OAuth client ID. Verify EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID is set correctly. ' +
            'Must be a Web Client ID from Google Cloud Console (format: xxxxx.apps.googleusercontent.com)'
        );
      }
      if (error.message.includes('redirect_uri_mismatch')) {
        throw new Error(
          'Redirect URI mismatch. Ensure the redirect URI is registered in: ' +
            '1. Google Cloud Console → OAuth 2.0 Web Client ' +
            '2. Firebase Console → Authentication → Google → Redirect URIs'
        );
      }
      if (error.message.includes('malformed')) {
        throw new Error(
          'Malformed OAuth request. Check: 1) Client ID is valid, 2) Redirect URI is configured, ' +
            '3) Google OAuth app type is "Web application" (not mobile)'
        );
      }
      if (error.message.includes('No ID token')) {
        throw new Error(
          'No ID token received. Ensure: 1) OAuth client is Web type, 2) Implicit flow is enabled, ' +
            '3) Redirect URI matches exactly in Google Cloud Console'
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
