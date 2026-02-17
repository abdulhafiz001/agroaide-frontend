import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';

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

const formatPrice = (price: number) => {
  return '₦' + price.toLocaleString('en-NG');
};

export default function MarketScreen() {
  const theme = useTheme();
  const token = useAppStore((s) => s.accessToken) ?? '';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['marketIntel'],
    queryFn: () => marketApi.getMarketIntel(token),
    enabled: Boolean(token),
  });

  const resourcesQuery = useQuery({
    queryKey: ['marketResources'],
    queryFn: () => marketApi.getResources(token),
    enabled: Boolean(token),
  });

  const prices = data?.marketPrices ?? [];
  const highlights = data?.highlights ?? [];
  const resources = resourcesQuery.data?.resources ?? [];

  if (isLoading) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text tone="muted">Fetching market intelligence...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Container>
        <View style={{ paddingTop: 16, gap: 4 }}>
          <Text variant="display">Market</Text>
          <Text variant="body" tone="muted">AI-estimated crop prices for your farm</Text>
        </View>

        {highlights.length > 0 && (
          <Section>
            <Text variant="headline">Market highlights</Text>
            <Surface rounded="xl" style={{ gap: 10 }}>
              {highlights.map((h, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <Ionicons name="information-circle-outline" size={18} color={theme.colors.primary} style={{ marginTop: 2 }} />
                  <Text variant="body" style={{ flex: 1 }}>{h}</Text>
                </View>
              ))}
            </Surface>
          </Section>
        )}

        <Section>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="headline">Your crop prices</Text>
            <Chip label="Per ton" tone="info" />
          </View>
          {prices.length === 0 ? (
            <Surface variant="muted" style={{ padding: 24, alignItems: 'center', gap: 8, borderRadius: 16 }}>
              <Ionicons name="pricetag-outline" size={32} color={theme.colors.textSecondary} />
              <Text tone="muted">No price data available. Add crops to your profile to see estimates.</Text>
            </Surface>
          ) : (
            prices.map((item: MarketPrice, index: number) => {
              const trend = trendConfig[item.trend] || trendConfig.stable;
              return (
                <PriceCard key={index} rounded="xl">
                  <View style={{
                    width: 44, height: 44, borderRadius: 22,
                    backgroundColor: `${theme.colors.primary}15`,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name="leaf" size={22} color={theme.colors.primary} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="headline">{item.commodity}</Text>
                    <Text variant="caption" tone="muted">{item.location}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text variant="headline" style={{ fontWeight: '700' }}>
                      {formatPrice(item.pricePerTon)}
                    </Text>
                    <TrendBadge trend={item.trend}>
                      <Ionicons name={trend.icon as any} size={14} color={trend.color} />
                      <Text variant="caption" style={{ color: trend.color, fontWeight: '600', fontSize: 11 }}>
                        {trend.label}
                      </Text>
                    </TrendBadge>
                  </View>
                </PriceCard>
              );
            })
          )}
          {data?.source && (
            <Text variant="caption" tone="muted" align="center" style={{ marginTop: 4 }}>
              {data.source} - Updated {data.lastUpdated ? new Date(data.lastUpdated).toLocaleDateString() : 'today'}
            </Text>
          )}
        </Section>

        {resources.length > 0 && (
          <Section>
            <Text variant="headline">Resources</Text>
            {resources.map((r) => (
              <Surface key={r.id} rounded="lg" style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Ionicons name="book-outline" size={20} color={theme.colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text variant="body" style={{ fontWeight: '600' }}>{r.name}</Text>
                  <Text variant="caption" tone="muted">{r.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
              </Surface>
            ))}
          </Section>
        )}
      </Container>
    </Screen>
  );
}
