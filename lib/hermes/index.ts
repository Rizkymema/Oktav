import { GoalAnalyzer } from '@/lib/hermes/core/goal-analyzer';
import { MainOrchestrator } from '@/lib/hermes/core/main-orchestrator';
import { PlanningEngine } from '@/lib/hermes/core/planning-engine';
import { RetryEngine } from '@/lib/hermes/core/retry-engine';
import { InMemoryTaskManager } from '@/lib/hermes/core/task-manager';
import { ValidationEngine } from '@/lib/hermes/core/validation-engine';
import { ContextManager } from '@/lib/hermes/memory/context-manager';
import { MemoryManager } from '@/lib/hermes/memory/memory-manager';
import { TaskHistoryStore } from '@/lib/hermes/memory/task-history-store';
import { AgentRegistry } from '@/lib/hermes/registry/agent-registry';
import { SkillRegistry } from '@/lib/hermes/registry/skill-registry';
import { ToolRegistry } from '@/lib/hermes/registry/tool-registry';
import { ApprovalManager } from '@/lib/hermes/runtime/approval-manager';
import { AuditLogger } from '@/lib/hermes/runtime/audit-logger';
import { EventBus } from '@/lib/hermes/runtime/event-bus';
import { PermissionManager } from '@/lib/hermes/runtime/permission-manager';
import { ProgressTracker } from '@/lib/hermes/runtime/progress-tracker';
import { RuntimeSettingsStore } from '@/lib/hermes/runtime/runtime-settings-store';
import { ToolExecutor } from '@/lib/hermes/runtime/tool-executor';
import { StatePersistence } from '@/lib/hermes/runtime/state-persistence';
import { getArtifactWorkingDir } from '@/lib/hermes/runtime/artifact-storage';
import { mergeSeedAgentsWithReferenceProfiles } from '@/lib/hermes/reference/reference-agent-sync';
import { getReferenceSkillDefinitionByName } from '@/lib/hermes/reference/reference-skill-sync';
import { mergeSeedToolsWithReferenceCatalog } from '@/lib/hermes/reference/reference-tool-sync';
import { hermesSeedAgents } from '@/lib/hermes/seed/agents';
import { hermesSeedTools } from '@/lib/hermes/seed/tools';
import { createTaskStatusNotification } from '@/lib/workspace/notification-factory';
import fs from 'node:fs';
import path from 'node:path';
import type { HermesExecutionMode } from '@/lib/hermes/runtime/runtime-settings-store';

export interface HermesRuntime {
  model: string;
  executionMode: HermesExecutionMode;
  installedReferenceSkillNames: Set<string>;
  settingsStore: RuntimeSettingsStore;
  agentRegistry: AgentRegistry;
  skillRegistry: SkillRegistry;
  toolRegistry: ToolRegistry;
  taskManager: InMemoryTaskManager;
  eventBus: EventBus;
  auditLogger: AuditLogger;
  progressTracker: ProgressTracker;
  permissionManager: PermissionManager;
  approvalManager: ApprovalManager;
  contextManager: ContextManager;
  memoryManager: MemoryManager;
  orchestrator: MainOrchestrator;
}

declare global {
  var __hermesHybridRuntime: HermesRuntime | undefined;
}

interface CreateHermesRuntimeOptions {
  settingsStore?: RuntimeSettingsStore;
}

export const createHermesRuntime = (options: CreateHermesRuntimeOptions = {}): HermesRuntime => {
  const settingsStore = options.settingsStore ?? new RuntimeSettingsStore();
  const settings = settingsStore.load();
  const resolvedExecutionMode =
    (process.env.HERMES_EXECUTION_MODE as HermesExecutionMode | undefined) ??
    settings.executionMode ??
    'auto';
  const agentRegistry = new AgentRegistry(mergeSeedAgentsWithReferenceProfiles(hermesSeedAgents));
  const skillRegistry = new SkillRegistry();
  const toolRegistry = new ToolRegistry(mergeSeedToolsWithReferenceCatalog(hermesSeedTools));
  toolRegistry.hydrateEnabledState(settings.toolEnabledState);
  const taskManager = new InMemoryTaskManager();
  const eventBus = new EventBus();
  const auditLogger = new AuditLogger();
  const progressTracker = new ProgressTracker(taskManager, eventBus, auditLogger);
  const permissionManager = new PermissionManager(agentRegistry, toolRegistry);
  const approvalManager = new ApprovalManager(taskManager, eventBus);
  const contextManager = new ContextManager();
  const memoryManager = new MemoryManager(new TaskHistoryStore());
  const orchestrator = new MainOrchestrator({
    executionMode: resolvedExecutionMode,
    taskManager,
    goalAnalyzer: new GoalAnalyzer(skillRegistry),
    planningEngine: new PlanningEngine(skillRegistry, agentRegistry),
    toolExecutor: new ToolExecutor(taskManager, toolRegistry, permissionManager, approvalManager, eventBus),
    validationEngine: new ValidationEngine(),
    retryEngine: new RetryEngine(),
    memoryManager,
    progressTracker,
    eventBus,
  });
  const installedReferenceSkillNames = new Set(settings.installedReferenceSkillNames);

  for (const skillName of installedReferenceSkillNames) {
    const definition = getReferenceSkillDefinitionByName(skillName);
    if (definition) {
      skillRegistry.register(definition);
    }
  }

  // Subscribe untuk sinkronisasi otomatis progress task ke dalam daftar Projects
  eventBus.subscribe('task.progress', (task: any) => {
    try {
      syncTaskToProject(task);
    } catch (e) {
      console.error('[Hermes EventBus] Gagal sinkronisasi task ke project:', e);
    }
  });

  return {
    model: settings.model ?? 'Hermes Hybrid Core',
    executionMode: resolvedExecutionMode,
    installedReferenceSkillNames,
    settingsStore,
    agentRegistry,
    skillRegistry,
    toolRegistry,
    taskManager,
    eventBus,
    auditLogger,
    progressTracker,
    permissionManager,
    approvalManager,
    contextManager,
    memoryManager,
    orchestrator,
  };
};

function syncTaskToProject(task: any) {
  // Hanya sinkronkan tugas yang memicu generator berkas (Slides, Documents, Sheets, Websites, Images, Videos)
  const allowedSkills = ['Slides', 'Documents', 'Sheets', 'Websites', 'Images', 'Videos'];
  if (!task.skillId || !allowedSkills.includes(task.skillId)) {
    return;
  }

  try {
    const projects = StatePersistence.loadProjects();
    const projectId = `prj-${task.id}`;
    const existingProjIdx = projects.findIndex((p: any) => p.id === projectId);

    const now = new Date();
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Hitung total ukuran berkas yang dihasilkan jika sudah selesai
    let totalBytes = 0;
    if (task.status === 'completed' && task.downloadItems) {
      const artifactsDir = getArtifactWorkingDir();
      for (const item of task.downloadItems) {
        const filePath = path.join(artifactsDir, item.label);
        if (fs.existsSync(filePath)) {
          try {
            const stats = fs.statSync(filePath);
            totalBytes += stats.size;
          } catch (e) {}
        }
      }
    }

    const slug = task.goal.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
    const projectPath = `d:/Project Apk-Web/hermes-projects/${slug}`;

    // Konversi status task ke status project
    let projStatus: 'draft' | 'queued' | 'running' | 'waiting_approval' | 'completed' | 'failed' = 'running';
    if (task.status === 'completed') projStatus = 'completed';
    else if (task.status === 'failed') projStatus = 'failed';
    else if (task.status === 'waiting_approval') projStatus = 'waiting_approval';
    else if (task.status === 'queued') projStatus = 'queued';

    const projectData = {
      id: projectId,
      name: task.goal.slice(0, 45) + (task.goal.length > 45 ? '...' : ''),
      description: `Dibuat via ${task.source.startsWith('telegram') ? 'Telegram Bot' : 'Web Composer'}. Prompt: "${task.prompt}"`,
      path: projectPath,
      category: task.category === 'image' ? 'Design' : task.category === 'data' ? 'Data' : 'General',
      type: task.skillId,
      file_count: task.downloadItems ? task.downloadItems.length : 0,
      size_bytes: totalBytes,
      status: projStatus,
      lastUpdate: dateStr,
      activeAgent: task.agentId || 'Hermes Core',
      progress: task.progress,
    };

    if (existingProjIdx > -1) {
      // Perbarui project yang sudah terdaftar
      projects[existingProjIdx] = {
        ...projects[existingProjIdx],
        ...projectData,
      };
    } else {
      // Daftarkan project baru di urutan teratas
      projects.unshift(projectData);
    }

    StatePersistence.saveProjects(projects);

    // Kirim notifikasi ke dasbor web ketika task selesai atau gagal
    if (task.status === 'waiting_approval' || task.status === 'completed' || task.status === 'failed') {
      try {
        const notifications = StatePersistence.loadNotifications();
        const projectIdForNotif = projectId;
        const notifId =
          task.status === 'waiting_approval'
            ? `notif-task-${task.id}-approval`
            : `notif-task-${task.id}`;

        if (!notifications.some((n: any) => n.id === notifId)) {
          const newNotif = createTaskStatusNotification(
            {
              id: task.id,
              source: task.source,
              status: task.status,
              category: task.category,
              agent: task.agentId || 'Hermes Core',
              prompt: task.prompt,
              summary: task.status === 'failed' ? task.error || task.summary : task.summary,
              progress: task.progress,
              createdTime: dateStr,
              logs: task.logs,
              outputFiles: task.outputFiles,
              downloadItems: task.downloadItems,
              requestedOutputType: task.requestedOutputType,
              projectId: projectIdForNotif,
              approvalActionType:
                task.status === 'waiting_approval' ? 'task.request_approval' : undefined,
              approvalReason:
                task.status === 'waiting_approval'
                  ? task.summary
                  : undefined,
            },
            projectIdForNotif,
          );
          notifications.unshift(newNotif);
          StatePersistence.saveNotifications(notifications);
        }
      } catch (notifErr) {
        console.error('[Hermes EventBus] Gagal menyimpan notifikasi:', notifErr);
      }
    }
  } catch (err) {
    console.error('[Telegram Bot Sync] Gagal memperbarui status proyek:', err);
  }
}

export const getHermesRuntime = () => {
  if (globalThis.__hermesHybridRuntime) {
    const isStale =
      globalThis.__hermesHybridRuntime.skillRegistry.constructor !== SkillRegistry ||
      globalThis.__hermesHybridRuntime.toolRegistry.constructor !== ToolRegistry ||
      globalThis.__hermesHybridRuntime.agentRegistry.constructor !== AgentRegistry;
    if (isStale) {
      console.log('[Hermes Runtime] HMR detected. Rebuilding hybrid runtime singleton...');
      globalThis.__hermesHybridRuntime = createHermesRuntime();
    }
  } else {
    globalThis.__hermesHybridRuntime = createHermesRuntime();
  }
  return globalThis.__hermesHybridRuntime;
};
