import SplashScreen from '@/app/splash';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import {
    requestNotificationPermission,
    scheduleMorningDigest,
    snoozeNotification,
} from '@/services/NotificationService';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  // 1️⃣ Register notification action buttons
  useEffect(() => {
    Notifications.setNotificationCategoryAsync('morning_digest', [
      {
        identifier: 'OPEN_APP',
        buttonTitle: 'Open',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'SNOOZE',
        buttonTitle: 'Snooze 😴',
      },
      {
        identifier: 'DONE',
        buttonTitle: 'Done ✓',
      },
    ]);
  }, []);

  // 2️⃣ Listen for notification button presses
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      async (response: Notifications.NotificationResponse) => {
        const action = response.actionIdentifier;

        if (action === 'SNOOZE') {
          await snoozeNotification(10);
        }

        if (action === 'OPEN_APP') {
          console.log('Open app pressed');
        }

        if (action === 'DONE') {
          console.log('Tasks acknowledged');
        }
      }
    );

    return () => sub.remove();
  }, []);

  // 3️⃣ Ask permission and schedule morning digest
  useEffect(() => {
    if (splashDone) {
      const setup = async () => {
        const granted = await requestNotificationPermission();
        if (granted) {
          await scheduleMorningDigest(8, 0);
        }
      };
      setup();
    }
  }, [splashDone]);

  // Splash screen while loading
  if (!splashDone) {
    return (
      <ThemeProvider>
        <SplashScreen onFinish={() => setSplashDone(true)} />
      </ThemeProvider>
    );
  }

  // Main app layout
  return (
    <AuthProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
