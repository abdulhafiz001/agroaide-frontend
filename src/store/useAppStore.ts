import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { ThemePreference } from '@/design-system/theme';
import type { FarmerProfile } from '@/types/farmer';

export type AuthStatus = 'signedOut' | 'authenticating' | 'authenticated';

export type NotificationPreferences = {
  severeWeather: boolean;
  marketMovers: boolean;
  aiInsights: boolean;
  communityMentions: boolean;
};

export type AiAdvisorPreference = {
  detailLevel: 'concise' | 'balanced' | 'deep';
  tone: 'cautious' | 'balanced' | 'bold';
  voiceTips: boolean;
};

interface AppState {
  hydrated: boolean;
  onboardingCompleted: boolean;
  authStatus: AuthStatus;
  accessToken?: string;
  farmerProfile?: FarmerProfile;
  themePreference: ThemePreference;
  lastSyncISO?: string;
  offlineModeEnabled: boolean;
  notificationPreferences: NotificationPreferences;
  aiAdvisorPreference: AiAdvisorPreference;
  completeOnboarding: () => void;
  setThemePreference: (preference: ThemePreference) => void;
  setAuthState: (state: { status: AuthStatus; token?: string }) => void;
  setFarmerProfile: (profile: FarmerProfile) => void;
  updateFarmerProfile: (profile: Partial<FarmerProfile>) => void;
  signOut: () => void;
  markHydrated: () => void;
  setOfflineMode: (enabled: boolean) => void;
  setLastSync: (date?: string) => void;
  updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void;
  updateAiAdvisorPreference: (prefs: Partial<AiAdvisorPreference>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      onboardingCompleted: false,
      authStatus: 'signedOut',
      themePreference: 'system',
      offlineModeEnabled: false,
      notificationPreferences: {
        severeWeather: true,
        marketMovers: true,
        aiInsights: true,
        communityMentions: false,
      },
      aiAdvisorPreference: {
        detailLevel: 'balanced',
        tone: 'balanced',
        voiceTips: false,
      },
      completeOnboarding: () => set({ onboardingCompleted: true }),
      setThemePreference: (preference) => {
        const currentProfile = get().farmerProfile;
        set({
          themePreference: preference,
          farmerProfile: currentProfile
            ? {
                ...currentProfile,
                preferredTheme:
                  preference === 'system' ? currentProfile.preferredTheme : (preference as FarmerProfile['preferredTheme']),
              }
            : currentProfile,
        });
      },
      setAuthState: ({ status, token }) => set({ authStatus: status, accessToken: token }),
      setFarmerProfile: (profile) => set({ farmerProfile: profile }),
      updateFarmerProfile: (profile) =>
        set((state) => ({
          farmerProfile: state.farmerProfile ? { ...state.farmerProfile, ...profile } : state.farmerProfile,
        })),
      setOfflineMode: (enabled) => set({ offlineModeEnabled: enabled }),
      setLastSync: (date) => set({ lastSyncISO: date }),
      updateNotificationPreferences: (prefs) =>
        set((state) => ({
          notificationPreferences: { ...state.notificationPreferences, ...prefs },
        })),
      updateAiAdvisorPreference: (prefs) =>
        set((state) => ({
          aiAdvisorPreference: { ...state.aiAdvisorPreference, ...prefs },
        })),
      signOut: () =>
        set({
          authStatus: 'signedOut',
          accessToken: undefined,
        }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'agroaide-store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
      // Only persist user-facing state
      partialize: (state) => ({
        onboardingCompleted: state.onboardingCompleted,
        authStatus: state.authStatus,
        accessToken: state.accessToken,
        farmerProfile: state.farmerProfile,
        themePreference: state.themePreference,
        lastSyncISO: state.lastSyncISO,
        offlineModeEnabled: state.offlineModeEnabled,
        notificationPreferences: state.notificationPreferences,
        aiAdvisorPreference: state.aiAdvisorPreference,
      }),
    },
  ),
);

export const useStoreHydration = () => useAppStore((state) => state.hydrated);

