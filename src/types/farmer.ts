export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type SupportedLanguage = 'en' | 'ha' | 'yo' | 'pcm';

export interface FarmerProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  farmName: string;
  farmLocation: string;
  farmLatitude: number | null;
  farmLongitude: number | null;
  farmSizeM2: number;
  crops: string[];
  experienceLevel: ExperienceLevel;
  soilType: string;
  irrigationAccess: 'rain-fed' | 'drip' | 'sprinkler' | 'flood';
  avatarColor: string;
  preferredTheme: 'light' | 'dark' | 'field';
  preferredLanguage: SupportedLanguage;
  aiDetailLevel?: 'concise' | 'balanced' | 'deep';
  aiTone?: 'cautious' | 'balanced' | 'bold';
  aiVoiceTips?: boolean;
  notificationPreferences?: {
    severeWeather: boolean;
    aiInsights: boolean;
    plantingWindowAlerts?: boolean;
    fieldBoundaryReminders?: boolean;
    diseaseOutbreak?: boolean;
  };
}

