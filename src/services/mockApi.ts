import { subDays, addDays } from 'date-fns';

import { aiInsights, dailyTasks, defaultFarmerProfile, marketPrices, soilHealthMetrics, weatherForecast } from '@/data/mockData';
import type { FarmerProfile } from '@/types/farmer';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface AuthResponse {
  token: string;
  profile: FarmerProfile;
}

export const mockAuthApi = {
  async login(email: string, _password: string): Promise<AuthResponse> {
    await delay(600);
    return {
      token: 'mock-token-123',
      profile: {
        ...defaultFarmerProfile,
        email,
      },
    };
  },
  async register(payload: Partial<FarmerProfile>): Promise<AuthResponse> {
    await delay(1200);
    return {
      token: 'mock-token-registered',
      profile: {
        ...defaultFarmerProfile,
        ...payload,
        id: 'farmer_registered',
      },
    };
  },
};

export const mockDashboardApi = {
  async getSnapshot() {
    await delay(400);
    return {
      weatherAlert: {
        active: true,
        title: 'Severe thunderstorms expected in 18 hrs',
        advice: 'Secure irrigation equipment and postpone fertilizer application.',
        probability: 0.72,
      },
      priorityTask: {
        title: 'Mulch tomato beds before noon',
        progress: 48,
        actionItems: ['Assign 2 laborers', 'Prepare organic mulch', 'Log completion in journal'],
        estimatedImpact: 'Prevents moisture loss ahead of heatwave.',
      },
      soilHealth: soilHealthMetrics,
      weatherForecast,
      aiInsights,
    };
  },
};

export const mockFarmApi = {
  async getFarmOverview() {
    await delay(500);
    return {
      fields: [
        { id: 'field-1', name: 'North Block', crop: 'Maize', area: 1.8, health: 82, moisture: 68 },
        { id: 'field-2', name: 'Cassava Ridge', crop: 'Cassava', area: 1.2, health: 77, moisture: 54 },
        { id: 'field-3', name: 'Tomato Valley', crop: 'Tomatoes', area: 1.5, health: 71, moisture: 61 },
      ],
      journal: [
        {
          id: 'entry-1',
          date: subDays(new Date(), 1).toISOString(),
          note: 'Observed mild nutrient deficiency on maize Block 1.',
          type: 'observation',
        },
        {
          id: 'entry-2',
          date: subDays(new Date(), 3).toISOString(),
          note: 'Applied foliar feed on tomatoes.',
          type: 'action',
        },
      ],
    };
  },
};

export const mockCalendarApi = {
  async getCalendar() {
    await delay(500);
    return {
      optimalWindows: [
        { date: addDays(new Date(), 1).toISOString(), activity: 'Foliar spray', crop: 'Tomatoes' },
        { date: addDays(new Date(), 3).toISOString(), activity: 'Irrigation boost', crop: 'Maize' },
      ],
      dayPlan: dailyTasks,
    };
  },
};

export const mockMarketApi = {
  async getMarketIntel() {
    await delay(350);
    return {
      marketPrices,
      highlights: [
        'Maize demand surging in Lagos due to feed mill restocking.',
        'Tomato prices trending upward with Ramadan demand.',
      ],
    };
  },
};

