import { apiRequest } from '@/services/apiClient';
import type { ScanVerificationStatus } from '@/utils/scanStatus';

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
  conditionLabel?: string;
  diseaseName?: string | null;
  fieldName?: string;
  fieldCrop?: string;
  summary?: string;
  confidencePercent?: number | null;
  imagePath?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  status?: ScanVerificationStatus;
  verificationStatus?: ScanVerificationStatus;
  processingState?: 'queued' | 'processing' | 'completed' | 'failed';
  verificationState?: string;
  safeErrorCode?: string | null;
  verifiedAt?: string | null;
  feedback?: { accurate: boolean; reason?: string | null } | null;
};

export type ScanDetail = ScanHistoryItem & {
  analysis?: ScanResult | null;
  farmFieldId?: string | null;
};

/** True when the payload is a real completed analysis (not [] / null / incomplete). */
export function isSuccessfulScanResult(analysis: unknown): analysis is ScanResult {
  if (!analysis || typeof analysis !== 'object' || Array.isArray(analysis)) {
    return false;
  }
  const value = analysis as Partial<ScanResult>;
  return Boolean(value.condition && typeof value.summary === 'string' && value.summary.length > 0);
}

function normalizeScanStatus(scan: ScanHistoryItem): ScanVerificationStatus {
  if (scan.processingState === 'queued' || scan.processingState === 'processing' || scan.processingState === 'failed') {
    return scan.processingState;
  }

  switch (scan.verificationState) {
    case 'expert_verified':
      return 'verified';
    case 'needs_retake':
      return 'rejected';
    case 'disputed':
      return 'needs_review';
    case 'pending_review':
    case 'auto_verified':
    default:
      // Kindwise research-backed scans complete without an expert wait.
      return 'completed';
  }
}

function normalizeScan<T extends ScanHistoryItem>(scan: T): T {
  const status = normalizeScanStatus(scan);
  return { ...scan, status, verificationStatus: status };
}

export const farmScanApi = {
  async analyzeImage(token: string, imageBase64: string, farmFieldId?: string) {
    const response = await apiRequest<{ scanId: string; scan: ScanDetail }>('/farm/scans', {
      method: 'POST',
      token,
      timeoutMs: 120000,
      body: {
        imageBase64,
        farmFieldId: farmFieldId ? parseInt(farmFieldId, 10) : undefined,
      },
    });
    const scan = normalizeScan(response.scan);
    return {
      scanId: response.scanId,
      status: scan.status!,
      analysis: isSuccessfulScanResult(scan.analysis) ? scan.analysis : null,
    };
  },

  async getHistory(token: string) {
    const response = await apiRequest<{ history: ScanHistoryItem[] }>('/farm/scan-history', {
      method: 'GET',
      token,
    });
    return { history: response.history.map(normalizeScan) };
  },

  async getScan(token: string, scanId: string) {
    const response = await apiRequest<{ scan: ScanDetail }>(`/farm/scans/${scanId}`, {
      method: 'GET',
      token,
    });
    const scan = normalizeScan(response.scan);
    return {
      scan: {
        ...scan,
        analysis: isSuccessfulScanResult(scan.analysis) ? scan.analysis : null,
      },
    };
  },

  async getScanStatus(token: string, scanId: string) {
    return this.getScan(token, scanId);
  },

  submitFeedback(token: string, scanId: string, payload: { accurate: boolean; reason?: string }) {
    return apiRequest<{ message: string; scan: ScanDetail }>(`/farm/scans/${scanId}/feedback`, {
      method: 'POST',
      token,
      body: {
        verdict: payload.accurate ? 'correct' : 'incorrect',
        comment: payload.reason,
      },
    });
  },

  deleteScan(token: string, scanId: string) {
    return apiRequest<{ message: string }>(`/farm/scan-history/${scanId}`, {
      method: 'DELETE',
      token,
    });
  },
};
