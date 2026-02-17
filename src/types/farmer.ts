export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface FarmerProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  farmName: string;
  farmLocation: string;
  farmLatitude: number | null;
  farmLongitude: number | null;
  farmSizeHectares: number;
  crops: string[];
  experienceLevel: ExperienceLevel;
  soilType: string;
  irrigationAccess: 'rain-fed' | 'drip' | 'sprinkler' | 'flood';
  avatarColor: string;
  preferredTheme: 'light' | 'dark' | 'field';
}

