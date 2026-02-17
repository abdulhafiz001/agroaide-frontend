import { Drawer } from 'expo-router/drawer';
import React from 'react';

import { useThemeController } from '@/design-system/DesignSystemProvider';

export default function AppDrawerLayout() {
  const { theme } = useThemeController();

  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.textSecondary,
        drawerStyle: {
          backgroundColor: theme.colors.surface,
        },
      }}>
      <Drawer.Screen name="(tabs)" options={{ title: 'Home' }} />
      <Drawer.Screen name="weather-detail" options={{ title: 'Weather Intelligence' }} />
      <Drawer.Screen name="notifications" options={{ title: 'Notifications', drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="settings" options={{ title: 'Settings & Profile' }} />
    </Drawer>
  );
}

