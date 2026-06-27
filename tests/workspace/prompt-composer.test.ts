import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@/lib/workspace/workspace-context', () => ({
  useWorkspace: () => ({
    promptInput: 'Buatkan proposal kerja sama yang rapi',
    setPromptInput: vi.fn(),
    selectedSkill: 'Documents',
    setSelectedSkill: vi.fn(),
    selectedModel: 'claude-sonnet',
    setSelectedModel: vi.fn(),
    availableModels: [{ id: 'claude-sonnet', name: 'Claude Sonnet', desc: 'Warm writer', capabilities: ['write'] }],
    selectedOutputType: 'pdf',
    setSelectedOutputType: vi.fn(),
    availableOutputTypes: [{ id: 'pdf', label: 'PDF', desc: 'Portable document' }],
    deepResearchMode: false,
    setDeepResearchMode: vi.fn(),
    researchDepth: 'Standard',
    setResearchDepth: vi.fn(),
    researchScope: 'Web',
    setResearchScope: vi.fn(),
    handleSubmitPrompt: vi.fn(),
  }),
}));

import PromptComposer from '@/components/workspace/PromptComposer';

describe('prompt composer', () => {
  test('renders a calmer writing surface with subdued controls', () => {
    const markup = renderToStaticMarkup(React.createElement(PromptComposer));

    expect(markup).toContain('bg-[#12110f]/92');
    expect(markup).toContain('text-slate-800');
    expect(markup).toContain('bg-indigo-600 text-white');
    expect(markup).toContain('type="file"');
  });
});
