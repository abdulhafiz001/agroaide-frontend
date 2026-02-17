import { apiRequest } from '@/services/apiClient';

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data: Record<string, any> | null;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

export const notificationApi = {
  getAll(token: string) {
    return apiRequest<NotificationsResponse>('/notifications', {
      method: 'GET',
      token,
    });
  },

  markRead(id: number, token: string) {
    return apiRequest<{ message: string }>(`/notifications/${id}/read`, {
      method: 'PATCH',
      token,
    });
  },

  markAllRead(token: string) {
    return apiRequest<{ message: string }>('/notifications/read-all', {
      method: 'POST',
      token,
    });
  },
};
