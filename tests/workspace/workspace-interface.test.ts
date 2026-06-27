import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@/lib/workspace/workspace-context', () => ({
  useWorkspace: () => ({
    messages: [
      {
        id: 'assistant-1',
        sender: 'assistant',
        kind: 'task_result',
        text: 'Proposal sudah siap.',
        timestamp: '10:30',
      },
    ],
    tasks: [],
    selectedSkill: null,
    setSelectedSkill: vi.fn(),
    isAssistantTyping: false,
    assistantStatusLabel: null,
    promptInput: 'Buatkan proposal kerja sama',
    setPromptInput: vi.fn(),
    setSelectedModel: vi.fn(),
    selectedModel: 'claude-sonnet',
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

import WorkspaceInterface from '@/components/workspace/WorkspaceInterface';

describe('workspace interface', () => {
  test('renders the calmer thread shell and narrower reading width', () => {
    const markup = renderToStaticMarkup(React.createElement(WorkspaceInterface));

    expect(markup).toContain('#171512');
    expect(markup).toContain('max-w-3xl');
    expect(markup).toContain('bg-[#12110f]/92');
  });
});
