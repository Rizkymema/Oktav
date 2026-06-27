import type { HermesSubTask } from '@/lib/hermes/contracts/task';
import { AgentRegistry } from '@/lib/hermes/registry/agent-registry';
import { SkillRegistry } from '@/lib/hermes/registry/skill-registry';

export interface ExecutionPlan {
  summary: string;
  agentName: string;
  skillName?: string;
  subTasks: HermesSubTask[];
  toolIds: string[];
  requestedOutputType?: string;
  requestedOutputLabel?: string;
  requestedCapability?: string;
}

export class PlanningEngine {
  constructor(
    private readonly skillRegistry: SkillRegistry,
    private readonly agentRegistry: AgentRegistry,
  ) {}

  createPlan(input: {
    taskId: string;
    goal: string;
    prompt: string;
    selectedSkill?: string;
    riskyAction: boolean;
    requestedOutputType?: string;
    requestedOutputLabel?: string;
    requestedCapability?: string;
  }): ExecutionPlan {
    const skill = input.selectedSkill ? this.skillRegistry.getByName(input.selectedSkill) : undefined;
    const agent = skill
      ? this.agentRegistry.getByName(skill.defaultAgent)
      : this.agentRegistry.getBySkill('Documents');

    const toolIds = [...(skill?.requiredTools ?? ['llm.generate_text', 'document.compose_markdown'])];

    if (input.riskyAction && !toolIds.includes('task.request_approval')) {
      toolIds.unshift('task.request_approval');
    }

    return {
      summary: skill
        ? `Rencana dibuat untuk skill ${skill.name} dengan target output ${input.requestedOutputLabel ?? input.requestedOutputType ?? 'artifact final'}.`
        : `Rencana umum dibuat dengan target output ${input.requestedOutputLabel ?? input.requestedOutputType ?? 'artifact final'}.`,
      agentName: agent?.name ?? 'Document Agent',
      skillName: skill?.name,
      toolIds,
      requestedOutputType: input.requestedOutputType,
      requestedOutputLabel: input.requestedOutputLabel,
      requestedCapability: input.requestedCapability,
      subTasks: toolIds.map((toolId, index) => ({
        id: `${input.taskId}-subtask-${index + 1}`,
        taskId: input.taskId,
        title: `Eksekusi ${toolId}`,
        status: 'queued',
        dependsOn: index === 0 ? [] : [`${input.taskId}-subtask-${index}`],
        agentId: agent?.id,
        skillId: skill?.name,
        toolIds: [toolId],
        input: {
          goal: input.goal,
          prompt: input.prompt,
          outputType: input.requestedOutputType,
          capability: input.requestedCapability,
        },
      })),
    };
  }
}
