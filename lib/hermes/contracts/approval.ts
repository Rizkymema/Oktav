export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface HermesApprovalRequest {
  id: string;
  taskId: string;
  actionType: string;
  reason: string;
  payload: Record<string, unknown>;
  status: ApprovalStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  responseNote?: string;
}
