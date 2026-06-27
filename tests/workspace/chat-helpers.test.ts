import { describe, expect, test } from 'vitest';

import {
  buildAssistantTaskMessage,
  getAssistantWorkingLabel,
  isNearBottom,
  upsertTaskAssistantMessage,
} from '@/lib/workspace/chat/chat-helpers';
import type { ChatMessage, Task } from '@/lib/workspace/types';

const imageTask: Task = {
  id: 'task-1',
  source: 'Workspace',
  status: 'completed',
  category: 'document',
  agent: 'Image Agent',
  prompt: 'buatkan saya logo bengkel motor sederhana',
  summary: 'Tugas selesai.',
  progress: 100,
  createdTime: '10:00',
  logs: [],
  outputFiles: ['logo.png'],
  downloadItems: [{ label: 'logo.png', url: '/artifacts/logo.png' }],
  requestedOutputType: 'png',
  resolvedModel: 'google/gemini-2.5-flash-image',
};

describe('chat helpers', () => {
  test('formats image task completion into concise assistant copy', () => {
    const message = buildAssistantTaskMessage(imageTask);

    expect(message.text).toContain('Logo bengkel motor sederhana');
    expect(message.text).toContain('PNG');
    expect(message.text).not.toContain('Task ID');
    expect(message.kind).toBe('task_result');
  });

  test('infers assistant working label from output type', () => {
    expect(getAssistantWorkingLabel({ selectedSkill: 'Images', outputType: 'png' })).toContain('image');
    expect(getAssistantWorkingLabel({ selectedSkill: 'Slides', outputType: 'pptx' })).toContain('presentation');
  });

  test('detects when chat viewport is near the bottom', () => {
    expect(isNearBottom({ scrollTop: 580, clientHeight: 300, scrollHeight: 900 })).toBe(true);
    expect(isNearBottom({ scrollTop: 200, clientHeight: 300, scrollHeight: 900 })).toBe(false);
  });

  test('updates an existing assistant task message instead of duplicating it', () => {
    const initialMessages: ChatMessage[] = [
      {
        id: 'assistant-1',
        sender: 'assistant',
        kind: 'system_status',
        text: 'Generating image...',
        timestamp: '10:00',
        taskId: 'task-1',
      },
    ];

    const nextMessages = upsertTaskAssistantMessage(initialMessages, {
      taskId: 'task-1',
      kind: 'task_result',
      text: 'Logo bengkel motor sederhana sudah siap.',
      timestamp: '10:01',
    });

    expect(nextMessages).toHaveLength(1);
    expect(nextMessages[0].kind).toBe('task_result');
    expect(nextMessages[0].text).toContain('sudah siap');
  });

  test('formats waiting approval tasks into action-oriented assistant copy', () => {
    const waitingTask: Task = {
      ...imageTask,
      id: 'task-approval',
      status: 'waiting_approval',
      summary: 'Menunggu persetujuan operator.',
      approvalReason: 'Aksi deploy production memerlukan approval operator.',
      approvalActionType: 'task.request_approval',
      progress: 35,
    };

    const message = buildAssistantTaskMessage(waitingTask);

    expect(message.kind).toBe('system_status');
    expect(message.text).toContain('approval');
  });
});
