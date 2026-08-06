import { apiRequest } from '@/services/apiClient';

export type AdvisorMessage = {
  id: string;
  text: string;
  fromAgent: boolean;
  timestamp?: string;
};

export type AdvisorRequestPreferences = {
  detailLevel: 'concise' | 'balanced' | 'deep';
  tone: 'cautious' | 'balanced' | 'bold';
  language: string;
};

export const advisorApi = {
  chat(message: string, token: string, preferences: AdvisorRequestPreferences) {
    return apiRequest<{ reply: string }>('/advisor/chat', {
      method: 'POST',
      token,
      body: { message, ...preferences },
      timeoutMs: 60000,
    });
  },

  getHistory(token: string) {
    return apiRequest<{ messages: AdvisorMessage[] }>('/advisor/history', {
      method: 'GET',
      token,
    });
  },

  getSuggestions(token: string) {
    return apiRequest<{ suggestions: string[] }>('/advisor/suggestions', {
      method: 'GET',
      token,
    });
  },

  transcribeVoice(audioBase64: string, token: string, preferences: AdvisorRequestPreferences) {
    return apiRequest<{ success: boolean; text?: string; error?: string }>('/advisor/transcribe', {
      method: 'POST',
      token,
      timeoutMs: 30000,
      body: { audioBase64, ...preferences, languageHint: preferences.language },
    });
  },
};
