import { apiRequest } from '@/services/apiClient';

export type DiseaseInfo = {
  name: string;
  scientificName?: string;
  symptoms: string[];
  cause: string;
  severity: 'mild' | 'moderate' | 'severe';
  spreadRisk: 'low' | 'medium' | 'high';
};

export type ProductRecommendation = {
  name: string;
  type: 'fungicide' | 'pesticide' | 'fertilizer' | 'other';
  usage: string;
};

export type ScanResult = {
  condition: 'healthy' | 'good' | 'fair' | 'poor' | 'diseased' | 'critical' | 'unknown';
  conditionLabel: string;
  confidencePercent: number;
  summary: string;
  details?: {
    plantsVisible: string;
    growthStage: string;
    overallVigor: string;
  } | null;
  disease?: DiseaseInfo | null;
  recommendations: {
    immediate: string[];
    products: ProductRecommendation[];
    prevention: string[];
    longTerm: string[];
  };
  personalizedNote: string;
  plantIdentification?: {
    scientificName: string;
    commonNames: string[];
    score: number;
  } | null;
};

export type ScanHistoryItem = {
  id: string;
  date: string;
  condition: string;
  fieldName?: string;
  fieldCrop?: string;
  summary?: string;
  imagePath?: string;
};

export const farmScanApi = {
  analyzeImage(token: string, imageBase64: string, farmFieldId?: string) {
    return apiRequest<{ analysis: ScanResult }>('/farm/analyze-image', {
      method: 'POST',
      token,
      timeoutMs: 120000,
      body: {
        imageBase64,
        farmFieldId: farmFieldId ? parseInt(farmFieldId, 10) : undefined,
      },
    });
  },

  getHistory(token: string) {
    return apiRequest<{ history: ScanHistoryItem[] }>('/farm/scan-history', {
      method: 'GET',
      token,
    });
  },
};
