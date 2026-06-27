import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { HermesMemoryRecord } from '@/lib/hermes/contracts/memory';

const DEFAULT_HISTORY_PATH = path.join(process.cwd(), '.tmp', 'hermes-task-history.json');

export class TaskHistoryStore {
  constructor(private readonly historyPath = DEFAULT_HISTORY_PATH) {}

  async load(): Promise<HermesMemoryRecord[]> {
    try {
      const raw = await readFile(this.historyPath, 'utf8');
      return JSON.parse(raw) as HermesMemoryRecord[];
    } catch {
      return [];
    }
  }

  async append(record: HermesMemoryRecord) {
    const existing = await this.load();
    await mkdir(path.dirname(this.historyPath), { recursive: true });
    await writeFile(
      this.historyPath,
      JSON.stringify([...existing.filter((item) => item.taskId !== record.taskId), record], null, 2),
      'utf8',
    );
  }
}
