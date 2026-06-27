# Workspace Tool Enablement And Dummy Purge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every visible workspace tool family reflect real runtime capability, remove dummy production data, and ensure supported outputs generate real downloadable artifacts.

**Architecture:** Keep the existing Hermes-style workspace shell and approval flow, but tighten runtime truth at the capability, resolver, executor, and artifact layers. Replace optimistic dummy/stub behavior with family-based execution strategies and honest status reporting in workspace state.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Node filesystem APIs

---

### Task 1: Replace Runtime Stub Tool IDs With Real Tool Families

**Files:**
- Modify: `lib/hermes/seed/tools.ts`
- Modify: `lib/hermes/seed/skills.ts`
- Modify: `lib/hermes/reference/reference-tool-sync.ts`
- Modify: `lib/hermes/reference/reference-skill-sync.ts`
- Test: `tests/hermes/reference-runtime-sync.test.ts`
- Test: `tests/hermes/reference-skill-sync.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';

import { createHermesRuntime } from '@/lib/hermes';
import { listReferenceWorkspaceToolCatalogSync } from '@/lib/hermes/reference/reference-tool-sync';
import { getReferenceSkillDefinitionByName } from '@/lib/hermes/reference/reference-skill-sync';

describe('runtime tool families', () => {
  it('registers real image and web tool ids instead of stub ids', () => {
    const runtime = createHermesRuntime();

    expect(runtime.toolRegistry.getById('image.generate_asset')).toBeDefined();
    expect(runtime.toolRegistry.getById('web.build_artifact')).toBeDefined();
    expect(runtime.toolRegistry.getById('image.generate_stub')).toBeUndefined();
    expect(runtime.toolRegistry.getById('web.build_component_stub')).toBeUndefined();
  });

  it('keeps reference catalog aligned with real tool ids', () => {
    const catalog = listReferenceWorkspaceToolCatalogSync();
    expect(catalog.find((entry) => entry.localToolId === 'image.generate_asset')).toBeDefined();
    expect(catalog.find((entry) => entry.localToolId === 'web.build_artifact')).toBeDefined();
  });

  it('maps reference coding/design skills to real runtime tools', () => {
    const designSkill = getReferenceSkillDefinitionByName('Slides');
    const codingSkill = getReferenceSkillDefinitionByName('browser-use');

    expect(designSkill?.requiredTools).toContain('document.compose_outline');
    expect(codingSkill?.requiredTools).toContain('web.build_artifact');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/hermes/reference-runtime-sync.test.ts tests/hermes/reference-skill-sync.test.ts`
Expected: FAIL because runtime still exposes `image.generate_stub` and `web.build_component_stub`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/hermes/seed/tools.ts
{
  id: 'image.generate_asset',
  name: 'Image Asset Generator',
  category: 'image',
  description: 'Menghasilkan asset gambar nyata untuk output visual.',
}

{
  id: 'web.build_artifact',
  name: 'Web Artifact Builder',
  category: 'web',
  description: 'Membangun artifact HTML atau ZIP untuk output website.',
}
```

```ts
// lib/hermes/seed/skills.ts
requiredTools: ['llm.generate_text', 'image.generate_asset', 'filesystem.write_artifact']
requiredTools: ['llm.generate_text', 'web.build_artifact', 'task.request_approval', 'filesystem.write_artifact']
requiredTools: ['llm.generate_text', 'image.generate_asset', 'video.generate_mp4', 'filesystem.write_artifact']
```

```ts
// lib/hermes/reference/reference-tool-sync.ts
{
  localToolId: 'image.generate_asset',
  ...
}

{
  localToolId: 'web.build_artifact',
  ...
}
```

```ts
// lib/hermes/reference/reference-skill-sync.ts
requiredTools: ['llm.generate_text', 'web.build_artifact', 'filesystem.write_artifact']
requiredTools: ['llm.generate_text', 'image.generate_asset', 'filesystem.write_artifact']
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/hermes/reference-runtime-sync.test.ts tests/hermes/reference-skill-sync.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/hermes/seed/tools.ts lib/hermes/seed/skills.ts lib/hermes/reference/reference-tool-sync.ts lib/hermes/reference/reference-skill-sync.ts tests/hermes/reference-runtime-sync.test.ts tests/hermes/reference-skill-sync.test.ts
git commit -m "refactor: replace stub tool ids with runtime tool families"
```

### Task 2: Remove Simulated Success From Orchestrator And Tighten Native Execution

**Files:**
- Modify: `lib/hermes/core/main-orchestrator.ts`
- Modify: `lib/hermes/runtime/tool-executor.ts`
- Test: `tests/hermes/orchestrator.test.ts`
- Test: `tests/hermes/tool-executor.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';

import { createHermesRuntime } from '@/lib/hermes';

describe('native runtime execution truth', () => {
  it('does not create synthetic artifact files during test execution', async () => {
    const runtime = createHermesRuntime();
    const task = await runtime.orchestrator.submit({
      goal: 'Buat draft laporan audit',
      prompt: 'Buat draft laporan audit',
      source: 'test',
      category: 'document',
      selectedSkill: 'Documents',
      outputType: 'pdf',
    });

    expect(task.summary.toLowerCase()).not.toContain('sintetis');
  });

  it('returns setup-blocked video result when no generator backend is ready', async () => {
    const runtime = createHermesRuntime();
    const record = runtime.taskManager.createTask({
      goal: 'Buat video promo',
      prompt: 'Buat video promo',
      source: 'test',
      category: 'document',
      selectedSkill: 'Videos',
      outputType: 'mp4',
    });

    const result = await runtime.toolExecutor.execute({
      task: record,
      agentName: 'Video Agent',
      toolId: 'video.generate_mp4',
    });

    expect(result.content).toContain('needs setup');
    expect(result.artifact).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/hermes/orchestrator.test.ts tests/hermes/tool-executor.test.ts`
Expected: FAIL because orchestrator still uses `simulateExecution()` and the executor still returns synthetic fallback success.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/hermes/core/main-orchestrator.ts
if (process.env.VITEST || process.env.NODE_ENV === 'test') {
  return this.executeNativePlan(taskId, executionPlan);
}
```

```ts
// lib/hermes/runtime/tool-executor.ts
case 'video.generate_mp4': {
  if (!hasVideoGenerationSupport()) {
    return {
      content: 'Video output needs setup: generator backend belum tersedia.',
    };
  }
}
```

```ts
// lib/hermes/runtime/tool-executor.ts
case 'image.generate_asset': {
  return this.runImageArtifactGeneration(input);
}

case 'web.build_artifact': {
  return this.runWebArtifactGeneration(input);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/hermes/orchestrator.test.ts tests/hermes/tool-executor.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/hermes/core/main-orchestrator.ts lib/hermes/runtime/tool-executor.ts tests/hermes/orchestrator.test.ts tests/hermes/tool-executor.test.ts
git commit -m "fix: remove simulated runtime success paths"
```

### Task 3: Purge Dummy Workspace State And Mock Composer Flows

**Files:**
- Modify: `lib/workspace/workspace-context.tsx`
- Modify: `lib/workspace/mock-data.ts`
- Modify: `lib/hermes/runtime/state-persistence.ts`
- Modify: `components/workspace/PromptComposer.tsx`
- Modify: `components/workspace/TrendingProjects.tsx`
- Test: `tests/workspace/prompt-composer.test.ts`
- Test: `tests/workspace/workspace-interface.test.ts`
- Test: `tests/workspace/workspace-shell-surfaces.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import PromptComposer from '@/components/workspace/PromptComposer';
import { WorkspaceProvider } from '@/lib/workspace/workspace-context';

describe('workspace production state', () => {
  it('does not inject random mock attachments from the add button', async () => {
    const user = userEvent.setup();
    render(
      <WorkspaceProvider>
        <PromptComposer />
      </WorkspaceProvider>,
    );

    await user.click(screen.getByTitle(/lampirkan file/i));

    expect(screen.queryByText(/data_penjualan_2026\.csv/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/workspace/prompt-composer.test.ts tests/workspace/workspace-interface.test.ts tests/workspace/workspace-shell-surfaces.test.ts`
Expected: FAIL because composer still adds random mock attachments and workspace state still seeds mock skills.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/workspace/workspace-context.tsx
const [controlSkills, setControlSkills] = useState<Skill[]>([]);
const [controlTools, setControlTools] = useState<Array<{ name: string; description: string; enabled: boolean }>>([]);
```

```ts
// lib/hermes/runtime/state-persistence.ts
if (!existsSync(PROJECTS_PATH)) {
  this.saveProjects([]);
  return [];
}
```

```tsx
// components/workspace/PromptComposer.tsx
const fileInputRef = useRef<HTMLInputElement>(null);

const handlePickFiles = () => {
  fileInputRef.current?.click();
};
```

```tsx
// components/workspace/TrendingProjects.tsx
if (templates.length === 0) {
  return null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/workspace/prompt-composer.test.ts tests/workspace/workspace-interface.test.ts tests/workspace/workspace-shell-surfaces.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/workspace/workspace-context.tsx lib/workspace/mock-data.ts lib/hermes/runtime/state-persistence.ts components/workspace/PromptComposer.tsx components/workspace/TrendingProjects.tsx tests/workspace/prompt-composer.test.ts tests/workspace/workspace-interface.test.ts tests/workspace/workspace-shell-surfaces.test.ts
git commit -m "refactor: remove dummy workspace production state"
```

### Task 4: Align Resolver, Artifact Status, And Full Verification

**Files:**
- Modify: `lib/hermes/services/task-request-resolver.ts`
- Modify: `lib/hermes/artifacts/artifact-registry.ts`
- Modify: `tests/hermes/task-request-resolver.test.ts`
- Modify: `tests/hermes/services.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';

import { createHermesRuntime } from '@/lib/hermes';
import { TaskRequestResolver } from '@/lib/hermes/services/task-request-resolver';

describe('task request resolution truth', () => {
  it('keeps video requests on the Videos skill instead of pretending document compatibility', () => {
    const runtime = createHermesRuntime();
    const resolver = new TaskRequestResolver(runtime);

    const result = resolver.resolve({
      prompt: '[Skill: Videos] Buat video promo parfum',
      outputType: 'mp4',
    });

    expect(result.selectedSkill).toBe('Videos');
    expect(result.capability).toBe('video');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/hermes/task-request-resolver.test.ts tests/hermes/services.test.ts`
Expected: FAIL if resolver still falls back through optimistic compatibility.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/hermes/services/task-request-resolver.ts
if (input.requestedSkill && this.supportsArtifact(input.requestedSkill, input.artifactId)) {
  return input.requestedSkill.name;
}

const exactCapabilitySkill = this.runtime.skillRegistry
  .list()
  .find((skill) => skill.name === input.fallbackSkillName && this.supportsArtifact(skill, input.artifactId));

return exactCapabilitySkill?.name ?? input.fallbackSkillName;
```

```ts
// lib/hermes/artifacts/artifact-registry.ts
status: 'ready' | 'needs_setup' | 'unavailable'
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/hermes/task-request-resolver.test.ts tests/hermes/services.test.ts`
Expected: PASS

- [ ] **Step 5: Run full verification**

Run: `npm test`
Expected: PASS

Run: `npm run lint`
Expected: PASS

Run: `npx tsc --noEmit`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/hermes/services/task-request-resolver.ts lib/hermes/artifacts/artifact-registry.ts tests/hermes/task-request-resolver.test.ts tests/hermes/services.test.ts
git commit -m "feat: align capability resolution with real runtime status"
```
