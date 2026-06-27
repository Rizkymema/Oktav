import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import type { HermesApprovalRequest } from '@/lib/hermes/contracts/approval';
import type { HermesTaskRecord } from '@/lib/hermes/contracts/task';
import { getRuntimeDataPath } from '@/lib/hermes/runtime/runtime-paths';

export interface HermesTaskRuntimeSnapshot {
  tasks: HermesTaskRecord[];
  approvals: HermesApprovalRequest[];
}

const DEFAULT_STATE_PATH = getRuntimeDataPath('hermes-runtime-state.json');

const resolveDefaultStatePath = () => {
  if (process.env.NODE_ENV === 'test') {
    return path.join(process.cwd(), '.tmp', `hermes-runtime-state-test-${randomUUID()}.json`);
  }

  return DEFAULT_STATE_PATH;
};

export class TaskStateStore {
  constructor(private readonly statePath = resolveDefaultStatePath()) {}

  load(): HermesTaskRuntimeSnapshot {
    try {
      if (!existsSync(this.statePath)) {
        return { tasks: [], approvals: [] };
      }

      const raw = readFileSync(this.statePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<HermesTaskRuntimeSnapshot>;

      return {
        tasks: parsed.tasks ?? [],
        approvals: parsed.approvals ?? [],
      };
    } catch {
      return { tasks: [], approvals: [] };
    }
  }

  save(snapshot: HermesTaskRuntimeSnapshot) {
    mkdirSync(path.dirname(this.statePath), { recursive: true });
    writeFileSync(this.statePath, JSON.stringify(snapshot, null, 2), 'utf8');
  }
}
