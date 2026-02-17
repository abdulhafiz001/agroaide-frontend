import { apiRequest } from '@/services/apiClient';

export type DashboardSnapshotResponse = {
  user: {
    name: string;
    farmName: string;
  };
  weatherAlert: {
    severity: string;
    title: string;
    advice: string;
    gradient: [string, string];
  };
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
    temperature: number;
    humidity: number;
    condition: string;
    icon: string;
  };
};

export const dashboardApi = {
  getSnapshot(token: string) {
    return apiRequest<DashboardSnapshotResponse>('/dashboard/snapshot', { token });
  },
};
