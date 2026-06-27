import { randomUUID } from 'node:crypto';

import type { HermesApprovalRequest } from '@/lib/hermes/contracts/approval';
import type { HermesExecutionEvent } from '@/lib/hermes/contracts/event';
import type {
  HermesTaskCreateInput,
  HermesTaskPhase,
  HermesTaskRecord,
  HermesTaskStatus,
} from '@/lib/hermes/contracts/task';
import { TaskStateStore } from '@/lib/hermes/runtime/task-state-store';

interface TaskTransitionInput {
  status: HermesTaskStatus;
  phase: HermesTaskPhase;
  summary: string;
  progress: number;
  log?: string;
  error?: string;
  result?: string;
}

interface ApprovalCreateInput {
  taskId: string;
  actionType: string;
  reason: string;
  payload: Record<string, unknown>;
}

const timestamp = () => new Date().toISOString();

const logLine = (message: string) =>
  `[${new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })}] ${message}`;

const createEvent = (
  taskId: string,
  type: string,
  message: string,
  metadata?: Record<string, unknown>,
): HermesExecutionEvent => ({
  id: randomUUID(),
  taskId,
  type,
  message,
  timestamp: timestamp(),
  metadata,
});

export class InMemoryTaskManager {
  private readonly tasks = new Map<string, HermesTaskRecord>();
  private readonly approvals = new Map<string, HermesApprovalRequest>();

  constructor(private readonly stateStore = new TaskStateStore()) {
    const snapshot = this.stateStore.load();

    for (const task of snapshot.tasks) {
      this.tasks.set(task.id, task);
    }

    for (const approval of snapshot.approvals) {
      this.approvals.set(approval.id, approval);
    }
  }

  createTask(input: HermesTaskCreateInput): HermesTaskRecord {
    const id = input.id || randomUUID();
    const createdAt = timestamp();
    const task: HermesTaskRecord = {
      id,
      goal: input.goal,
      source: input.source,
      prompt: input.prompt,
      category: input.category,
      status: 'planning',
      phase: 'goal_analysis',
      projectId: input.projectId,
      skillId: input.selectedSkill,
      requestedOutputType: input.outputType,
      resolvedModel: input.selectedModel,
      summary: 'Menganalisis tujuan pengguna.',
      progress: 5,
      attemptCount: 0,
      createdAt,
      updatedAt: createdAt,
      logs: [logLine('Task dibuat dan masuk fase analisis tujuan.')],
      events: [],
      subTasks: [],
      outputFiles: [],
      downloadItems: [],
    };

    task.events.push(
      createEvent(task.id, 'task.created', 'Task dibuat.', {
        selectedSkill: input.selectedSkill,
        category: input.category,
      }),
    );

    this.tasks.set(task.id, task);
    this.persist();
    return task;
  }

  getTask(taskId: string): HermesTaskRecord | undefined {
    return this.tasks.get(taskId);
  }

  listPendingApprovals(): HermesApprovalRequest[] {
    return this.listApprovals().filter((approval) => approval.status === 'pending');
  }

  getApproval(approvalId: string): HermesApprovalRequest | undefined {
    return this.approvals.get(approvalId);
  }

  listTasks(): HermesTaskRecord[] {
    return Array.from(this.tasks.values()).sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    );
  }

  transitionTask(taskId: string, input: TaskTransitionInput): HermesTaskRecord {
    const task = this.requireTask(taskId);
    task.status = input.status;
    task.phase = input.phase;
    task.summary = input.summary;
    task.progress = input.progress;
    task.updatedAt = timestamp();
    if (input.error) {
      task.error = input.error;
    }
    if (input.result) {
      task.result = input.result;
    }
    if (input.log) {
      task.logs.push(logLine(input.log));
    }
    task.events.push(
      createEvent(task.id, `task.${input.status}`, input.summary, {
        phase: input.phase,
        progress: input.progress,
      }),
    );
    this.persist();
    return task;
  }

  createApproval(input: ApprovalCreateInput): HermesApprovalRequest {
    const task = this.requireTask(input.taskId);
    const approval: HermesApprovalRequest = {
      id: randomUUID(),
      taskId: input.taskId,
      actionType: input.actionType,
      reason: input.reason,
      payload: input.payload,
      status: 'pending',
      createdAt: timestamp(),
    };

    this.approvals.set(approval.id, approval);
    task.approvalState = 'pending';
    task.updatedAt = timestamp();
    task.events.push(
      createEvent(task.id, 'approval.created', 'Approval dibuat.', {
        actionType: input.actionType,
      }),
    );
    task.logs.push(logLine(`Approval dibuat untuk aksi ${input.actionType}.`));
    this.persist();
    return approval;
  }

  listApprovals(): HermesApprovalRequest[] {
    return Array.from(this.approvals.values()).sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
  }

  respondApproval(
    approvalId: string,
    input: {
      status: HermesApprovalRequest['status'];
      reviewedBy?: string;
      responseNote?: string;
    },
  ): HermesApprovalRequest {
    const approval = this.requireApproval(approvalId);
    approval.status = input.status;
    approval.reviewedAt = timestamp();
    approval.reviewedBy = input.reviewedBy;
    approval.responseNote = input.responseNote;

    const task = this.requireTask(approval.taskId);
    task.approvalState = input.status;
    task.updatedAt = timestamp();
    task.logs.push(logLine(`Approval ${input.status} untuk aksi ${approval.actionType}.`));
    task.events.push(
      createEvent(task.id, `approval.${input.status}`, `Approval ${input.status}.`, {
        actionType: approval.actionType,
      }),
    );

    this.persist();
    return approval;
  }

  assignExecution(
    taskId: string,
    input: {
      agentId?: string;
      skillId?: string;
      requestedOutputType?: string;
      requestedOutputLabel?: string;
      requestedCapability?: string;
      resolvedModel?: string;
    },
  ): HermesTaskRecord {
    const task = this.requireTask(taskId);
    task.agentId = input.agentId ?? task.agentId;
    task.skillId = input.skillId ?? task.skillId;
    task.requestedOutputType = input.requestedOutputType ?? task.requestedOutputType;
    task.requestedOutputLabel = input.requestedOutputLabel ?? task.requestedOutputLabel;
    task.requestedCapability = input.requestedCapability ?? task.requestedCapability;
    task.resolvedModel = input.resolvedModel ?? task.resolvedModel;
    task.updatedAt = timestamp();
    this.persist();
    return task;
  }

  replaceSubTasks(taskId: string, subTasks: HermesTaskRecord['subTasks']): HermesTaskRecord {
    const task = this.requireTask(taskId);
    task.subTasks = subTasks;
    task.updatedAt = timestamp();
    this.persist();
    return task;
  }

  addDownloadItem(taskId: string, item: { label: string; url: string }): HermesTaskRecord {
    const task = this.requireTask(taskId);
    const alreadyExists = task.downloadItems.some(
      (existing) => existing.label === item.label && existing.url === item.url,
    );
    if (alreadyExists) {
      return task;
    }
    task.downloadItems.push(item);
    task.outputFiles.push(item.label);
    task.updatedAt = timestamp();
    task.logs.push(logLine(`Artifact ${item.label} disiapkan.`));
    task.events.push(
      createEvent(task.id, 'task.artifact_ready', `Artifact ${item.label} tersedia.`, item),
    );
    this.persist();
    return task;
  }

  incrementAttempt(taskId: string, reason: string): HermesTaskRecord {
    const task = this.requireTask(taskId);
    task.attemptCount += 1;
    task.status = 'retrying';
    task.phase = 'planning';
    task.updatedAt = timestamp();
    task.logs.push(logLine(reason));
    task.events.push(
      createEvent(task.id, 'task.retrying', reason, {
        attemptCount: task.attemptCount,
      }),
    );
    this.persist();
    return task;
  }

  cancelTask(taskId: string, reason: string): HermesTaskRecord {
    const task = this.requireTask(taskId);
    task.status = 'cancelled';
    task.phase = 'cancelled';
    task.summary = reason;
    task.progress = 100;
    task.updatedAt = timestamp();
    task.logs.push(logLine(reason));
    task.events.push(createEvent(task.id, 'task.cancelled', reason));
    this.persist();
    return task;
  }

  private persist() {
    this.stateStore.save({
      tasks: this.listTasks(),
      approvals: this.listApprovals(),
    });
  }

  private requireTask(taskId: string): HermesTaskRecord {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} tidak ditemukan.`);
    }
    return task;
  }

  private requireApproval(approvalId: string): HermesApprovalRequest {
    const approval = this.approvals.get(approvalId);
    if (!approval) {
      throw new Error(`Approval ${approvalId} tidak ditemukan.`);
    }
    return approval;
  }
}
