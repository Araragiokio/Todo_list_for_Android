# Google Sign-In Setup Guide for Expo React Native TodoApp

## What is happening

The failing request in the screenshot uses:

```text
redirect_uri=exp://10.186.66.226:8081/--/oauth-redirect
```

Google rejects that for a **Web application** OAuth client because web redirect URIs must be secure HTTPS URLs. In Expo Go, the app cannot use your custom `todoapp://` scheme directly, so this project uses Expo's HTTPS AuthSession proxy redirect for local testing.

## 1. Google Cloud OAuth client

Create or edit an OAuth 2.0 client in Google Cloud Console:

1. Go to **APIs & Services** -> **Credentials**.
2. Create **OAuth client ID** -> **Web application**.
3. Add this exact Authorized redirect URI:

```text
https://auth.expo.io/@araragi_okio/TodoApp
```

This must match the redirect URI printed by the app exactly.

Do not add the `exp://...` URL from Expo Go. Google will reject it.

## 2. Environment variables

Update `.env.local`:

```env
EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=xxxxx.apps.googleusercontent.com
EXPO_PUBLIC_EXPO_PROJECT_FULL_NAME=@araragi_okio/TodoApp
EXPO_PUBLIC_GOOGLE_OAUTH_REDIRECT_URI=https://auth.expo.io/@araragi_okio/TodoApp
```

If the app logs a different redirect URI, you can override it explicitly:

```env
EXPO_PUBLIC_GOOGLE_OAUTH_REDIRECT_URI=https://auth.expo.io/@araragi_okio/TodoApp
```

Restart Expo after changing `.env.local`.

## 3. Firebase

In Firebase Console:

1. Open project `todo-list-app-8d8f4`.
2. Go to **Authentication** -> **Sign-in method**.
3. Enable **Google**.
4. Make sure the support email is selected.

## 4. Expected console log

When sign-in starts, the app logs:

```text
Starting Google OAuth flow...
OAuth Client ID: xxxxx.apps.googleusercontent.com
Redirect URI: https://auth.expo.io/@araragi_okio/TodoApp
```

That logged redirect URI must match the Google Cloud authorized redirect URI exactly.

## Notes

Expo's AuthSession proxy is useful for Expo Go testing, but Expo now recommends development builds or native provider libraries for production Google sign-in. For a production Android build, prefer `@react-native-google-signin/google-signin` with Firebase and SHA-1/SHA-256 configured.
