import fs from 'node:fs';
import path from 'node:path';

import { afterEach, describe, expect, test, vi } from 'vitest';

import { InMemoryTaskManager } from '@/lib/hermes/core/task-manager';
import { AgentRegistry } from '@/lib/hermes/registry/agent-registry';
import { ToolRegistry } from '@/lib/hermes/registry/tool-registry';
import { ApprovalManager } from '@/lib/hermes/runtime/approval-manager';
import { AuditLogger } from '@/lib/hermes/runtime/audit-logger';
import { EventBus } from '@/lib/hermes/runtime/event-bus';
import { PermissionManager } from '@/lib/hermes/runtime/permission-manager';
import { ToolExecutor } from '@/lib/hermes/runtime/tool-executor';

const createdFiles: string[] = [];

afterEach(() => {
  for (const filePath of createdFiles.splice(0, createdFiles.length)) {
    try {
      fs.unlinkSync(filePath);
    } catch {}
  }

  vi.restoreAllMocks();
  delete process.env.GENVID_ENABLED;
  delete process.env.GENVID_API_URL;
  delete process.env.GENVID_ROOT;
  delete process.env.GENVID_AUTO_START;
  delete process.env.GENVID_START_COMMAND;
  delete process.env.GENVID_HEALTH_TIMEOUT_MS;
  delete process.env.GENVID_POLL_INTERVAL_MS;
  delete process.env.GENVID_POLL_TIMEOUT_MS;
  delete process.env.GENVID_FALLBACK_MODE;
  delete process.env.OPENAI_API_KEY;
  delete process.env.HERMES_ALLOW_SYNTHETIC_IMAGE_FALLBACK;
  delete process.env.HERMES_ALLOW_SYNTHETIC_VIDEO_FALLBACK;
});

describe('ToolExecutor', () => {
  test('writes artifact using accumulated draft content instead of generic placeholder', async () => {
    const taskManager = new InMemoryTaskManager();
    const eventBus = new EventBus();
    const toolRegistry = new ToolRegistry();
    const agentRegistry = new AgentRegistry();
    const permissionManager = new PermissionManager(agentRegistry, toolRegistry);
    const approvalManager = new ApprovalManager(taskManager, eventBus);
    const executor = new ToolExecutor(taskManager, toolRegistry, permissionManager, approvalManager, eventBus);

    const task = taskManager.createTask({
      goal: 'Regression Artifact Writer',
      category: 'document',
      source: 'Workspace',
      prompt: 'Buat dokumen pengujian artifact writer',
      selectedSkill: 'Documents',
      outputType: 'md',
    });

    const result = await executor.execute({
      task,
      agentName: 'Document Agent',
      toolId: 'filesystem.write_artifact',
      draftContent: '# Final Content\n\nIni harus masuk ke file artifact.',
    });

    const artifactPath = path.join(process.cwd(), 'public', 'artifacts', result.artifact!.label);
    createdFiles.push(artifactPath);

    expect(fs.readFileSync(artifactPath, 'utf8')).toContain('Ini harus masuk ke file artifact.');
  });

  test('renders a local mp4 artifact for video tasks', async () => {
    const taskManager = new InMemoryTaskManager();
    const eventBus = new EventBus();
    const toolRegistry = new ToolRegistry();
    const agentRegistry = new AgentRegistry();
    const permissionManager = new PermissionManager(agentRegistry, toolRegistry);
    const approvalManager = new ApprovalManager(taskManager, eventBus);
    const executor = new ToolExecutor(taskManager, toolRegistry, permissionManager, approvalManager, eventBus);

    const task = taskManager.createTask({
      goal: 'Video Produk Baru',
      category: 'document',
      source: 'Workspace',
      prompt: 'Buat video promosi produk baru',
      selectedSkill: 'Videos',
      outputType: 'mp4',
    });

    const result = await executor.execute({
      task,
      agentName: 'Video Agent',
      toolId: 'video.generate_mp4',
    });

    const artifactPath = path.join(process.cwd(), 'public', 'artifacts', result.artifact!.label);
    createdFiles.push(artifactPath);

    expect(result.content).toContain('MP4');
    expect(result.artifact?.label.endsWith('.mp4')).toBe(true);
    expect(fs.readFileSync(artifactPath).length).toBeGreaterThan(64);
  }, 20000);

  test('does not report video success when only the synthetic fallback is available', async () => {
    process.env.HERMES_ALLOW_SYNTHETIC_VIDEO_FALLBACK = 'false';

    const taskManager = new InMemoryTaskManager();
    const eventBus = new EventBus();
    const toolRegistry = new ToolRegistry();
    const agentRegistry = new AgentRegistry();
    const permissionManager = new PermissionManager(agentRegistry, toolRegistry);
    const approvalManager = new ApprovalManager(taskManager, eventBus);
    const executor = new ToolExecutor(taskManager, toolRegistry, permissionManager, approvalManager, eventBus);

    const task = taskManager.createTask({
      goal: 'Video Tanpa Engine Nyata',
      category: 'document',
      source: 'Workspace',
      prompt: 'Buat video promosi produk baru',
      selectedSkill: 'Videos',
      outputType: 'mp4',
    });

    const result = await executor.execute({
      task,
      agentName: 'Video Agent',
      toolId: 'video.generate_mp4',
    });

    expect(result.artifact).toBeUndefined();
    expect(result.content).toContain('provider video');
  });

  test('uses the video provider output instead of the synthetic fallback', async () => {
    process.env.OPENAI_API_KEY = 'oa-key';
    process.env.HERMES_ALLOW_SYNTHETIC_VIDEO_FALLBACK = 'false';

    const providerVideo = Buffer.from([0, 0, 0, 24, 102, 116, 121, 112, 105, 115, 111, 109]);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'video_123',
            status: 'queued',
            progress: 0,
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'video_123',
            status: 'completed',
            progress: 100,
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(providerVideo, { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);

    const taskManager = new InMemoryTaskManager();
    const eventBus = new EventBus();
    const toolRegistry = new ToolRegistry();
    const agentRegistry = new AgentRegistry();
    const permissionManager = new PermissionManager(agentRegistry, toolRegistry);
    const approvalManager = new ApprovalManager(taskManager, eventBus);
    const executor = new ToolExecutor(taskManager, toolRegistry, permissionManager, approvalManager, eventBus);

    const task = taskManager.createTask({
      goal: 'Video Kucing Makan',
      category: 'document',
      source: 'Workspace',
      prompt: 'Buat video kucing makan',
      selectedSkill: 'Videos',
      outputType: 'mp4',
    });

    const result = await executor.execute({
      task,
      agentName: 'Video Agent',
      toolId: 'video.generate_mp4',
    });

    const artifactPath = path.join(process.cwd(), 'public', 'artifacts', result.artifact!.label);
    createdFiles.push(artifactPath);

    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.openai.com/v1/videos');
    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://api.openai.com/v1/videos/video_123');
    expect(fetchMock.mock.calls[2]?.[0]).toBe('https://api.openai.com/v1/videos/video_123/content');
    expect(fs.readFileSync(artifactPath)).toEqual(providerVideo);
  });

  test('does not overwrite an existing mp4 artifact during write_artifact', async () => {
    const taskManager = new InMemoryTaskManager();
    const eventBus = new EventBus();
    const toolRegistry = new ToolRegistry();
    const agentRegistry = new AgentRegistry();
    const permissionManager = new PermissionManager(agentRegistry, toolRegistry);
    const approvalManager = new ApprovalManager(taskManager, eventBus);
    const executor = new ToolExecutor(taskManager, toolRegistry, permissionManager, approvalManager, eventBus);

    const task = taskManager.createTask({
      goal: 'Video Aman',
      category: 'document',
      source: 'Workspace',
      prompt: 'Buat video aman',
      selectedSkill: 'Videos',
      outputType: 'mp4',
    });

    const artifactPath = path.join(process.cwd(), 'public', 'artifacts', 'video-aman.mp4');
    fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
    fs.writeFileSync(artifactPath, Buffer.from([0, 1, 2, 3, 4, 5]));
    createdFiles.push(artifactPath);

    const result = await executor.execute({
      task,
      agentName: 'Video Agent',
      toolId: 'filesystem.write_artifact',
      draftContent: 'Ini tidak boleh menimpa file video.',
    });

    expect(result.artifact?.label).toBe('video-aman.mp4');
    expect(fs.readFileSync(artifactPath)).toEqual(Buffer.from([0, 1, 2, 3, 4, 5]));
  });

  test('reuses an existing mp4 download item without requiring local public artifact file', async () => {
    const taskManager = new InMemoryTaskManager();
    const eventBus = new EventBus();
    const toolRegistry = new ToolRegistry();
    const agentRegistry = new AgentRegistry();
    const permissionManager = new PermissionManager(agentRegistry, toolRegistry);
    const approvalManager = new ApprovalManager(taskManager, eventBus);
    const executor = new ToolExecutor(taskManager, toolRegistry, permissionManager, approvalManager, eventBus);

    const task = taskManager.createTask({
      goal: 'Video Blob',
      category: 'document',
      source: 'Workspace',
      prompt: 'Buat video untuk blob storage',
      selectedSkill: 'Videos',
      outputType: 'mp4',
    });

    taskManager.addDownloadItem(task.id, {
      label: 'video-blob.mp4',
      url: 'https://example.com/video-blob.mp4',
    });

    const result = await executor.execute({
      task,
      agentName: 'Video Agent',
      toolId: 'filesystem.write_artifact',
      draftContent: 'Video cloud tidak boleh dianggap hilang.',
    });

    expect(result.artifact).toEqual({
      label: 'video-blob.mp4',
      url: 'https://example.com/video-blob.mp4',
    });
    expect(result.content).toContain('video-blob.mp4');
  });

  test('reuses an existing image download item without rewriting a local artifact file', async () => {
    const taskManager = new InMemoryTaskManager();
    const eventBus = new EventBus();
    const toolRegistry = new ToolRegistry();
    const agentRegistry = new AgentRegistry();
    const permissionManager = new PermissionManager(agentRegistry, toolRegistry);
    const approvalManager = new ApprovalManager(taskManager, eventBus);
    const executor = new ToolExecutor(taskManager, toolRegistry, permissionManager, approvalManager, eventBus);

    const task = taskManager.createTask({
      goal: 'Poster Blob',
      category: 'image',
      source: 'Workspace',
      prompt: 'Buat poster blob',
      selectedSkill: 'Images',
      outputType: 'png',
    });

    taskManager.addDownloadItem(task.id, {
      label: 'poster-blob.png',
      url: 'https://example.com/poster-blob.png',
    });

    const result = await executor.execute({
      task,
      agentName: 'Image Agent',
      toolId: 'filesystem.write_artifact',
      draftContent: 'Poster cloud tidak boleh ditulis ulang ke public/artifacts.',
    });

    expect(result.artifact).toEqual({
      label: 'poster-blob.png',
      url: 'https://example.com/poster-blob.png',
    });
  });

  test('does not synthesize a png artifact during write_artifact when the real image file is missing', async () => {
    const taskManager = new InMemoryTaskManager();
    const eventBus = new EventBus();
    const toolRegistry = new ToolRegistry();
    const agentRegistry = new AgentRegistry();
    const permissionManager = new PermissionManager(agentRegistry, toolRegistry);
    const approvalManager = new ApprovalManager(taskManager, eventBus);
    const executor = new ToolExecutor(taskManager, toolRegistry, permissionManager, approvalManager, eventBus);
    const artifactPath = path.join(process.cwd(), 'public', 'artifacts', 'poster-gagal-provider.png');

    try {
      fs.unlinkSync(artifactPath);
    } catch {}

    const task = taskManager.createTask({
      goal: 'Poster Gagal Provider',
      category: 'image',
      source: 'Workspace',
      prompt: 'Buat poster yang seharusnya gagal',
      selectedSkill: 'Images',
      outputType: 'png',
    });

    const result = await executor.execute({
      task,
      agentName: 'Image Agent',
      toolId: 'filesystem.write_artifact',
      draftContent: 'Ini tidak boleh berubah menjadi file PNG fallback.',
    });

    expect(result.artifact).toBeUndefined();
    expect(result.content).toContain('Artifact image belum tersedia');
  });

  test('uses the image provider output instead of the local placeholder renderer', async () => {
    process.env.OPENAI_API_KEY = 'oa-key';

    const providerPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+y2WQAAAAASUVORK5CYII=',
      'base64',
    );
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [{ b64_json: providerPng.toString('base64') }],
        }),
        { status: 200 },
      ),
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
      goal: 'Gambar Kucing Makan',
      category: 'image',
      source: 'Workspace',
      prompt: 'Buatkan saya gambar kucing makan',
      selectedSkill: 'Images',
      outputType: 'png',
    });

    const result = await executor.execute({
      task,
      agentName: 'Image Agent',
      toolId: 'image.generate_asset',
    });

    const artifactPath = path.join(process.cwd(), 'public', 'artifacts', result.artifact!.label);
    createdFiles.push(artifactPath);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.openai.com/v1/images/generations');
    expect(fs.readFileSync(artifactPath)).toEqual(providerPng);
  });

  test('does not report image success when no real image provider is available', async () => {
    process.env.HERMES_ALLOW_SYNTHETIC_IMAGE_FALLBACK = 'false';

    const taskManager = new InMemoryTaskManager();
    const eventBus = new EventBus();
    const toolRegistry = new ToolRegistry();
    const agentRegistry = new AgentRegistry();
    const permissionManager = new PermissionManager(agentRegistry, toolRegistry);
    const approvalManager = new ApprovalManager(taskManager, eventBus);
    const executor = new ToolExecutor(taskManager, toolRegistry, permissionManager, approvalManager, eventBus);

    const task = taskManager.createTask({
      goal: 'Kucing Makan Tanpa Provider',
      category: 'image',
      source: 'Workspace',
      prompt: 'Buatkan saya gambar kucing makan',
      selectedSkill: 'Images',
      outputType: 'png',
    });

    const result = await executor.execute({
      task,
      agentName: 'Image Agent',
      toolId: 'image.generate_asset',
    });

    expect(result.artifact).toBeUndefined();
    expect(result.content).toContain('provider image');
  });

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

    const artifactPath = path.join(process.cwd(), 'public', 'artifacts', result.artifact!.label);
    createdFiles.push(artifactPath);

    expect(result.content).toContain('Genvid');
    expect(result.artifact?.label.endsWith('.mp4')).toBe(true);
  });

  test('generates real office and web artifact files for supported output types', async () => {
    const taskManager = new InMemoryTaskManager();
    const eventBus = new EventBus();
    const toolRegistry = new ToolRegistry();
    const agentRegistry = new AgentRegistry();
    const permissionManager = new PermissionManager(agentRegistry, toolRegistry);
    const approvalManager = new ApprovalManager(taskManager, eventBus);
    const executor = new ToolExecutor(taskManager, toolRegistry, permissionManager, approvalManager, eventBus);

    const scenarios = [
      {
        skill: 'Documents',
        outputType: 'docx',
        expectedExt: '.docx',
        expectedPrefix: 'PK',
      },
      {
        skill: 'Slides',
        outputType: 'pptx',
        expectedExt: '.pptx',
        expectedPrefix: 'PK',
      },
      {
        skill: 'Sheets',
        outputType: 'xlsx',
        expectedExt: '.xlsx',
        expectedPrefix: 'PK',
      },
      {
        skill: 'Websites',
        outputType: 'html',
        expectedExt: '.html',
        expectedPrefix: '<!DOCT',
      },
      {
        skill: 'Websites',
        outputType: 'zip',
        expectedExt: '.zip',
        expectedPrefix: 'PK',
      },
    ] as const;

    for (const scenario of scenarios) {
      const task = taskManager.createTask({
        goal: `${scenario.skill} Output Nyata`,
        category: scenario.skill === 'Websites' ? 'project' : 'document',
        source: 'Workspace',
        prompt: `Buat ${scenario.outputType} untuk ${scenario.skill}`,
        selectedSkill: scenario.skill,
        outputType: scenario.outputType,
      });

      const result = await executor.execute({
        task,
        agentName:
          scenario.skill === 'Slides' || scenario.skill === 'Documents'
            ? 'Document Agent'
            : scenario.skill === 'Sheets'
              ? 'Data & Sheets Agent'
              : 'Project Builder Agent',
        toolId: 'filesystem.write_artifact',
        draftContent: `# ${scenario.skill}\n\nKonten output nyata untuk ${scenario.outputType}.`,
      });

      const artifactPath = path.join(process.cwd(), 'public', 'artifacts', result.artifact!.label);
      createdFiles.push(artifactPath);

      expect(result.artifact?.label.endsWith(scenario.expectedExt)).toBe(true);

      const fileBuffer = fs.readFileSync(artifactPath);
      expect(fileBuffer.length).toBeGreaterThan(32);
      expect(fileBuffer.subarray(0, scenario.expectedPrefix.length).toString('utf8')).toBe(scenario.expectedPrefix);
    }
  }, 20000);

  test('writes pdf artifacts even when AI text contains emoji characters', async () => {
    const taskManager = new InMemoryTaskManager();
    const eventBus = new EventBus();
    const toolRegistry = new ToolRegistry();
    const agentRegistry = new AgentRegistry();
    const permissionManager = new PermissionManager(agentRegistry, toolRegistry);
    const approvalManager = new ApprovalManager(taskManager, eventBus);
    const executor = new ToolExecutor(taskManager, toolRegistry, permissionManager, approvalManager, eventBus);

    const task = taskManager.createTask({
      goal: 'Dokumen Emoji Kucing',
      category: 'document',
      source: 'Workspace',
      prompt: 'Buat PDF tentang kucing 😹 yang berlari',
      selectedSkill: 'Documents',
      outputType: 'pdf',
    });

    const result = await executor.execute({
      task,
      agentName: 'Document Agent',
      toolId: 'filesystem.write_artifact',
      draftContent: 'Kucing 😹 berlari sangat cepat di taman kota.',
    });

    const artifactPath = path.join(process.cwd(), 'public', 'artifacts', result.artifact!.label);
    createdFiles.push(artifactPath);

    const fileBuffer = fs.readFileSync(artifactPath);
    expect(result.artifact?.label.endsWith('.pdf')).toBe(true);
    expect(fileBuffer.length).toBeGreaterThan(32);
    expect(fileBuffer.subarray(0, 4).toString('utf8')).toBe('%PDF');
  });
});
