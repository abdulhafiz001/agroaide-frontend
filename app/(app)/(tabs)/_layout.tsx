import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';

import { useThemeController } from '@/design-system/DesignSystemProvider';
import { useTranslation } from '@/i18n/useTranslation';

const iconMap = {
  dashboard: 'leaf-outline',
  farm: 'map-outline',
  calendar: 'calendar-outline',
  advisor: 'chatbubbles-outline',
  profile: 'person-circle-outline',
} as const;

export default function TabsLayout() {
  const { theme } = useThemeController();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={({ route, navigation }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.textPrimary,
        headerTitle: 'AgroAide',
        headerLeft: () => (
          <Pressable
            onPress={() => navigation.getParent()?.dispatch(DrawerActions.openDrawer())}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Open main menu"
            style={{ marginLeft: 16, padding: 6 }}>
            <Ionicons name="menu" size={26} color={theme.colors.textPrimary} />
          </Pressable>
        ),
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: { fontFamily: 'Inter_500Medium', fontSize: 10},
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
      <Tabs.Screen name="dashboard" options={{ title: t('tabDashboard') }} />
      <Tabs.Screen name="farm" options={{ title: t('tabFarm') }} />
      <Tabs.Screen name="calendar" options={{ title: t('tabCalendar') }} />
      <Tabs.Screen name="advisor" options={{ title: t('tabAdvisor') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabProfile') }} />
    </Tabs>
  );
}

