import { SkillRegistry } from '@/lib/hermes/registry/skill-registry';
import { createArtifactRegistry } from '@/lib/hermes/artifacts/artifact-registry';

export interface GoalAnalysisResult {
  normalizedGoal: string;
  selectedSkill?: string;
  requiresClarification: boolean;
  clarificationQuestion?: string;
  riskyAction: boolean;
  primaryIntent: string;
  requestedOutputType?: string;
  requestedOutputLabel?: string;
  requestedCapability: string;
}

export class GoalAnalyzer {
  private readonly artifactRegistry = createArtifactRegistry();

  constructor(private readonly skillRegistry: SkillRegistry) {}

  analyze(input: {
    goal: string;
    prompt: string;
    selectedSkill?: string;
    outputType?: string;
  }): GoalAnalysisResult {
    const normalizedGoal = input.goal.trim();
    const lowerPrompt = input.prompt.toLowerCase();
    const resolvedArtifact = this.artifactRegistry.resolve({
      outputType: input.outputType,
      selectedSkill: input.selectedSkill,
      prompt: input.prompt,
    });
    const selectedSkill =
      (input.selectedSkill && this.skillRegistry.getByName(input.selectedSkill)?.name) ??
      resolvedArtifact.defaultSkill;

    const requiresClarification = normalizedGoal.length < 10 || normalizedGoal.split(/\s+/).length < 2;
    const riskyAction = /(hapus|delete|remove|deploy|production|database)/i.test(lowerPrompt);

    return {
      normalizedGoal,
      selectedSkill,
      requiresClarification,
      clarificationQuestion: requiresClarification
        ? 'Mohon jelaskan output yang Anda inginkan, format hasil, dan batasan utamanya.'
        : undefined,
      riskyAction,
      primaryIntent: selectedSkill ?? 'General Execution',
      requestedOutputType: resolvedArtifact.id,
      requestedOutputLabel: resolvedArtifact.label,
      requestedCapability: resolvedArtifact.capability,
    };
  }
}
