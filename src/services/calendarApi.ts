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
  markedDates: Record<string, { marked: boolean; dotColor: string }>;
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
};
