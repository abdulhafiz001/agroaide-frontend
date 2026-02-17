import type { FarmerProfile } from '@/types/farmer';

export const defaultFarmerProfile: FarmerProfile = {
  id: 'farmer_01',
  fullName: 'Adaeze Okonkwo',
  email: 'adaeze.okonkwo@example.com',
  phoneNumber: '+2348031234567',
  farmName: 'GreenRise Farms',
  farmLocation: 'Nsukka, Enugu',
  farmSizeHectares: 4.5,
  crops: ['Maize', 'Cassava', 'Tomatoes'],
  experienceLevel: 'intermediate',
  soilType: 'Loamy',
  irrigationAccess: 'drip',
  avatarColor: '#f97316',
  preferredTheme: 'light',
};

export const weatherForecast = [
  { day: 'Today', condition: 'Partly Cloudy', high: 32, low: 23, precipitation: 0.2 },
  { day: 'Tue', condition: 'Thunderstorms', high: 29, low: 22, precipitation: 0.8 },
  { day: 'Wed', condition: 'Sunny', high: 34, low: 21, precipitation: 0.1 },
  { day: 'Thu', condition: 'Showers', high: 30, low: 22, precipitation: 0.45 },
  { day: 'Fri', condition: 'Mostly Sunny', high: 33, low: 23, precipitation: 0.05 },
  { day: 'Sat', condition: 'Showers', high: 30, low: 24, precipitation: 0.4 },
  { day: 'Sun', condition: 'Cloudy', high: 31, low: 23, precipitation: 0.25 },
];

export const soilHealthMetrics = [
  { label: 'Soil Moisture', value: 62, unit: '%' },
  { label: 'Nitrogen Level', value: 78, unit: '%' },
  { label: 'PH Balance', value: 6.5, unit: 'pH' },
];

export const marketPrices = [
  { commodity: 'Maize (White)', pricePerBag: 34500, location: 'Mile 12, Lagos', trend: 'up' },
  { commodity: 'Cassava (Fresh tubers)', pricePerBag: 18500, location: 'Dawanau, Kano', trend: 'down' },
  { commodity: 'Tomatoes (Basket)', pricePerBag: 41000, location: 'Onitsha Main Market', trend: 'up' },
  { commodity: 'Rice (Paddy)', pricePerBag: 52000, location: 'Sabo, Kaduna', trend: 'stable' },
  { commodity: 'Yam (Tuber)', pricePerBag: 28000, location: 'Aba Market', trend: 'up' },
];

export const aiInsights = [
  {
    id: 'insight-1',
    title: 'Cassava Mosaic risk moderate',
    description: 'Monitor for whitefly populations over the next 14 days.',
    severity: 'medium',
  },
  {
    id: 'insight-2',
    title: 'Optimal maize fertilization window',
    description: 'Moisture forecast supports NPK 15-15-15 application on Wednesday.',
    severity: 'positive',
  },
];

export const dailyTasks = [
  { id: 'task-1', title: 'Inspect maize for armyworm', period: 'Morning', durationMinutes: 40, impact: 'high' },
  { id: 'task-2', title: 'Flush drip lines', period: 'Afternoon', durationMinutes: 30, impact: 'medium' },
  { id: 'task-3', title: 'Update field journal', period: 'Evening', durationMinutes: 15, impact: 'low' },
];

