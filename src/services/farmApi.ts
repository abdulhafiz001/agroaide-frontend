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
  boundaryGeojson?: GeoJSON.Polygon | null;
  hasMeasuredBoundary?: boolean;
  totalExpense?: number;
  totalIncome?: number;
  netProfit?: number;
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
    fields?: Array<{
      fieldId: string;
      name: string;
      crop?: string;
      polygon: MapCoordinate[];
      geojson?: GeoJSON.Polygon;
    }>;
  } | null;
  farmSummary: {
    farmName: string;
    farmLocation: string;
    farmSizeM2: number;
  };
};

export type FieldTransaction = {
  id: string;
  farmFieldId: string;
  type: 'EXPENSE' | 'INCOME';
  category: 'SEED' | 'FERTILIZER' | 'LABOR' | 'HARVEST_SALE' | 'OTHER';
  amount: number;
  quantity: number | null;
  unit: string | null;
  saleItem?: string | null;
  categoryOther?: string | null;
  occurredOn: string;
  note: string | null;
  clientUuid?: string | null;
};

export type FieldEconomics = {
  fieldId: string;
  crop: string;
  areaM2: number;
  totals: {
    expense: number;
    income: number;
    netProfit: number;
  };
  costPerM2: number | null;
  netProfitPerM2: number | null;
  byCategory: Array<{ category: string; expense: number; income: number; net: number }>;
};

declare namespace GeoJSON {
  type Position = [number, number] | [number, number, number];
  interface Polygon {
    type: 'Polygon';
    coordinates: Position[][];
  }
}

export const farmApi = {
  getOverview(token: string) {
    return apiRequest<FarmOverviewResponse>('/farm/overview', { token });
  },

  getField(token: string, fieldId: string) {
    return apiRequest<{
      field: FarmField;
      farmSummary: FarmOverviewResponse['farmSummary'];
      map: FarmOverviewResponse['map'];
    }>(`/farm/fields/${fieldId}`, { token });
  },

  addField(token: string, payload: { name: string; crop: string; areaM2?: number; plantedAt?: string; clientUuid?: string }) {
    return apiRequest<{ field: FarmField }>('/farm/fields', {
      method: 'POST',
      token,
      body: payload,
    });
  },

  updateField(token: string, fieldId: string, payload: Record<string, unknown>) {
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

  clearBoundary(token: string, fieldId: string) {
    return apiRequest<{ message: string; field: Partial<FarmField> }>(`/farm/fields/${fieldId}/boundary`, {
      method: 'DELETE',
      token,
    });
  },

  inputEstimate(
    token: string,
    fieldId: string,
    payload?: { rowCm?: number; intraCm?: number; spacingMode?: 'cm' | 'steps' },
  ) {
    return apiRequest<{
      estimate: {
        crop: string;
        areaM2: number;
        areaSource: string;
        spacingMode: string;
        rowCm: number;
        intraCm: number;
        rowSteps: number;
        intraSteps: number;
        population: number;
        seedUnit: string;
        seedKg: number | null;
        seedStands: number | null;
        fertilizers: Array<{ name: string; kg: number; bags50kg: number; kgPerHa: number }>;
        disclaimer: string;
        aiSummary: string;
      };
    }>(`/farm/fields/${fieldId}/input-estimate`, {
      method: 'POST',
      token,
      body: payload ?? {},
      timeoutMs: 60000,
    });
  },

  updateBoundary(
    token: string,
    fieldId: string,
    payload: { geojson: GeoJSON.Polygon; areaM2: number; clientUuid?: string; clientTimestamp?: string },
  ) {
    return apiRequest<{ message: string; field: FarmField }>(`/farm/fields/${fieldId}/boundary`, {
      method: 'PUT',
      token,
      body: payload,
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

  listTransactions(token: string, fieldId: string, params?: { from?: string; to?: string }) {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    const qs = query.toString();
    return apiRequest<{ transactions: FieldTransaction[] }>(
      `/farm/fields/${fieldId}/transactions${qs ? `?${qs}` : ''}`,
      { token },
    );
  },

  createTransaction(
    token: string,
    fieldId: string,
    payload: {
      type: FieldTransaction['type'];
      category: FieldTransaction['category'];
      amount: number;
      quantity?: number;
      unit?: string;
      saleItem?: string;
      categoryOther?: string;
      occurredOn: string;
      note?: string;
      clientUuid?: string;
    },
  ) {
    return apiRequest<{ transaction: FieldTransaction }>(`/farm/fields/${fieldId}/transactions`, {
      method: 'POST',
      token,
      body: payload,
    });
  },

  updateTransaction(token: string, transactionId: string, payload: Record<string, unknown>) {
    return apiRequest<{ transaction: FieldTransaction }>(`/transactions/${transactionId}`, {
      method: 'PUT',
      token,
      body: payload,
    });
  },

  deleteTransaction(token: string, transactionId: string) {
    return apiRequest<{ message: string }>(`/transactions/${transactionId}`, {
      method: 'DELETE',
      token,
    });
  },

  getFieldEconomics(token: string, fieldId: string) {
    return apiRequest<FieldEconomics>(`/farm/fields/${fieldId}/economics`, { token });
  },

  getFarmEconomicsSummary(token: string) {
    return apiRequest<{
      byCrop: Array<{
        crop: string;
        expense: number;
        income: number;
        netProfit: number;
        areaM2: number;
        costPerM2: number | null;
      }>;
      totals: { expense: number; income: number; netProfit: number };
    }>('/farm/economics/summary', { token });
  },

  exportEconomics(token: string, fieldId: string) {
    return apiRequest<{
      downloadUrl?: string;
      content?: string;
      filename: string;
      mimeType: string;
      encoding?: string;
    }>(`/farm/fields/${fieldId}/economics/export?format=pdf`, {
      token,
      timeoutMs: 90000,
    });
  },
};
