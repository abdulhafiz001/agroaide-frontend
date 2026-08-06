export type ScanVerificationStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'needs_review'
  | 'verified'
  | 'rejected'
  | 'failed';

export function canPollScan(status: ScanVerificationStatus): boolean {
  // Do not keep polling on needs_review — Kindwise scans complete as auto_verified.
  return status === 'queued' || status === 'processing';
}

export function getScanStatusMessage(status: ScanVerificationStatus): string {
  const messages: Record<ScanVerificationStatus, string> = {
    queued: 'Scan queued',
    processing: 'Analysis in progress',
    completed: 'Analysis complete',
    needs_review: 'Analysis complete',
    verified: 'Analysis complete',
    rejected: 'Result needs a new photo',
    failed: 'Analysis could not be completed',
  };
  return messages[status];
}

export function normalizeFeedbackReason(value: string): string | undefined {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized || undefined;
}
