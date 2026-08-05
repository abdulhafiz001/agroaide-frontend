import { apiRequest } from '@/services/apiClient';

export type MarketPrice = {
  commodity: string;
  productName?: string | null;
  price: number | null;
  /** @deprecated use price — kept for older UI paths */
  pricePerTon?: number | null;
  unit?: string | null;
  currency?: string;
  location: string;
  trend: 'up' | 'down' | 'stable';
  changePercent?: number | null;
  available?: boolean;
  confidence?: string | null;
};

export type MarketIntelResponse = {
  market?: {
    id: number;
    name: string;
    area?: string | null;
    city?: string | null;
    state?: string | null;
    distanceKm?: number | null;
  };
  marketPrices: MarketPrice[];
  history?: Record<string, { date: string; price: number }[]>;
  highlights: string[];
  lastUpdated: string;
  lastSyncedAt?: string;
  source: string;
  disclaimer?: string;
};

export const marketApi = {
  getMarketIntel(token: string, crop?: string) {
    const qs = crop ? `?crop=${encodeURIComponent(crop)}` : '';
    return apiRequest<MarketIntelResponse>(`/market/intel${qs}`, {
      token,
      timeoutMs: 45000,
    });
  },
};
