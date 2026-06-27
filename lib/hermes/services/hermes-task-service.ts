import type { HermesTaskCategory } from '@/lib/hermes/contracts/task';
import type { HermesRuntime } from '@/lib/hermes/index';

interface SubmitTaskInput {
  id?: string;
  goal: string;
  prompt: string;
  source: string;
  category: HermesTaskCategory;
  selectedSkill?: string;
  outputType?: string;
  selectedModel?: string;
  projectId?: string;
}

export class HermesTaskService {
  constructor(private readonly runtime: HermesRuntime) {}

  async submit(input: SubmitTaskInput) {
    return this.runtime.orchestrator.submit(input);
  }

  async getTask(taskId: string) {
    const task = this.runtime.taskManager.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} tidak ditemukan.`);
    }
    return task;
  }

  async retry(taskId: string) {
    const existing = await this.getTask(taskId);
    return this.submit({
      goal: existing.goal,
      prompt: existing.prompt,
      source: existing.source,
      category: existing.category,
      selectedSkill: existing.skillId,
      outputType: existing.requestedOutputType,
      selectedModel: existing.resolvedModel,
      projectId: existing.projectId,
    });
  }

  async cancel(taskId: string) {
    return this.runtime.taskManager.cancelTask(taskId, 'Dibatalkan oleh operator.');
  }

  async resume(taskId: string) {
    return this.runtime.orchestrator.resume(taskId);
  }

  async reject(taskId: string, reason?: string) {
    return this.runtime.progressTracker.mark(taskId, {
      status: 'failed',
      phase: 'failed',
      summary: reason ?? 'Approval ditolak oleh operator.',
      progress: 100,
      log: reason ?? 'Approval ditolak oleh operator.',
      error: reason ?? 'Approval ditolak oleh operator.',
    });
  }
}
