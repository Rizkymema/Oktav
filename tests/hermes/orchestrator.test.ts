import fs from 'node:fs';
import path from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

import { GoalAnalyzer } from '@/lib/hermes/core/goal-analyzer';
import { MainOrchestrator, shouldUseNativeExecution } from '@/lib/hermes/core/main-orchestrator';
import { PlanningEngine } from '@/lib/hermes/core/planning-engine';
import { RetryEngine } from '@/lib/hermes/core/retry-engine';
import { InMemoryTaskManager } from '@/lib/hermes/core/task-manager';
import { ValidationEngine } from '@/lib/hermes/core/validation-engine';
import { AgentRegistry } from '@/lib/hermes/registry/agent-registry';
import { SkillRegistry } from '@/lib/hermes/registry/skill-registry';
import { ToolRegistry } from '@/lib/hermes/registry/tool-registry';
import { ApprovalManager } from '@/lib/hermes/runtime/approval-manager';
import { AuditLogger } from '@/lib/hermes/runtime/audit-logger';
import { EventBus } from '@/lib/hermes/runtime/event-bus';
import { PermissionManager } from '@/lib/hermes/runtime/permission-manager';
import { ProgressTracker } from '@/lib/hermes/runtime/progress-tracker';
import { ToolExecutor } from '@/lib/hermes/runtime/tool-executor';
import { MemoryManager } from '@/lib/hermes/memory/memory-manager';
import { TaskHistoryStore } from '@/lib/hermes/memory/task-history-store';

describe('Hermes registries', () => {
  test('resolves existing agent, skill, and tool definitions', () => {
    const agentRegistry = new AgentRegistry();
    const skillRegistry = new SkillRegistry();
    const toolRegistry = new ToolRegistry();

    const agent = agentRegistry.getBySkill('Documents');
    const skill = skillRegistry.getByName('Websites');
    const tool = toolRegistry.getById('task.request_approval');

    expect(agent?.name).toBe('Document Agent');
    expect(skill?.defaultAgent).toBe('Project Builder Agent');
    expect(tool?.requiresApproval).toBe(true);
  });

  test('filters tools by risk level and enabled state', () => {
    const toolRegistry = new ToolRegistry();

    const safeTools = toolRegistry.listEnabledByRisk('safe');

    expect(safeTools.map((tool) => tool.id)).toContain('document.compose_markdown');
    expect(safeTools.every((tool) => tool.enabled)).toBe(true);
  });

  test('infers requested output capability from explicit output type', () => {
    const skillRegistry = new SkillRegistry();
    const analyzer = new GoalAnalyzer(skillRegistry);

    const result = analyzer.analyze({
      goal: 'Buat pitch deck startup 10 slide',
      prompt: 'Buat pitch deck startup 10 slide',
      selectedSkill: 'Slides',
      outputType: 'pptx',
    });

    expect(result.requestedOutputType).toBe('pptx');
    expect(result.requestedCapability).toBe('presentation');
  });

  test('routes binary artifact generation through native execution path', () => {
    expect(
      shouldUseNativeExecution({
        executionMode: 'auto',
        hasReferenceWorkspace: true,
        skillName: 'Images',
        requestedCapability: 'image',
      }),
    ).toBe(true);

    expect(
      shouldUseNativeExecution({
        executionMode: 'auto',
        hasReferenceWorkspace: true,
        skillName: 'Documents',
        requestedCapability: 'document',
      }),
    ).toBe(true);

    expect(
      shouldUseNativeExecution({
        executionMode: 'auto',
        hasReferenceWorkspace: true,
        skillName: 'Slides',
        requestedCapability: 'presentation',
      }),
    ).toBe(true);

    expect(
      shouldUseNativeExecution({
        executionMode: 'auto',
        hasReferenceWorkspace: true,
        skillName: 'Sheets',
        requestedCapability: 'spreadsheet',
      }),
    ).toBe(true);

    expect(
      shouldUseNativeExecution({
        executionMode: 'reference',
        hasReferenceWorkspace: true,
        skillName: 'Websites',
        requestedCapability: 'web',
      }),
    ).toBe(false);

    expect(
      shouldUseNativeExecution({
        executionMode: 'auto',
        hasReferenceWorkspace: false,
        skillName: 'Documents',
        requestedCapability: 'document',
      }),
    ).toBe(true);
  });
});

describe('Hermes orchestration flow', () => {
  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.HERMES_ALLOW_SYNTHETIC_IMAGE_FALLBACK;
  });

  const createOrchestrator = () => {
    const taskManager = new InMemoryTaskManager();
    const eventBus = new EventBus();
    const auditLogger = new AuditLogger();
    const progressTracker = new ProgressTracker(taskManager, eventBus, auditLogger);
    const historyStore = new TaskHistoryStore();
    const memoryManager = new MemoryManager(historyStore);
    const skillRegistry = new SkillRegistry();
    const toolRegistry = new ToolRegistry();
    const agentRegistry = new AgentRegistry();
    const permissionManager = new PermissionManager(agentRegistry, toolRegistry);
    const approvalManager = new ApprovalManager(taskManager, eventBus);
    const toolExecutor = new ToolExecutor(taskManager, toolRegistry, permissionManager, approvalManager, eventBus);
    const goalAnalyzer = new GoalAnalyzer(skillRegistry);
    const planningEngine = new PlanningEngine(skillRegistry, agentRegistry);
    const validationEngine = new ValidationEngine();
    const retryEngine = new RetryEngine();

    return {
      taskManager,
      approvalManager,
      orchestrator: new MainOrchestrator({
        taskManager,
        goalAnalyzer,
        planningEngine,
        toolExecutor,
        validationEngine,
        retryEngine,
        memoryManager,
        progressTracker,
        eventBus,
      }),
    };
  };

  test('asks for clarification when goal is too vague', async () => {
    const { taskManager, orchestrator } = createOrchestrator();

    const task = await orchestrator.submit({
      goal: 'Bantu',
      prompt: 'Bantu',
      source: 'Workspace',
      category: 'general',
      selectedSkill: 'Documents',
    });

    const storedTask = taskManager.getTask(task.id);

    expect(storedTask?.status).toBe('planning');
    expect(storedTask?.phase).toBe('clarification');
    expect(storedTask?.summary).toContain('klarifikasi');
  });

  test('completes a document task and stores artifact metadata', async () => {
    const { taskManager, orchestrator } = createOrchestrator();

    const task = await orchestrator.submit({
      goal: 'Buat proposal bisnis untuk klinik AI',
      prompt: 'Buat proposal bisnis untuk klinik AI yang profesional dan ringkas',
      source: 'Workspace',
      category: 'document',
      selectedSkill: 'Documents',
    });

    const storedTask = taskManager.getTask(task.id);

    expect(storedTask?.status).toBe('completed');
    expect(storedTask?.downloadItems.length).toBeGreaterThan(0);
    expect(storedTask?.result).toContain('proposal bisnis');
  });

  test('creates approval request for risky action', async () => {
    const { taskManager, orchestrator, approvalManager } = createOrchestrator();

    const task = await orchestrator.submit({
      goal: 'Hapus file environment produksi',
      prompt: 'Hapus file environment produksi sekarang juga',
      source: 'Workspace',
      category: 'runtime',
      selectedSkill: 'Websites',
    });

    const storedTask = taskManager.getTask(task.id);

    expect(storedTask?.status).toBe('waiting_approval');
    expect(approvalManager.listPending()).toHaveLength(1);
  });

  test('resumes execution after approval is granted', async () => {
    const { taskManager, orchestrator, approvalManager } = createOrchestrator();

    const task = await orchestrator.submit({
      goal: 'Hapus file environment produksi',
      prompt: 'Hapus file environment produksi sekarang juga',
      source: 'Workspace',
      category: 'runtime',
      selectedSkill: 'Websites',
    });

    const approval = approvalManager.listPending()[0];
    expect(approval).toBeTruthy();

    approvalManager.respond(approval.id, {
      status: 'approved',
      reviewedBy: 'operator',
      responseNote: 'Lanjutkan eksekusi.',
    });

    await orchestrator.resume(task.id);

    const resumedTask = taskManager.getTask(task.id);

    expect(resumedTask?.status).toBe('completed');
    expect(resumedTask?.approvalState).toBe('approved');
    expect(resumedTask?.downloadItems.length).toBeGreaterThan(0);
  });

  test('retries once when validation fails and then completes', async () => {
    const { taskManager, orchestrator } = createOrchestrator();

    const task = await orchestrator.submit({
      goal: 'Buat proposal bisnis retry',
      prompt: 'Buat proposal bisnis retry untuk klinik AI',
      source: 'Workspace',
      category: 'document',
      selectedSkill: 'Documents',
    });

    const storedTask = taskManager.getTask(task.id);

    expect(storedTask?.attemptCount).toBe(1);
    expect(storedTask?.status).toBe('completed');
    expect(storedTask?.events.some((event) => event.type === 'task.retrying')).toBe(true);
  });

  test('uses native execution in test mode instead of synthetic artifacts', async () => {
    const { taskManager, orchestrator } = createOrchestrator();

    const task = await orchestrator.submit({
      goal: 'Buat poster grand opening yang modern',
      prompt: 'Buat poster grand opening yang modern',
      source: 'Workspace',
      category: 'image',
      selectedSkill: 'Images',
      outputType: 'png',
    });

    const storedTask = taskManager.getTask(task.id);

    expect(storedTask?.status).toBe('completed');
    expect(storedTask?.result).not.toContain('Hasil sintetis');
    expect(storedTask?.downloadItems[0]?.label).toMatch(/\.(png|svg)$/i);
  }, 15000);

  test('fails an image task when no real artifact is produced', async () => {
    process.env.HERMES_ALLOW_SYNTHETIC_IMAGE_FALLBACK = 'false';
    const artifactPath = path.join(process.cwd(), 'public', 'artifacts', 'buat-gambar-kucing-makan.png');

    try {
      fs.unlinkSync(artifactPath);
    } catch {}

    const { taskManager, orchestrator } = createOrchestrator();

    const task = await orchestrator.submit({
      goal: 'Buat gambar kucing makan',
      prompt: 'Buat gambar kucing makan',
      source: 'Workspace',
      category: 'image',
      selectedSkill: 'Images',
      outputType: 'png',
    });

    const storedTask = taskManager.getTask(task.id);

    expect(storedTask?.status).toBe('failed');
    expect(storedTask?.downloadItems).toHaveLength(0);
    expect(storedTask?.summary).toContain('Artifact');
  }, 15000);
});
