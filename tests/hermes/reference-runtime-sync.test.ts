import { describe, expect, test } from 'vitest';

import { createHermesRuntime } from '@/lib/hermes';
import { listReferenceWorkspaceToolCatalogSync } from '@/lib/hermes/reference/reference-tool-sync';

describe('Hermes reference runtime sync', () => {
  test('maps reference tool surface into local runtime tool catalog', () => {
    const catalog = listReferenceWorkspaceToolCatalogSync();
    const webTool = catalog.find((entry) => entry.localToolId === 'web.build_artifact');
    const approvalTool = catalog.find((entry) => entry.localToolId === 'task.request_approval');
    const imageTool = catalog.find((entry) => entry.localToolId === 'image.generate_asset');

    expect(webTool?.capabilities).toContain('browser-automation');
    expect(webTool?.capabilities).toContain('terminal-execution');
    expect(webTool?.referenceModules).toContain('browser_tool.py');
    expect(webTool?.referenceModules).toContain('terminal_tool.py');
    expect(webTool?.referenceToolNames).toContain('browser_navigate');
    expect(webTool?.referenceToolNames).toContain('terminal');
    expect(imageTool?.capabilities).toContain('image-generation');
    expect(imageTool?.referenceModules).toContain('image_generation_tool.py');

    expect(approvalTool?.capabilities).toContain('human-approval');
    expect(approvalTool?.referenceModules).toContain('approval.py');
  });

  test('hydrates local tool and agent registries with reference-backed capabilities', () => {
    const runtime = createHermesRuntime();
    const webTool = runtime.toolRegistry.getById('web.build_artifact');
    const projectBuilderAgent = runtime.agentRegistry.getByName('Project Builder Agent');

    expect(webTool?.source).toBe('hybrid');
    expect(webTool?.capabilities).toContain('browser-automation');
    expect(webTool?.capabilities).toContain('delegation');
    expect(webTool?.aliases).toContain('browser_navigate');
    expect(webTool?.aliases).toContain('terminal');
    expect(runtime.toolRegistry.getById('web.build_component_stub')).toBeUndefined();
    expect(runtime.toolRegistry.getById('image.generate_stub')).toBeUndefined();
    expect(runtime.toolRegistry.getById('image.generate_asset')).toBeDefined();

    expect(projectBuilderAgent?.capabilities).toContain('browser-automation');
    expect(projectBuilderAgent?.capabilities).toContain('terminal-execution');
    expect(projectBuilderAgent?.capabilities).toContain('workflow-automation');
  });
});
