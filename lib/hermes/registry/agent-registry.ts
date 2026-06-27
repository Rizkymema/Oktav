import type { HermesAgentDefinition } from '@/lib/hermes/contracts/agent';
import { hermesSeedAgents } from '@/lib/hermes/seed/agents';

const normalizeOutput = (value: string) => value.trim().toLowerCase();

const OUTPUT_ALIASES: Record<string, string[]> = {
  pptx: ['pptx', 'presentation', 'slides'],
  pdf: ['pdf', 'document'],
  docx: ['docx', 'word', 'document'],
  xlsx: ['xlsx', 'excel', 'spreadsheet'],
  csv: ['csv', 'spreadsheet'],
  png: ['png', 'image'],
  jpg: ['jpg', 'jpeg', 'image'],
  svg: ['svg', 'vector', 'image'],
  mp4: ['mp4', 'video'],
  html: ['html', 'website', 'web'],
  zip: ['zip', 'source code', 'package'],
  md: ['markdown', 'md'],
};

export class AgentRegistry {
  private readonly agents: HermesAgentDefinition[];

  constructor(agents: HermesAgentDefinition[] = hermesSeedAgents) {
    this.agents = agents.map((agent) => ({
      ...agent,
      capabilities: [...agent.capabilities],
      supportedSkills: [...agent.supportedSkills],
      supportedOutputs: [...agent.supportedOutputs],
      allowedTools: [...agent.allowedTools],
    }));
  }

  list(): HermesAgentDefinition[] {
    return [...this.agents];
  }

  getByName(name: string): HermesAgentDefinition | undefined {
    return this.agents.find((agent) => agent.name === name);
  }

  getBySkill(skillName: string): HermesAgentDefinition | undefined {
    return this.agents.find((agent) => agent.supportedSkills.includes(skillName));
  }

  resolveForTask(input: {
    skillName?: string;
    capability?: string;
    outputType?: string;
  }): HermesAgentDefinition | undefined {
    if (input.skillName) {
      const bySkill = this.getBySkill(input.skillName);
      if (bySkill) {
        return bySkill;
      }
    }

    if (input.outputType) {
      const byOutput = this.agents.find((agent) => this.supportsOutput(agent, input.outputType!));
      if (byOutput) {
        return byOutput;
      }
    }

    if (input.capability) {
      const capabilityMap: Record<string, string> = {
        presentation: 'Document Agent',
        document: 'Document Agent',
        spreadsheet: 'Data & Sheets Agent',
        image: 'Image Agent',
        web: 'Project Builder Agent',
        video: 'Video Agent',
      };
      const mappedName = capabilityMap[input.capability];
      if (mappedName) {
        return this.getByName(mappedName);
      }
    }

    return this.getByName('Document Agent');
  }

  private supportsOutput(agent: HermesAgentDefinition, outputType: string) {
    const requested = normalizeOutput(outputType);
    const aliases = OUTPUT_ALIASES[requested] ?? [requested];

    return agent.supportedOutputs.some((output) => {
      const normalizedOutput = normalizeOutput(output);
      return aliases.some((alias) => normalizedOutput.includes(alias));
    });
  }
}
