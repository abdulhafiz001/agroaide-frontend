import { Drawer } from 'expo-router/drawer';
import React from 'react';

import { useThemeController } from '@/design-system/DesignSystemProvider';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function AppDrawerLayout() {
  const { theme } = useThemeController();
  usePushNotifications();

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
      <Drawer.Screen name="farm-scan" options={{ title: 'Crop Scanner', drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="walk-boundary" options={{ title: 'Walk Boundary', drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="field-finances" options={{ title: 'Field Finances', drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="market" options={{ title: 'Market', drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="outbreak-map" options={{ title: 'Disease Map', drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="notifications" options={{ title: 'Notifications', drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="settings" options={{ title: 'Settings & Profile' }} />
    </Drawer>
  );
}

