import { apiRequest } from '@/services/apiClient';

export type HeatmapPoint = {
  latitude: number;
  longitude: number;
  disease: string;
  count: number;
  date: string;
};

export type OutbreakAlert = {
  id: string;
  title: string;
  message: string;
  data: {
    disease: string;
    reportCount: number;
    centerLat: number;
    centerLng: number;
  };
  createdAt: string;
};

export const outbreakApi = {
  getHeatmap(token: string) {
    return apiRequest<{ points: HeatmapPoint[] }>('/outbreak/heatmap', {
      method: 'GET',
      token,
    });
  },

  getAlerts(token: string) {
    return apiRequest<{ alerts: OutbreakAlert[] }>('/outbreak/alerts', {
      method: 'GET',
      token,
    });
  },
};
