import type { HermesTaskRecord } from '@/lib/hermes/contracts/task';

export class ContextManager {
  buildForTask(task: HermesTaskRecord) {
    return {
      requestSummary: task.goal,
      activeSkill: task.skillId,
      activeProjectId: task.projectId,
      latestOutputs: task.outputFiles,
    };
  }
}
