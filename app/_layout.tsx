import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from '@/context/ThemeContext';
import SplashScreen from '@/app/splash';
import { requestNotificationPermission } from '@/Services/NotificationService';

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (splashDone) {
      // Request permission after splash finishes
      requestNotificationPermission();
    }
  }, [splashDone]);

  if (!splashDone) {
    return (
      <ThemeProvider>
        <SplashScreen onFinish={() => setSplashDone(true)} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}