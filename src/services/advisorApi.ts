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
};
