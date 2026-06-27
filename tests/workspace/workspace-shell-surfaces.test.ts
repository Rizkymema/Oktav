import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/workspace/projects',
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/workspace/workspace-context', () => ({
  useWorkspace: () => ({
    projects: [
      {
        id: 'project-1',
        name: 'Hermes Workspace',
        description: 'Workspace utama',
        path: 'D:/workspace',
        category: 'General',
        type: 'Documents',
        file_count: 12,
        size_bytes: 1200,
        status: 'running',
        lastUpdate: 'Baru saja',
      },
    ],
    setProjects: vi.fn(),
    credits: { used: 12, max: 50 },
    connected: true,
    notifications: [{ id: 'notif-1', read: false, type: 'tasks', title: 'Baru', description: 'desc', time: 'baru' }],
  }),
}));

import WorkspaceShell from '@/components/workspace/WorkspaceShell';

describe('workspace shell surfaces', () => {
  test('renders calmer shell chrome and warmer navigation surfaces', () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceShell, null, React.createElement('div', {}, 'body')),
    );

    expect(markup).toContain('bg-[#0c0b09]');
    expect(markup).toContain('bg-[#12110f]');
    expect(markup).toContain('text-stone-300');
  });
});
