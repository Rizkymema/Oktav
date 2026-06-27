# Genvid Video Engine Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import the Genvid video engine into `AI ASSISTENT` and route `video.generate_mp4` through that engine while preserving the current Hermes workspace shell and artifact surfaces.

**Architecture:** Keep the existing Next.js and Hermes runtime as the primary application boundary, but add an isolated `integrations/genvid` Python subsystem plus TypeScript adapters under `lib/hermes/video`. `ToolExecutor` will prefer the Genvid HTTP provider, poll its task API, mirror the resulting MP4 into `public/artifacts`, and fall back to the legacy `ffmpeg` path only when configured to do so.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Node filesystem APIs, FastAPI (imported Python subsystem), ffmpeg-static

---

### Task 1: Add Genvid config and provider selection primitives

**Files:**
- Create: `lib/hermes/video/genvid-types.ts`
- Create: `lib/hermes/video/genvid-config.ts`
- Create: `tests/hermes/genvid-config.test.ts`
- Modify: `.env.example`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from 'vitest';

describe('readGenvidConfig', () => {
  it('reads genvid env vars with defaults', async () => {
    vi.resetModules();
    process.env.GENVID_ENABLED = 'true';
    process.env.GENVID_API_URL = 'http://127.0.0.1:8000';
    process.env.GENVID_ROOT = 'D:\\genvid\\Pixelle-Video-main';
    process.env.GENVID_AUTO_START = 'false';
    process.env.GENVID_FALLBACK_MODE = 'legacy_ffmpeg';

    const { readGenvidConfig } = await import('@/lib/hermes/video/genvid-config');
    const config = readGenvidConfig();

    expect(config.enabled).toBe(true);
    expect(config.apiUrl).toBe('http://127.0.0.1:8000');
    expect(config.root).toContain('Pixelle-Video-main');
    expect(config.autoStart).toBe(false);
    expect(config.fallbackMode).toBe('legacy_ffmpeg');
    expect(config.pollIntervalMs).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/hermes/genvid-config.test.ts`
Expected: FAIL with `Cannot find module '@/lib/hermes/video/genvid-config'`

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/hermes/video/genvid-types.ts
export type GenvidFallbackMode = 'legacy_ffmpeg' | 'fail';

export interface GenvidConfig {
  enabled: boolean;
  apiUrl: string;
  root: string;
  autoStart: boolean;
  startCommand: string;
  healthTimeoutMs: number;
  pollIntervalMs: number;
  pollTimeoutMs: number;
  fallbackMode: GenvidFallbackMode;
}
```

```ts
// lib/hermes/video/genvid-config.ts
import path from 'node:path';

import type { GenvidConfig, GenvidFallbackMode } from '@/lib/hermes/video/genvid-types';

const readBool = (value: string | undefined, fallback: boolean) =>
  value ? value.toLowerCase() === 'true' : fallback;

const readNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const readGenvidConfig = (): GenvidConfig => ({
  enabled: readBool(process.env.GENVID_ENABLED, false),
  apiUrl: process.env.GENVID_API_URL?.trim() || 'http://127.0.0.1:8000',
  root:
    process.env.GENVID_ROOT?.trim() ||
    path.join(process.cwd(), 'integrations', 'genvid'),
  autoStart: readBool(process.env.GENVID_AUTO_START, false),
  startCommand:
    process.env.GENVID_START_COMMAND?.trim() ||
    'uv run python api/app.py --host 127.0.0.1 --port 8000',
  healthTimeoutMs: readNumber(process.env.GENVID_HEALTH_TIMEOUT_MS, 5000),
  pollIntervalMs: readNumber(process.env.GENVID_POLL_INTERVAL_MS, 2500),
  pollTimeoutMs: readNumber(process.env.GENVID_POLL_TIMEOUT_MS, 300000),
  fallbackMode:
    (process.env.GENVID_FALLBACK_MODE as GenvidFallbackMode | undefined) ||
    'legacy_ffmpeg',
});
```

```env
# .env.example
GENVID_ENABLED=false
GENVID_API_URL=http://127.0.0.1:8000
GENVID_ROOT=
GENVID_AUTO_START=false
GENVID_START_COMMAND=uv run python api/app.py --host 127.0.0.1 --port 8000
GENVID_HEALTH_TIMEOUT_MS=5000
GENVID_POLL_INTERVAL_MS=2500
GENVID_POLL_TIMEOUT_MS=300000
GENVID_FALLBACK_MODE=legacy_ffmpeg
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/hermes/genvid-config.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .env.example lib/hermes/video/genvid-types.ts lib/hermes/video/genvid-config.ts tests/hermes/genvid-config.test.ts
git commit -m "feat: add genvid provider configuration"
```

### Task 2: Build the Genvid HTTP client and artifact mirroring service

**Files:**
- Create: `lib/hermes/video/genvid-client.ts`
- Create: `lib/hermes/video/genvid-service.ts`
- Create: `tests/hermes/genvid-service.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import fs from 'node:fs';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

const artifactPath = path.join(process.cwd(), 'public', 'artifacts', 'genvid-test.mp4');

afterEach(() => {
  vi.restoreAllMocks();
  try {
    fs.unlinkSync(artifactPath);
  } catch {}
});

describe('GenvidVideoService', () => {
  it('polls the remote task and mirrors the finished mp4 locally', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'healthy' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ task_id: 'task-123' }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            task_id: 'task-123',
            status: 'completed',
            result: {
              video_url: 'http://127.0.0.1:8000/api/files/run/final.mp4',
              duration: 12.5,
              file_size: 512,
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(Uint8Array.from(Array.from({ length: 256 }, (_, index) => index % 255)), {
          status: 200,
          headers: { 'content-type': 'video/mp4' },
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { GenvidVideoService } = await import('@/lib/hermes/video/genvid-service');
    const service = new GenvidVideoService({
      enabled: true,
      apiUrl: 'http://127.0.0.1:8000',
      root: 'D:\\genvid\\Pixelle-Video-main',
      autoStart: false,
      startCommand: 'uv run python api/app.py --host 127.0.0.1 --port 8000',
      healthTimeoutMs: 5000,
      pollIntervalMs: 1,
      pollTimeoutMs: 2000,
      fallbackMode: 'legacy_ffmpeg',
    });

    const result = await service.generateVideo({
      prompt: 'Buat video promosi parfum mewah',
      goal: 'Video Promosi Parfum',
      outputPath: artifactPath,
      taskId: 'hermes-task-1',
    });

    expect(result.duration).toBe(12.5);
    expect(result.fileSize).toBe(512);
    expect(fs.existsSync(artifactPath)).toBe(true);
    expect(fs.readFileSync(artifactPath).length).toBeGreaterThan(64);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/hermes/genvid-service.test.ts`
Expected: FAIL with `Cannot find module '@/lib/hermes/video/genvid-service'`

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/hermes/video/genvid-client.ts
import type { GenvidConfig } from '@/lib/hermes/video/genvid-types';

export class GenvidClient {
  constructor(private readonly config: GenvidConfig) {}

  async checkHealth() {
    const response = await fetch(`${this.config.apiUrl}/health`, {
      signal: AbortSignal.timeout(this.config.healthTimeoutMs),
    });
    if (!response.ok) {
      throw new Error('Genvid health check failed.');
    }
    return response.json();
  }

  async submitVideo(payload: Record<string, unknown>) {
    const response = await fetch(`${this.config.apiUrl}/api/video/generate/async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error('Genvid video submission failed.');
    }
    return response.json() as Promise<{ task_id: string }>;
  }

  async getTask(taskId: string) {
    const response = await fetch(`${this.config.apiUrl}/api/tasks/${taskId}`);
    if (!response.ok) {
      throw new Error(`Genvid task ${taskId} not found.`);
    }
    return response.json();
  }

  async downloadVideo(videoUrl: string) {
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error('Failed to download Genvid video output.');
    }
    return Buffer.from(await response.arrayBuffer());
  }
}
```

```ts
// lib/hermes/video/genvid-service.ts
import fs from 'node:fs';
import path from 'node:path';

import { GenvidClient } from '@/lib/hermes/video/genvid-client';
import type { GenvidConfig } from '@/lib/hermes/video/genvid-types';

interface GenerateVideoInput {
  taskId: string;
  goal: string;
  prompt: string;
  outputPath: string;
}

export class GenvidVideoService {
  private readonly client: GenvidClient;

  constructor(private readonly config: GenvidConfig) {
    this.client = new GenvidClient(config);
  }

  async generateVideo(input: GenerateVideoInput) {
    await this.client.checkHealth();

    const submitResult = await this.client.submitVideo({
      text: input.prompt,
      mode: 'generate',
      title: input.goal,
      n_scenes: 5,
      frame_template: '1080x1920/image_default.html',
    });

    const startedAt = Date.now();
    while (Date.now() - startedAt < this.config.pollTimeoutMs) {
      const task = await this.client.getTask(submitResult.task_id);
      if (task.status === 'completed') {
        const videoBuffer = await this.client.downloadVideo(task.result.video_url);
        await fs.promises.mkdir(path.dirname(input.outputPath), { recursive: true });
        await fs.promises.writeFile(input.outputPath, videoBuffer);

        return {
          remoteTaskId: submitResult.task_id,
          duration: task.result.duration,
          fileSize: task.result.file_size,
          outputPath: input.outputPath,
        };
      }

      if (task.status === 'failed' || task.status === 'cancelled') {
        throw new Error('Genvid task failed.');
      }

      await new Promise((resolve) => setTimeout(resolve, this.config.pollIntervalMs));
    }

    throw new Error('Genvid task timed out.');
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/hermes/genvid-service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/hermes/video/genvid-client.ts lib/hermes/video/genvid-service.ts tests/hermes/genvid-service.test.ts
git commit -m "feat: add genvid video client and mirror service"
```

### Task 3: Import the Genvid runtime into a repository-local integration boundary

**Files:**
- Create: `integrations/genvid/`
- Create: `integrations/genvid/api/`
- Create: `integrations/genvid/pixelle_video/`
- Create: `integrations/genvid/workflows/`
- Create: `integrations/genvid/templates/`
- Create: `integrations/genvid/resources/`
- Create: `integrations/genvid/bgm/`
- Create: `integrations/genvid/pyproject.toml`
- Create: `integrations/genvid/config.example.yaml`
- Create: `integrations/genvid/README.import.md`

- [ ] **Step 1: Copy the imported engine into the repository-local boundary**

Run:

```powershell
New-Item -ItemType Directory -Force 'D:\Project Apk-Web\AI ASSISTENT\integrations\genvid' | Out-Null
Copy-Item 'D:\genvid\Pixelle-Video-main\api' 'D:\Project Apk-Web\AI ASSISTENT\integrations\genvid' -Recurse -Force
Copy-Item 'D:\genvid\Pixelle-Video-main\pixelle_video' 'D:\Project Apk-Web\AI ASSISTENT\integrations\genvid' -Recurse -Force
Copy-Item 'D:\genvid\Pixelle-Video-main\workflows' 'D:\Project Apk-Web\AI ASSISTENT\integrations\genvid' -Recurse -Force
Copy-Item 'D:\genvid\Pixelle-Video-main\templates' 'D:\Project Apk-Web\AI ASSISTENT\integrations\genvid' -Recurse -Force
Copy-Item 'D:\genvid\Pixelle-Video-main\resources' 'D:\Project Apk-Web\AI ASSISTENT\integrations\genvid' -Recurse -Force
Copy-Item 'D:\genvid\Pixelle-Video-main\bgm' 'D:\Project Apk-Web\AI ASSISTENT\integrations\genvid' -Recurse -Force
Copy-Item 'D:\genvid\Pixelle-Video-main\pyproject.toml' 'D:\Project Apk-Web\AI ASSISTENT\integrations\genvid' -Force
Copy-Item 'D:\genvid\Pixelle-Video-main\config.example.yaml' 'D:\Project Apk-Web\AI ASSISTENT\integrations\genvid' -Force
```

Expected: imported Python engine folders exist under `integrations/genvid`

- [ ] **Step 2: Add an import note describing the boundary**

```md
<!-- integrations/genvid/README.import.md -->
# Genvid Import Boundary

This directory contains the imported Genvid video engine used by `AI ASSISTENT`.

- The main product UI remains the Next.js workspace.
- Video generation is consumed through the imported FastAPI boundary.
- Do not move these Python files into the Next.js root.
- Runtime adapters for this engine live in `lib/hermes/video/`.
```

- [ ] **Step 3: Verify the imported files exist**

Run:

```powershell
Get-ChildItem 'D:\Project Apk-Web\AI ASSISTENT\integrations\genvid' | Select-Object Name
```

Expected output contains:

```text
api
pixelle_video
workflows
templates
resources
bgm
pyproject.toml
config.example.yaml
README.import.md
```

- [ ] **Step 4: Commit**

```bash
git add integrations/genvid
git commit -m "chore: import genvid runtime into integration boundary"
```

### Task 4: Route `video.generate_mp4` through Genvid first, then fall back safely

**Files:**
- Modify: `lib/hermes/runtime/tool-executor.ts`
- Modify: `tests/hermes/tool-executor.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('prefers genvid provider when enabled and healthy', async () => {
  process.env.GENVID_ENABLED = 'true';
  process.env.GENVID_API_URL = 'http://127.0.0.1:8000';

  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'healthy' }), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ task_id: 'task-123' }), { status: 200 }))
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          task_id: 'task-123',
          status: 'completed',
          result: {
            video_url: 'http://127.0.0.1:8000/api/files/run/final.mp4',
            duration: 7.2,
            file_size: 256,
          },
        }),
        { status: 200 },
      ),
    )
    .mockResolvedValueOnce(
      new Response(Uint8Array.from(Array.from({ length: 256 }, () => 1)), { status: 200 }),
    );

  vi.stubGlobal('fetch', fetchMock);

  const taskManager = new InMemoryTaskManager();
  const eventBus = new EventBus();
  const toolRegistry = new ToolRegistry();
  const agentRegistry = new AgentRegistry();
  const permissionManager = new PermissionManager(agentRegistry, toolRegistry);
  const approvalManager = new ApprovalManager(taskManager, eventBus);
  const executor = new ToolExecutor(taskManager, toolRegistry, permissionManager, approvalManager, eventBus);

  const task = taskManager.createTask({
    goal: 'Video Produk Genvid',
    category: 'document',
    source: 'Workspace',
    prompt: 'Buat video promosi produk premium',
    selectedSkill: 'Videos',
    outputType: 'mp4',
  });

  const result = await executor.execute({
    task,
    agentName: 'Video Agent',
    toolId: 'video.generate_mp4',
  });

  expect(result.content).toContain('Genvid');
  expect(result.artifact?.label.endsWith('.mp4')).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/hermes/tool-executor.test.ts`
Expected: FAIL because `video.generate_mp4` still uses the legacy static MP4 path only

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/hermes/runtime/tool-executor.ts
import { readGenvidConfig } from '@/lib/hermes/video/genvid-config';
import { GenvidVideoService } from '@/lib/hermes/video/genvid-service';
```

```ts
// lib/hermes/runtime/tool-executor.ts
private async runGenvidVideo(input: ExecuteToolInput) {
  const config = readGenvidConfig();
  const slug = this.slugify(input.task.goal);
  const absolutePath = path.join(process.cwd(), 'public', 'artifacts', `${slug}.mp4`);
  const service = new GenvidVideoService(config);
  const result = await service.generateVideo({
    taskId: input.task.id,
    goal: input.task.goal,
    prompt: input.task.prompt,
    outputPath: absolutePath,
  });

  const artifact = {
    label: path.basename(absolutePath),
    url: `/artifacts/${path.basename(absolutePath)}`,
  };
  this.taskManager.addDownloadItem(input.task.id, artifact);

  return {
    content: `Video Genvid untuk "${input.task.goal}" berhasil dirender.`,
    artifact,
  };
}
```

```ts
// lib/hermes/runtime/tool-executor.ts
case 'video.generate_mp4': {
  const config = readGenvidConfig();

  if (config.enabled) {
    try {
      return await this.runGenvidVideo(input);
    } catch (error) {
      if (config.fallbackMode === 'fail') {
        return {
          content: 'Video engine Genvid gagal dijalankan.',
        };
      }
    }
  }

  return this.runLegacyMp4Fallback(input);
}
```

```ts
// lib/hermes/runtime/tool-executor.ts
private async runLegacyMp4Fallback(input: ExecuteToolInput): Promise<ToolExecutionResult> {
  // move the current ffmpeg-static implementation here unchanged
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/hermes/tool-executor.test.ts tests/hermes/genvid-config.test.ts tests/hermes/genvid-service.test.ts`
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
git add lib/hermes/runtime/tool-executor.ts tests/hermes/tool-executor.test.ts
git commit -m "feat: route video generation through genvid provider"
```
