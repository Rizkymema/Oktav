import type { HermesApprovalRequest } from '@/lib/hermes/contracts/approval';
import type { Skill } from '@/lib/workspace/types';
import type { HermesTaskRecord } from '@/lib/hermes/contracts/task';
import type { HermesToolDefinition } from '@/lib/hermes/contracts/tool';
import type { HermesSkillDefinition } from '@/lib/hermes/contracts/skill';

export class WorkspaceAdapter {
  toWorkspaceTask(task: HermesTaskRecord, approval?: HermesApprovalRequest) {
    return {
      id: task.id,
      source: task.source,
      status: task.status,
      category: task.category,
      agent: task.agentId ?? 'Auto Agent',
      prompt: task.prompt,
      summary: task.summary,
      progress: task.progress,
      createdTime: new Date(task.createdAt).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      logs: task.logs,
      outputFiles: task.outputFiles,
      downloadItems: task.downloadItems,
      outputContent: task.result ?? task.error,
      creditsUsed: Math.max(1, task.attemptCount + 1),
      durationSeconds: 15 + task.attemptCount * 5,
      phase: task.phase,
      approvalState: task.approvalState,
      approvalRequestId: approval?.id,
      approvalActionType: approval?.actionType,
      approvalReason: approval?.reason,
      requestedOutputType: task.requestedOutputType,
      resolvedModel: task.resolvedModel,
      projectId: task.projectId,
    };
  }

  toWorkspaceSkill(skill: HermesSkillDefinition): Skill {
    return {
      name: skill.name,
      description: skill.description,
      category: skill.category,
      agent: skill.defaultAgent,
      supportedInputs: ['Prompt', 'Goal'],
      supportedOutputs: skill.outputFormats,
      requiredTools: skill.requiredTools,
      examplePrompts: skill.examplePrompts,
      limitations: skill.validationRules,
      estimatedCredits: Math.max(2, skill.requiredTools.length),
    };
  }

  toWorkspaceTool(tool: HermesToolDefinition) {
    return {
      name: tool.name,
      description: tool.description,
      enabled: tool.enabled,
    };
  }
}
