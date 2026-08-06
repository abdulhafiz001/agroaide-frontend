import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { ThemePreference } from '@/design-system/theme';
import type { FarmerProfile } from '@/types/farmer';

export type AuthStatus = 'signedOut' | 'authenticating' | 'authenticated';

export type NotificationPreferences = {
  severeWeather: boolean;
  aiInsights: boolean;
  plantingWindowAlerts: boolean;
  fieldBoundaryReminders: boolean;
  /** Always on — cannot be disabled in the UI. */
  diseaseOutbreak: boolean;
};

export type AiAdvisorPreference = {
  detailLevel: 'concise' | 'balanced' | 'deep';
  tone: 'cautious' | 'balanced' | 'bold';
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
  personalDataRevision: number;
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
  clearPersonalDataViews: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      onboardingCompleted: false,
      authStatus: 'signedOut',
      themePreference: 'system',
      offlineModeEnabled: true,
      notificationPreferences: {
        severeWeather: true,
        aiInsights: true,
        plantingWindowAlerts: true,
        fieldBoundaryReminders: true,
        diseaseOutbreak: true,
      },
      aiAdvisorPreference: {
        detailLevel: 'balanced',
        tone: 'balanced',
      },
      personalDataRevision: 0,
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
      setFarmerProfile: (profile) =>
        set((state) => ({
          farmerProfile: profile,
          notificationPreferences: profile.notificationPreferences
            ? { ...state.notificationPreferences, ...profile.notificationPreferences }
            : state.notificationPreferences,
          aiAdvisorPreference: {
            detailLevel:
              profile.aiDetailLevel && ['concise', 'balanced', 'deep'].includes(profile.aiDetailLevel)
                ? profile.aiDetailLevel
                : state.aiAdvisorPreference.detailLevel,
            tone:
              profile.aiTone && ['cautious', 'balanced', 'bold'].includes(profile.aiTone)
                ? profile.aiTone
                : state.aiAdvisorPreference.tone,
          },
        })),
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
      clearPersonalDataViews: () =>
        set((state) => ({ personalDataRevision: state.personalDataRevision + 1 })),
      signOut: () =>
        set({
          authStatus: 'signedOut',
          accessToken: undefined,
          farmerProfile: undefined,
        }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'agroaide-preferences-v2',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== 'object') return persistedState;
        const preferences = { ...(persistedState as Record<string, unknown>) };
        delete preferences.farmerProfile;
        if (preferences.aiAdvisorPreference && typeof preferences.aiAdvisorPreference === 'object') {
          const aiPreferences = { ...(preferences.aiAdvisorPreference as Record<string, unknown>) };
          delete aiPreferences.voiceTips;
          preferences.aiAdvisorPreference = aiPreferences;
        }
        return preferences;
      },
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
      // Only persist user-facing state
      partialize: (state) => ({
        onboardingCompleted: state.onboardingCompleted,
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

