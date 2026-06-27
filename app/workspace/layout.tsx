import React from 'react';
import { WorkspaceProvider } from '@/lib/workspace/workspace-context';
import WorkspaceShell from '@/components/workspace/WorkspaceShell';

export const metadata = {
  title: 'Hermes AI Workspace',
  description: 'All-in-One AI Agent Workspace based on Deep Research and Multi-Agent Orchestration.',
};

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceProvider>
      <WorkspaceShell>{children}</WorkspaceShell>
    </WorkspaceProvider>
  );
}
