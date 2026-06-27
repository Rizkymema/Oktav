import type { HermesAgentDefinition } from '@/lib/hermes/contracts/agent';
import type { HermesToolDefinition } from '@/lib/hermes/contracts/tool';
import { AgentRegistry } from '@/lib/hermes/registry/agent-registry';
import { ToolRegistry } from '@/lib/hermes/registry/tool-registry';

export interface PermissionDecision {
  allowed: boolean;
  requiresApproval: boolean;
  reason?: string;
  agent?: HermesAgentDefinition;
  tool?: HermesToolDefinition;
}

export class PermissionManager {
  constructor(
    private readonly agentRegistry: AgentRegistry,
    private readonly toolRegistry: ToolRegistry,
  ) {}

  evaluate(agentName: string, toolId: string): PermissionDecision {
    const agent = this.agentRegistry.getByName(agentName);
    const tool = this.toolRegistry.getById(toolId);

    if (!agent || !tool) {
      return {
        allowed: false,
        requiresApproval: false,
        reason: 'Agent atau tool tidak ditemukan.',
      };
    }

    if (!agent.allowedTools.includes(toolId)) {
      return {
        allowed: false,
        requiresApproval: false,
        reason: `Tool ${toolId} tidak diizinkan untuk ${agentName}.`,
        agent,
        tool,
      };
    }

    return {
      allowed: true,
      requiresApproval: tool.requiresApproval,
      agent,
      tool,
    };
  }
}
