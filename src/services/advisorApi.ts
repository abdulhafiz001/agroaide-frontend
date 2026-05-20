import { apiRequest } from '@/services/apiClient';

export const advisorApi = {
  chat(message: string, token: string) {
    return apiRequest<{ reply: string }>('/advisor/chat', {
      method: 'POST',
      token,
      body: { message },
    });
  },

  getSuggestions(token: string) {
    return apiRequest<{ suggestions: string[] }>('/advisor/suggestions', {
      method: 'GET',
      token,
    });
  },

  transcribeVoice(audioBase64: string, token: string, languageHint?: string) {
    return apiRequest<{ success: boolean; text?: string; error?: string }>('/advisor/transcribe', {
      method: 'POST',
      token,
      timeoutMs: 30000,
      body: { audioBase64, languageHint },
    });
  },
};
