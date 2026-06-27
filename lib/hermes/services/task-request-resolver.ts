import type { HermesTaskCategory } from '@/lib/hermes/contracts/task';
import type { HermesSkillDefinition } from '@/lib/hermes/contracts/skill';
import type { HermesRuntime } from '@/lib/hermes/index';
import { HermesGenerationService } from '@/lib/hermes/services/hermes-generation-service';

const extractSelectedSkill = (prompt: string) => {
  const match = prompt.match(/^\[Skill:\s*(.*?)\]\s*/i);
  return match?.[1];
};

const stripSkillPrefix = (prompt: string) => prompt.replace(/^\[Skill:\s*.*?\]\s*/i, '').trim();

export interface ResolvedTaskRequest {
  goal: string;
  prompt: string;
  selectedSkill: string;
  category: HermesTaskCategory;
  outputType: string;
  outputLabel: string;
  capability: string;
  targetAgent: string;
}

export class TaskRequestResolver {
  private readonly generationService = new HermesGenerationService();

  constructor(private readonly runtime: HermesRuntime) {}

  resolve(input: {
    prompt: string;
    outputType?: string | null;
    selectedSkill?: string | null;
  }): ResolvedTaskRequest {
    const explicitSkill = extractSelectedSkill(input.prompt);
    const prompt = stripSkillPrefix(input.prompt);
    const resolvedArtifact = this.generationService.resolveOutput({
      outputType: input.outputType,
      selectedSkill: input.selectedSkill ?? explicitSkill,
      prompt,
    });
    const requestedSkillName = input.selectedSkill ?? explicitSkill;
    const requestedSkill = requestedSkillName
      ? this.runtime.skillRegistry.getByName(requestedSkillName)
      : undefined;
    const selectedSkill = this.resolveCompatibleSkill({
      requestedSkill,
      fallbackSkillName: resolvedArtifact.defaultSkill,
      artifactId: resolvedArtifact.id,
    });
    const skillDefinition = this.runtime.skillRegistry.getByName(selectedSkill);
    const targetAgent =
      this.runtime.agentRegistry.resolveForTask({
        skillName: selectedSkill,
        capability: resolvedArtifact.capability,
        outputType: resolvedArtifact.id,
      })?.name ?? skillDefinition?.defaultAgent ?? 'Document Agent';

    return {
      goal: prompt,
      prompt,
      selectedSkill,
      category: this.resolveCategory({
        selectedSkill,
        requestedCapability: resolvedArtifact.capability,
      }),
      outputType: resolvedArtifact.id,
      outputLabel: resolvedArtifact.label,
      capability: resolvedArtifact.capability,
      targetAgent,
    };
  }

  private resolveCompatibleSkill(input: {
    requestedSkill?: HermesSkillDefinition;
    fallbackSkillName: string;
    artifactId: string;
  }) {
    if (input.requestedSkill && this.supportsArtifact(input.requestedSkill, input.artifactId)) {
      return input.requestedSkill.name;
    }

    return this.runtime.skillRegistry.getByName(input.fallbackSkillName)?.name ?? input.fallbackSkillName;
  }

  private supportsArtifact(skill: HermesSkillDefinition, artifactId: string) {
    if (skill.supportedArtifactIds?.length) {
      return skill.supportedArtifactIds.some((supportedId) => supportedId.toLowerCase() === artifactId.toLowerCase());
    }

    const normalizedArtifact = artifactId.toLowerCase();
    return skill.outputFormats.some((format) => format.toLowerCase().includes(normalizedArtifact));
  }

  private resolveCategory(input: {
    selectedSkill?: string;
    requestedCapability?: string;
  }): HermesTaskCategory {
    const skillCategory = input.selectedSkill
      ? this.runtime.skillRegistry.getByName(input.selectedSkill)?.category
      : undefined;

    switch (skillCategory) {
      case 'Coding':
        return 'project';
      case 'Data':
        return 'data';
      case 'Design':
        return input.requestedCapability === 'image' ? 'image' : 'project';
      case 'Content':
      case 'Research':
      case 'Productivity':
        return 'document';
      case 'Automation':
        return 'runtime';
      default:
        break;
    }

    switch (input.requestedCapability) {
      case 'presentation':
      case 'document':
      case 'video':
        return 'document';
      case 'spreadsheet':
        return 'data';
      case 'image':
        return 'image';
      case 'web':
        return 'project';
      default:
        return 'general';
    }
  }
}
