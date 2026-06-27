import type { HermesContextSnapshot, HermesMemoryRecord } from '@/lib/hermes/contracts/memory';
import { TaskHistoryStore } from '@/lib/hermes/memory/task-history-store';

export class MemoryManager {
  private readonly records = new Map<string, HermesMemoryRecord>();

  constructor(private readonly historyStore: TaskHistoryStore) {}

  remember(taskId: string, summary: string, context: HermesContextSnapshot) {
    const record: HermesMemoryRecord = {
      taskId,
      summary,
      context,
      updatedAt: new Date().toISOString(),
    };
    this.records.set(taskId, record);
    void this.historyStore.append(record);
    return record;
  }

  get(taskId: string) {
    return this.records.get(taskId);
  }

  list() {
    return [...this.records.values()];
  }
}
