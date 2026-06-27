import { describe, expect, test } from 'vitest';

import { createReferenceSkillDefinition } from '@/lib/hermes/reference/reference-skill-sync';

describe('reference skill sync', () => {
  test('maps Hermes reference workspace skills into runtime skill definitions', () => {
    const definition = createReferenceSkillDefinition({
      name: 'claude-code',
      description: 'Advanced coding workflow skill.',
      category: 'Coding',
      agent: 'Hermes Reference',
      supportedInputs: ['Prompt'],
      supportedOutputs: ['Guidance'],
      requiredTools: ['Hermes reference'],
      examplePrompts: [],
      limitations: ['Referensi skill dari repo Hermes lokal, bukan runtime langsung.'],
      estimatedCredits: 1,
      installed: false,
      source: 'hermes-reference',
    });

    expect(definition.name).toBe('claude-code');
    expect(definition.defaultAgent).toBe('Project Builder Agent');
    expect(definition.requiredTools).toContain('web.build_artifact');
    expect(definition.outputFormats).toContain('HTML');
  });
});
