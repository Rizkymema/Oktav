import type { HermesApprovalRequest } from '@/lib/hermes/contracts/approval';
import { InMemoryTaskManager } from '@/lib/hermes/core/task-manager';
import { EventBus } from '@/lib/hermes/runtime/event-bus';

export class ApprovalManager {
  constructor(
    private readonly taskManager: InMemoryTaskManager,
    private readonly eventBus: EventBus,
  ) {}

  request(input: {
    taskId: string;
    actionType: string;
    reason: string;
    payload: Record<string, unknown>;
  }): HermesApprovalRequest {
    const approval = this.taskManager.createApproval(input);
    this.eventBus.emit('approval.created', approval);
    return approval;
  }

  respond(
    approvalId: string,
    input: {
      status: HermesApprovalRequest['status'];
      reviewedBy?: string;
      responseNote?: string;
    },
  ) {
    const approval = this.taskManager.respondApproval(approvalId, input);
    this.eventBus.emit(`approval.${approval.status}`, approval);
    return approval;
  }

  listPending() {
    return this.taskManager.listPendingApprovals();
  }

  listAll() {
    return this.taskManager.listApprovals();
  }
}
