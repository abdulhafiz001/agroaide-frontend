import { DarkTheme, DefaultTheme, Theme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeProvider as StyledThemeProvider } from 'styled-components/native';

import { getThemeByPreference, type AgroTheme, type ThemePreference } from './theme';

import { useAppStore } from '@/store/useAppStore';

interface ThemeControllerContextValue {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  theme: AgroTheme;
}

const ThemeControllerContext = createContext<ThemeControllerContextValue | undefined>(undefined);

interface DesignSystemProviderProps {
  children: React.ReactNode;
}

export const DesignSystemProvider: React.FC<DesignSystemProviderProps> = ({ children }) => {
  const preference = useAppStore((state) => state.themePreference);
  const setPreference = useAppStore((state) => state.setThemePreference);
  const systemScheme = useColorScheme();

  const theme = useMemo(() => getThemeByPreference(preference, systemScheme), [preference, systemScheme]);

  const navigationTheme = useMemo<Theme>(() => {
    const baseTheme = theme.mode === 'light' ? DefaultTheme : DarkTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: theme.colors.primary,
        text: theme.colors.textPrimary,
        background: theme.colors.background,
        card: theme.colors.surface,
        border: theme.colors.border,
        notification: theme.colors.accent,
      },
    };
  }, [theme]);

  const value = useMemo(
    () => ({
      preference,
      setPreference,
      theme,
    }),
    [preference, setPreference, theme],
  );

  return (
    <ThemeControllerContext.Provider value={value}>
      <StyledThemeProvider theme={theme}>
        <NavigationThemeProvider value={navigationTheme}>{children}</NavigationThemeProvider>
      </StyledThemeProvider>
    </ThemeControllerContext.Provider>
  );
};

export const useThemeController = () => {
  const context = useContext(ThemeControllerContext);
  if (!context) {
    throw new Error('useThemeController must be used within a DesignSystemProvider');
  }
  return context;
};

