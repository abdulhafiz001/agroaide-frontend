import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DesignSystemProvider, useThemeController } from '@/design-system/DesignSystemProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: Platform.OS === 'web',
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export const AppProviders: React.FC<React.PropsWithChildren> = ({ children }) => {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      focusManager.setFocused(status === 'active');
    });

    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DesignSystemProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeAwareStatusBar />
            {children}
          </QueryClientProvider>
        </DesignSystemProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const ThemeAwareStatusBar = () => {
  const { theme } = useThemeController();
  return <StatusBar style={theme.mode === 'light' ? 'dark' : 'light'} />;
};

