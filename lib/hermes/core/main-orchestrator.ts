import type { HermesTaskCategory, HermesTaskRecord } from '@/lib/hermes/contracts/task';
import { GoalAnalyzer } from '@/lib/hermes/core/goal-analyzer';
import { PlanningEngine } from '@/lib/hermes/core/planning-engine';
import { RetryEngine } from '@/lib/hermes/core/retry-engine';
import { InMemoryTaskManager } from '@/lib/hermes/core/task-manager';
import { ValidationEngine } from '@/lib/hermes/core/validation-engine';
import { MemoryManager } from '@/lib/hermes/memory/memory-manager';
import { EventBus } from '@/lib/hermes/runtime/event-bus';
import { ProgressTracker } from '@/lib/hermes/runtime/progress-tracker';
import { ToolExecutor } from '@/lib/hermes/runtime/tool-executor';
import { HermesGenerationService } from '@/lib/hermes/services/hermes-generation-service';
import { resolveHermesReferenceRoot } from '@/lib/hermes/reference/reference-config';
import type { HermesExecutionMode } from '@/lib/hermes/runtime/runtime-settings-store';
import { getArtifactWorkingDir } from '@/lib/hermes/runtime/artifact-storage';
import fs from 'node:fs';

interface MainOrchestratorDeps {
  executionMode?: HermesExecutionMode;
  taskManager: InMemoryTaskManager;
  goalAnalyzer: GoalAnalyzer;
  planningEngine: PlanningEngine;
  toolExecutor: ToolExecutor;
  validationEngine: ValidationEngine;
  retryEngine: RetryEngine;
  memoryManager: MemoryManager;
  progressTracker: ProgressTracker;
  eventBus: EventBus;
}

interface SubmitTaskInput {
  id?: string;
  goal: string;
  prompt: string;
  source: string;
  category: HermesTaskCategory;
  selectedSkill?: string;
  outputType?: string;
  selectedModel?: string;
  projectId?: string;
}

interface PlannedExecutionInput {
  toolIds: string[];
  agentName: string;
  skillName?: string;
  projectId?: string;
  goal: string;
  prompt: string;
  requestedOutputType?: string;
  requestedOutputLabel?: string;
  requestedCapability?: string;
  resolvedModel?: string;
}

export const shouldUseNativeExecution = (input: {
  executionMode: HermesExecutionMode;
  hasReferenceWorkspace: boolean;
  skillName?: string;
  requestedCapability?: string;
}) => {
  const nativeCapabilities = new Set(['presentation', 'document', 'spreadsheet', 'image', 'video']);
  const nativeSkills = new Set(['Slides', 'Documents', 'Sheets', 'Images', 'Videos']);

  if (input.executionMode === 'native') {
    return true;
  }

  if (input.executionMode === 'reference') {
    return false;
  }

  if (!input.hasReferenceWorkspace) {
    return true;
  }

  if (
    (input.skillName && nativeSkills.has(input.skillName)) ||
    (input.requestedCapability && nativeCapabilities.has(input.requestedCapability))
  ) {
    return true;
  }

  return false;
};

export const buildRuntimeQuery = (input: {
  prompt: string;
  requestedOutputType?: string;
  requestedOutputLabel?: string;
  requestedCapability?: string;
}) => `${input.prompt}

IMPORTANT:
1. Target output: ${input.requestedOutputType ?? 'pdf'}${input.requestedOutputLabel ? ` (${input.requestedOutputLabel})` : ''}.
2. Output capability: ${input.requestedCapability ?? 'document'}.
3. If you write, modify, or create any files (such as documents, PDFs, presentasi/Slides, spreadsheets, code files, images, or videos), you MUST save them directly under the directory: "${getArtifactWorkingDir()}/".
4. Use the absolute path "${getArtifactWorkingDir()}/[filename]" in your file writing tool. Do not write to any other directory.
`;

export class MainOrchestrator {
  private readonly generationService = new HermesGenerationService();

  constructor(private readonly deps: MainOrchestratorDeps) {}

  async submit(input: SubmitTaskInput): Promise<HermesTaskRecord> {
    const task = this.deps.taskManager.createTask({
      goal: input.goal,
      prompt: input.prompt,
      source: input.source,
      category: input.category,
      selectedSkill: input.selectedSkill,
      outputType: input.outputType,
      selectedModel: input.selectedModel,
      projectId: input.projectId,
    });

    const analysis = this.deps.goalAnalyzer.analyze(input);
    const generationResolution = this.generationService.resolveModel({
      modelId: input.selectedModel,
      outputType: analysis.requestedOutputType,
      selectedSkill: analysis.selectedSkill,
      prompt: input.prompt,
      capability: analysis.requestedCapability as any,
    });
    if (analysis.requiresClarification) {
      return this.deps.progressTracker.mark(task.id, {
        status: 'planning',
        phase: 'clarification',
        summary: `Butuh klarifikasi: ${analysis.clarificationQuestion}`,
        progress: 10,
        log: 'Task memerlukan klarifikasi tambahan dari operator.',
      });
    }

    const plan = this.deps.planningEngine.createPlan({
      taskId: task.id,
      goal: input.goal,
      prompt: input.prompt,
      selectedSkill: analysis.selectedSkill,
      riskyAction: analysis.riskyAction,
      requestedOutputType: analysis.requestedOutputType,
      requestedOutputLabel: analysis.requestedOutputLabel,
      requestedCapability: analysis.requestedCapability,
    });

    this.deps.taskManager.assignExecution(task.id, {
      agentId: plan.agentName,
      skillId: plan.skillName,
      requestedOutputType: analysis.requestedOutputType,
      requestedOutputLabel: analysis.requestedOutputLabel,
      requestedCapability: analysis.requestedCapability,
      resolvedModel: generationResolution.model?.id,
    });
    this.deps.taskManager.replaceSubTasks(task.id, plan.subTasks);

    this.deps.progressTracker.mark(task.id, {
      status: 'running',
      phase: 'planning',
      summary: plan.summary,
      progress: 20,
      log: 'Rencana eksekusi berhasil dibuat.',
    });

    return this.runPlannedExecution(task.id, {
      toolIds: plan.toolIds,
      agentName: plan.agentName,
      skillName: plan.skillName,
      projectId: input.projectId,
      goal: input.goal,
      prompt: input.prompt,
      requestedOutputType: analysis.requestedOutputType,
      requestedOutputLabel: analysis.requestedOutputLabel,
      requestedCapability: analysis.requestedCapability,
      resolvedModel: generationResolution.model?.id,
    });
  }

  async resume(taskId: string): Promise<HermesTaskRecord> {
    const task = this.deps.taskManager.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} tidak ditemukan.`);
    }
    if (task.approvalState !== 'approved') {
      throw new Error('Task belum mendapat approval untuk dilanjutkan.');
    }

    this.deps.progressTracker.mark(task.id, {
      status: 'running',
      phase: 'delegation',
      summary: 'Melanjutkan task setelah approval disetujui.',
      progress: Math.max(task.progress, 40),
      log: 'Approval diterima. Runtime melanjutkan eksekusi task.',
    });

    const toolIds = task.subTasks.flatMap((subTask) => subTask.toolIds).filter((toolId) => toolId !== 'task.request_approval');

    return this.runPlannedExecution(task.id, {
      toolIds,
      agentName: task.agentId ?? 'Document Agent',
      skillName: task.skillId,
      projectId: task.projectId,
      goal: task.goal,
      prompt: task.prompt,
      requestedOutputType: task.requestedOutputType,
      requestedOutputLabel: task.requestedOutputLabel,
      requestedCapability: task.requestedCapability,
      resolvedModel: task.resolvedModel,
    });
  }

  private async runPlannedExecution(taskId: string, executionPlan: PlannedExecutionInput): Promise<HermesTaskRecord> {
    const task = this.deps.taskManager.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} tidak ditemukan.`);
    }

    if (executionPlan.toolIds.includes('task.request_approval')) {
      const approvalResult = await this.deps.toolExecutor.execute({
        task,
        agentName: executionPlan.agentName,
        toolId: 'task.request_approval',
      });

      if (approvalResult.approvalRequired) {
        return this.deps.progressTracker.mark(taskId, {
          status: 'waiting_approval',
          phase: 'approval_required',
          summary: 'Task menunggu approval operator sebelum dilanjutkan.',
          progress: 35,
          log: 'Approval operator diperlukan untuk melanjutkan task.',
        });
      }
    }

    return this.executeWithValidation(taskId, executionPlan);
  }

  private async executeWithValidation(
    taskId: string,
    executionPlan: PlannedExecutionInput,
  ): Promise<HermesTaskRecord> {
    const runResult = await this.performExecutionOnce(taskId, executionPlan);
    const validation = this.deps.validationEngine.validate({
      result: runResult.result,
      downloadCount: runResult.newFiles.length,
    });

    const task = this.deps.taskManager.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} tidak ditemukan.`);
    }

    if (this.deps.retryEngine.shouldRetry(task, validation)) {
      this.deps.taskManager.incrementAttempt(taskId, validation.reason ?? 'Output invalid, mencoba ulang.');
      return this.executeWithValidation(taskId, executionPlan);
    }

    if (!validation.valid) {
      return this.deps.progressTracker.mark(taskId, {
        status: 'failed',
        phase: 'failed',
        summary: validation.reason ?? 'Eksekusi gagal divalidasi.',
        progress: 100,
        log: validation.reason ?? 'Eksekusi gagal divalidasi.',
        error: validation.reason ?? 'Eksekusi gagal divalidasi.',
      });
    }

    const knownArtifacts = new Set(task.downloadItems.map((item) => item.label));
    for (const filename of runResult.newFiles) {
      if (knownArtifacts.has(filename)) {
        continue;
      }
      const relativeUrl = `/artifacts/${filename}`;
      this.deps.taskManager.addDownloadItem(taskId, {
        label: filename,
        url: relativeUrl,
      });
    }

    let summaryText = 'Tugas diselesaikan secara otonom oleh Hermes Agent.';
    if (runResult.newFiles.length > 0) {
      summaryText += ` Berkas baru tersedia: ${runResult.newFiles.join(', ')}`;
    }

    const completedTask = this.deps.progressTracker.mark(taskId, {
      status: 'completed',
      phase: 'completed',
      summary: summaryText,
      progress: 100,
      log: 'Eksekusi selesai dan berkas berhasil disinkronkan.',
      result: runResult.result,
    });

    this.deps.memoryManager.remember(taskId, completedTask.summary, {
      requestSummary: executionPlan.goal,
      activeSkill: executionPlan.skillName,
      activeProjectId: executionPlan.projectId,
      latestOutputs: completedTask.outputFiles,
    });
    this.deps.eventBus.emit('task.completed', completedTask);
    return completedTask;
  }

  private async performExecutionOnce(taskId: string, executionPlan: PlannedExecutionInput) {
    const { spawn } = require('child_process');
    const path = require('path');
    const task = this.deps.taskManager.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} tidak ditemukan.`);
    }

    if (process.env.VITEST || process.env.NODE_ENV === 'test') {
      return this.executeNativePlan(taskId, executionPlan);
    }

    const referenceWorkspaceRoot = resolveHermesReferenceRoot();
    const executionMode = this.deps.executionMode ?? (process.env.HERMES_EXECUTION_MODE as HermesExecutionMode | undefined) ?? 'auto';
    const useNativeExecution = shouldUseNativeExecution({
      executionMode,
      hasReferenceWorkspace: fs.existsSync(referenceWorkspaceRoot),
      skillName: executionPlan.skillName,
      requestedCapability: executionPlan.requestedCapability,
    });

    if (useNativeExecution) {
      return this.executeNativePlan(taskId, executionPlan);
    }

    const modelId = executionPlan.resolvedModel || 'google/gemini-2.5-flash';
    const provider = 'openrouter'; 
    const startTime = Date.now() - 2000;
    const query = buildRuntimeQuery({
      prompt: executionPlan.prompt,
      requestedOutputType: executionPlan.requestedOutputType,
      requestedOutputLabel: executionPlan.requestedOutputLabel,
      requestedCapability: executionPlan.requestedCapability,
    });

    this.deps.progressTracker.mark(taskId, {
      status: 'running',
      phase: 'planning',
      summary: 'Menginisiasi Python Hermes Agent...',
      progress: 30,
      log: `Memulai eksekusi tugas otonom menggunakan model ${modelId} via OpenRouter...`,
    });

    return new Promise<{ result: string; newFiles: string[] }>((resolve) => {
      try {
        const child = spawn('uv', [
          'run',
          'cli.py',
          `--query=${query}`,
          `--model=${modelId}`,
          `--provider=${provider}`
        ], {
          cwd: referenceWorkspaceRoot,
          env: process.env
        });

        child.stdout.on('data', (data: Buffer) => {
          const lines = data.toString('utf8').split(/\r?\n/);
          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine) {
              const currentTask = this.deps.taskManager.getTask(taskId);
              if (currentTask) {
                this.deps.progressTracker.mark(taskId, {
                  status: 'running',
                  phase: 'executing_tool',
                  summary: 'Python Hermes Agent sedang bekerja...',
                  progress: Math.min(currentTask.progress + 1, 95),
                  log: cleanLine,
                });
              }
            }
          }
        });

        child.stderr.on('data', (data: Buffer) => {
          const lines = data.toString('utf8').split(/\r?\n/);
          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine) {
              console.error('Python Agent Stderr:', cleanLine);
            }
          }
        });

        child.on('close', (code: number) => {
          console.log(`Python Agent process exited with code ${code}`);
          
          if (code !== 0) {
            resolve({
              result: `Python Agent gagal dengan exit code ${code}.`,
              newFiles: [],
            });
            return;
          }

          // Scan artifacts directory for newly created files
          const artifactsDir = getArtifactWorkingDir();

          // Copy newly generated images from Hermes local cache to public/artifacts
          try {
            const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Local');
            const hermesCacheImagesDir = path.join(localAppData, 'hermes', 'cache', 'images');
            if (fs.existsSync(hermesCacheImagesDir)) {
              const files = fs.readdirSync(hermesCacheImagesDir);
              for (const file of files) {
                const filePath = path.join(hermesCacheImagesDir, file);
                const stats = fs.statSync(filePath);
                if (stats.mtimeMs > startTime) {
                  const destPath = path.join(artifactsDir, file);
                  fs.mkdirSync(path.dirname(destPath), { recursive: true });
                  fs.copyFileSync(filePath, destPath);
                  console.log(`Copied local cached image: ${file} to public/artifacts`);
                }
              }
            }
          } catch (copyErr) {
            console.error('Gagal menyalin gambar dari cache lokal Hermes:', copyErr);
          }

          // Copy any newly generated files from the Python workspace root to public/artifacts
          try {
            const workspaceRoot = referenceWorkspaceRoot;
            if (fs.existsSync(workspaceRoot)) {
              const files = fs.readdirSync(workspaceRoot);
              const allowedExtensions = ['.pdf', '.docx', '.pptx', '.xlsx', '.xls', '.csv', '.png', '.jpg', '.jpeg', '.svg', '.html', '.txt', '.zip', '.md'];
              for (const file of files) {
                const filePath = path.join(workspaceRoot, file);
                const stats = fs.statSync(filePath);
                if (stats.isFile() && stats.mtimeMs > startTime) {
                  const ext = path.extname(file).toLowerCase();
                  if (allowedExtensions.includes(ext) && file !== 'test-cli.txt' && file !== 'test.txt') {
                    const destPath = path.join(artifactsDir, file);
                    fs.mkdirSync(path.dirname(destPath), { recursive: true });
                    fs.copyFileSync(filePath, destPath);
                    console.log(`Copied workspace file: ${file} to public/artifacts`);
                    try {
                      fs.unlinkSync(filePath);
                    } catch (e) {}
                  }
                }
              }
            }
          } catch (wsErr) {
            console.error('Gagal menyalin file dari workspace root:', wsErr);
          }

          const newFiles: string[] = [];
          try {
            if (fs.existsSync(artifactsDir)) {
              const files = fs.readdirSync(artifactsDir);
              for (const file of files) {
                const filePath = path.join(artifactsDir, file);
                const stats = fs.statSync(filePath);
                if (stats.mtimeMs > startTime && file !== 'test-py.txt') {
                  newFiles.push(file);
                }
              }
            }
          } catch (scanErr) {
            console.error('Gagal memindai folder artifacts:', scanErr);
          }

          resolve({
            result: `Tugas ${executionPlan.goal} selesai dengan target output ${executionPlan.requestedOutputType ?? 'pdf'}.`,
            newFiles,
          });
        });

      } catch (err: any) {
        console.error('Gagal menjalankan Python Agent:', err);
        resolve({
          result: `Gagal men-spawn Python Agent: ${err.message}`,
          newFiles: [],
        });
      }
    });
  }

  private async executeNativePlan(taskId: string, executionPlan: PlannedExecutionInput) {
    this.deps.progressTracker.mark(taskId, {
      status: 'running',
      phase: 'executing_tool',
      summary: 'Menjalankan native toolchain untuk artifact lokal...',
      progress: 30,
      log: `Task ${executionPlan.skillName ?? 'artifact'} dirutekan ke native toolchain.`,
    });

    const newFiles = new Set<string>();
    const contentParts: string[] = [];
    const activeToolIds = executionPlan.toolIds.filter((id) => id !== 'task.request_approval');
    let currentStep = 0;
    const totalSteps = activeToolIds.length;

    for (const toolId of activeToolIds) {
      const task = this.deps.taskManager.getTask(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} tidak ditemukan.`);
      }

      currentStep++;
      const stepProgress = 30 + Math.round((currentStep / totalSteps) * 60);

      this.deps.progressTracker.mark(taskId, {
        status: 'running',
        phase: 'executing_tool',
        summary: `Menjalankan tool: ${toolId}...`,
        progress: stepProgress - 5,
        result: contentParts.join('\n\n').trim(),
      });

      const result = await this.deps.toolExecutor.execute({
        task,
        agentName: executionPlan.agentName,
        toolId,
        draftContent: contentParts.join('\n\n').trim(),
      });

      if (result.approvalRequired) {
        return {
          result: '',
          newFiles: [],
        };
      }

      if (result.content) {
        if (toolId !== 'filesystem.write_artifact') {
          contentParts.push(result.content);
        }
      }

      if (result.artifact?.label) {
        newFiles.add(result.artifact.label);
      }

      this.deps.progressTracker.mark(taskId, {
        status: 'running',
        phase: 'executing_tool',
        summary: `Selesai menjalankan ${toolId}.`,
        progress: stepProgress,
        result: contentParts.join('\n\n').trim(),
      });
    }

    const latestTask = this.deps.taskManager.getTask(taskId);
    if (latestTask) {
      for (const item of latestTask.downloadItems) {
        newFiles.add(item.label);
      }
    }

    return {
      result: contentParts.join('\n\n').trim(),
      newFiles: [...newFiles],
    };
  }
}
