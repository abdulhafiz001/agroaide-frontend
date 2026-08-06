import { apiRequest } from '@/services/apiClient';

export type DashboardSnapshotResponse = {
  user: {
    id?: string;
    name: string;
    farmName: string;
  };
  profileComplete?: boolean;
  hasFarmLocation?: boolean;
  weatherAlert: {
    severity: string;
    title: string;
    advice: string;
    gradient: [string, string];
  } | null;
  priorityTask: {
    title: string;
    progress: number;
    estimatedImpact: string;
    actionItems: string[];
  };
  soilHealth: {
    label: string;
    value: number;
    unit: string;
    icon: string;
    tone: string;
  }[];
  weatherForecast: {
    day: string;
    high: number;
    low: number;
    precipitation: number;
    icon: string;
    condition: string;
  }[];
  aiInsights: {
    id: string;
    title: string;
    description: string;
  }[];
  unreadNotifications: number;
  currentWeather: {
    temperature?: number;
    humidity?: number;
    condition?: string;
    icon?: string;
  };
  outbreakAlerts?: {
    id: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    createdAt?: string;
  }[];
};

export const dashboardApi = {
  getSnapshot(token: string) {
    return apiRequest<DashboardSnapshotResponse>('/dashboard/snapshot', { token });
  },

  getAiInsights(token: string) {
    return apiRequest<{ aiInsights: DashboardSnapshotResponse['aiInsights'] }>('/dashboard/ai-insights', { token });
  },
};
