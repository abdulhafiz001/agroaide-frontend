import { apiRequest } from '@/services/apiClient';

export type MarketPrice = {
  commodity: string;
  pricePerTon: number;
  pricePerBag?: number;
  location: string;
  trend: 'up' | 'down' | 'stable';
};

export type MarketIntelResponse = {
  marketPrices: MarketPrice[];
  highlights: string[];
  lastUpdated: string;
  source: string;
};

export const marketApi = {
  getMarketIntel(token: string) {
    return apiRequest<MarketIntelResponse>('/market/intel', { token });
  },

  getNearbyFarmers(token: string) {
    return apiRequest<{
      farmers: any[];
      message: string;
    }>('/market/nearby-farmers', { token });
  },

  getResources(token: string) {
    return apiRequest<{
      resources: {
        id: string;
        name: string;
        description: string;
      }[];
    }>('/market/resources', { token });
  },
};
