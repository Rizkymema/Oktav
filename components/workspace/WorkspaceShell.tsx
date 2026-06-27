'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

import WorkspaceIconRail from './WorkspaceIconRail';
import WorkspaceSidebar from './WorkspaceSidebar';
import WorkspaceTopbar from './WorkspaceTopbar';

const DynamicCreateProjectModal = dynamic(() => import('./CreateProjectModal'), {
  loading: () => <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />,
});

const DynamicNotificationCenter = dynamic(() => import('./NotificationCenter'), {
  loading: () => (
    <div className="fixed bottom-0 right-0 top-0 z-40 w-96 border-l border-white/8 bg-[#12110f] backdrop-blur-sm" />
  ),
});

export default function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#0c0b09] font-sans text-stone-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,113,108,0.12),transparent_32%),linear-gradient(180deg,#171512_0%,#0c0b09_100%)]" />

      <WorkspaceIconRail />

      <WorkspaceSidebar
        isCollapsed={isSidebarCollapsed}
        onOpenNewProject={() => setIsNewProjectOpen(true)}
      />

      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <WorkspaceTopbar
          onToggleSidebar={() => setIsSidebarCollapsed((value) => !value)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleNotifications={() => setIsNotificationsOpen((value) => !value)}
        />

        <div className="relative flex-1 overflow-hidden">{children}</div>
      </div>

      {isNewProjectOpen && <DynamicCreateProjectModal onClose={() => setIsNewProjectOpen(false)} />}
      {isNotificationsOpen && <DynamicNotificationCenter onClose={() => setIsNotificationsOpen(false)} />}
    </div>
  );
}
