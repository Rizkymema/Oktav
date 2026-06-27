import type { HermesToolDefinition, HermesToolRiskLevel } from '@/lib/hermes/contracts/tool';
import { hermesSeedTools } from '@/lib/hermes/seed/tools';

export class ToolRegistry {
  private readonly tools: HermesToolDefinition[];

  constructor(tools: HermesToolDefinition[] = hermesSeedTools) {
    this.tools = tools.map((tool) => ({
      ...tool,
      aliases: [...(tool.aliases ?? [])],
      capabilities: [...(tool.capabilities ?? [])],
      referenceModules: [...(tool.referenceModules ?? [])],
      referenceToolsets: [...(tool.referenceToolsets ?? [])],
    }));
  }

  list(): HermesToolDefinition[] {
    return [...this.tools];
  }

  getById(toolId: string): HermesToolDefinition | undefined {
    return this.tools.find((tool) => tool.id === toolId);
  }

  getByName(name: string): HermesToolDefinition | undefined {
    return this.tools.find((tool) => tool.name === name);
  }

  listEnabledByRisk(riskLevel: HermesToolRiskLevel): HermesToolDefinition[] {
    return this.tools.filter((tool) => tool.enabled && tool.riskLevel === riskLevel);
  }

  setEnabled(toolName: string, enabled: boolean) {
    const tool = this.getByName(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} tidak ditemukan.`);
    }
    tool.enabled = enabled;
    return tool;
  }

  hydrateEnabledState(state: Record<string, boolean>) {
    for (const tool of this.tools) {
      if (Object.prototype.hasOwnProperty.call(state, tool.name)) {
        tool.enabled = state[tool.name];
      }
    }
  }

  getEnabledState() {
    return Object.fromEntries(this.tools.map((tool) => [tool.name, tool.enabled]));
  }
}
