import { apiRequest } from '@/services/apiClient';

export type CalendarTask = {
  id: string;
  title: string;
  description: string | null;
  scheduledDate: string;
  period: string;
  durationMinutes: number;
  impact: string;
  completed: boolean;
  completedAt: string | null;
};

export type CalendarResponse = {
  tasks: CalendarTask[];
  dayPlan: CalendarTask[];
  dayReminders?: Array<{
    id: string;
    crop: string;
    plantOn: string;
    kind: string;
    title: string;
    description: string;
  }>;
  markedDates: Record<string, { marked: boolean; dotColor: string; plantingReminder?: boolean }>;
  selectedDate: string;
};

export type CreateTaskPayload = {
  title: string;
  description?: string;
  scheduledDate: string;
  period?: string;
  durationMinutes?: number;
  impact?: string;
};

export const calendarApi = {
  getCalendar(token: string, date?: string) {
    const query = date ? `?date=${date}` : '';
    return apiRequest<CalendarResponse>(`/calendar${query}`, { token });
  },

  createTask(token: string, payload: CreateTaskPayload) {
    return apiRequest<{ task: CalendarTask }>('/calendar/tasks', {
      method: 'POST',
      token,
      body: payload,
    });
  },

  updateTask(token: string, taskId: string, payload: Partial<CreateTaskPayload>) {
    return apiRequest<{ message: string }>(`/calendar/tasks/${taskId}`, {
      method: 'PUT',
      token,
      body: payload,
    });
  },

  deleteTask(token: string, taskId: string) {
    return apiRequest<{ message: string }>(`/calendar/tasks/${taskId}`, {
      method: 'DELETE',
      token,
    });
  },

  markTaskComplete(token: string, taskId: string, completed = true) {
    return apiRequest<{ taskId: string; completed: boolean; message: string }>(`/calendar/tasks/${taskId}/complete`, {
      method: 'POST',
      token,
      body: { completed },
    });
  },

  getSeasonalSuggestions(token: string, params?: { crop?: string; fieldId?: string }) {
    const query = new URLSearchParams();
    if (params?.crop) query.set('crop', params.crop);
    if (params?.fieldId) query.set('fieldId', params.fieldId);
    const qs = query.toString();
    return apiRequest<{
      zone: string;
      zoneLabel: string;
      season: { zone: string; season: string; isRainy: boolean; rainyMonths: number[]; month: number };
      suggestions: Array<{
        crop: string;
        plantingMonths: number[];
        plantingWindowActive: boolean;
        stages: Array<{
          stage: string;
          offsetDays: number;
          dueDate: string | null;
          isDue: boolean;
          isPast: boolean;
        }>;
        fieldId: string | null;
      }>;
    }>(`/calendar/seasonal-suggestions${qs ? `?${qs}` : ''}`, { token });
  },

  listCropWatches(token: string) {
    return apiRequest<{
      watches: Array<{
        id: string;
        crop: string;
        notifyWhenPlantingWindow: boolean;
        lastNotifiedOn: string | null;
      }>;
    }>('/calendar/crop-watches', { token });
  },

  addCropWatch(token: string, payload: { crop: string; notifyWhenPlantingWindow?: boolean }) {
    return apiRequest<{ watch: { id: string; crop: string; notifyWhenPlantingWindow: boolean } }>(
      '/calendar/crop-watches',
      { method: 'POST', token, body: payload },
    );
  },

  removeCropWatch(token: string, id: string) {
    return apiRequest<{ message: string }>(`/calendar/crop-watches/${id}`, {
      method: 'DELETE',
      token,
    });
  },

  setPlantingReminder(
    token: string,
    payload: { notificationId?: number; watchId?: number; crop: string; plantOn: string },
  ) {
    return apiRequest<{
      reminder: { id: string; crop: string; plantOn: string; remind2dAt: string; remindOnAt: string };
      localSchedule: Array<{ id: string; title: string; body: string; triggerAt: string }>;
    }>('/calendar/planting-reminders', {
      method: 'POST',
      token,
      body: payload,
    });
  },
};
