import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import AssistantTypingBubble from '@/components/workspace/chat/AssistantTypingBubble';
import MessageBubble from '@/components/workspace/chat/MessageBubble';
import TaskResultCard from '@/components/workspace/chat/TaskResultCard';
import type { ChatMessage, Task } from '@/lib/workspace/types';

const assistantMessage: ChatMessage = {
  id: 'assistant-1',
  sender: 'assistant',
  kind: 'task_result',
  text: 'Dokumen proposal sudah siap. Saya lampirkan hasilnya di bawah.',
  timestamp: '10:15',
  skill: 'Documents',
  model: 'claude-sonnet',
};

const completedTask: Task = {
  id: 'task-1',
  source: 'Workspace',
  status: 'completed',
  category: 'document',
  agent: 'Document Agent',
  prompt: 'buat proposal kerja sama',
  summary: 'Proposal siap diunduh.',
  progress: 100,
  createdTime: '10:10',
  logs: [],
  outputFiles: ['proposal.pdf'],
  downloadItems: [{ label: 'proposal.pdf', url: '/artifacts/proposal.pdf' }],
  requestedOutputType: 'pdf',
};

const videoTask: Task = {
  ...completedTask,
  id: 'task-2',
  summary: 'Video promosi siap dipreview.',
  outputFiles: ['promo.mp4'],
  downloadItems: [{ label: 'promo.mp4', url: '/artifacts/promo.mp4' }],
  requestedOutputType: 'mp4',
};

describe('chat components', () => {
  test('renders assistant message with subtle metadata and warm surface', () => {
    const markup = renderToStaticMarkup(React.createElement(MessageBubble, { message: assistantMessage }));

    expect(markup).toContain('HermesClaw');
    expect(markup).toContain('border-[#2a2a24]');
    expect(markup).toContain('text-stone-400');
  });

  test('renders typing bubble with thinking label', () => {
    const markup = renderToStaticMarkup(
      React.createElement(AssistantTypingBubble, { label: 'Preparing document...' }),
    );

    expect(markup).toContain('Preparing document...');
    expect(markup).toContain('bg-[#141412]');
  });

  test('renders result card as attachment with open result action', () => {
    const markup = renderToStaticMarkup(React.createElement(TaskResultCard, { task: completedTask }));

    expect(markup).toContain('Open Result');
    expect(markup).toContain('Proposal siap diunduh.');
  });

  test('renders media preview affordance for video artifacts', () => {
    const markup = renderToStaticMarkup(React.createElement(TaskResultCard, { task: videoTask }));

    expect(markup).toContain('Preview Result');
    expect(markup).toContain('promo.mp4');
  });
});
