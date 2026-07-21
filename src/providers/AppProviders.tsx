import { QueryClientProvider, focusManager } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/Toast';
import { DesignSystemProvider, useThemeController } from '@/design-system/DesignSystemProvider';
import { queryClient } from '@/utils/queryClient';

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
            <ToastProvider>
              <ThemeAwareStatusBar />
              {children}
            </ToastProvider>
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
