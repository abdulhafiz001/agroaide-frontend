import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeController } from '@/design-system/DesignSystemProvider';

const iconMap = {
  dashboard: 'leaf-outline',
  farm: 'map-outline',
  calendar: 'calendar-outline',
  advisor: 'chatbubbles-outline',
  market: 'business-outline',
  profile: 'person-circle-outline',
} as const;

export default function TabsLayout() {
  const { theme } = useThemeController();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: { fontFamily: 'Inter_500Medium', fontSize: 12 },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: `${theme.colors.border}40`,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: 14,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={iconMap[route.name as keyof typeof iconMap]} size={size} color={color} />
        ),
      })}>
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="farm" options={{ title: 'My Farm' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
      <Tabs.Screen name="advisor" options={{ title: 'AI Advisor' }} />
      <Tabs.Screen name="market" options={{ title: 'Market' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

