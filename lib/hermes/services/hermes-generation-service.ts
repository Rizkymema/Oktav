import { createArtifactRegistry } from '@/lib/hermes/artifacts/artifact-registry';
import type { HermesArtifactCapability } from '@/lib/hermes/artifacts/artifact-types';
import { createModelRegistry } from '@/lib/hermes/models/model-registry';
import type { HermesProviderConfig } from '@/lib/hermes/models/model-types';

const readProviderConfig = (): HermesProviderConfig => ({
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  openAiApiKey: process.env.OPENAI_API_KEY || process.env.VIDEO_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  googleApiKey: process.env.GOOGLE_API_KEY,
});

export class HermesGenerationService {
  private readonly artifactRegistry = createArtifactRegistry();

  private getModelRegistry() {
    return createModelRegistry(readProviderConfig());
  }

  listModels() {
    return this.getModelRegistry().listForUi();
  }

  resolveOutput(input: {
    outputType?: string | null;
    selectedSkill?: string | null;
    prompt?: string | null;
  }) {
    return this.artifactRegistry.resolve(input);
  }

  resolveModel(input: {
    modelId?: string | null;
    outputType?: string | null;
    selectedSkill?: string | null;
    prompt?: string | null;
    capability?: HermesArtifactCapability;
  }) {
    const artifact = this.resolveOutput(input);
    const capability = input.capability ?? artifact.capability;
    const model = this.getModelRegistry().resolveModel({
      requestedModelId: input.modelId,
      capability,
    });

    return {
      artifact,
      capability,
      model,
    };
  }
}
