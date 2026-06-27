import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

import { createHermesRuntime } from '@/lib/hermes';
import { RuntimeSettingsStore } from '@/lib/hermes/runtime/runtime-settings-store';
import { HermesControlService } from '@/lib/hermes/services/hermes-control-service';
import { TaskRequestResolver } from '@/lib/hermes/services/task-request-resolver';

describe('TaskRequestResolver', () => {
  test('resolves installed reference skills into runtime category and output plan', async () => {
    const settingsDir = mkdtempSync(path.join(tmpdir(), 'hermes-task-resolver-'));
    const runtime = createHermesRuntime({
      settingsStore: new RuntimeSettingsStore(path.join(settingsDir, 'runtime-settings.json')),
    });
    const controlService = new HermesControlService(runtime);

    await controlService.handleAction({
      action: 'install_skill',
      identifier: 'claude-code',
    });

    const resolver = new TaskRequestResolver(runtime);
    const result = resolver.resolve({
      prompt: '[Skill: claude-code] Buat struktur orchestrator coding agent yang modular',
      outputType: 'html',
    });

    expect(result.selectedSkill).toBe('claude-code');
    expect(result.category).toBe('project');
    expect(result.outputType).toBe('html');
    expect(result.targetAgent).toBe('Project Builder Agent');
  });

  test('falls back to an output-compatible skill when the selected skill cannot produce the requested artifact', () => {
    const runtime = createHermesRuntime();
    const resolver = new TaskRequestResolver(runtime);

    const result = resolver.resolve({
      prompt: 'Buat landing page company profile yang modern',
      selectedSkill: 'Documents',
      outputType: 'html',
    });

    expect(result.selectedSkill).toBe('Websites');
    expect(result.category).toBe('project');
    expect(result.outputType).toBe('html');
    expect(result.targetAgent).toBe('Project Builder Agent');
  });
});
