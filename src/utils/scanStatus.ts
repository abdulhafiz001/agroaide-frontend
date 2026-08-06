export type ScanVerificationStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'needs_review'
  | 'verified'
  | 'rejected'
  | 'failed';

export function canPollScan(status: ScanVerificationStatus): boolean {
  return status === 'queued' || status === 'processing' || status === 'needs_review';
}

export function getScanStatusMessage(status: ScanVerificationStatus): string {
  const messages: Record<ScanVerificationStatus, string> = {
    queued: 'Scan queued',
    processing: 'Analysis in progress',
    completed: 'Analysis complete',
    needs_review: 'Waiting for expert review',
    verified: 'Verified by an expert',
    rejected: 'Result needs a new photo',
    failed: 'Analysis could not be completed',
  };
  return messages[status];
}

export function normalizeFeedbackReason(value: string): string | undefined {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized || undefined;
}
