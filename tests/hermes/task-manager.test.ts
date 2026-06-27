import path from 'node:path';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

import { afterEach, describe, expect, test } from 'vitest';

import { InMemoryTaskManager } from '@/lib/hermes/core/task-manager';
import { TaskStateStore } from '@/lib/hermes/runtime/task-state-store';

const tempDirs: string[] = [];

afterEach(() => {
  tempDirs.splice(0, tempDirs.length);
});

describe('InMemoryTaskManager', () => {
  test('creates a task with planning status and event trail', () => {
    const manager = new InMemoryTaskManager();

    const task = manager.createTask({
      goal: 'Buat proposal bisnis untuk klinik AI',
      category: 'document',
      source: 'Workspace',
      prompt: 'Buat proposal bisnis untuk klinik AI',
      selectedSkill: 'Documents',
    });

    expect(task.status).toBe('planning');
    expect(task.phase).toBe('goal_analysis');
    expect(task.events.at(-1)?.type).toBe('task.created');
    expect(task.logs.at(-1)).toContain('Task dibuat');
  });

  test('updates task status, appends events, and queues approvals', () => {
    const manager = new InMemoryTaskManager();
    const task = manager.createTask({
      goal: 'Hapus file produksi',
      category: 'runtime',
      source: 'Workspace',
      prompt: 'Hapus file produksi',
      selectedSkill: 'Websites',
    });

    manager.transitionTask(task.id, {
      status: 'waiting_approval',
      phase: 'approval_required',
      summary: 'Menunggu persetujuan operator',
      progress: 35,
      log: 'Approval dibutuhkan untuk aksi berisiko.',
    });

    const approval = manager.createApproval({
      taskId: task.id,
      actionType: 'filesystem.delete',
      reason: 'Permintaan delete file produksi',
      payload: { path: '/var/www/app/.env' },
    });

    const refreshedTask = manager.getTask(task.id);

    expect(refreshedTask?.status).toBe('waiting_approval');
    expect(refreshedTask?.approvalState).toBe('pending');
    expect(approval.status).toBe('pending');
    expect(manager.listApprovals()).toHaveLength(1);
  });

  test('records retry attempt and cancellation', () => {
    const manager = new InMemoryTaskManager();
    const task = manager.createTask({
      goal: 'Bangun landing page',
      category: 'project',
      source: 'Workspace',
      prompt: 'Bangun landing page',
      selectedSkill: 'Websites',
    });

    manager.incrementAttempt(task.id, 'Retry karena validasi gagal.');
    manager.cancelTask(task.id, 'Dibatalkan operator');

    const refreshedTask = manager.getTask(task.id);

    expect(refreshedTask?.attemptCount).toBe(1);
    expect(refreshedTask?.status).toBe('cancelled');
    expect(refreshedTask?.logs.at(-1)).toContain('Dibatalkan operator');
  });

  test('rehydrates persisted tasks and approvals after runtime restart', () => {
    const stateDir = mkdtempSync(path.join(tmpdir(), 'hermes-task-state-'));
    tempDirs.push(stateDir);
    const stateStore = new TaskStateStore(path.join(stateDir, 'runtime-state.json'));

    const firstManager = new InMemoryTaskManager(stateStore);
    const task = firstManager.createTask({
      goal: 'Hapus file produksi',
      category: 'runtime',
      source: 'Workspace',
      prompt: 'Hapus file produksi',
      selectedSkill: 'Websites',
    });

    firstManager.transitionTask(task.id, {
      status: 'waiting_approval',
      phase: 'approval_required',
      summary: 'Menunggu persetujuan operator',
      progress: 35,
      log: 'Approval dibutuhkan untuk aksi berisiko.',
    });

    const approval = firstManager.createApproval({
      taskId: task.id,
      actionType: 'filesystem.delete',
      reason: 'Permintaan delete file produksi',
      payload: { path: '/var/www/app/.env' },
    });

    const secondManager = new InMemoryTaskManager(stateStore);
    const restoredTask = secondManager.getTask(task.id);
    const restoredApproval = secondManager.getApproval(approval.id);

    expect(restoredTask?.status).toBe('waiting_approval');
    expect(restoredTask?.approvalState).toBe('pending');
    expect(restoredTask?.summary).toBe('Menunggu persetujuan operator');
    expect(restoredApproval?.reason).toBe('Permintaan delete file produksi');
    expect(secondManager.listApprovals()).toHaveLength(1);
  });
});
