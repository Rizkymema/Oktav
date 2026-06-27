import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useParams: () => ({ projectId: 'project-1' }),
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
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
        activeAgent: 'Hermes Core',
      },
    ],
    tasks: [],
    messages: [],
    setProjects: vi.fn(),
    setNotifications: vi.fn(),
  }),
}));

import ProjectDetailsPage from '@/app/workspace/projects/[projectId]/page';

describe('project details page', () => {
  test('renders warmer detail shell and calmer tabs', () => {
    const markup = renderToStaticMarkup(React.createElement(ProjectDetailsPage));

    expect(markup).toContain('bg-[#0c0b09]');
    expect(markup).toContain('border-white/8');
    expect(markup).toContain('Lanjutkan di Composer');
  });
});
