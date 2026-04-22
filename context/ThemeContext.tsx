import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  colors: typeof Colors.dark;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  isDark: true,
  colors: Colors.dark,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('system');

  // Load saved theme on app start
  useEffect(() => {
    AsyncStorage.getItem('theme').then((saved) => {
      if (saved) setThemeState(saved as ThemeType);
    });
  }, []);

  // Save theme whenever it changes
  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  // Figure out if we're actually in dark mode
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && systemScheme === 'dark');

  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);