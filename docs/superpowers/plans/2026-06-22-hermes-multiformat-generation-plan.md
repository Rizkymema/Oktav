# Hermes Multi-Format Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan registry model dan output artifact agar workspace bisa membuat dokumen multi-format dengan model yang sinkron terhadap API aktif.

**Architecture:** Metadata model dan artifact dipusatkan di `lib/hermes`, lalu route, planner, orchestrator, dan UI memakai metadata yang sama. Output target dikirim sampai ke runtime Hermes supaya artifact yang dibuat lebih deterministik.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest

---

### Task 1: Add Artifact And Model Registries

**Files:**
- Create: `lib/hermes/artifacts/artifact-types.ts`
- Create: `lib/hermes/artifacts/artifact-registry.ts`
- Create: `lib/hermes/models/model-types.ts`
- Create: `lib/hermes/models/model-registry.ts`
- Test: `tests/hermes/registry.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { createArtifactRegistry } from '@/lib/hermes/artifacts/artifact-registry';
import { createModelRegistry } from '@/lib/hermes/models/model-registry';

describe('registry foundations', () => {
  it('maps pptx to presentation capability', () => {
    const registry = createArtifactRegistry();
    expect(registry.getById('pptx')?.capability).toBe('presentation');
  });

  it('filters available models by configured providers and capability', () => {
    const registry = createModelRegistry({
      openRouterApiKey: 'or-key',
      openAiApiKey: 'oa-key',
      geminiApiKey: '',
      googleApiKey: '',
    });

    const models = registry.listForCapability('presentation');
    expect(models.some((model) => model.id === 'openai/gpt-4o')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/hermes/registry.test.ts`
Expected: FAIL karena file registry belum ada.

- [ ] **Step 3: Write minimal implementation**

```ts
export type HermesArtifactCapability =
  | 'chat'
  | 'document'
  | 'presentation'
  | 'spreadsheet'
  | 'image'
  | 'video'
  | 'web';
```

```ts
export const HERMES_ARTIFACT_TYPES = [
  { id: 'pptx', capability: 'presentation', extensions: ['.pptx'] },
  { id: 'pdf', capability: 'document', extensions: ['.pdf'] },
];
```

```ts
export const HERMES_MODEL_CATALOG = [
  { id: 'openai/gpt-4o', capabilities: ['chat', 'document', 'presentation'] },
  { id: 'google/gemini-2.5-flash', capabilities: ['chat', 'document'] },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/hermes/registry.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/hermes/registry.test.ts lib/hermes/artifacts lib/hermes/models
git commit -m "feat: add hermes model and artifact registries"
```

### Task 2: Refactor Model And Chat Routes To Use Registry Service

**Files:**
- Create: `lib/hermes/services/hermes-generation-service.ts`
- Modify: `app/api/hermes/models/route.ts`
- Modify: `app/api/hermes/chat/route.ts`
- Test: `tests/hermes/api.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('returns registry-backed model data', async () => {
  const response = await GET();
  const body = await response.json();
  expect(body.models[0]).toHaveProperty('capabilities');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/hermes/api.test.ts`
Expected: FAIL karena route belum memakai service registry.

- [ ] **Step 3: Write minimal implementation**

```ts
export class HermesGenerationService {
  listModels() {
    return createModelRegistry(readProviderConfig()).listForUi();
  }
}
```

```ts
export async function GET() {
  const service = new HermesGenerationService();
  return NextResponse.json({ models: service.listModels() });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/hermes/api.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/hermes/models/route.ts app/api/hermes/chat/route.ts lib/hermes/services/hermes-generation-service.ts tests/hermes/api.test.ts
git commit -m "refactor: back hermes routes with generation service"
```

### Task 3: Extend Task Contract, Goal Analysis, And Planning

**Files:**
- Modify: `lib/hermes/contracts/task.ts`
- Modify: `lib/hermes/core/goal-analyzer.ts`
- Modify: `lib/hermes/core/planning-engine.ts`
- Modify: `app/api/hermes/tasks/route.ts`
- Test: `tests/hermes/orchestrator.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('captures requested output type from task input', () => {
  const result = analyzer.analyze({
    goal: 'Buat pitch deck startup 10 slide',
    prompt: 'Buat pitch deck startup 10 slide',
    selectedSkill: 'Slides',
    outputType: 'pptx',
  });

  expect(result.requestedOutputType).toBe('pptx');
  expect(result.requestedCapability).toBe('presentation');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/hermes/orchestrator.test.ts`
Expected: FAIL karena contract dan analyzer belum mengenal `outputType`.

- [ ] **Step 3: Write minimal implementation**

```ts
export interface HermesTaskCreateInput {
  goal: string;
  category: HermesTaskCategory;
  source: string;
  prompt: string;
  selectedSkill?: string;
  outputType?: string;
  projectId?: string;
}
```

```ts
return {
  requestedOutputType: input.outputType ?? inferOutputFromSkill(selectedSkill),
  requestedCapability: artifact?.capability ?? 'document',
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/hermes/orchestrator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/hermes/contracts/task.ts lib/hermes/core/goal-analyzer.ts lib/hermes/core/planning-engine.ts app/api/hermes/tasks/route.ts tests/hermes/orchestrator.test.ts
git commit -m "feat: carry output target through hermes planning"
```

### Task 4: Update Orchestrator Prompting And Artifact Sync

**Files:**
- Modify: `lib/hermes/core/main-orchestrator.ts`
- Test: `tests/hermes/services.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('injects output-specific instructions into runtime query', () => {
  const query = buildRuntimeQuery({
    prompt: 'Buat company profile',
    requestedOutputType: 'pdf',
  });

  expect(query).toContain('Target output: pdf');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/hermes/services.test.ts`
Expected: FAIL karena query runtime belum membawa target output.

- [ ] **Step 3: Write minimal implementation**

```ts
const query = `${executionPlan.prompt}

IMPORTANT:
1. Target output: ${executionPlan.requestedOutputType}.
2. Save final files under d:/Project Apk-Web/AI ASSISTENT/public/artifacts/.
`;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/hermes/services.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/hermes/core/main-orchestrator.ts tests/hermes/services.test.ts
git commit -m "feat: add output-aware hermes runtime prompting"
```

### Task 5: Wire UI Output Selection And Task Submission

**Files:**
- Modify: `lib/workspace/types.ts`
- Modify: `lib/workspace/workspace-context.tsx`
- Modify: `components/workspace/PromptComposer.tsx`
- Test: `tests/hermes/reference-config.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('serializes output type for workspace task submission', () => {
  const payload = buildTaskPayload({
    prompt: 'Buat proposal investasi',
    selectedSkill: 'Documents',
    outputType: 'pdf',
  });

  expect(payload.outputType).toBe('pdf');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/hermes/reference-config.test.ts`
Expected: FAIL karena payload UI belum mengenal `outputType`.

- [ ] **Step 3: Write minimal implementation**

```ts
const [selectedOutputType, setSelectedOutputType] = useState('pdf');
```

```ts
body: JSON.stringify({
  prompt: selectedSkill ? `[Skill: ${selectedSkill}] ${userText}` : userText,
  model: selectedModel,
  outputType: selectedOutputType,
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/hermes/reference-config.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/workspace/types.ts lib/workspace/workspace-context.tsx components/workspace/PromptComposer.tsx tests/hermes/reference-config.test.ts
git commit -m "feat: expose output type selection in workspace"
```

### Task 6: Verify End-To-End Quality

**Files:**
- Modify: `.env.example`
- Modify: `docs/superpowers/specs/2026-06-22-hermes-multiformat-generation-design.md`
- Modify: `docs/superpowers/plans/2026-06-22-hermes-multiformat-generation-plan.md`

- [ ] **Step 1: Run targeted tests**

Run: `npm test -- tests/hermes/registry.test.ts tests/hermes/api.test.ts tests/hermes/orchestrator.test.ts tests/hermes/services.test.ts`
Expected: PASS

- [ ] **Step 2: Run full quality checks**

Run: `npm run lint`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Update environment example if needed**

```env
OPENAI_API_KEY=
OPENROUTER_API_KEY=
GEMINI_API_KEY=
GOOGLE_API_KEY=
```

- [ ] **Step 4: Commit**

```bash
git add .env.example docs/superpowers/specs/2026-06-22-hermes-multiformat-generation-design.md docs/superpowers/plans/2026-06-22-hermes-multiformat-generation-plan.md
git commit -m "docs: document hermes multiformat generation rollout"
```
