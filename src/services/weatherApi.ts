import { apiRequest } from '@/services/apiClient';

export type WeatherForecastResponse = {
  current: {
    temperature: number;
    humidity: number;
    apparentTemperature: number;
    precipitation: number;
    weatherCode: number;
    windSpeed: number;
    isDay: boolean;
    condition: string;
    icon: string;
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
    date: string;
    high: number;
    low: number;
    precipitation: number;
    precipitationProbability: number;
    condition: string;
    icon: string;
    uvIndex: number;
  }[];
  hourly: {
    time: string;
    temperature: number;
    precipitationProbability: number;
    condition: string;
  }[];
  alerts: {
    severity: string;
    title: string;
    advice: string;
    gradient: [string, string];
  }[];
};

export const weatherApi = {
  getForecast(token: string) {
    return apiRequest<WeatherForecastResponse>('/weather/forecast', { token });
  },
};
