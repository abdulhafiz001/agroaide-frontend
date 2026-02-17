import { apiRequest } from '@/services/apiClient';

export const systemApi = {
  syncOfflineBrief(token: string) {
    return apiRequest<{ syncedAt: string; message: string }>('/system/sync-offline', {
      method: 'POST',
      token,
    });
  },

  requestExport(token: string) {
    return apiRequest<{ message: string }>('/system/export-request', {
      method: 'POST',
      token,
    });
  },

  getSupportLinks(token: string) {
    return apiRequest<{
      links: {
        id: string;
        label: string;
        message: string;
      }[];
    }>('/system/support-links', {
      method: 'GET',
      token,
    });
  },
};
