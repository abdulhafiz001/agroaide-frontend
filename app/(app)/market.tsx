import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';

import { MarketPriceChart } from '@/components/MarketPriceChart';
import { Chip, Surface, Text } from '@/design-system/components';
import styled from '@/design-system/styled';
import { marketApi, type MarketPrice } from '@/services/marketApi';
import { useAppStore } from '@/store/useAppStore';

const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Container = styled(ScrollView).attrs(({ theme }) => ({
  contentContainerStyle: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
}))``;

const Header = styled.View`
  flex-direction: row;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing.sm}px ${theme.spacing.md}px`};
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

const Section = styled.View`
  margin-top: ${({ theme }) => theme.spacing.lg}px;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

const PriceCard = styled(Surface)`
  flex-direction: row;
  align-items: center;
  gap: 14px;
`;

const TrendBadge = styled.View<{ trend: string }>`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  background-color: ${({ trend }) => {
    if (trend === 'up') return '#d1fae5';
    if (trend === 'down') return '#fde2e2';
    return '#f3f4f6';
  }};
`;

const trendConfig: Record<string, { icon: string; color: string; label: string }> = {
  up: { icon: 'trending-up', color: '#047857', label: 'Rising' },
  down: { icon: 'trending-down', color: '#b91c1c', label: 'Falling' },
  stable: { icon: 'remove-outline', color: '#374151', label: 'Stable' },
};

const formatPrice = (price: number | null | undefined, unit?: string | null) => {
  if (price == null) return 'No price yet';
  const money = '₦' + price.toLocaleString('en-NG');
  return unit ? `${money} / ${unit}` : money;
};

export default function MarketScreen() {
  const theme = useTheme();
  const router = useRouter();
  const token = useAppStore((s) => s.accessToken) ?? '';

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['marketIntel'],
    queryFn: () => marketApi.getMarketIntel(token),
    enabled: Boolean(token),
  });

  const prices = data?.marketPrices ?? [];
  const highlights = data?.highlights ?? [];
  const history = data?.history ?? {};
  const market = data?.market;

  if (isLoading) {
    return (
      <Screen>
        <Header>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text variant="title" style={{ flex: 1 }}>
            Market
          </Text>
        </Header>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text tone="muted">Loading nearest market prices…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text variant="title" style={{ flex: 1 }}>
          Market
        </Text>
        <TouchableOpacity onPress={() => refetch()} hitSlop={12}>
          <Ionicons
            name="refresh"
            size={22}
            color={isRefetching ? theme.colors.textSecondary : theme.colors.primary}
          />
        </TouchableOpacity>
      </Header>

      <Container>
        <View style={{ paddingTop: 8, gap: 6 }}>
          <Text variant="body" tone="muted">
            {data?.disclaimer || 'Crowd-verified prices for the market nearest your farm.'}
          </Text>
          {market ? (
            <Chip
              label={
                market.distanceKm != null
                  ? `${market.name}${market.city ? `, ${market.city}` : ''} · ~${market.distanceKm} km`
                  : `${market.name}${market.city ? `, ${market.city}` : ''}`
              }
              tone="info"
            />
          ) : null}
        </View>

        {highlights.length > 0 && (
          <Section>
            <Text variant="headline">Market highlights</Text>
            <Surface rounded="xl" style={{ gap: 10 }}>
              {highlights.map((h, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color={theme.colors.primary}
                    style={{ marginTop: 2 }}
                  />
                  <Text variant="body" style={{ flex: 1 }}>
                    {h}
                  </Text>
                </View>
              ))}
            </Surface>
          </Section>
        )}

        <Section>
          <Text variant="headline">Price trend</Text>
          <Surface rounded="xl" style={{ paddingVertical: 8 }}>
            <MarketPriceChart history={history} />
          </Surface>
          <Text variant="caption" tone="muted">
            Chart uses your crops at {market?.name || 'the nearest market'}. History updates when prices change
            (checked daily).
          </Text>
        </Section>

        <Section>
          <Text variant="headline">Your crop prices</Text>
          {prices.length === 0 ? (
            <Surface variant="muted" style={{ padding: 24, alignItems: 'center', gap: 8, borderRadius: 16 }}>
              <Ionicons name="pricetag-outline" size={32} color={theme.colors.textSecondary} />
              <Text tone="muted">Add crops to your profile or fields to see market prices.</Text>
            </Surface>
          ) : (
            prices.map((item: MarketPrice, index: number) => {
              const trend = trendConfig[item.trend] || trendConfig.stable;
              const available = item.available !== false && item.price != null;
              return (
                <PriceCard key={`${item.commodity}-${index}`} rounded="xl">
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: `${theme.colors.primary}15`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Ionicons name="leaf" size={22} color={theme.colors.primary} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="headline">{item.commodity}</Text>
                    <Text variant="caption" tone="muted">
                      {item.productName ? `${item.productName} · ` : ''}
                      {item.location}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4, maxWidth: '42%' }}>
                    <Text
                      variant="headline"
                      style={{ fontWeight: '700', textAlign: 'right', fontSize: available ? 16 : 13 }}>
                      {formatPrice(item.price, item.unit)}
                    </Text>
                    {available ? (
                      <TrendBadge trend={item.trend}>
                        <Ionicons name={trend.icon as any} size={14} color={trend.color} />
                        <Text
                          variant="caption"
                          style={{ color: trend.color, fontWeight: '600', fontSize: 11 }}>
                          {trend.label}
                          {item.changePercent != null ? ` ${item.changePercent > 0 ? '+' : ''}${item.changePercent}%` : ''}
                        </Text>
                      </TrendBadge>
                    ) : (
                      <Chip label="No price yet" tone="warning" />
                    )}
                  </View>
                </PriceCard>
              );
            })
          )}
          {data?.source ? (
            <Text variant="caption" tone="muted" align="center" style={{ marginTop: 4 }}>
              {data.source}
              {data.lastSyncedAt
                ? ` · Synced ${new Date(data.lastSyncedAt).toLocaleString()}`
                : ''}
            </Text>
          ) : null}
        </Section>
      </Container>
    </Screen>
  );
}
