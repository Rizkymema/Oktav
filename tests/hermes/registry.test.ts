import { describe, expect, test } from 'vitest';

import { createArtifactRegistry } from '@/lib/hermes/artifacts/artifact-registry';
import { createModelRegistry } from '@/lib/hermes/models/model-registry';

describe('Hermes model and artifact registries', () => {
  test('maps pptx output to presentation capability', () => {
    const registry = createArtifactRegistry();

    expect(registry.getById('pptx')?.capability).toBe('presentation');
    expect(registry.getByExtension('.pdf')?.id).toBe('pdf');
  });

  test('filters model availability by provider configuration and capability', () => {
    const registry = createModelRegistry({
      openRouterApiKey: 'or-key',
      openAiApiKey: 'oa-key',
      geminiApiKey: '',
      googleApiKey: '',
    });

    const presentationModels = registry.listForCapability('presentation');
    const imageModels = registry.listForCapability('image');

    expect(presentationModels.some((model) => model.id === 'openai/gpt-4o')).toBe(true);
    expect(imageModels.some((model) => model.id === 'openai/gpt-image-1')).toBe(true);
    expect(registry.listForUi()[0]?.id).toBe('auto');
  });
});
