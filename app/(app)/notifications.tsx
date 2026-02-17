import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';

import { Button, Surface, Text } from '@/design-system/components';
import styled from '@/design-system/styled';
import { notificationApi, type AppNotification } from '@/services/notificationApi';
import { useAppStore } from '@/store/useAppStore';

const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Header = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.border};
`;

const NotifCard = styled(TouchableOpacity)<{ unread: boolean }>`
  flex-direction: row;
  padding: 16px 20px;
  gap: 14px;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.border};
  background-color: ${({ theme, unread }) => (unread ? `${theme.colors.primary}08` : 'transparent')};
`;

const IconCircle = styled.View<{ type: string }>`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, type }) => {
    if (type === 'weather') return '#e0f2ff';
    if (type === 'ai') return '#e9d5ff';
    if (type === 'market') return '#d1fae5';
    return '#f3f4f6';
  }};
`;

const typeIcons: Record<string, { name: string; color: string }> = {
  weather: { name: 'cloud-outline', color: '#1d4ed8' },
  ai: { name: 'sparkles-outline', color: '#7c3aed' },
  market: { name: 'trending-up-outline', color: '#047857' },
  system: { name: 'notifications-outline', color: '#374151' },
};

const EmptyState = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 48px;
  gap: 16px;
`;

export default function NotificationsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const token = useAppStore((s) => s.accessToken) ?? '';
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getAll(token),
    enabled: Boolean(token),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationApi.markRead(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSnapshot'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSnapshot'] });
    },
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString();
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const iconDef = typeIcons[item.type] || typeIcons.system;

    return (
      <NotifCard
        unread={!item.read}
        onPress={() => {
          if (!item.read) markReadMutation.mutate(item.id);
        }}
      >
        <IconCircle type={item.type}>
          <Ionicons name={iconDef.name as any} size={20} color={iconDef.color} />
        </IconCircle>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="body" style={{ fontWeight: item.read ? '400' : '600', flex: 1 }}>
              {item.title}
            </Text>
            {!item.read && (
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary, marginLeft: 8 }} />
            )}
          </View>
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {item.message}
          </Text>
          <Text variant="caption" tone="muted" style={{ fontSize: 11 }}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </NotifCard>
    );
  };

  return (
    <Screen>
      <Header>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text variant="headline" style={{ fontWeight: '700' }}>
          Notifications
        </Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={() => markAllMutation.mutate()}>
            <Text variant="caption" tone="accent">
              Mark all read
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </Header>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <EmptyState>
          <Ionicons name="notifications-off-outline" size={48} color={theme.colors.textSecondary} />
          <Text variant="headline" tone="muted">
            No notifications at this moment
          </Text>
          <Text variant="body" tone="muted" align="center">
            We'll notify you about weather alerts, task reminders, and farming insights.
          </Text>
          <Button label="Refresh" variant="outline" onPress={() => refetch()} />
        </EmptyState>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          refreshing={isLoading}
          onRefresh={() => refetch()}
        />
      )}
    </Screen>
  );
}
