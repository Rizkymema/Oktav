import { mkdtempSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, test } from 'vitest';

import { createHermesRuntime } from '@/lib/hermes';
import { RuntimeSettingsStore } from '@/lib/hermes/runtime/runtime-settings-store';
import { HermesControlService } from '@/lib/hermes/services/hermes-control-service';
import { HermesOverviewService } from '@/lib/hermes/services/hermes-overview-service';
import { HermesTaskService } from '@/lib/hermes/services/hermes-task-service';

describe('Hermes services', () => {
  test('formats overview payload for workspace UI', async () => {
    const runtime = createHermesRuntime();
    const taskService = new HermesTaskService(runtime);
    const overviewService = new HermesOverviewService(runtime);

    await taskService.submit({
      goal: 'Buat proposal bisnis untuk klinik AI',
      prompt: 'Buat proposal bisnis untuk klinik AI yang profesional dan ringkas',
      source: 'Workspace',
      category: 'document',
      selectedSkill: 'Documents',
    });

    const overview = await overviewService.getOverview();

    expect(overview.runtime.model).toBe('Hermes Hybrid Core');
    expect(overview.tasks.length).toBeGreaterThan(0);
    expect(overview.stats.tasks).toBeGreaterThan(0);
  });

  test('formats control payload and supports toggle action', async () => {
    const runtime = createHermesRuntime();
    const controlService = new HermesControlService(runtime);

    const before = await controlService.getControlState();
    const toolName = before.tools[0]?.name;

    expect(toolName).toBeTruthy();

    await controlService.handleAction({
      action: 'toggle_tool',
      name: toolName!,
      enabled: false,
    });

    const after = await controlService.getControlState();
    expect(after.tools.find((tool) => tool.name === toolName)?.enabled).toBe(false);
  }, 15000);

  test('includes approval metadata on workspace tasks that wait for operator approval', async () => {
    const runtime = createHermesRuntime();
    const taskService = new HermesTaskService(runtime);
    const overviewService = new HermesOverviewService(runtime);

    const task = await taskService.submit({
      goal: 'Hapus file environment produksi sekarang juga',
      prompt: '[Skill: Websites] Hapus file environment produksi sekarang juga',
      source: 'Workspace',
      category: 'project',
      selectedSkill: 'Websites',
    });

    const overview = await overviewService.getOverview();
    const waitingTask = overview.tasks.find((item) => item.id === task.id);

    expect(waitingTask?.status).toBe('waiting_approval');
    expect(waitingTask?.approvalState).toBe('pending');
    expect(waitingTask?.approvalRequestId).toBeTruthy();
    expect(waitingTask?.approvalActionType).toBe('task.request_approval');
    expect(waitingTask?.approvalReason).toContain('memerlukan approval operator');
  });

  test('loads additional reference skills from local Hermes repository', async () => {
    const runtime = createHermesRuntime();
    const controlService = new HermesControlService(runtime);

    const state = await controlService.getControlState();

    expect(state.skills.some((skill) => skill.name === 'claude-code')).toBe(true);
    expect(state.skills.some((skill) => skill.name === 'apple-notes')).toBe(true);
  });

  test('persists installed reference skills and selected model across runtime recreation', async () => {
    const settingsDir = mkdtempSync(path.join(tmpdir(), 'hermes-runtime-settings-'));
    const settingsStore = new RuntimeSettingsStore(path.join(settingsDir, 'runtime-settings.json'));

    const runtime = createHermesRuntime({ settingsStore });
    const controlService = new HermesControlService(runtime);

    await controlService.handleAction({
      action: 'install_skill',
      identifier: 'claude-code',
    });
    await controlService.handleAction({
      action: 'update_model',
      model: 'google/gemini-2.5-flash',
    });

    const recreatedRuntime = createHermesRuntime({ settingsStore });

    expect(recreatedRuntime.model).toBe('google/gemini-2.5-flash');
    expect(recreatedRuntime.installedReferenceSkillNames.has('claude-code')).toBe(true);
    expect(recreatedRuntime.skillRegistry.getByName('claude-code')?.defaultAgent).toBe('Project Builder Agent');
  });

  test('persists tool enabled state across runtime recreation', async () => {
    const settingsDir = mkdtempSync(path.join(tmpdir(), 'hermes-runtime-tools-'));
    const settingsStore = new RuntimeSettingsStore(path.join(settingsDir, 'runtime-settings.json'));

    const runtime = createHermesRuntime({ settingsStore });
    const controlService = new HermesControlService(runtime);
    const toolName = runtime.toolRegistry.list()[0]?.name;

    expect(toolName).toBeTruthy();

    await controlService.handleAction({
      action: 'toggle_tool',
      name: toolName!,
      enabled: false,
    });

    const recreatedRuntime = createHermesRuntime({ settingsStore });

    expect(recreatedRuntime.toolRegistry.getByName(toolName!)?.enabled).toBe(false);
  });

  test('persists execution mode across runtime recreation', async () => {
    const settingsDir = mkdtempSync(path.join(tmpdir(), 'hermes-runtime-mode-'));
    const settingsStore = new RuntimeSettingsStore(path.join(settingsDir, 'runtime-settings.json'));

    const runtime = createHermesRuntime({ settingsStore });
    const controlService = new HermesControlService(runtime);

    await controlService.handleAction({
      action: 'update_execution_mode',
      mode: 'reference',
    } as any);

    const recreatedRuntime = createHermesRuntime({ settingsStore });

    expect(recreatedRuntime.executionMode).toBe('reference');
  });
});
