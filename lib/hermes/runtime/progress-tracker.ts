import type { HermesTaskPhase, HermesTaskStatus } from '@/lib/hermes/contracts/task';
import type { InMemoryTaskManager } from '@/lib/hermes/core/task-manager';
import type { EventBus } from '@/lib/hermes/runtime/event-bus';
import type { AuditLogger } from '@/lib/hermes/runtime/audit-logger';

interface ProgressUpdateInput {
  status: HermesTaskStatus;
  phase: HermesTaskPhase;
  summary: string;
  progress: number;
  log?: string;
  error?: string;
  result?: string;
}

export class ProgressTracker {
  constructor(
    private readonly taskManager: InMemoryTaskManager,
    private readonly eventBus: EventBus,
    private readonly auditLogger: AuditLogger,
  ) {}

  mark(taskId: string, input: ProgressUpdateInput) {
    const task = this.taskManager.transitionTask(taskId, input);
    this.auditLogger.write('task.progress', input.summary, {
      taskId,
      status: input.status,
      phase: input.phase,
      progress: input.progress,
    });
    this.eventBus.emit('task.progress', task);
    return task;
  }
}
