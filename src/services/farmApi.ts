import { apiRequest } from '@/services/apiClient';

type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export type FarmField = {
  id: string;
  name: string;
  crop: string;
  area: number;
  health: number;
  moisture: number;
  daysSincePlanting: number | null;
  status: string;
  plantedAt: string | null;
};

export type JournalEntry = {
  id: string;
  date: string;
  note: string;
  type: string;
  fieldName?: string;
};

export type FarmOverviewResponse = {
  fields: FarmField[];
  journal: JournalEntry[];
  map: {
    center: MapCoordinate;
    polygon: MapCoordinate[];
  };
  farmSummary: {
    farmName: string;
    farmLocation: string;
    farmSizeHectares: number;
  };
};

export const farmApi = {
  getOverview(token: string) {
    return apiRequest<FarmOverviewResponse>('/farm/overview', { token });
  },

  addField(token: string, payload: { name: string; crop: string; areaHectares?: number; plantedAt?: string }) {
    return apiRequest<{ field: FarmField }>('/farm/fields', {
      method: 'POST',
      token,
      body: payload,
    });
  },

  updateField(token: string, fieldId: string, payload: Record<string, any>) {
    return apiRequest<{ message: string; field: FarmField }>(`/farm/fields/${fieldId}`, {
      method: 'PUT',
      token,
      body: payload,
    });
  },

  deleteField(token: string, fieldId: string) {
    return apiRequest<{ message: string }>(`/farm/fields/${fieldId}`, {
      method: 'DELETE',
      token,
    });
  },

  addJournalEntry(token: string, payload: { note: string; type?: string; farmFieldId?: number }) {
    return apiRequest<{ entry: JournalEntry }>('/farm/journal', {
      method: 'POST',
      token,
      body: payload,
    });
  },

  updateJournalEntry(token: string, entryId: string, payload: { note?: string; type?: string }) {
    return apiRequest<{ message: string }>(`/farm/journal/${entryId}`, {
      method: 'PUT',
      token,
      body: payload,
    });
  },

  deleteJournalEntry(token: string, entryId: string) {
    return apiRequest<{ message: string }>(`/farm/journal/${entryId}`, {
      method: 'DELETE',
      token,
    });
  },
};
