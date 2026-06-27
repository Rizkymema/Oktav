import { describe, expect, test } from 'vitest';

import type { ChatMessage, Project, Task } from '@/lib/workspace/types';
import {
  buildProjectWorkspaceIntent,
  resolveProjectArtifacts,
  resolveProjectMessages,
  resolveProjectTasks,
} from '@/lib/workspace/project-runtime';
import { createTaskStatusNotification } from '@/lib/workspace/notification-factory';

const project: Project = {
  id: 'prj-task-1',
  name: 'Landing Page Devcore',
  description: 'Project website company profile',
  path: 'd:/Project Apk-Web/hermes-projects/landing-page-devcore',
  category: 'General',
  type: 'Websites',
  file_count: 2,
  size_bytes: 0,
  status: 'waiting_approval',
  lastUpdate: '22 Juni 2026 17:00',
  activeAgent: 'Project Builder Agent',
  progress: 42,
};

const task: Task = {
  id: 'task-1',
  source: 'Workspace',
  status: 'waiting_approval',
  category: 'project',
  agent: 'Project Builder Agent',
  prompt: '[Skill: Websites] Buat landing page company profile Devcore',
  summary: 'Menunggu approval operator.',
  progress: 42,
  createdTime: '17:00',
  logs: ['[17:00:00] Approval dibuat untuk aksi task.request_approval.'],
  outputFiles: ['index.html', 'bundle.zip'],
  downloadItems: [
    { label: 'index.html', url: '/artifacts/index.html' },
    { label: 'bundle.zip', url: '/artifacts/bundle.zip' },
  ],
  requestedOutputType: 'html',
  projectId: 'prj-task-1',
  approvalRequestId: 'approval-1',
  approvalActionType: 'task.request_approval',
  approvalReason: 'Deploy production memerlukan approval operator.',
};

describe('project runtime helpers', () => {
  test('resolves project tasks and artifacts from runtime-linked tasks', () => {
    const tasks = resolveProjectTasks(project, [task]);
    const files = resolveProjectArtifacts(tasks);

    expect(tasks).toHaveLength(1);
    expect(files.map((file) => file.name)).toEqual(['index.html', 'bundle.zip']);
    expect(files[0]?.url).toBe('/artifacts/index.html');
  });

  test('filters project chat messages by linked task ids', () => {
    const messages: ChatMessage[] = [
      {
        id: 'assistant-task-task-1',
        sender: 'assistant',
        kind: 'task_result',
        text: 'Landing page sudah siap.',
        timestamp: '17:04',
        taskId: 'task-1',
      },
      {
        id: 'assistant-other',
        sender: 'assistant',
        kind: 'message',
        text: 'Percakapan umum',
        timestamp: '17:05',
      },
    ];

    const filtered = resolveProjectMessages(['task-1'], messages);

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.taskId).toBe('task-1');
  });

  test('builds composer intent for continuing a project from the project details page', () => {
    const intent = buildProjectWorkspaceIntent(project);

    expect(intent.projectId).toBe(project.id);
    expect(intent.projectName).toBe(project.name);
    expect(intent.projectType).toBe(project.type);
    expect(intent.prompt).toContain(project.name);
  });
});

describe('workspace notification factory', () => {
  test('creates approval notifications with deep link into the affected project task tab', () => {
    const notification = createTaskStatusNotification(task, project.id);

    expect(notification.type).toBe('tasks');
    expect(notification.taskId).toBe(task.id);
    expect(notification.projectId).toBe(project.id);
    expect(notification.actionLabel).toContain('Review');
    expect(notification.actionUrl).toContain(`/workspace/projects/${project.id}`);
    expect(notification.actionUrl).toContain('tab=tasks');
    expect(notification.actionUrl).toContain(`taskId=${task.id}`);
  });
});
