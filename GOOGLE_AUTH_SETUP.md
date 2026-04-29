# Google Sign-In Setup Guide for Expo React Native TodoApp

## Problem
The app was returning `400 malformed request` when attempting Google sign-in. This was caused by:
1. Placeholder/invalid Google OAuth Client ID
2. Missing `useProxy: true` in AuthSession configuration
3. Incorrect redirect URI configuration
4. Missing explicit `responseType: IdToken` specification

## Solution Overview
This project now uses the **correct Expo + Firebase OAuth 2.0 implicit flow** for Google Sign-In:
- Uses Expo's proxy server (`useProxy: true`) for Web Client IDs
- Requests ID token directly (implicit flow, no backend token exchange)
- Supports Expo Go, standalone app, and web with same credentials
- Proper error handling for configuration issues

## Step-by-Step Setup

### 1. Get Google OAuth Web Client ID

⚠️ **IMPORTANT**: You need a **Web Client ID**, NOT an Android or iOS credential.

**Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project: **todo-list-app-8d8f4**
3. Navigate to **APIs & Services** → **Credentials**
4. Click **+ Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Under "Authorized redirect URIs", add:
   ```
   https://auth.expo.io/@YOUR_EXPO_USERNAME/TodoApp/callback
   https://localhost:19000
   ```
   (Replace `YOUR_EXPO_USERNAME` with your actual Expo account username)
7. Click **Create**
8. Copy the **Client ID** (format: `xxxxx.apps.googleusercontent.com`)

**Store it as an environment variable:**

Create or update `.env.local` in the project root:
```env
EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

Or set it in your development environment:
```bash
export EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID="xxxxx.apps.googleusercontent.com"
```

### 2. Verify Firebase Authentication Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **todo-list-app-8d8f4**
3. Navigate to **Authentication** → **Sign-in providers**
4. Ensure **Google** is **Enabled**
5. Under Google settings, verify:
   - Web SDK Configuration is shown (save for Firebase Web SDK if needed)
   - Redirect URIs are listed (auto-configured by Firebase)

### 3. Configure Deep Link Scheme

The app already has `scheme: "todoapp"` configured in `app.json` ✓

Verify:
```json
{
  "expo": {
    "scheme": "todoapp"
  }
}
```

### 4. Test the Setup

#### Test on Expo Go (development)
```bash
npm start
# Scan QR code with Expo Go app
# Tap sign-in button
```

#### Expected Flow:
1. Browser opens → Google login page
2. User signs in / selects account
3. Browser redirects back to app
4. App receives ID token
5. Firebase authenticates user
6. App returns to home screen

### 5. Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| **400 Malformed Request** | Placeholder client ID or invalid format | Set `EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID` to valid Web Client ID |
| **redirect_uri_mismatch** | Redirect URI not registered in Google Cloud Console | Add `https://auth.expo.io/@YOUR_EXPO_USERNAME/TodoApp/callback` to authorized URIs |
| **INVALID_CLIENT** | Wrong OAuth app type (Android/iOS instead of Web) | Create Web application credential, not Mobile OAuth |
| **No ID token received** | Implicit flow not enabled or redirect URI mismatch | Verify redirect URI registered, ensure Web app type |
| **Sign-in cancelled** | User cancelled authentication | This is normal - user can try again |

**Debug Mode:**
The code logs details to console:
```
Starting Google OAuth flow...
OAuth Client ID: xxxxx.apps.googleusercontent.com
Redirect URI: https://auth.expo.io/@YOUR_EXPO_USERNAME/TodoApp/callback
ID token received from OAuth server
Creating Firebase credential from ID token...
Firebase sign-in successful: { uid: '...', email: '...' }
```

## Technical Details

### OAuth 2.0 Flow (Implicit)
```
1. App requests ID token from Google
   - Client ID: xxxxx.apps.googleusercontent.com (Web app)
   - Scopes: openid, profile, email
   - Redirect URI: https://auth.expo.io/@.../TodoApp/callback
   - useProxy: true (uses Expo proxy server)
   - responseType: IdToken (requests ID token directly)

2. User authorizes → Google redirects with ID token

3. App extracts ID token from redirect

4. App creates Firebase credential from ID token:
   GoogleAuthProvider.credential(idToken)

5. App signs in to Firebase:
   signInWithCredential(auth, credential)

6. Firebase returns authenticated User

7. Session persisted to AsyncStorage
```

### Why This Works
- **useProxy: true**: Expo's proxy handles the OAuth redirect for native apps (can't intercept custom schemes natively)
- **Web Client ID**: Same credentials work for Expo Go, standalone app, and web
- **Implicit flow**: No backend token exchange needed
- **Firebase credential**: Converts OAuth token to Firebase auth

### Key Files Modified
- `services/auth.ts`: 
  - Added environment variable support for client ID
  - Added `responseType: AuthSession.ResponseType.IdToken`
  - Added `useProxy: true` to redirect URI
  - Added validation for placeholder client ID
  - Enhanced error messages for common issues

## Additional Resources

- [Expo AuthSession docs](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Firebase Google Auth docs](https://firebase.google.com/docs/auth/web/google-signin)
- [Google OAuth 2.0 documentation](https://developers.google.com/identity/protocols/oauth2)

## Questions?

If sign-in still doesn't work:
1. Check console logs for specific error message
2. Verify client ID matches Web app type (not Mobile)
3. Verify redirect URI is registered EXACTLY as shown in console
4. Ensure Google provider is enabled in Firebase Console
5. Clear app cache and reinstall/restart if testing on device
